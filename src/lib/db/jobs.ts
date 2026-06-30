// Jobs domain — reads, writes, real-time subscription, job history and the
// hiring/apply/complete workflow for the `jobs` collection.
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, writeBatch, deleteField, onSnapshot, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Job, User, JobHistoryItem } from '../../types';
import { addNotification } from './notifications';

function mapJobDoc(d: { id: string; data: () => unknown }): Job {
  const data = d.data() as Job;
  data.id = d.id;
  if (!data.applicants) data.applicants = [];
  if (!data.title) data.title = '';
  if (!data.description) data.description = '';
  if (!data.machineryType) data.machineryType = 'Бусад';
  if (!data.location) data.location = 'Улаанбаатар';
  return data;
}

export async function getJobs(): Promise<Job[]> {
  try {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map(mapJobDoc);
  } catch (err) {
    console.error('Error fetching jobs from Firestore:', err);
    return [];
  }
}

/**
 * Real-time subscription to the jobs collection.
 * Returns an unsubscribe function. Use instead of polling getJobs().
 */
export function subscribeToJobs(callback: (jobs: Job[]) => void): () => void {
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(mapJobDoc)),
    (err) => console.error('Error in jobs snapshot listener:', err)
  );
}

export async function getSingleJob(jobId: string): Promise<Job | null> {
  try {
    const snap = await getDoc(doc(db, 'jobs', jobId));
    if (snap.exists()) {
      return mapJobDoc({ id: jobId, data: () => snap.data() });
    }
  } catch (err) {
    console.error('Error fetching single job from Firestore:', err);
  }
  return null;
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const j of jobs) {
      batch.set(doc(db, 'jobs', j.id), j);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving jobs to Firestore:', err);
  }
}

export async function getJobHistory(): Promise<JobHistoryItem[]> {
  try {
    const snap = await getDocs(collection(db, 'jobHistory'));
    return snap.docs.map(d => d.data() as JobHistoryItem);
  } catch (err) {
    console.error('Error fetching jobHistory from Firestore:', err);
    return [];
  }
}

export async function saveJobHistory(history: JobHistoryItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const h of history) {
      batch.set(doc(db, 'jobHistory', h.id), h);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving jobHistory to Firestore:', err);
  }
}
export async function addJob(jobData: Omit<Job, 'id' | 'status' | 'createdAt' | 'applicants'>, presetId?: string): Promise<Job> {
  try {
    const id = presetId || `job_${Date.now()}`;
    const newJob: Job = {
      ...jobData,
      id: id,
      status: 'open',
      createdAt: new Date().toISOString(),
      applicants: []
    };
    
    // Filter out undefined properties to prevent Firestore write failures
    const cleanJob = Object.fromEntries(
      Object.entries(newJob).filter(([_, v]) => v !== undefined)
    ) as unknown as Job;

    await setDoc(doc(db, 'jobs', id), cleanJob);
    return newJob;
  } catch (err) {
    console.error('Error adding job to Firestore:', err);
    throw err;
  }
}

export async function updateJob(jobId: string, updatedFields: Partial<Job>): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const cleanFields = Object.fromEntries(
      Object.entries(updatedFields).filter(([_, v]) => v !== undefined)
    ) as Partial<Job>;
    await updateDoc(jobRef, cleanFields);
  } catch (err) {
    console.error('Error updating job in Firestore:', err);
    throw err;
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    
    const notifsQuery = query(collection(db, 'notifications'), where('relatedId', '==', jobId));
    const notifsSnap = await getDocs(notifsQuery);
    const batch = writeBatch(db);
    notifsSnap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    
    const historyQuery = query(collection(db, 'jobHistory'), where('jobId', '==', jobId));
    const historySnap = await getDocs(historyQuery);
    historySnap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    
    await batch.commit();
  } catch (err) {
    console.error('Error deleting job in Firestore:', err);
    throw err;
  }
}

export async function applyForJob(jobId: string, operatorId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const job = jobDoc.data() as Job;
    
    // Зөвхөн нээлттэй ажилд хүсэлт илгээх боломжтой
    if (job.status !== 'open') return false;
    
    // Ажил олгогч өөрийн заранд хүсэлт илгээх боломжгүй
    if (job.employerId === operatorId) return false;
    
    if (!job.applicants.includes(operatorId)) {
      const updatedApplicants = [...job.applicants, operatorId];
      await updateDoc(jobRef, { applicants: updatedApplicants });
      
      // Get operator name for notification
      const opDoc = await getDoc(doc(db, 'users', operatorId));
      const opData = opDoc.exists() ? (opDoc.data() as User) : null;
      const opName = opData ? opData.fullName : 'Харилцагч';
      const roleText = opData && opData.type === 'operator' ? 'Жолооч/Оператор' : 'Харилцагч';
      
      await addNotification(
        job.employerId,
        'Шинэ хүсэлт ирлээ 🚜',
        `${roleText} ${opName} таны "${job.title}" заранд хүсэлт ирүүлж, мэдээллээ илгээлээ.`,
        'info',
        jobId
      );
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error applying for job in Firestore:', err);
    return false;
  }
}

export async function hireOperator(jobId: string, operatorId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const jobData = jobDoc.data() as Job;
    // Зөвхөн нээлттэй ажилд хөлслөх боломжтой — давхар хөлслөлт хориглох
    if (jobData.status !== 'open') return false;
    
    const operatorDoc = await getDoc(doc(db, 'users', operatorId));
    if (!operatorDoc.exists()) return false;
    
    const operator = operatorDoc.data() as User;
    const job = jobDoc.data() as Job;
    
    // Update Job Document in Firestore
    await updateDoc(jobRef, {
      status: 'completed',
      hiredOperatorId: operatorId,
      hiredOperatorName: operator.fullName
    });
    
    // Add to Job History Collection in Firestore
    const histId1 = `hist_${Date.now()}_op`;
    const histId2 = `hist_${Date.now()}_emp`;
    
    await setDoc(doc(db, 'jobHistory', histId1), {
      id: histId1,
      jobId: jobId,
      title: job.title,
      partnerName: job.employerName,
      role: 'operator',
      status: 'completed',
      dateRange: new Date().toLocaleDateString('mn-MN')
    });
    
    await setDoc(doc(db, 'jobHistory', histId2), {
      id: histId2,
      jobId: jobId,
      title: job.title,
      partnerName: operator.fullName,
      role: 'employer',
      status: 'completed',
      dateRange: new Date().toLocaleDateString('mn-MN')
    });
    
    // Create notification for operator
    await addNotification(
      operatorId,
      'Ажилд сонгогдлоо 🎉',
      `Баяр хүргэе! Захиалагч ${job.employerName} таныг "${job.title}" ажилдаа сонгон томиллоо.`,
      'success',
      jobId
    );
    
    return true;
  } catch (err) {
    console.error('Error hiring operator in Firestore:', err);
    return false;
  }
}

export async function cancelHiring(jobId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;

    // Update Job Document in Firestore: change status to open and clear hiredOperatorId & Name
    await updateDoc(jobRef, {
      status: 'open',
      hiredOperatorId: deleteField(),
      hiredOperatorName: deleteField()
    });

    // Delete Job History records in Firestore
    const histSnap = await getDocs(collection(db, 'jobHistory'));
    const batch = writeBatch(db);
    histSnap.docs.forEach(d => {
      const h = d.data() as JobHistoryItem;
      if (h.jobId === jobId) {
        batch.delete(doc(db, 'jobHistory', h.id));
      }
    });
    await batch.commit();

    return true;
  } catch (err) {
    console.error('Error canceling hiring in Firestore:', err);
    return false;
  }
}

export async function completeJob(jobId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const job = jobDoc.data() as Job;
    await updateDoc(jobRef, { status: 'completed' });
    
    // Update Job History records in Firestore
    const histSnap = await getDocs(collection(db, 'jobHistory'));
    const batch = writeBatch(db);
    
    histSnap.docs.forEach(d => {
      const h = d.data() as JobHistoryItem;
      if (h.jobId === jobId) {
        batch.update(doc(db, 'jobHistory', h.id), {
          status: 'completed',
          dateRange: h.dateRange.replace('Одоо', new Date().toLocaleDateString('mn-MN'))
        });
      }
    });
    await batch.commit();
    
    // Notification for operator
    if (job.hiredOperatorId) {
      await addNotification(
        job.hiredOperatorId,
        'Ажил дууслаа ✓',
        `Захиалагч ${job.employerName} ажлыг гүйцэтгэж дууссаныг баталгаажууллаа. Одоо нэвтэрч үнэлгээгээ өгнө үү.`,
        'success',
        jobId
      );
    }
    
    // Notification for employer
    await addNotification(
      job.employerId,
      'Ажлын гүйцэтгэл дууслаа',
      `"${job.title}" ажил амжилттай дууслаа. Та жолооч ${job.hiredOperatorName || 'оператор'}-д сэтгэгдэл үнэлгээ өгнө үү.`,
      'info',
      jobId
    );
    
    return true;
  } catch (err) {
    console.error('Error completing job in Firestore:', err);
    return false;
  }
}
