/**
 * URL-safe Latin slugs for the aimag/city landing pages (audit P7).
 *
 * Hand-mapped rather than auto-transliterated — Mongolian Cyrillic has enough
 * irregular cases (Ө/Ү, compound names like "Баян-Өлгий") that a generic
 * converter risks collisions or unreadable slugs. Covers the same 22 entries
 * as LOCATION_OPTIONS in job-format.ts (minus the 'Бүгд' all-filter sentinel)
 * so the filter dropdown, landing pages, and footer links can't drift apart.
 */
export const AIMAG_SLUGS: { location: string; slug: string }[] = [
  { location: 'Улаанбаатар хот', slug: 'ulaanbaatar' },
  { location: 'Архангай аймаг', slug: 'arkhangai' },
  { location: 'Баян-Өлгий аймаг', slug: 'bayan-ulgii' },
  { location: 'Баянхонгор аймаг', slug: 'bayankhongor' },
  { location: 'Булган аймаг', slug: 'bulgan' },
  { location: 'Говь-Алтай аймаг', slug: 'govi-altai' },
  { location: 'Говьсүмбэр аймаг', slug: 'govisumber' },
  { location: 'Дархан-Уул аймаг', slug: 'darkhan-uul' },
  { location: 'Дорноговь аймаг', slug: 'dornogovi' },
  { location: 'Дорнод аймаг', slug: 'dornod' },
  { location: 'Дундговь аймаг', slug: 'dundgovi' },
  { location: 'Завхан аймаг', slug: 'zavkhan' },
  { location: 'Орхон аймаг', slug: 'orkhon' },
  { location: 'Өвөрхангай аймаг', slug: 'uvurkhangai' },
  { location: 'Өмнөговь аймаг', slug: 'umnugovi' },
  { location: 'Сүхбаатар аймаг', slug: 'sukhbaatar' },
  { location: 'Сэлэнгэ аймаг', slug: 'selenge' },
  { location: 'Төв аймаг', slug: 'tuv' },
  { location: 'Увс аймаг', slug: 'uvs' },
  { location: 'Ховд аймаг', slug: 'khovd' },
  { location: 'Хөвсгөл аймаг', slug: 'khuvsgul' },
  { location: 'Хэнтий аймаг', slug: 'khentii' },
];

export function getLocationBySlug(slug: string): string | undefined {
  return AIMAG_SLUGS.find(a => a.slug === slug)?.location;
}
