import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { pbkdf2 as _pbkdf2, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { checkRateLimit, identifierKey } from './rateLimit';

admin.initializeApp();
const db = admin.firestore();

export { optimizeBio } from './optimizeBio';
export { onReviewWrite, cleanupJobRelations, onJobHiringCancelled } from './jobLifecycle';
export { createJob } from './jobPosting';
const pbkdf2Async = promisify(_pbkdf2);

// Callable function: total registered user count for the public homepage stat.
// Uses an Admin-SDK count aggregation so no user documents (and thus no PII) are
// ever transferred to the client — Firestore rules block list/collection reads
// on `users` entirely (see firestore.rules), so this is the only sanctioned way
// to surface an aggregate number.
export const getUserCount = onCall(
  { region: 'us-central1' },
  async () => {
    const snap = await db.collection('users').count().get();
    return { count: snap.data().count };
  }
);

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
// Rate-limited: this runs before Firebase Auth sees any request, so Auth's own
// brute-force protection never kicks in here — without a limit, a script could
// feed it thousands of phone numbers and harvest which ones are registered
// (an enumeration oracle), or hammer one repeatedly (audit S4).
export const resolveLoginEmail = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { email, phone } = request.data as { email?: string; phone?: string };
    if (!email && !phone) {
      throw new HttpsError('invalid-argument', 'Имэйл эсвэл утасны дугаар шаардлагатай.');
    }

    const ip = request.rawRequest.ip || 'unknown';
    const [byIp, byIdentifier] = await Promise.all([
      checkRateLimit(`resolveLoginEmail_ip_${ip}`, 30, 15 * 60 * 1000),
      checkRateLimit(`resolveLoginEmail_id_${identifierKey(email, phone)}`, 10, 15 * 60 * 1000),
    ]);
    if (!byIp || !byIdentifier) {
      throw new HttpsError('resource-exhausted', 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.');
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
// Rate-limited for the same enumeration/brute-force reasons as resolveLoginEmail (audit S4).
export const resolveAccountForRecovery = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { email, phone } = request.data as { email?: string; phone?: string };
    if (!email && !phone) {
      throw new HttpsError('invalid-argument', 'Имэйл эсвэл утасны дугаар шаардлагатай.');
    }

    const ip = request.rawRequest.ip || 'unknown';
    const [byIp, byIdentifier] = await Promise.all([
      checkRateLimit(`resolveAccountForRecovery_ip_${ip}`, 30, 15 * 60 * 1000),
      checkRateLimit(`resolveAccountForRecovery_id_${identifierKey(email, phone)}`, 10, 15 * 60 * 1000),
    ]);
    if (!byIp || !byIdentifier) {
      throw new HttpsError('resource-exhausted', 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.');
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

// Callable function: verify PBKDF2 security answers server-side and reset Firebase Auth password.
// Rate-limited per target account AND per caller IP — normalized (lowercased)
// security answers have far less entropy than a real password, so without a
// limit this endpoint was an unthrottled account-takeover oracle (audit S4).
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

    const ip = request.rawRequest.ip || 'unknown';
    const [byUser, byIp] = await Promise.all([
      checkRateLimit(`resetPasswordWithAnswers_user_${userId}`, 5, 60 * 60 * 1000),
      checkRateLimit(`resetPasswordWithAnswers_ip_${ip}`, 20, 60 * 60 * 1000),
    ]);
    if (!byUser || !byIp) {
      throw new HttpsError(
        'resource-exhausted',
        'Хэт олон удаа буруу оролдлого хийлээ. 1 цагийн дараа дахин оролдоно уу.'
      );
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

    // Update Firebase Auth password (Admin SDK bypasses reauthentication requirement).
    // Firestore never stores a password hash (audit S7), so there's nothing to
    // update there — Auth is the single source of truth for the password itself.
    await admin.auth().updateUser(userId, { password: newPassword });

    return { success: true };
  }
);
