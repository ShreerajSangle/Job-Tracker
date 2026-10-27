const POOLS: Record<string, string[]> = {
  night: ['Burning the midnight oil', 'Still up', 'The quiet hours', 'Night shift'],
  early: ['Rise and shine', 'Early start', 'Fresh day ahead', 'Up with the sun'],
  morning: ['Good morning', 'Morning momentum', 'Make it count today', 'Let’s get moving'],
  afternoon: ['Good afternoon', 'Keep the momentum', 'Afternoon push', 'Halfway there'],
  evening: ['Good evening', 'Evening wind-down', 'One more application?', 'Golden hour'],
  late: ['Winding down', 'Wrap up the day', 'Late-night focus', 'Almost bedtime'],
};

export function periodFor(hour: number): keyof typeof POOLS {
  if (hour < 5) return 'night';
  if (hour < 9) return 'early';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'late';
}

/** Deterministic per (day, hour): stable across re-renders, changes as the day moves on. */
export function greetingFor(date: Date, name = ''): string {
  const pool = POOLS[periodFor(date.getHours())];
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + date.getHours() * 7;
  const base = pool[seed % pool.length];
  const first = name.split(/\s+/)[0];
  return first ? `${base}, ${first}` : base;
}
