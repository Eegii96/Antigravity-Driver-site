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
