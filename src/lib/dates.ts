import type { HDate } from './types';

export const START_YEAR = 1940;
export const END_YEAR = 2026;

const MONTHS = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
];
const MONTHS_BARE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export function parts(d: HDate): [number, number | undefined, number | undefined] {
  const [y, m, day] = d.split('-').map(Number);
  return [y, m || undefined, day || undefined];
}

export function yearOf(d: HDate): number {
  return parts(d)[0];
}

/** Fractional year, used for positioning on the ruler. */
export function toYearFloat(d: HDate): number {
  const [y, m, day] = parts(d);
  return y + ((m ?? 1) - 1) / 12 + ((day ?? 1) - 1) / 365;
}

export function formatDate(d: HDate): string {
  const [y, m, day] = parts(d);
  if (day && m) return `${day} ${MONTHS[m - 1]} ${y}`;
  if (m) return `${MONTHS_BARE[m - 1]} ${y}`;
  return String(y);
}

export function formatRange(start: HDate, end: HDate | null): string {
  return `${formatDate(start)} – ${end ? formatDate(end) : 'היום'}`;
}

export function compareDates(a: HDate, b: HDate): number {
  return toYearFloat(a) - toYearFloat(b);
}
