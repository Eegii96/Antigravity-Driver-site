import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Optimizes a user's bio (operator or employer) via a server-side Cloud Function.
 * The Gemini API key lives only in the Cloud Function's secret config — it is
 * never read or bundled on the client.
 */
export async function optimizeBio(params: {
  fullName: string;
  experienceYears: number;
  machineTypes: string[];
  rawBio: string;
  currentBio?: string;
  userType?: 'operator' | 'employer';
}): Promise<string> {
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'optimizeBio');
  const result = await fn(params);
  return result.data as string;
}
