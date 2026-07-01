// Session & auth domain — local session persistence (localStorage), login,
// registration and the seeded-user migration. Firebase Auth lives here.
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User, AppNotification } from '../../types';
import { hashSecret } from '../crypto';

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


export async function loginUser(email: string, phone: string, password?: string): Promise<User | null> {
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';

    let targetEmail = '';
    let userData: User | null = null;

    // 1. Resolve the phone/email identifier to the Firebase Auth email via a Cloud Function.
    //    This runs with Admin SDK privileges server-side — the users collection now requires
    //    auth to read, so this lookup can no longer happen directly from the client.
    const functions = getFunctions();
    const resolveFn = httpsCallable(functions, 'resolveLoginEmail');
    const result = await resolveFn({ email: cleanEmail || undefined, phone: cleanEmail ? undefined : cleanPhone });
    const data = result.data as { found: boolean; authEmail?: string };

    if (data.found && data.authEmail) {
      targetEmail = data.authEmail;
    } else if (cleanEmail) {
      // Not found in Firestore — fall back to trying the entered email directly.
      targetEmail = cleanEmail;
    } else {
      return null; // No user found
    }

    // Password itself is verified by Firebase Auth in step 2 below — no separate check needed.

    // Generate session ID before sign in to prevent race condition in onAuthStateChanged observer
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('activeSessionId', newSessionId);
    localStorage.setItem('activeSessionIdTime', Date.now().toString());

    // 2. Authenticate with Firebase Auth using the real password
    let authUser = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password || '');
      authUser = userCredential.user;
    } catch (authErr) {
      console.warn('Firebase Auth sign-in failed:', authErr);
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeSessionIdTime');
      localStorage.removeItem('sessionIsNew');
      return null;
    }

    if (authUser) {
      const docSnap = await getDoc(doc(db, 'users', authUser.uid));
      if (docSnap.exists()) {
        userData = docSnap.data() as User;
        userData.id = authUser.uid;
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

    // Check if phone number already exists (both local and international formats) via the
    // same Admin-SDK-backed resolver used for login — the users collection now requires auth
    // to read directly, so this check can no longer query Firestore from the client.
    if (onProgress) onProgress('Утасны дугаарыг шалгаж байна...');
    const phoneClean = userData.phone.trim();
    const functions = getFunctions();
    const resolveFn = httpsCallable(functions, 'resolveLoginEmail');
    const resolveResult = await resolveFn({ phone: phoneClean });
    const { found: phoneExists } = resolveResult.data as { found: boolean };

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
      const authUser = await createUserWithEmailAndPassword(auth, targetEmail, userData.password || '');
      uid = authUser.user.uid;
    } catch (authErr: unknown) {
      console.error('Auth user registration failed:', authErr);
      localStorage.removeItem('activeSessionId');
      localStorage.removeItem('activeSessionIdTime');
      localStorage.removeItem('sessionIsNew');
      const ae = authErr as { code?: string; message?: string };
      let userFriendlyMsg = ae.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.';
      if (ae.code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'Энэ имэйл хаяг эсвэл утас аль хэдийн бүртгэгдсэн байна.';
      } else if (ae.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Имэйл хаяг буруу форматтай байна.';
      } else if (ae.code === 'auth/operation-not-allowed') {
        userFriendlyMsg = 'Бүртгүүлэх үйлчилгээ түр хаагдсан байна. Дараа дахин оролдоно уу.';
      } else if (ae.code === 'auth/weak-password') {
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
        Object.entries(newUser).filter(([, v]) => v !== undefined)
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
