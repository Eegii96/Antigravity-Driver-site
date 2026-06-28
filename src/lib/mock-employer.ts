/**
 * Deterministic mock employer name & phone for GUEST (logged-out) views.
 *
 * Real employer names/phone numbers must NEVER appear in the DOM for
 * unauthenticated users (see AGENTS.md §2 — Guest Privacy Protection). These
 * helpers produce stable, fake-but-plausible values derived from the job id so
 * the blurred placeholder is consistent across renders and across pages.
 *
 * Single source of truth — consumed by both JobBoard.tsx and JobDetailClient.tsx
 * so the two views can never drift out of sync.
 */

const MOCK_NAMES = [
  'Бат-Эрдэнэ', 'Лхагвасүрэн', 'Энхбат', 'Ганзориг',
  'Мөнх-Эрдэнэ', 'Болдбаатар', 'Төмөрхүү', 'Алтанхуяг',
];

const MOCK_PHONE_PREFIXES = [
  '9911', '8811', '9909', '8010', '9511', '9400', '8515', '9922',
];

function charCodeSum(jobId: string): number {
  return jobId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getMockEmployerName(jobId: string): string {
  return MOCK_NAMES[charCodeSum(jobId) % MOCK_NAMES.length];
}

export function getMockEmployerPhone(jobId: string): string {
  const sum = charCodeSum(jobId);
  const prefix = MOCK_PHONE_PREFIXES[sum % MOCK_PHONE_PREFIXES.length];
  const lastFour = (sum * 17) % 9000 + 1000;
  return `${prefix}${lastFour}`;
}
