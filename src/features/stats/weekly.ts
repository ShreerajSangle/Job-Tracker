export interface WeekBucket {
  weekStart: number;
  label: string;
  count: number;
}

function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** Counts applications per Monday-based week for the last `n` weeks, oldest first. */
export function weeklyCounts(dates: Date[], today: Date, n = 6): WeekBucket[] {
  const thisWeek = mondayOf(today);
  const starts = Array.from({ length: n }, (_, i) => {
    const w = new Date(thisWeek);
    w.setDate(w.getDate() - (n - 1 - i) * 7);
    return w;
  });
  const counts = new Map<number, number>();
  for (const d of dates) {
    const k = mondayOf(d).getTime();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return starts.map((w, i) => ({
    weekStart: w.getTime(),
    label: i === n - 1 ? 'This wk' : w.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: counts.get(w.getTime()) ?? 0,
  }));
}
