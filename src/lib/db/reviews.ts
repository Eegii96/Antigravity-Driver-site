// Reviews domain — review CRUD. Depends on jobs (to resolve participants) and
// notifications (to alert the reviewed user). Rating/ratingCount recalculation
// is NOT done here: Firestore rules no longer let clients write those fields
// on a user doc (that used to let anyone rate anyone without a review — see
// AGENTS.md security notes / audit S2). Instead, the onReviewWrite Cloud
// Function trigger (functions/src/index.ts) recalculates the target user's
// rating server-side whenever a review is created, edited or deleted.
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Review, Job } from '../../types';
import { addNotification } from './notifications';

export async function getReviews(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, 'reviews'));
    return snap.docs.map(d => d.data() as Review);
  } catch (err) {
    console.error('Error fetching reviews from Firestore:', err);
    return [];
  }
}

export async function getSingleReview(reviewId: string): Promise<Review | null> {
  try {
    const snap = await getDoc(doc(db, 'reviews', reviewId));
    if (snap.exists()) {
      const r = snap.data() as Review;
      r.id = reviewId;
      return r;
    }
  } catch (err) {
    console.error('Error fetching single review from Firestore:', err);
  }
  return null;
}


export async function saveReviews(reviews: Review[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const r of reviews) {
      batch.set(doc(db, 'reviews', r.id), r);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving reviews to Firestore:', err);
  }
}
export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  try {
    const id = `rev_${crypto.randomUUID()}`;
    const newReview: Review = {
      ...reviewData,
      id: id,
      createdAt: new Date().toLocaleDateString('mn-MN')
    };
    
    // Write review in Firestore
    await setDoc(doc(db, 'reviews', id), newReview);
    
    // Recalculate target user's ratings
    const jobDoc = await getDoc(doc(db, 'jobs', reviewData.jobId));
    if (jobDoc.exists()) {
      const job = jobDoc.data() as Job;
      // Reviewer нь operator бол target нь employer, эсрэгээрээ
      const targetUserId = reviewData.reviewerType === 'operator' ? job.employerId : job.hiredOperatorId;
      
      if (targetUserId) {
        // Rating recalculation happens server-side (onReviewWrite trigger).
        await addNotification(
          targetUserId,
          'Шинэ үнэлгээ ирлээ ⭐',
          `${reviewData.reviewerName} танд ${reviewData.rating}⭐ үнэлгээ болон сэтгэгдэл үлдээлээ.`,
          'success',
          id,
          reviewData.jobId
        );
      }
      
      // Update job review flag in Firestore
      const jobUpdate: Partial<Pick<Job, 'isReviewedByEmployer' | 'isReviewedByOperator'>> = {};
      if (reviewData.reviewerType === 'employer') {
        jobUpdate.isReviewedByEmployer = true;
      } else {
        jobUpdate.isReviewedByOperator = true;
      }
      await updateDoc(doc(db, 'jobs', reviewData.jobId), jobUpdate);
    }
    
    return newReview;
  } catch (err) {
    console.error('Error submitting review in Firestore:', err);
    throw err;
  }
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const revDoc = await getDoc(doc(db, 'reviews', reviewId));
    if (!revDoc.exists()) return false;
    const reviewData = revDoc.data() as Review;

    // Delete review document
    await deleteDoc(doc(db, 'reviews', reviewId));

    // Reset review flag on job
    const jobDoc = await getDoc(doc(db, 'jobs', reviewData.jobId));
    if (jobDoc.exists()) {
      const jobUpdate: Partial<Pick<Job, 'isReviewedByEmployer' | 'isReviewedByOperator'>> = {};
      if (reviewData.reviewerType === 'employer') {
        jobUpdate.isReviewedByEmployer = false;
      } else {
        jobUpdate.isReviewedByOperator = false;
      }
      await updateDoc(doc(db, 'jobs', reviewData.jobId), jobUpdate);
      // Rating recalculation happens server-side (onReviewWrite trigger).
    }
    return true;
  } catch (err) {
    console.error('Error deleting review:', err);
    return false;
  }
}

export async function updateReview(reviewId: string, rating: number, comment: string): Promise<boolean> {
  try {
    const revDoc = await getDoc(doc(db, 'reviews', reviewId));
    if (!revDoc.exists()) return false;

    // Update review — rating recalculation happens server-side (onReviewWrite trigger).
    await updateDoc(doc(db, 'reviews', reviewId), {
      rating: rating,
      comment: comment
    });
    return true;
  } catch (err) {
    console.error('Error updating review:', err);
    return false;
  }
}
