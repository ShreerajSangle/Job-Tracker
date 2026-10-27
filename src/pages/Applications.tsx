import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, Plus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PageShell } from '@/components/Surface';
import { useApplications, useSetStatus } from '@/features/applications/queries';
import { StatusPill } from '@/features/applications/StatusPill';
import { ApplicationSheet } from '@/features/applications/ApplicationSheet';
import { STATUSES, STATUS_STYLE, type Application, type ApplicationStatus } from '@/features/applications/types';
import { openVersion, useResumes } from '@/features/resumes/queries';
import { formatDay } from '@/lib/format';
import { toCsv } from '@/lib/csv';
import { useAllStages } from '@/features/applications/stageQueries';

export default function Applications() {
  const { data: apps = [], isLoading, error } = useApplications();
  const { data: resumes = [] } = useResumes();
  const { data: stages = [] } = useAllStages();
  const setStatus = useSetStatus();
  const [source, setSource] = useState('all');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sheet, setSheet] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); search.current?.focus(); }
      if (e.key === 'n') { e.preventDefault(); setSheet({ open: true, app: null }); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const versions = useMemo(() => {
    const m = new Map<string, { label: string; file_path: string }>();
    resumes.forEach((r) => r.versions.forEach((v) => m.set(v.id, { label: `${r.name} · v${v.version}`, file_path: v.file_path })));
    return m;
  }, [resumes]);

  const currentStage = useMemo(() => {
    const m = new Map<string, string>();
    stages.filter((x) => x.state === 'current').forEach((x) => m.set(x.application_id, x.name));
    return m;
  }, [stages]);
  const sources = useMemo(() => [...new Set(apps.map((a) => a.source).filter(Boolean) as string[])].sort(), [apps]);

  const exportCsv = () => {
    const cols = ['company', 'role', 'status', 'location', 'source', 'url', 'applied_on', 'notes'];
    const blob = new Blob([toCsv(rows as unknown as Record<string, unknown>[], cols)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'applications.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return apps.filter((a) =>
      (filter === 'all' || a.status === filter) &&
      (source === 'all' || a.source === source) &&
      (!s || a.company.toLowerCase().includes(s) || a.role.toLowerCase().includes(s)));
  }, [apps, q, filter, source]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageShell>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-cream">Applications</h1>
            <p className="mt-1 text-sm text-ink-2">{apps.length} total</p>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={!rows.length} aria-label="Export CSV" title="Export CSV"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-cream transition-transform hover:bg-surface-2 active:scale-[0.95] disabled:opacity-40">
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSheet({ open: true, app: null })}
            aria-label="New application"
            title="New application (n)"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bordo text-cream transition-transform hover:bg-bordo-hi active:scale-[0.95]"
          >
            <Plus className="h-5 w-5" />
          </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            ref={search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search  /"
            aria-label="Search applications"
            className="w-full max-w-xs rounded-full bg-surface-2 px-4 py-2 text-sm text-cream outline-none placeholder:text-ink-2 focus:ring-2 focus:ring-ring"
          />
          {sources.length > 0 && (
            <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source"
              className="rounded-full bg-surface-2 px-3 py-2 text-xs text-cream outline-none">
              <option value="all">All sources</option>
              {sources.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.97] ${filter === s ? 'bg-surface-3 text-cream' : 'text-ink-2 hover:text-cream'}`}
              >
                {s === 'all' ? 'All' : STATUS_STYLE[s].label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-16 text-center text-sm text-bordo-ink">Couldn't load applications: {(error as Error).message}</p>
        ) : isLoading ? (
          <p className="mt-16 text-center text-sm text-ink-2">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="mt-24 text-center">
            <p className="font-display text-xl text-cream">{apps.length ? 'No matches' : 'No applications yet'}</p>
            {!apps.length && <p className="mt-2 text-sm text-ink-2">Press <kbd className="rounded bg-surface-3 px-1.5">n</kbd> or tap + to add your first.</p>}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[var(--r-md)] bg-surface-1">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-[0.75rem] uppercase tracking-[0.02em] text-ink-2">
                  {['Company', 'Role', 'Location', 'Status', 'Link', 'Resume', 'Notes', 'Date'].map((h) => (
                    <th key={h} className={`px-4 py-4 font-medium ${['Location', 'Notes'].includes(h) ? 'hidden lg:table-cell' : ''} ${['Link', 'Resume'].includes(h) ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const v = a.resume_version_id ? versions.get(a.resume_version_id) : undefined;
                  return (
                    <tr
                      key={a.id}
                      tabIndex={0}
                      onClick={() => setSheet({ open: true, app: a })}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSheet({ open: true, app: a }); }}
                      className="reveal h-14 cursor-pointer outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
                    >
                      <td className="px-4 font-semibold text-cream">{a.company}</td>
                      <td className="max-w-[16rem] truncate px-4 text-cream">{a.role}</td>
                      <td className="hidden px-4 text-ink-2 lg:table-cell">{a.location || '—'}</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <StatusPill status={a.status} onChange={(s) => setStatus(a.id, s)} />
                          {a.status === 'interviewing' && currentStage.get(a.id) && <span className="hidden truncate text-xs text-ink-2 sm:inline">{currentStage.get(a.id)}</span>}
                          {a.status === 'rejected' && a.rejected_stage_name && <span className="hidden truncate text-xs text-ink-2 sm:inline">at {a.rejected_stage_name}</span>}
                        </div>
                      </td>
                      <td className="hidden px-4 md:table-cell">
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-green-ink hover:underline">Open <ExternalLink className="h-3.5 w-3.5" /></a>
                        ) : <span className="text-ink-2">—</span>}
                      </td>
                      <td className="hidden px-4 md:table-cell">
                        {v ? (
                          <button onClick={(e) => { e.stopPropagation(); openVersion(v); }} className="text-cream-dim hover:underline">{v.label}</button>
                        ) : <span className="text-ink-2">—</span>}
                      </td>
                      <td className="hidden max-w-[12rem] truncate px-4 text-ink-2 lg:table-cell">{a.notes || '—'}</td>
                      <td className="px-4 tabular-nums text-ink-2">{formatDay(a.applied_on)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
      <ApplicationSheet open={sheet.open} application={sheet.app} onClose={() => setSheet((s) => ({ ...s, open: false }))} />
    </div>
  );
}
