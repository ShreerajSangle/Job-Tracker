import { useState } from 'react';
import { useApplications } from '@/features/applications/queries';
import { todayISO } from '@/lib/format';
import { computeStreak } from './streak';
import { useGoal } from './useGoal';

/** Today's progress toward the daily goal, plus the current streak. */
export function GoalRing() {
  const { data: apps = [] } = useApplications();
  const { goal, setGoal } = useGoal();
  const [editing, setEditing] = useState(false);
  const today = todayISO();
  const dates = apps.filter((a) => a.status !== 'bookmarked').map((a) => a.applied_on);
  const done = dates.filter((d) => d === today).length;
  const streak = computeStreak(dates, today);
  const r = 22, c = 2 * Math.PI * r, p = Math.min(1, done / goal);

  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" role="img" aria-label={`${done} of ${goal} applications today`}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--surface-3))" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={p >= 1 ? 'hsl(var(--green-ink))' : 'hsl(var(--bordo-hi))'} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`} style={{ transition: 'stroke-dasharray 600ms var(--ease-out)' }} />
      </svg>
      <div className="text-left font-display">
        <p className="text-lg font-semibold leading-tight text-cream">
          {done} /{' '}
          {editing ? (
            <input
              type="number" min={1} max={100} autoFocus defaultValue={goal} aria-label="Daily goal"
              onBlur={(e) => { const n = Number(e.target.value); if (n >= 1) setGoal(n); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="w-14 rounded-md bg-surface-3 px-1.5 text-lg text-cream outline-none"
            />
          ) : (
            <button type="button" onClick={() => setEditing(true)} title="Change daily goal" className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">{goal}</button>
          )}{' '}
          today
        </p>
        <p className="text-sm text-ink-2">{streak > 0 ? `${streak}-day streak` : 'Apply today to start a streak'}</p>
      </div>
    </div>
  );
}
