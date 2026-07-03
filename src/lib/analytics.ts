// Minimum-viable funnel tracking (audit C2 — previously zero analytics of any
// kind existed, so neither funnel — "contact a poster" nor "post a listing" —
// could be measured). Firebase Analytics requires a Google Analytics property
// linked to this Firebase project (Firebase Console → Project Settings →
// General → your web app → measurementId) and the resulting id set as
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID. Until that's configured, every call
// here silently no-ops — nothing breaks, events are just not collected yet.
import app from './firebase';

type AnalyticsInstance = import('firebase/analytics').Analytics;
let analyticsPromise: Promise<AnalyticsInstance | null> | null = null;

function getAnalyticsInstance(): Promise<AnalyticsInstance | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return Promise.resolve(null);

  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
      const supported = await isSupported().catch(() => false);
      return supported ? getAnalytics(app) : null;
    });
  }
  return analyticsPromise;
}

async function track(eventName: string, params?: Record<string, unknown>): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, params);
  } catch (err) {
    console.error('Analytics event failed:', eventName, err);
  }
}

// Funnel (a): visitor -> contacts a listing poster
export const trackSearch = (query: string, location: string, type: string) =>
  track('search', { search_term: query, location, job_type: type });

export const trackViewJob = (jobId: string, status: string) =>
  track('view_job', { job_id: jobId, status });

export const trackContactClick = (jobId: string, method: 'tel') =>
  track('contact_click', { job_id: jobId, method });

export const trackShareJob = (jobId: string, platform: string) =>
  track('share_job', { job_id: jobId, platform });

export const trackApplySubmit = (jobId: string) =>
  track('apply_submit', { job_id: jobId });

// Funnel (b): visitor -> posts a listing
export const trackPostStarted = () => track('post_started');
export const trackPostCompleted = (jobId: string, type: string) =>
  track('post_completed', { job_id: jobId, job_type: type });

export const trackSignUpStarted = (userType: string) =>
  track('sign_up_started', { user_type: userType });
export const trackSignUpCompleted = (userType: string) =>
  track('sign_up_completed', { user_type: userType });
