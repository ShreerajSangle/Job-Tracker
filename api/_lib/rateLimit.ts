// Best-effort per-instance sliding-window limiter (serverless instances are
// short-lived, so this blunts abuse bursts rather than guaranteeing a quota).
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return Math.ceil((windowMs - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  return 0;
}
