import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCounterStats } from '@/features/stats/useCounterStats';
import { useDaysLeft } from '@/features/stats/useDaysLeft';
import { useCountUp } from '@/features/stats/useCountUp';
import { GoalRing } from '@/features/stats/GoalRing';

function Metric({ label, value, className }: { label: string; value: number | undefined; className: string }) {
  const shown = useCountUp(value);
  return (
    <p className={`font-display text-[clamp(1.75rem,4.2vw,3.25rem)] font-semibold italic leading-[1.1] tracking-[-0.02em] ${className}`}>
      {label} : <span className="tabular-nums">{value === undefined ? '–' : shown}</span>
    </p>
  );
}

export default function Counter() {
  const { data } = useCounterStats();
  const { endsOn, daysLeft, setEndsOn } = useDaysLeft();
  const [editing, setEditing] = useState(false);
  const [hint, setHint] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 1200);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement)) navigate('/dashboard');
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-center font-display text-[clamp(3rem,9vw,7rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em] text-cream">
          Job Application Counter
        </h1>

        <div className="mt-10 text-center">
          {editing ? (
            <input
              type="date"
              autoFocus
              defaultValue={endsOn ?? ''}
              onBlur={(e) => { setEndsOn(e.target.value); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="rounded-[var(--r-sm)] border border-line bg-surface-3 px-3 py-1.5 text-sm text-cream outline-none focus:border-green-ink"
              aria-label="Job search end date"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="font-display text-xs font-semibold uppercase tracking-[0.04em] text-cream/90 transition-transform active:scale-[0.97]"
              aria-label="Set job search end date"
            >
              Days left {daysLeft ?? '—'}
            </button>
          )}
        </div>

        <div className="mx-auto mt-12 w-fit space-y-1 text-left">
          <Metric label="APPLIED" value={data?.applied} className="text-green-ink" />
          <Metric label="REJECTIONS" value={data?.rejections} className="text-bordo-ink" />
          <Metric label="INTERVIEWS" value={data?.interviews} className="text-cream-dim" />
        </div>

        <GoalRing />

        <div className={`mt-16 text-center transition-opacity duration-700 ${hint ? 'opacity-100' : 'opacity-0'}`}>
          <Link to="/dashboard" className="text-xs uppercase tracking-[0.08em] text-ink-2 hover:text-cream">
            Enter ↵
          </Link>
        </div>
      </div>
    </main>
  );
}
