// Notifications domain — fetch (with one-time seeding/migration), real-time
// subscription, create, mark-read and delete operations.
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification } from '../../types';

export function parseNotificationDateString(str: string): number {
  if (!str) return 0;
  
  // 1. If it's a standard ISO 8601 string, parse it directly.
  // Standard ISO strings contain 'T' (e.g., 2026-06-15T06:00:52.338Z)
  if (str.includes('T')) {
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) return parsed;
  }
  
  // 2. Otherwise, parse custom localized formats manually to avoid browser-specific quirks (especially in WebKit/Safari)
  try {
    const parts = str.trim().split(/\s+/);
    if (parts.length === 0) return 0;
    
    const dateStr = parts[0];
    const timeStr = parts[1] || '00:00';
    
    // Split date by delimiters: /, -, .
    const dateComponents = dateStr.split(/[\/\-\.]+/).map(num => parseInt(num, 10));
    if (dateComponents.length < 3 || dateComponents.some(isNaN)) {
      const fallback = Date.parse(str);
      return isNaN(fallback) ? 0 : fallback;
    }
    
    const timeComponents = timeStr.split(':').map(num => parseInt(num, 10));
    const hours = isNaN(timeComponents[0]) ? 0 : timeComponents[0];
    const minutes = isNaN(timeComponents[1]) ? 0 : timeComponents[1];
    const seconds = isNaN(timeComponents[2]) ? 0 : timeComponents[2];
    
    let year = 0;
    let month = 0; // 0-indexed for JS Date
    let day = 0;
    
    if (dateComponents[0] > 1000) {
      // Format: YYYY/MM/DD or YYYY/DD/MM
      year = dateComponents[0];
      if (dateComponents[1] > 12) {
        day = dateComponents[1];
        month = dateComponents[2] - 1;
      } else {
        month = dateComponents[1] - 1;
        day = dateComponents[2];
      }
    } else if (dateComponents[2] > 1000) {
      // Format: MM/DD/YYYY or DD/MM/YYYY
      year = dateComponents[2];
      if (dateComponents[0] > 12) {
        day = dateComponents[0];
        month = dateComponents[1] - 1;
      } else if (dateComponents[1] > 12) {
        month = dateComponents[0] - 1;
        day = dateComponents[1];
      } else {
        // Both first and second components are <= 12, default to MM/DD/YYYY
        month = dateComponents[0] - 1;
        day = dateComponents[1];
      }
    } else {
      const fallback = Date.parse(str);
      return isNaN(fallback) ? 0 : fallback;
    }
    
    const d = new Date(year, month, day, hours, minutes, seconds);
    const time = d.getTime();
    return isNaN(time) ? 0 : time;
  } catch (e) {
    console.error('Error parsing custom date string:', str, e);
    const fallback = Date.parse(str);
    return isNaN(fallback) ? 0 : fallback;
  }
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  try {
    // Fetch only real notifications stored in Firestore for this user
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const filtered = snap.docs.map(d => d.data() as AppNotification);

    // Auto-migration/seeding for existing/older users
    const welcomeId = `notif_welcome_${userId}`;
    const securityId = `notif_security_${userId}`;

    let welcomeNotif = filtered.find(n => n.id === welcomeId || n.title.includes('тавтай') || n.title.includes('Welcome'));
    let securityNotif = filtered.find(n => n.id === securityId || n.title.includes('Аюулгүй байдал') || n.title.includes('🔒') || n.message.includes('асуулт'));

    const batch = writeBatch(db);
    let needsCommit = false;

    const targetWelcomeTitle = 'Платформд тавтай морилно уу! 🎉';
    const targetWelcomeMsg = 'Хүнд машин механизм, газар шорооны ажлын нэгдсэн системд нэгдсэнд баярлалаа. Танд амжилт хүсье!';
    const targetWelcomeType = 'success';

    const targetSecurityTitle = '🔒 Аюулгүй байдлаа хангаж, профайлаа 100% болгоно уу';
    const targetSecurityMsg = 'Миний профайл -> Засах цэс рүү орж аюулгүй байдлын 2 асуултыг заавал тохируулаарай. Ингэснээр та нууц кодоо мартсан үедээ найдвартай сэргээх боломжтой болохоос гадна профайлын мэдээлэл тань 100% баталгаажна.';
    const targetSecurityType = 'warning';

    // 1. Migrate Welcome Notification
    if (!welcomeNotif) {
      welcomeNotif = {
        id: welcomeId,
        userId: userId,
        title: targetWelcomeTitle,
        message: targetWelcomeMsg,
        type: targetWelcomeType,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      batch.set(doc(db, 'notifications', welcomeId), welcomeNotif);
      filtered.push(welcomeNotif);
      needsCommit = true;
    } else {
      if (
        welcomeNotif.title !== targetWelcomeTitle ||
        welcomeNotif.message !== targetWelcomeMsg ||
        welcomeNotif.type !== targetWelcomeType
      ) {
        welcomeNotif.title = targetWelcomeTitle;
        welcomeNotif.message = targetWelcomeMsg;
        welcomeNotif.type = targetWelcomeType;

        batch.update(doc(db, 'notifications', welcomeNotif.id), {
          title: targetWelcomeTitle,
          message: targetWelcomeMsg,
          type: targetWelcomeType
        });
        needsCommit = true;
      }
    }

    // 2. Migrate Security Notification
    if (!securityNotif) {
      securityNotif = {
        id: securityId,
        userId: userId,
        title: targetSecurityTitle,
        message: targetSecurityMsg,
        type: targetSecurityType,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      batch.set(doc(db, 'notifications', securityId), securityNotif);
      filtered.push(securityNotif);
      needsCommit = true;
    } else {
      if (
        securityNotif.title !== targetSecurityTitle ||
        securityNotif.message !== targetSecurityMsg ||
        securityNotif.type !== targetSecurityType
      ) {
        securityNotif.title = targetSecurityTitle;
        securityNotif.message = targetSecurityMsg;
        securityNotif.type = targetSecurityType;

        batch.update(doc(db, 'notifications', securityNotif.id), {
          title: targetSecurityTitle,
          message: targetSecurityMsg,
          type: targetSecurityType
        });
        needsCommit = true;
      }
    }

    if (needsCommit) {
      await batch.commit();
    }

    // Filter out deleted notifications
    const result = filtered.filter(n => !n.isDeleted);

    // Sort notifications chronologically: newest (most recent) at the top, oldest at the bottom
    result.sort((a, b) => parseNotificationDateString(b.createdAt) - parseNotificationDateString(a.createdAt));

    return result;
  } catch (err) {
    console.error('Error fetching notifications from Firestore:', err);
    return [];
  }
}

/**
 * Real-time subscription to a user's notifications.
 * Lightweight: maps, filters soft-deleted, and sorts newest-first — it does NOT
 * run the welcome/security seeding/migration that getNotifications() performs.
 * Call getNotifications() once on mount for seeding, then subscribe for live updates.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const result = snap.docs
        .map(d => d.data() as AppNotification)
        .filter(n => !n.isDeleted)
        .sort((a, b) => parseNotificationDateString(b.createdAt) - parseNotificationDateString(a.createdAt));
      callback(result);
    },
    (err) => console.error('Error in notifications snapshot listener:', err)
  );
}

export async function addNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'alert',
  relatedId?: string
): Promise<AppNotification> {
  try {
    const id = 'notif_' + Math.random().toString(36).substr(2, 9);
    const newNotif: AppNotification = {
      id,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedId
    };
    
    const cleanNotif = Object.fromEntries(
      Object.entries(newNotif).filter(([, v]) => v !== undefined)
    ) as unknown as AppNotification;
    
    await setDoc(doc(db, 'notifications', id), cleanNotif);
    return newNotif;
  } catch (err) {
    console.error('Error adding notification to Firestore:', err);
    throw err;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  } catch (err) {
    console.error('Error marking notification as read in Firestore:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      const n = d.data() as AppNotification;
      if (!n.isRead) {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      }
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all notifications as read in Firestore:', err);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    if (notificationId.startsWith('notif_welcome_') || notificationId.startsWith('notif_security_')) {
      await updateDoc(doc(db, 'notifications', notificationId), { isDeleted: true });
    } else {
      await deleteDoc(doc(db, 'notifications', notificationId));
    }
  } catch (err) {
    console.error('Error deleting notification in Firestore:', err);
  }
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      const n = d.data() as AppNotification;
      if (n.id.startsWith('notif_welcome_') || n.id.startsWith('notif_security_')) {
        batch.update(doc(db, 'notifications', n.id), { isDeleted: true });
      } else {
        batch.delete(d.ref);
      }
    });
    await batch.commit();
  } catch (err) {
    console.error('Error deleting all notifications in Firestore:', err);
  }
}
