import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Optional: only set once Google Analytics is linked to this Firebase project
  // in the Firebase Console (Project Settings → General → your web app). Until
  // NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is set, src/lib/analytics.ts no-ops
  // (audit C2 — no funnel tracking existed at all).
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services with auto long-polling detection to prevent Firestore WebSocket hanging in specific networks
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
