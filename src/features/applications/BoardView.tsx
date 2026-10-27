import { useState } from 'react';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { relativeDay } from '@/lib/format';
import { needsFollowUp } from './followUp';
import { STATUSES, STATUS_STYLE, type Application, type ApplicationStatus } from './types';

/** Kanban board: one column per status. Drag a card to change its status (undo is offered by the caller). */
export function BoardView({ rows, onOpen, onMove }: {
  rows: Application[]; onOpen: (a: Application) => void; onMove: (a: Application, to: ApplicationStatus) => void;
}) {
  const [over, setOver] = useState<ApplicationStatus | null>(null);

  return (
    <div className="mt-6 flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Applications board">
      {STATUSES.map((status) => {
        const cards = rows.filter((a) => a.status === status);
        return (
          <section
            key={status}
            role="listitem"
            aria-label={STATUS_STYLE[status].label}
            onDragOver={(e) => { e.preventDefault(); setOver(status); }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData('text/plain');
              const app = rows.find((a) => a.id === id);
              if (app && app.status !== status) onMove(app, status);
            }}
            className={`w-64 shrink-0 rounded-[var(--r-md)] p-3 transition-colors ${over === status ? 'bg-surface-3' : 'bg-surface-1'}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status].cls}`}>{STATUS_STYLE[status].label}</span>
              <span className="font-mono text-xs tabular-nums text-ink-2">{cards.length}</span>
            </header>
            <ul className="space-y-2">
              {cards.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onClick={() => onOpen(a)}
                    className="flex w-full cursor-grab items-start gap-3 rounded-[var(--r-sm)] bg-surface-2 p-3 text-left outline-none transition-[transform,background-color] hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] active:cursor-grabbing"
                  >
                    <CompanyAvatar company={a.company} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-cream">{a.company}</span>
                      <span className="block truncate text-xs text-ink-2">{a.role}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-[0.7rem] text-ink-2">
                        <span className="tabular-nums">{relativeDay(a.applied_on)}</span>
                        {needsFollowUp(a) && <span className="inline-flex items-center gap-1 text-cream-dim"><span className="h-1.5 w-1.5 rounded-full bg-cream-dim" />Follow up</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {cards.length === 0 && <li className="px-1 py-6 text-center text-xs text-ink-2">Drop here</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
