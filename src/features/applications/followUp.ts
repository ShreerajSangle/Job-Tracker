import type { Application } from './types';

export const FOLLOW_UP_DAYS = 7;

/** An "applied" application with no activity for a week deserves a nudge. */
export function needsFollowUp(app: Pick<Application, 'status' | 'applied_on' | 'updated_at'>, now: Date = new Date()): boolean {
  if (app.status !== 'applied') return false;
  const last = Math.max(new Date(`${app.applied_on}T00:00:00`).getTime(), new Date(app.updated_at).getTime());
  return (now.getTime() - last) / 864e5 >= FOLLOW_UP_DAYS;
}
