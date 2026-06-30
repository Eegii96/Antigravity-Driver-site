// Reviews domain — review CRUD plus rating recalculation. Depends on jobs
// (to resolve participants) and notifications (to alert the reviewed user).
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Review, Job, User } from '../../types';
import { getJobs } from './jobs';
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
export async function recalculateUserRating(targetUserId: string): Promise<void> {
  const [allReviews, allJobs] = await Promise.all([getReviews(), getJobs()]);
  const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
  if (targetUserDoc.exists()) {
    const targetUser = targetUserDoc.data() as User;
    
    // Build a Set of jobIds where this target user was a participant
    const targetUserJobIds = new Set<string>();
    for (const j of allJobs) {
      if (targetUser.type === 'operator' && j.hiredOperatorId === targetUserId) {
        targetUserJobIds.add(j.id);
      } else if (targetUser.type === 'employer' && j.employerId === targetUserId) {
        targetUserJobIds.add(j.id);
      }
    }
    
    // Filter reviews that are FOR this target user
    const relevantReviews = allReviews.filter(r => {
      if (!targetUserJobIds.has(r.jobId)) return false;
      if (r.reviewerType === targetUser.type) return false;
      if (r.reviewerId === targetUserId) return false;
      return true;
    });
    
    // Re-calculate average rating
    const totalRating = relevantReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = relevantReviews.length > 0 ? Number((totalRating / relevantReviews.length).toFixed(1)) : 5.0;
    
    await updateDoc(doc(db, 'users', targetUserId), {
      rating: avg,
      ratingCount: relevantReviews.length
    });
  }
}

export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  try {
    const id = `rev_${Date.now()}`;
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
        await recalculateUserRating(targetUserId);
        
        await addNotification(
          targetUserId,
          'Шинэ үнэлгээ ирлээ ⭐',
          `${reviewData.reviewerName} танд ${reviewData.rating}⭐ үнэлгээ болон сэтгэгдэл үлдээлээ.`,
          'success',
          id
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
      const job = jobDoc.data() as Job;
      const targetUserId = reviewData.reviewerType === 'operator' ? job.employerId : job.hiredOperatorId;
      
      const jobUpdate: Partial<Pick<Job, 'isReviewedByEmployer' | 'isReviewedByOperator'>> = {};
      if (reviewData.reviewerType === 'employer') {
        jobUpdate.isReviewedByEmployer = false;
      } else {
        jobUpdate.isReviewedByOperator = false;
      }
      await updateDoc(doc(db, 'jobs', reviewData.jobId), jobUpdate);

      if (targetUserId) {
        await recalculateUserRating(targetUserId);
      }
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
    const reviewData = revDoc.data() as Review;

    // Update review
    await updateDoc(doc(db, 'reviews', reviewId), {
      rating: rating,
      comment: comment
    });

    // Recalculate target user's ratings
    const jobDoc = await getDoc(doc(db, 'jobs', reviewData.jobId));
    if (jobDoc.exists()) {
      const job = jobDoc.data() as Job;
      const targetUserId = reviewData.reviewerType === 'operator' ? job.employerId : job.hiredOperatorId;
      if (targetUserId) {
        await recalculateUserRating(targetUserId);
      }
    }
    return true;
  } catch (err) {
    console.error('Error updating review:', err);
    return false;
  }
}
