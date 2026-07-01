import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { pbkdf2 as _pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

admin.initializeApp();
const db = admin.firestore();
const pbkdf2Async = promisify(_pbkdf2);

const ITERATIONS = 100_000;
const KEY_BYTES = 32;

async function verifySecret(secret: string, stored: string, normalize = false): Promise<boolean> {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [, itersStr, saltBase64, hashBase64] = parts;
  const iterations = parseInt(itersStr, 10);
  let input = normalize ? secret.trim().toLowerCase() : secret;
  const salt = Buffer.from(saltBase64, 'base64');
  const expected = Buffer.from(hashBase64, 'base64');
  const derived = await pbkdf2Async(input, salt, iterations, KEY_BYTES, 'sha256');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await pbkdf2Async(secret, salt, ITERATIONS, KEY_BYTES, 'sha256');
  return `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Shared lookup: find a user doc by email or phone (with local/international phone fallback).
// Runs with Admin SDK privileges — bypasses Firestore rules, so it's the only place allowed
// to read the users collection before the caller is authenticated.
async function findUserByIdentifier(email?: string, phone?: string) {
  if (email) {
    const snap = await db.collection('users').where('email', '==', email.trim().toLowerCase()).limit(1).get();
    if (!snap.empty) return snap.docs[0];
    return null;
  }
  if (phone) {
    const cleanPhone = phone.trim();
    let snap = await db.collection('users').where('phone', '==', cleanPhone).limit(1).get();
    if (snap.empty) {
      const altPhone = cleanPhone.startsWith('+976') ? cleanPhone.replace('+976', '') : '+976' + cleanPhone;
      snap = await db.collection('users').where('phone', '==', altPhone).limit(1).get();
    }
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

// Callable function: resolve an email-or-phone login identifier to the Firebase Auth email,
// without exposing any other user document fields to the (still unauthenticated) client.
export const resolveLoginEmail = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { email, phone } = request.data as { email?: string; phone?: string };
    if (!email && !phone) {
      throw new HttpsError('invalid-argument', 'Имэйл эсвэл утасны дугаар шаардлагатай.');
    }

    const userDoc = await findUserByIdentifier(email, phone);
    if (!userDoc) {
      return { found: false };
    }
    const data = userDoc.data();
    const authEmail = data.email || `${(data.phone as string).replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
    return { found: true, authEmail };
  }
);

// Callable function: resolve an email-or-phone identifier to the account's security questions
// (text only, never the hashed answers) so the password-recovery UI can render step 2.
export const resolveAccountForRecovery = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { email, phone } = request.data as { email?: string; phone?: string };
    if (!email && !phone) {
      throw new HttpsError('invalid-argument', 'Имэйл эсвэл утасны дугаар шаардлагатай.');
    }

    const userDoc = await findUserByIdentifier(email, phone);
    if (!userDoc) {
      throw new HttpsError('not-found', 'Энэхүү имэйл эсвэл утасны дугаартай хэрэглэгч системд бүртгэлгүй байна.');
    }
    const data = userDoc.data();
    if (!data.securityQuestion1 || !data.securityAnswer1 || !data.securityQuestion2 || !data.securityAnswer2) {
      throw new HttpsError(
        'failed-precondition',
        'Уучлаарай, та аюулгүй байдлын асуулт тохируулаагүй тул автоматаар нууц код сэргээх боломжгүй байна. Та манай холбоо барих хэсгээр хандаж дэмжлэг авна уу.'
      );
    }

    return {
      userId: userDoc.id,
      securityQuestion1: data.securityQuestion1 as string,
      securityQuestion2: data.securityQuestion2 as string,
    };
  }
);

// Callable function: verify PBKDF2 security answers server-side and reset Firebase Auth password
export const resetPasswordWithAnswers = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { userId, answer1, answer2, newPassword } = request.data as {
      userId: string;
      answer1: string;
      answer2: string;
      newPassword: string;
    };

    if (!userId || !answer1 || !answer2 || !newPassword) {
      throw new HttpsError('invalid-argument', 'Бүх талбарыг бөглөнө үү.');
    }
    if (newPassword.length < 8) {
      throw new HttpsError('invalid-argument', 'Нууц үг хамгийн багадаа 8 тэмдэгт байх шаардлагатай.');
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Хэрэглэгч олдсонгүй.');
    }
    const userData = userDoc.data()!;

    const [ok1, ok2] = await Promise.all([
      verifySecret(answer1, userData['securityAnswer1'] || '', true),
      verifySecret(answer2, userData['securityAnswer2'] || '', true),
    ]);

    if (!ok1 || !ok2) {
      throw new HttpsError(
        'permission-denied',
        'Аюулгүй байдлын асуултуудын хариулт таарахгүй байна.'
      );
    }

    // Update Firebase Auth password (Admin SDK bypasses reauthentication requirement)
    await admin.auth().updateUser(userId, { password: newPassword });

    // Update Firestore PBKDF2 hash to match the new password
    const hashedPassword = await hashSecret(newPassword);
    await db.collection('users').doc(userId).update({ password: hashedPassword });

    return { success: true };
  }
);
