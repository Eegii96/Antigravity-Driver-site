import * as admin from 'firebase-admin';
import { onDocumentWritten, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';

// Firestore 'in' queries accept at most 30 values.
const IN_QUERY_CHUNK_SIZE = 30;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface ReviewData {
  jobId: string;
  reviewerId: string;
  reviewerType: 'operator' | 'employer';
  rating: number;
}

interface JobData {
  employerId: string;
  hiredOperatorId?: string;
}

interface UserData {
  type: 'operator' | 'employer';
}

/**
 * Recalculates a user's rating/ratingCount from their actual reviews, server-side.
 * Firestore rules no longer let clients write rating/ratingCount directly (that
 * previously let any authenticated user rate anyone with no real review behind
 * it — see AGENTS.md security notes / audit S2), so this is now the only path
 * that updates those fields.
 */
async function recalcRating(targetUserId: string): Promise<void> {
  const db = admin.firestore();
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetUserDoc.exists) return;
  const targetUser = targetUserDoc.data() as UserData;

  const jobsSnap = await db.collection('jobs')
    .where(targetUser.type === 'operator' ? 'hiredOperatorId' : 'employerId', '==', targetUserId)
    .get();
  const targetUserJobIds = jobsSnap.docs.map(d => d.id);
  if (targetUserJobIds.length === 0) {
    await db.collection('users').doc(targetUserId).update({ rating: 5.0, ratingCount: 0 });
    return;
  }

  // Only fetch reviews for this user's own jobs (chunked into 'in' queries of
  // <=30 ids) instead of the whole reviews collection — this used to re-read
  // every review in the system on every single review write (audit S11).
  const reviewSnaps = await Promise.all(
    chunk(targetUserJobIds, IN_QUERY_CHUNK_SIZE).map(ids =>
      db.collection('reviews').where('jobId', 'in', ids).get()
    )
  );
  const relevantReviews = reviewSnaps
    .flatMap(snap => snap.docs.map(d => d.data() as ReviewData))
    .filter(r =>
      r.reviewerType !== targetUser.type &&
      r.reviewerId !== targetUserId
    );

  const totalRating = relevantReviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = relevantReviews.length > 0 ? Number((totalRating / relevantReviews.length).toFixed(1)) : 5.0;

  await db.collection('users').doc(targetUserId).update({
    rating: avg,
    ratingCount: relevantReviews.length,
  });
}

// Fires on every review create/update/delete and recalculates the reviewed
// user's rating. Runs with Admin SDK privileges (bypasses Firestore rules),
// so it is the single source of truth for rating/ratingCount.
export const onReviewWrite = onDocumentWritten(
  { document: 'reviews/{reviewId}', region: 'us-central1' },
  async (event) => {
    const after = event.data?.after?.exists ? (event.data.after.data() as ReviewData) : undefined;
    const before = event.data?.before?.exists ? (event.data.before.data() as ReviewData) : undefined;
    const review = after || before;
    if (!review) return;

    const jobDoc = await admin.firestore().collection('jobs').doc(review.jobId).get();
    if (!jobDoc.exists) return;
    const job = jobDoc.data() as JobData;

    const targetUserId = review.reviewerType === 'operator' ? job.employerId : job.hiredOperatorId;
    if (!targetUserId) return;
    await recalcRating(targetUserId);
  }
);

// Fires when a job is deleted and cleans up its notifications/jobHistory.
// Runs with Admin SDK privileges so it can delete every participant's records
// regardless of ownership — client-side rules can't do this (a notification
// is only readable/deletable by its own recipient, and a `list` query without
// a matching `where` on the owner field is rejected outright).
export const cleanupJobRelations = onDocumentDeleted(
  { document: 'jobs/{jobId}', region: 'us-central1' },
  async (event) => {
    const jobId = event.params.jobId;
    const db = admin.firestore();
    const [notifsSnap, historySnap] = await Promise.all([
      db.collection('notifications').where('relatedId', '==', jobId).get(),
      db.collection('jobHistory').where('jobId', '==', jobId).get(),
    ]);

    const batch = db.batch();
    notifsSnap.docs.forEach(d => batch.delete(d.ref));
    historySnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
);

// Fires whenever a job flips from completed→open with hiredOperatorId cleared
// (i.e. the employer cancelled a hiring) and cleans up the now-stale reviews
// and review flags. cancelHiring() previously left isReviewedByEmployer/
// isReviewedByOperator set and any submitted review in place, so the job
// could end up "open" but still showing as reviewed (audit S11). Runs with
// Admin SDK privileges because a review may belong to either participant —
// client-side rules only let a review's own author delete it.
export const onJobHiringCancelled = onDocumentUpdated(
  { document: 'jobs/{jobId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (!(before.status === 'completed' && after.status === 'open' && !after.hiredOperatorId)) return;

    const jobId = event.params.jobId;
    const db = admin.firestore();
    const reviewsSnap = await db.collection('reviews').where('jobId', '==', jobId).get();

    const batch = db.batch();
    reviewsSnap.docs.forEach(d => batch.delete(d.ref));
    if (after.isReviewedByEmployer || after.isReviewedByOperator) {
      batch.update(db.collection('jobs').doc(jobId), {
        isReviewedByEmployer: admin.firestore.FieldValue.delete(),
        isReviewedByOperator: admin.firestore.FieldValue.delete(),
      });
    }
    await batch.commit();
  }
);
