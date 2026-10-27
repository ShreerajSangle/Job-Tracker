import { parseDay } from '@/lib/format';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Consecutive days with at least one application, ending today (or yesterday if today has none yet). */
export function computeStreak(appliedDates: string[], today: string): number {
  const days = new Set(appliedDates);
  const cursor = parseDay(today);
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(key(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}
