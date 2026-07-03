import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { checkRateLimit } from './rateLimit';

interface CreateJobInput {
  id: string;
  title: string;
  description: string;
  employerId: string;
  employerName: string;
  employerRating: number;
  type: string;
  machineryType: string;
  salary: number;
  salaryUnit: string;
  duration: string;
  location: string;
  requirements: string[];
  additionalInfo?: string;
  imageUrl?: string;
  imageUrls?: string[];
  thumbnailUrls?: string[];
}

const MAX_JOBS_PER_HOUR = 5;

// Callable function: create a job posting, rate-limited per employer.
// Job creation used to be a direct client Firestore write with no quota at
// all — a script could mass-post thousands of jobs and bury the board in
// spam (audit S10). Routing it through a Cloud Function lets us enforce a
// per-user cooldown that Firestore rules alone can't express (rules can only
// `get()` a single known document, not "this user's most recent job").
export const createJob = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Нэвтэрсэн байх шаардлагатай.');
    }
    const uid = request.auth.uid;
    const data = request.data as CreateJobInput;

    if (!data.employerId || data.employerId !== uid) {
      throw new HttpsError('permission-denied', 'Зөвхөн өөрийн нэрийн дор зар нийтлэх боломжтой.');
    }
    if (!data.title || !data.id) {
      throw new HttpsError('invalid-argument', 'Зарын гарчиг болон ID шаардлагатай.');
    }

    const allowed = await checkRateLimit(`createJob_${uid}`, MAX_JOBS_PER_HOUR, 60 * 60 * 1000);
    if (!allowed) {
      throw new HttpsError(
        'resource-exhausted',
        `Танд 1 цагийн дотор хамгийн ихдээ ${MAX_JOBS_PER_HOUR} зар нийтлэх эрх байна. Түр хүлээгээд дахин оролдоно уу.`
      );
    }

    const db = admin.firestore();
    const newJob = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      employerId: uid,
      employerName: data.employerName || '',
      employerRating: data.employerRating ?? 5,
      status: 'open' as const,
      type: data.type || 'earthwork',
      machineryType: data.machineryType || 'Бусад',
      salary: data.salary ?? 0,
      salaryUnit: data.salaryUnit || 'Өдрөөр',
      duration: data.duration || 'Тохиролцоно',
      location: data.location || 'Улаанбаатар хот',
      requirements: data.requirements || [],
      createdAt: new Date().toISOString(),
      applicants: [] as string[],
      ...(data.additionalInfo && { additionalInfo: data.additionalInfo }),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.imageUrls && data.imageUrls.length > 0 && { imageUrls: data.imageUrls }),
      ...(data.thumbnailUrls && data.thumbnailUrls.length > 0 && { thumbnailUrls: data.thumbnailUrls }),
    };

    await db.collection('jobs').doc(data.id).set(newJob);
    await notifyMatchingOperators(db, newJob);
    return newJob;
  }
);

const MAX_LOCATION_NOTIFY_RECIPIENTS = 200;

// Pings operators who opted into "new job in my aimag" alerts (User.notifyLocations,
// set in Settings). Runs with Admin SDK privileges — the `users` collection denies
// client `list` reads entirely (audit S1), so this query only works server-side.
// Best-effort: any failure here must not fail job creation itself.
async function notifyMatchingOperators(db: admin.firestore.Firestore, job: { id: string; title: string; location: string }): Promise<void> {
  try {
    const matches = await db.collection('users')
      .where('type', '==', 'operator')
      .where('notifyLocations', 'array-contains', job.location)
      .limit(MAX_LOCATION_NOTIFY_RECIPIENTS)
      .get();

    if (matches.empty) return;

    const batch = db.batch();
    const now = new Date().toISOString();
    matches.docs.forEach(userDoc => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        id: notifRef.id,
        userId: userDoc.id,
        title: `Шинэ ажлын зар: ${job.location}`,
        message: `"${job.title}" ажлын зар танай сонгосон бүсэд шинээр нийтлэгдлээ.`,
        type: 'info',
        isRead: false,
        createdAt: now,
        relatedId: job.id,
        jobId: job.id,
      });
    });
    await batch.commit();
  } catch (err) {
    console.error('notifyMatchingOperators failed (non-fatal):', err);
  }
}
