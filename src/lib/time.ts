// Time + slot rules — centralised so /book components never duplicate cutoff / Sunday logic.
// All comparisons are IST. (QA BK-02, BK-03, §17 time/timezone notes.)

import { BookingCutoffError } from './errors';

const CUTOFF_HOUR_IST = 20; // 8 PM IST — tomorrow's slots lock at this server-side wall time.

function getHourIST(date: Date): number {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false,
  });
  return parseInt(f.format(date), 10);
}

function getDayOfWeekIST(date: Date): number {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  });
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[f.format(date)] ?? -1;
}

/** ISO 'YYYY-MM-DD' for a date in IST. */
function istDateKey(date: Date): string {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return f.format(date);
}

/** After 8 PM IST, tomorrow's slots are locked. Server-time enforced (QA BK-02). */
export function isAfterCutoff(now: Date = new Date()): boolean {
  return getHourIST(now) >= CUTOFF_HOUR_IST;
}

/** PT not available on Sundays — group classes only (QA BK-03). */
export function isPTAvailable(slotDate: Date): boolean {
  return getDayOfWeekIST(slotDate) !== 0;
}

/** True if slotDate falls on the IST calendar day after `now`. */
export function isTomorrowIST(slotDate: Date, now: Date = new Date()): boolean {
  const nowKey = istDateKey(now);
  const [y, m, d] = nowKey.split('-').map(Number);
  // Build tomorrow in IST by incrementing the date, then comparing keys
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  return istDateKey(slotDate) === istDateKey(tomorrow);
}

/**
 * Throws BookingCutoffError if a tomorrow-slot is being booked after 8 PM IST.
 * Call at the server-action boundary, not in components — clients can spoof clocks.
 */
export function assertWithinCutoff(slotDate: Date, now: Date = new Date()): void {
  if (isTomorrowIST(slotDate, now) && isAfterCutoff(now)) {
    throw new BookingCutoffError();
  }
}

export interface SlotGenerationOptions {
  weekOffset?: number;
  baseDate?: Date;
}

export interface SlotDay {
  date: Date;
  iso: string;
  label: string;
  day: number;
  month: string;
  locked: boolean;
}

/**
 * Booking-grid slot generator. Signature locked in Phase 0 so booking components
 * don't invent their own. Full implementation lands Phase 2 against the `sessions`
 * table + coach availability join.
 */
export function generateSlots(_opts: SlotGenerationOptions = {}): SlotDay[] {
  // TODO Phase 2.
  return [];
}
