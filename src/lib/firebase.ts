import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Firebase Storage is only touched by the job-image upload flow
// (src/lib/storage.ts), so it's loaded on demand there via a dynamic
// import instead of bundled into the vendor chunk every page ships with
// (audit: "reduce unused JavaScript" — firebase/storage was ~30-40 KiB of
// dead weight on pages that never upload an image).

// App Check (audit S4/S10) — proves requests come from the real web app, not
// a script hitting Firestore/Storage/Functions directly. No-ops until
// NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is set (see .env.example): shipping this
// SDK call is safe on its own, since nothing enforces App Check tokens yet —
// that's a separate, deliberately staged Firebase Console setting per
// service (Monitor mode first, then Enforce, done outside this codebase).
// `firebase/app-check` (+ its bundled reCAPTCHA v3 provider code) is dynamically
// imported instead of loaded at module scope — it was a meaningful chunk of the
// JS every page parsed/executed before first paint (audit: "reduce unused
// JavaScript" + LCP main-thread-blocking investigation). Kicked off immediately
// on load, not deferred to idle/interaction, so the window where a Firestore
// call could fire before the App Check token is attached stays as small as
// possible — relevant once Enforce mode is turned on per AGENTS.md's staged
// rollout, since Monitor mode doesn't reject unverified requests today.
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  });
}

export default app;
