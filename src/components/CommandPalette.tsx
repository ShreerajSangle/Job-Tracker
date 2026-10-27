import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Gauge, LayoutDashboard, LogOut, Plus, Search, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/features/applications/queries';
import { useResumes } from '@/features/resumes/queries';

interface Cmd { id: string; label: string; hint?: string; group: string; Icon: typeof Search; run: () => void }

/** ⌘/Ctrl+K quick jump: pages, actions, applications and resumes. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: apps = [] } = useApplications();
  const { data: resumes = [] } = useResumes();
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) { setQ(''); setActive(0); } }, [open]);

  const go = (to: string) => () => navigate(to);
  const commands = useMemo<Cmd[]>(() => {
    const base: Cmd[] = [
      { id: 'p-counter', label: 'Counter', hint: 'g c', group: 'Pages', Icon: Gauge, run: go('/') },
      { id: 'p-dash', label: 'Dashboard', hint: 'g d', group: 'Pages', Icon: LayoutDashboard, run: go('/dashboard') },
      { id: 'p-apps', label: 'Applications', hint: 'g a', group: 'Pages', Icon: Briefcase, run: go('/applications') },
      { id: 'p-res', label: 'Resumes', hint: 'g r', group: 'Pages', Icon: FileText, run: go('/resumes') },
      { id: 'p-set', label: 'Settings', group: 'Pages', Icon: Settings, run: go('/settings') },
      { id: 'a-new', label: 'New application', hint: 'n', group: 'Actions', Icon: Plus, run: go('/applications?new=1') },
      { id: 'a-out', label: 'Sign out', group: 'Actions', Icon: LogOut, run: () => { void signOut().then(() => navigate('/login')); } },
    ];
    const s = q.trim().toLowerCase();
    const appCmds: Cmd[] = s
      ? apps.filter((a) => `${a.company} ${a.role}`.toLowerCase().includes(s)).slice(0, 6)
          .map((a) => ({ id: `app-${a.id}`, label: `${a.company} — ${a.role}`, hint: a.status, group: 'Applications', Icon: Briefcase, run: go(`/applications?id=${a.id}`) }))
      : [];
    const resCmds: Cmd[] = s
      ? resumes.filter((r) => r.name.toLowerCase().includes(s)).slice(0, 4)
          .map((r) => ({ id: `res-${r.id}`, label: r.name, group: 'Resumes', Icon: FileText, run: go('/resumes') }))
      : [];
    const filtered = s ? base.filter((c) => c.label.toLowerCase().includes(s)) : base;
    return [...filtered, ...appCmds, ...resCmds];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, apps, resumes]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const run = (c?: Cmd) => { if (!c) return; setOpen(false); c.run(); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(commands.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(commands[active]); }
  };

  let lastGroup = '';
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[22%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-[var(--r-md)] border-0 bg-surface-1 p-0 text-cream shadow-2xl shadow-black/50 [&>button]:hidden">
        <DialogTitle className="sr-only">Quick search</DialogTitle>
        <DialogDescription className="sr-only">Jump to a page, action, application or resume</DialogDescription>
        <div className="flex items-center gap-3 px-5 py-4">
          <Search className="h-5 w-5 text-ink-2" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} placeholder="Search pages, applications, resumes…"
            aria-label="Search" className="w-full bg-transparent text-base text-cream outline-none placeholder:text-ink-2" />
          <kbd className="rounded bg-surface-3 px-1.5 py-0.5 text-[0.65rem] text-ink-2">esc</kbd>
        </div>
        <ul ref={list} className="max-h-80 overflow-y-auto border-t border-cream/10 p-2" role="listbox">
          {commands.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-2">No matches</li>}
          {commands.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <li key={c.id} role="presentation">
                {header && <p className="px-3 pb-1 pt-3 text-[0.65rem] uppercase tracking-[0.06em] text-ink-2">{header}</p>}
                <button type="button" role="option" aria-selected={i === active} data-active={i === active}
                  onMouseEnter={() => setActive(i)} onClick={() => run(c)}
                  className={`flex w-full items-center gap-3 rounded-[var(--r-sm)] px-3 py-2.5 text-left text-sm ${i === active ? 'bg-surface-3' : ''}`}>
                  <c.Icon className="h-4 w-4 shrink-0 text-ink-2" />
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="text-xs capitalize text-ink-2">{c.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
