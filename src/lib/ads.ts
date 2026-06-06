'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  orderBy,
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { Ad, WorkHistoryItem } from '../types';

/**
 * 1. Adds a new ad to the 'ads' collection (representing an active advertisement).
 * The function generates a document ID, sets the status to 'active', and adds the creation timestamp.
 * 
 * @param adData - The fields of the ad without id, status, and createdAt
 * @returns The auto-generated document ID of the new ad
 */
export async function addActiveAd(adData: Omit<Ad, 'id' | 'status' | 'createdAt'>): Promise<string> {
  try {
    const adDocRef = doc(collection(db, 'ads'));
    const id = adDocRef.id;
    
    const newAd: Ad = {
      ...adData,
      id,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(adDocRef, newAd);
    return id;
  } catch (error) {
    console.error('Error adding active ad to Firestore:', error);
    throw error;
  }
}

/**
 * 2. Transitions an active ad to expired status: deletes the ad from the 'ads' collection
 * and simultaneously saves it in the 'ad_history' collection.
 * Done atomically using a Firestore Batch Write to guarantee data consistency.
 * 
 * @param adId - The document ID of the active ad to expire
 */
export async function expireAd(adId: string): Promise<void> {
  try {
    const adRef = doc(db, 'ads', adId);
    const adSnap = await getDoc(adRef);
    
    if (!adSnap.exists()) {
      throw new Error(`Active ad with ID ${adId} not found.`);
    }
    
    const adData = adSnap.data() as Ad;
    const historyRef = doc(db, 'ad_history', adId);
    
    const batch = writeBatch(db);
    
    // Copy the ad to 'ad_history' with status 'expired' and record the expiration time
    batch.set(historyRef, {
      ...adData,
      status: 'expired',
      expiredAt: new Date().toISOString()
    });
    
    // Delete the ad from active 'ads'
    batch.delete(adRef);
    
    // Commit the batch atomically
    await batch.commit();
  } catch (error) {
    console.error(`Error archiving ad ${adId}:`, error);
    throw error;
  }
}

/**
 * 3. Retrieves all work history items for a logged-in driver from their 'work_history' subcollection,
 * ordered by completion date (newest first).
 * 
 * Path: users/{driverId}/work_history
 * 
 * @param driverId - The user ID of the logged-in driver
 * @returns An array of WorkHistoryItem objects
 */
export async function getDriverWorkHistory(driverId: string): Promise<WorkHistoryItem[]> {
  try {
    const historyRef = collection(db, 'users', driverId, 'work_history');
    const q = query(historyRef, orderBy('completedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const history: WorkHistoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      history.push(docSnap.data() as WorkHistoryItem);
    });
    
    return history;
  } catch (error) {
    console.error(`Error fetching work history for driver ${driverId}:`, error);
    throw error;
  }
}
