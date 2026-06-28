// Pure formatting helpers and shared constants for the job board UI.
// Extracted from JobBoard.tsx so they can be unit-tested and reused.
import type { User } from '../types';
import { parseNotificationDateString } from './db';

/** Mongolian аймаг list used by the location filter (incl. the "Бүгд" / all option). */
export const LOCATION_OPTIONS = [
  'Бүгд',
  'Улаанбаатар хот',
  'Архангай аймаг',
  'Баян-Өлгий аймаг',
  'Баянхонгор аймаг',
  'Булган аймаг',
  'Говь-Алтай аймаг',
  'Говьсүмбэр аймаг',
  'Дархан-Уул аймаг',
  'Дорноговь аймаг',
  'Дорнод аймаг',
  'Дундговь аймаг',
  'Завхан аймаг',
  'Орхон аймаг',
  'Өвөрхангай аймаг',
  'Өмнөговь аймаг',
  'Сүхбаатар аймаг',
  'Сэлэнгэ аймаг',
  'Төв аймаг',
  'Увс аймаг',
  'Ховд аймаг',
  'Хөвсгөл аймаг',
  'Хэнтий аймаг',
];

/**
 * Short display name: company name for employers, otherwise the person's first
 * name (falling back to the last token of a full name). Accepts a User or a raw
 * name string. Returns '' when nothing usable is available.
 */
export const getFirstName = (userOrName?: User | string | null): string => {
  if (!userOrName) return '';
  if (typeof userOrName === 'string') {
    const parts = userOrName.trim().split(/\s+/);
    return parts[parts.length - 1] || userOrName;
  }
  if (userOrName.type === 'employer' && userOrName.companyName && userOrName.companyName.trim()) {
    return userOrName.companyName.trim();
  }
  if (userOrName.firstName && userOrName.firstName.trim()) {
    return userOrName.firstName.trim();
  }
  if (userOrName.fullName) {
    const parts = userOrName.fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || userOrName.fullName;
  }
  return '';
};

/** Format an ISO date string as `YYYY.MM.DD`. Returns the input unchanged if unparseable. */
export const formatDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return isoString || '';
  }
};

/** Format a notification timestamp (any supported format) as `YYYY.MM.DD HH:mm`. */
export const formatNotificationDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const ms = parseNotificationDateString(isoString);
    if (ms === 0) return isoString;
    const d = new Date(ms);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch {
    return isoString || '';
  }
};
