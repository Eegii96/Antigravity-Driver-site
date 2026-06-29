/**
 * Browser-native SHA-256 via Web Crypto API.
 * Returns a lowercase 64-char hex digest.
 * Input is trimmed and lowercased so comparisons are case-insensitive.
 */
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 produces exactly 64 lowercase hex characters — use to detect already-hashed values. */
export function isHashed(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
