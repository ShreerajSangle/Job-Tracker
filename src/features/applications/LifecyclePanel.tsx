import { useState } from 'react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { formatDay } from '@/lib/format';
import {
  useAddStage, useAllStages, useDeleteStage, useMoveStage, useSetStageState, useStageEvents,
} from './stageQueries';
import { STAGE_PRESETS, type Stage, type StageState } from './types';

const DOT: Record<StageState, string> = {
  pending: 'bg-surface-3', current: 'bg-green-ink', completed: 'bg-cream-dim', skipped: 'bg-ink-2', rejected: 'bg-bordo-hi',
};
const EVENT_LABEL: Record<string, string> = {
  application_created: 'Application created', stage_added: 'Stage added', stage_started: 'Stage started',
  stage_completed: 'Stage completed', stage_skipped: 'Stage skipped', stage_rejected: 'Rejected at stage',
  stage_reset: 'Stage reset', stage_renamed: 'Stage renamed', status_changed: 'Status changed',
};

const btn = 'rounded-full px-2.5 py-1 text-xs text-ink-2 transition-colors hover:bg-surface-3 hover:text-cream';

/** Ordered interview pipeline for one application + its append-only history. */
export function LifecyclePanel({ applicationId }: { applicationId: string }) {
  const { data: all = [] } = useAllStages();
  const { data: events = [] } = useStageEvents(applicationId);
  const add = useAddStage();
  const setState = useSetStageState();
  const move = useMoveStage();
  const del = useDeleteStage();
  const [preset, setPreset] = useState('');
  const [custom, setCustom] = useState('');

  const stages = all.filter((s) => s.application_id === applicationId).sort((a, b) => a.position - b.position);
  const current = stages.find((s) => s.state === 'current');

  const addStage = () => {
    const p = STAGE_PRESETS.find((x) => x[0] === preset);
    if (!p) return;
    const name = p[0] === 'custom' ? custom.trim() : p[1];
    if (!name) return;
    add.mutate({ applicationId, name, stageType: p[2], position: stages.length ? Math.max(...stages.map((s) => s.position)) + 1 : 0 },
      { onSuccess: () => { setPreset(''); setCustom(''); } });
  };

  const act = (s: Stage, state: StageState) => setState.mutate({ stage: s, state, current });

  return (
    <section className="space-y-4 border-t border-line pt-6">
      <h3 className="text-xs font-medium uppercase tracking-[0.02em] text-ink-2">Lifecycle</h3>
      {stages.length === 0 && <p className="text-sm text-ink-2">No stages yet. Add the rounds you expect.</p>}
      <ol className="space-y-2">
        {stages.map((s, i) => (
          <li key={s.id} className="rounded-[var(--r-sm)] bg-surface-2 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[s.state]}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-cream">{s.name}</span>
              <span className="text-xs capitalize text-ink-2">{s.state}</span>
              {s.state === 'pending' && (
                <>
                  <button aria-label="Move up" disabled={i === 0} onClick={() => move.mutate({ a: s, b: stages[i - 1] })} className={btn}><ArrowUp className="h-3 w-3" /></button>
                  <button aria-label="Move down" disabled={i === stages.length - 1} onClick={() => move.mutate({ a: s, b: stages[i + 1] })} className={btn}><ArrowDown className="h-3 w-3" /></button>
                  <button aria-label="Remove stage" onClick={() => del.mutate(s.id)} className={btn}><X className="h-3 w-3" /></button>
                </>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 pl-4">
              {s.state !== 'current' && s.state !== 'completed' && <button type="button" className={btn} onClick={() => act(s, 'current')}>Start</button>}
              {s.state === 'current' && <button type="button" className={btn} onClick={() => act(s, 'completed')}>Complete</button>}
              {(s.state === 'pending' || s.state === 'current') && <button type="button" className={btn} onClick={() => act(s, 'skipped')}>Skip</button>}
              {(s.state === 'pending' || s.state === 'current') && <button type="button" className={`${btn} text-bordo-ink`} onClick={() => act(s, 'rejected')}>Rejected here</button>}
              {(s.state === 'completed' || s.state === 'skipped' || s.state === 'rejected') && <button type="button" className={btn} onClick={() => act(s, 'pending')}>Reset</button>}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex gap-2">
        <select value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Add stage"
          className="min-w-0 flex-1 rounded-[var(--r-sm)] border border-line bg-surface-3 px-3 py-2 text-sm text-cream outline-none">
          <option value="">Add a stage…</option>
          {STAGE_PRESETS.map((p) => <option key={p[0]} value={p[0]}>{p[1]}</option>)}
        </select>
        <button type="button" onClick={addStage} disabled={!preset || add.isPending}
          className="rounded-full bg-surface-3 px-4 text-sm text-cream transition-transform hover:bg-bordo active:scale-[0.97] disabled:opacity-50">Add</button>
      </div>
      {preset === 'custom' && (
        <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={200} placeholder="Stage name" aria-label="Custom stage name"
          className="w-full rounded-[var(--r-sm)] border border-line bg-surface-3 px-3 py-2 text-sm text-cream outline-none" />
      )}

      {events.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-ink-2 hover:text-cream">History ({events.length})</summary>
          <ul className="mt-3 space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 text-xs">
                <span className="text-cream">
                  {EVENT_LABEL[e.event_type] ?? e.event_type}
                  {e.stage_name_snapshot && <span className="text-ink-2"> · {e.stage_name_snapshot}</span>}
                  {e.event_type === 'status_changed' && <span className="text-ink-2"> · {e.from_status} → {e.to_status}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-ink-2">{formatDay(e.occurred_at.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
