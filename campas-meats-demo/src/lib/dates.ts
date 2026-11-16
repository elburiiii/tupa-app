/**
 * Date helpers shared by build-time filtering. The same rules are re-applied in the
 * browser by src/scripts/freshness.ts, so a page that was built weeks ago still hides
 * anything that has expired since.
 *
 * All dates are plain YYYY-MM-DD strings interpreted in Finnish time (Europe/Helsinki).
 * Comparing them as strings is correct because the format is fixed-width.
 */
export const TIME_ZONE = 'Europe/Helsinki';

export function todayInFinland(now: Date = new Date()): string {
  // sv-SE formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIME_ZONE }).format(now);
}

/** Inclusive window: visible on start day through end day. */
export function isActive(start: string, end: string, today: string): boolean {
  return start <= today && today <= end;
}

export function isNotExpired(end: string, today: string): boolean {
  return today <= end;
}
