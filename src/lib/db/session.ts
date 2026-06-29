// Session & auth domain — local session persistence (localStorage), login,
// registration and the seeded-user migration. Firebase Auth lives here.
import { collection, doc, getDocs, getDoc, setDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { User, Job, Review, AppNotification } from '../../types';
import { saveSingleUser } from './users';
import { hashSecret, verifySecret } from '../crypto';

export function getCurrentUser(): User | null {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return null;
    const u = JSON.parse(userJson) as User;
    if (u) {
      if (!u.fullName) u.fullName = 'Хэрэглэгч';
      if (!u.firstName) u.firstName = '';
      if (!u.lastName) u.lastName = '';
      if (!u.machineTypes) u.machineTypes = [];
    }
    return u;
  } catch (err) {
    console.warn('Error reading currentUser from localStorage:', err);
    return null;
  }
}

// Keep local session updated in localStorage for UX, but fetch fresh data from Firestore asynchronously when needed.
export async function getFreshCurrentUser(): Promise<User | null> {
  const current = getCurrentUser();
  if (!current) return null;
  try {
    let targetUid = current.id;
    if (auth.currentUser && auth.currentUser.uid && auth.currentUser.uid !== current.id) {
      targetUid = auth.currentUser.uid;
    }
    if (!targetUid) {
      return current;
    }
    const freshDoc = await getDoc(doc(db, 'users', targetUid));
    if (freshDoc.exists()) {
      const freshUser = freshDoc.data() as User;
      freshUser.id = targetUid;
      if (!freshUser.fullName) freshUser.fullName = 'Хэрэглэгч';
      if (!freshUser.firstName) freshUser.firstName = '';
      if (!freshUser.lastName) freshUser.lastName = '';
      if (!freshUser.machineTypes) freshUser.machineTypes = [];
      setCurrentUser(freshUser);
      return freshUser;
    }
  } catch (err) {
    console.error('Error getting fresh current user:', err);
  }
  return current;
}

export function setCurrentUser(user: User | null) {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  } catch (err) {
    console.warn('Error writing currentUser to localStorage:', err);
  }
}

async function migrateSeededUserDocument(oldId: string, newId: string, userData: User) {
  try {
    console.log(`Migrating seeded user Firestore document from ${oldId} to ${newId}`);
    const batch = writeBatch(db);

    // 1. Copy user document to the new Auth UID
    const newUserDoc = { ...userData, id: newId };
    const cleanUser = Object.fromEntries(
      Object.entries(newUserDoc).filter(([_, v]) => v !== undefined)
    ) as unknown as User;
    batch.set(doc(db, 'users', newId), cleanUser);
    batch.delete(doc(db, 'users', oldId));

    // 2. Query and update all jobs where this user is involved
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    jobsSnap.docs.forEach((jobDoc) => {
      const job = jobDoc.data() as Job;
      let changed = false;
      const updatedApplicants = job.applicants.map((id) => {
        if (id === oldId) {
          changed = true;
          return newId;
        }
        return id;
      });

      const updatePayload: any = {};
      if (job.employerId === oldId) {
        updatePayload.employerId = newId;
        changed = true;
      }
      if (job.hiredOperatorId === oldId) {
        updatePayload.hiredOperatorId = newId;
        changed = true;
      }
      if (changed) {
        updatePayload.applicants = updatedApplicants;
        batch.update(doc(db, 'jobs', jobDoc.id), updatePayload);
      }
    });

    // 3. Query and update all reviews written by or for this user
    const reviewsSnap = await getDocs(collection(db, 'reviews'));
    reviewsSnap.docs.forEach((revDoc) => {
      const rev = revDoc.data() as Review;
      if (rev.reviewerId === oldId) {
        batch.update(doc(db, 'reviews', revDoc.id), { reviewerId: newId });
      }
    });

    // 4. Query and update all notifications
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    notifsSnap.docs.forEach((notifDoc) => {
      const notif = notifDoc.data() as AppNotification;
      if (notif.userId === oldId) {
        batch.update(doc(db, 'notifications', notifDoc.id), { userId: newId });
      }
    });

    await batch.commit();
    console.log(`User ${oldId} successfully migrated to ${newId} across collections.`);
  } catch (err) {
    console.error('Error during seeded user migration:', err);
  }
}

export async function loginUser(email: string, phone: string, password?: string): Promise<User | null> {
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';
    
    let targetEmail = '';
    let userData: User | null = null;
    
    // 1. Find the user in Firestore first to get the correct email/phone mapping
    let snapshot;
    if (cleanEmail) {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      snapshot = await getDocs(q);
    } else if (cleanPhone) {
      let q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      snapshot = await getDocs(q);
      
      if (snapshot.empty && cleanPhone.startsWith('+976')) {
        const localPhone = cleanPhone.replace('+976', '');
        q = query(collection(db, 'users'), where('phone', '==', localPhone));
        snapshot = await getDocs(q);
      } else if (snapshot.empty && !cleanPhone.startsWith('+976')) {
        const countryPhone = '+976' + cleanPhone;
        q = query(collection(db, 'users'), where('phone', '==', countryPhone));
        snapshot = await getDocs(q);
      }
    }
    
    if (snapshot && !snapshot.empty) {
      const userDoc = snapshot.docs[0];
      userData = userDoc.data() as User;
      userData.id = userDoc.id;
      
      // Determine the Firebase Auth email registered for this user
      targetEmail = userData.email || `${userData.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
    } else {
      // If user not found in Firestore, try logging in with the entered email directly
      if (cleanEmail) {
        targetEmail = cleanEmail;
      } else {
        return null; // No user found
      }
    }

    // Validate the submitted password against the stored PBKDF2 hash
    if (userData && userData.password) {
      const ok = await verifySecret(password || '', userData.password);
      if (!ok) {
        console.warn('Firestore password mismatch');
        return null;
      }
    }
    
    // Generate session ID before sign in to prevent race condition in onAuthStateChanged observer
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('activeSessionId', newSessionId);
    localStorage.setItem('activeSessionIdTime', Date.now().toString());

    // 2. Authenticate using Firebase Auth
    let authUser = null;
    try {
      // Try signing in with the fixed password first (for accounts created/unified under this system)
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, 'Password123!');
      authUser = userCredential.user;
    } catch (authErr) {
      // Fallback: Try signing in with the typed password (for older accounts not yet unified)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password || 'Password123!');
        authUser = userCredential.user;
        
        // Since login succeeded with their custom password, let's unify their Firebase Auth password to 'Password123!'
        // and cache the password in Firestore for future logins.
        if (authUser && userData) {
          try {
            await updatePassword(authUser, 'Password123!');
            userData.password = password;
            await saveSingleUser(userData);
          } catch (unifyErr) {
            console.warn('Could not unify password in Auth:', unifyErr);
          }
        }
      } catch (authErr2) {
        console.warn('Firebase Auth sign-in failed with both passwords:', authErr2);
        localStorage.removeItem('activeSessionId');
        localStorage.removeItem('activeSessionIdTime');
        localStorage.removeItem('sessionIsNew');
        return null; // Login failed! Incorrect password or auth issue.
      }
    }
    
    if (authUser) {
      // Fetch fresh Firestore user data using the authenticated UID
      const docSnap = await getDoc(doc(db, 'users', authUser.uid));
      if (docSnap.exists()) {
        userData = docSnap.data() as User;
        userData.id = authUser.uid;
      } else if (userData && userData.id !== authUser.uid) {
        // If Firestore document exists under original seeded ID (e.g. user_op_1) but not authUser.uid,
        // migrate the document and update references!
        const oldId = userData.id;
        userData.id = authUser.uid;
        
        await migrateSeededUserDocument(oldId, authUser.uid, userData);
      }
    }
    
    if (userData) {
      userData.activeSessionId = localStorage.getItem('activeSessionId') || undefined;

      // Security: Remove raw password field from session object
      const sessionUser = { ...userData };
      if ('password' in sessionUser) {
        delete sessionUser.password;
      }
      setCurrentUser(sessionUser);
      return sessionUser;
    }
    return null;
  } catch (err) {
    console.error('Error logging in user:', err);
    return null;
  }
}



export async function registerUser(
  userData: Omit<User, 'id' | 'rating' | 'ratingCount' | 'createdAt'>,
  onProgress?: (status: string) => void
): Promise<User> {
  try {
    const tempId = `user_${Date.now()}`;
    const targetEmail = userData.email ? userData.email.trim().toLowerCase() : `${userData.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
    let uid = tempId;

    // Check if phone number already exists in Firestore (checking both formats: local and international)
    if (onProgress) onProgress('Утасны дугаарыг шалгаж байна...');
    const phoneClean = userData.phone.trim();
    const q1 = query(collection(db, 'users'), where('phone', '==', phoneClean));
    const snap1 = await getDocs(q1);
    
    let phoneExists = !snap1.empty;
    
    if (!phoneExists) {
      if (phoneClean.startsWith('+976')) {
        const local = phoneClean.replace('+976', '');
        const q2 = query(collection(db, 'users'), where('phone', '==', local));
        const snap2 = await getDocs(q2);
        phoneExists = !snap2.empty;
      } else {
        const country = '+976' + phoneClean;
        const q2 = query(collection(db, 'users'), where('phone', '==', country));
        const snap2 = await getDocs(q2);
        phoneExists = !snap2.empty;
      }
    }
    
    if (phoneExists) {
      throw new Error('Энэхүү утасны дугаар системд бүртгэгдсэн байна. Та өөр дугаар ашиглах эсвэл нэвтэрч орно уу.');
    }
    
    // Generate session ID before creating auth user to prevent race condition in onAuthStateChanged observer
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('activeSessionId', newSessionId);
    localStorage.setItem('activeSessionIdTime', Date.now().toString());

    // 1. Create Auth user
    if (onProgress) onProgress('Шинэ бүртгэл үүсгэж байна...');
    try {
      const authUser = await createUserWithEmailAndPassword(auth, targetEmail, 'Password123!');
      uid = authUser.user.uid;
    } catch (authErr: any) {
      console.error('Auth user registration failed:', authErr);
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeSessionIdTime');
      localStorage.removeItem('sessionIsNew');
      let userFriendlyMsg = authErr.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.';
      if (authErr.code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'Энэ имэйл хаяг эсвэл утас аль хэдийн бүртгэгдсэн байна.';
      } else if (authErr.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Имэйл хаяг буруу форматтай байна.';
      } else if (authErr.code === 'auth/operation-not-allowed') {
        userFriendlyMsg = 'Бүртгүүлэх үйлчилгээ түр хаагдсан байна. Дараа дахин оролдоно уу.';
      } else if (authErr.code === 'auth/weak-password') {
        userFriendlyMsg = 'Нууц үг хэтэрхий сул байна.';
      }
      throw new Error(userFriendlyMsg);
    }
    
    // 3. Store profile
    if (onProgress) onProgress('Бүртгэлийг баталгаажуулж байна...');

    const newUser: User = {
      ...userData,
      id: uid,
      rating: 5.0,
      ratingCount: 0,
      activeSessionId: localStorage.getItem('activeSessionId') || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Store user session in localStorage early to prevent race conditions with onAuthStateChanged observer
    const sessionUser = { ...newUser };
    if ('password' in sessionUser) {
      delete sessionUser.password;
    }
    setCurrentUser(sessionUser);

    try {
      // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
      const cleanUser = Object.fromEntries(
        Object.entries(newUser).filter(([_, v]) => v !== undefined)
      ) as User;

      // Hash the password before persisting to Firestore — never store plaintext
      if (cleanUser.password) {
        cleanUser.password = await hashSecret(cleanUser.password);
      }

      // Create a 12-second timeout for Firestore write
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Холболт амжилтгүй боллоо. Та сүлжээгээ шалгаад дахин оролдоно уу.')), 12000)
      );

      const writePromise = setDoc(doc(db, 'users', uid), cleanUser);
      
      // Race setDoc against timeout
      await Promise.race([writePromise, timeoutPromise]);
      
      // Create actual real notifications for the newly registered user in Firestore
      try {
        const welcomeId = `notif_welcome_${uid}`;
        const securityId = `notif_security_${uid}`;
        
        const batch = writeBatch(db);
        
        const welcomeNotif: AppNotification = {
          id: welcomeId,
          userId: uid,
          title: 'Платформд тавтай морилно уу! 🎉',
          message: 'Хүнд машин механизм, газар шорооны ажлын нэгдсэн системд нэгдсэнд баярлалаа. Танд амжилт хүсье!',
          type: 'success',
          isRead: false,
          createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
        };
        
        const securityNotif: AppNotification = {
          id: securityId,
          userId: uid,
          title: '🔒 Аюулгүй байдлаа хангаж, профайлаа 100% болгоно уу',
          message: 'Миний профайл -> Засах цэс рүү орж аюулгүй байдлын 2 асуултыг заавал тохируулаарай. Ингэснээр та нууц кодоо мартсан үедээ найдвартай сэргээх боломжтой болохоос гадна профайлын мэдээлэл тань 100% баталгаажна.',
          type: 'warning',
          isRead: false,
          createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
        };
        
        batch.set(doc(db, 'notifications', welcomeId), welcomeNotif);
        batch.set(doc(db, 'notifications', securityId), securityNotif);
        await batch.commit();
      } catch (notifErr) {
        console.error('Error creating welcome notifications:', notifErr);
      }

      return sessionUser;
    } catch (err) {
      // Clear the local session on database write failures so subsequent actions aren't run as logged in
      setCurrentUser(null);
      console.error('Error registering user:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error registering user:', err);
    throw err;
  }
}
