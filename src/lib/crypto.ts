/**
 * Password / secret hashing using PBKDF2-HMAC-SHA-256 via the Web Crypto API.
 *
 * Each secret gets a fresh random 16-byte salt and is stretched over many
 * iterations, so identical inputs produce different stored values and
 * brute-force / rainbow-table attacks are impractical.
 *
 * Stored format (single string, safe for Firestore):
 *   pbkdf2$<iterations>$<saltBase64>$<hashBase64>
 */

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32; // 256-bit derived key

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(secret: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

/**
 * Hash a secret (password or security answer) for storage.
 * Security answers are normalized (trim + lowercase) so capitalization
 * and surrounding whitespace don't affect verification.
 */
export async function hashSecret(secret: string, normalize = false): Promise<string> {
  const input = normalize ? secret.trim().toLowerCase() : secret;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(input, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Constant-time-ish comparison of two equal-length byte arrays. */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify a submitted secret against a stored pbkdf2 string. */
export async function verifySecret(secret: string, stored: string, normalize = false): Promise<boolean> {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations)) return false;
  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const input = normalize ? secret.trim().toLowerCase() : secret;
  const actual = await derive(input, salt, iterations);
  return bytesEqual(actual, expected);
}
