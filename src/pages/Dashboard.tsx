import { useState, useMemo, useCallback, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { JobDetailSheet } from '@/components/jobs/JobDetailSheet';
import { QuickAddJobForm } from '@/components/jobs/QuickAddJobForm';
import { useJobsContext } from '@/context/JobsContext';
import { useJobStats } from '@/hooks/useJobStats';
import { Job, JobStatus, JobSource, STATUS_CONFIG, SOURCE_CONFIG } from '@/types/job';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Search, Briefcase, Plus, Send, MessageSquare,
  CheckCircle, XCircle, Gift, AlertCircle, Bell,
  ArrowUpDown, ArrowUp, ArrowDown, Trash2, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortField = 'date' | 'company' | 'title' | 'status';
type SortDir   = 'asc' | 'desc';

const STATUS_COLORS: Record<JobStatus, string> = {
  saved:        'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  applied:      'bg-sky-500/15 text-sky-400 border-sky-500/30',
  interviewing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  offered:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  accepted:     'bg-green-500/15 text-green-400 border-green-500/30',
  rejected:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
  withdrawn:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function StatPill({ label, value, icon: Icon, colorClass }: {
  label: string; value: number; icon: React.ElementType; colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 min-w-0">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${colorClass}`} />
      <span className="text-base font-semibold tabular-nums text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider truncate">{label}</span>
    </div>
  );
}

function UrgencyDot({ deadline }: { deadline?: string | null }) {
  if (!deadline) return null;
  const daysLeft = Math.floor((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 7) return null;
  return (
    <span
      title={`Deadline in ${daysLeft}d`}
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        daysLeft <= 2 ? 'bg-rose-500' : 'bg-amber-500'
      } animate-pulse`}
    />
  );
}

function StatusBadge({ status, jobId, onChangeStatus }: {
  status: JobStatus;
  jobId: string;
  onChangeStatus: (id: string, s: JobStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium transition-opacity hover:opacity-80 ${
            STATUS_COLORS[status]
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_CONFIG[status]?.label ?? status}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {(Object.entries(STATUS_CONFIG) as [JobStatus, typeof STATUS_CONFIG[JobStatus]][]).map(([key, cfg]) => (
          <DropdownMenuItem
            key={key}
            className={`text-xs ${key === status ? 'font-semibold' : ''}`}
            onClick={() => onChangeStatus(jobId, key)}
          >
            <span className={`mr-2 h-2 w-2 rounded-full inline-block ${
              STATUS_COLORS[key].split(' ')[0]
            }`} />
            {cfg.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Upcoming panel (interviews + deadlines) ───────────────────────────────
function UpcomingPanel({ jobs }: { jobs: Job[] }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in14  = new Date(today); in14.setDate(in14.getDate() + 14);

  const upcoming = jobs
    .filter(j => j.deadline_date && new Date(j.deadline_date) >= today && new Date(j.deadline_date) <= in14)
    .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
    .slice(0, 5);

  const interviewing = jobs.filter(j => j.status === 'interviewing').slice(0, 5);
  if (!upcoming.length && !interviewing.length) return null;

  return (
    <section className="container shrink-0 pb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {interviewing.length > 0 && (
          <div className="rounded-xl border border-border/30 bg-card/60 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" /> Active Interviews
            </p>
            <div className="space-y-1.5">
              {interviewing.map(j => (
                <div key={j.id} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs font-medium truncate">{j.job_title}</span>
                  <span className="text-[10px] text-muted-foreground truncate ml-auto">{j.company_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[11px] uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
              <Bell className="h-3 w-3" /> Deadlines in 14 days
            </p>
            <div className="space-y-1.5">
              {upcoming.map(j => {
                const d = Math.floor((new Date(j.deadline_date!).getTime() - today.getTime()) / 864e5);
                return (
                  <div key={j.id} className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold tabular-nums ${ d <= 2 ? 'text-rose-400' : 'text-amber-400' }`}>{d}d</span>
                    <span className="text-xs font-medium truncate">{j.job_title}</span>
                    <span className="text-[10px] text-muted-foreground truncate ml-auto">{j.company_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Table row ─────────────────────────────────────────────────────────────
function JobRow({ job, onClick, onDelete, onChangeStatus }: {
  job: Job;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onChangeStatus: (id: string, s: JobStatus) => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="group border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
    >
      {/* Company + title */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <UrgencyDot deadline={job.deadline_date} />
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">{job.company_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{job.job_title}</p>
          </div>
        </div>
      </td>
      {/* Status — inline change */}
      <td className="py-3 px-3">
        <StatusBadge status={job.status as JobStatus} jobId={job.id} onChangeStatus={onChangeStatus} />
      </td>
      {/* Source */}
      <td className="py-3 px-3 hidden sm:table-cell">
        {job.source ? (
          <span className={`text-[11px] px-2 py-0.5 rounded border ${
            SOURCE_CONFIG[job.source]?.bgColor ?? 'bg-muted'
          } ${SOURCE_CONFIG[job.source]?.color ?? 'text-muted-foreground'} border-transparent`}>
            {SOURCE_CONFIG[job.source]?.label ?? job.source}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </td>
      {/* Salary */}
      <td className="py-3 px-3 hidden md:table-cell">
        {job.salary_min ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {job.currency || '$'}{job.salary_min.toLocaleString()}{job.salary_max ? `–${job.salary_max.toLocaleString()}` : '+'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </td>
      {/* Date applied */}
      <td className="py-3 px-3 hidden sm:table-cell">
        <span className="text-xs text-muted-foreground tabular-nums">
          {job.applied_date
            ? new Date(job.applied_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
            : '—'}
        </span>
      </td>
      {/* Tags */}
      <td className="py-3 px-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {(job.tags ?? []).slice(0, 2).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
          ))}
          {(job.tags ?? []).length > 2 && (
            <span className="text-[10px] text-muted-foreground/60">+{job.tags!.length - 2}</span>
          )}
        </div>
      </td>
      {/* Actions */}
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Open job posting"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile card ───────────────────────────────────────────────────────────
function MobileJobCard({ job, onClick, onDelete, onChangeStatus }: {
  job: Job;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onChangeStatus: (id: string, s: JobStatus) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-border/30 bg-card p-3 cursor-pointer hover:border-border/60 hover:bg-muted/20 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <UrgencyDot deadline={job.deadline_date} />
          <p className="text-sm font-medium text-foreground truncate">{job.company_name}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate mb-2">{job.job_title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={job.status as JobStatus} jobId={job.id} onChangeStatus={onChangeStatus} />
          {job.source && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              SOURCE_CONFIG[job.source]?.bgColor ?? 'bg-muted'
            } ${SOURCE_CONFIG[job.source]?.color ?? 'text-muted-foreground'}`}>
              {SOURCE_CONFIG[job.source]?.label ?? job.source}
            </span>
          )}
          {job.applied_date && (
            <span className="text-[10px] text-muted-foreground/60">
              {new Date(job.applied_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground/30 hover:text-rose-400 transition-colors shrink-0 mt-0.5"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Sort icon helper ──────────────────────────────────────────────────────
function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (field !== active) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/40 inline" />;
  return dir === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1 text-primary inline" />
    : <ArrowDown className="h-3 w-3 ml-1 text-primary inline" />;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { jobs, loading, error, updateJobStatus, deleteJob } = useJobsContext();
  const stats = useJobStats(jobs);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [tagFilter,    setTagFilter]    = useState('');
  const [selectedJobId,  setSelectedJobId]  = useState<string | null>(null);
  const [deleteJobId,    setDeleteJobId]    = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');

  const selectedJob = useMemo(() =>
    selectedJobId ? jobs.find(j => j.id === selectedJobId) ?? null : null,
  [jobs, selectedJobId]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach(j => j.tags?.forEach(t => s.add(t)));
    return Array.from(s);
  }, [jobs]);

  const companyList = useMemo(() => {
    const m = new Map<string, number>();
    jobs.forEach(j => m.set(j.company_name, (m.get(j.company_name) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [jobs]);

  // Keyboard shortcut: / = focus search, Esc = close sheet
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (e.key === 'Escape') { setSelectedJobId(null); return; }
      if (!inInput && e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const matchesFilters = useCallback((job: Job) => {
    const q = searchTerm.toLowerCase();
    return (
      (!q || job.company_name.toLowerCase().includes(q) || job.job_title.toLowerCase().includes(q)) &&
      (sourceFilter === 'all' || job.source === sourceFilter) &&
      (statusFilter === 'all' || job.status === statusFilter) &&
      (!tagFilter || (job.tags?.includes(tagFilter) ?? false))
    );
  }, [searchTerm, sourceFilter, statusFilter, tagFilter]);

  const toggleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortDir('asc'); }
      return field;
    });
  }, []);

  const filteredSorted = useMemo(() => {
    const list = jobs.filter(matchesFilters);
    list.sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      if (sortField === 'company') { va = a.company_name.toLowerCase(); vb = b.company_name.toLowerCase(); }
      else if (sortField === 'title') { va = a.job_title.toLowerCase(); vb = b.job_title.toLowerCase(); }
      else if (sortField === 'status') { va = a.status; vb = b.status; }
      else { va = a.applied_date ?? a.created_at ?? ''; vb = b.applied_date ?? b.created_at ?? ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [jobs, matchesFilters, sortField, sortDir]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setTagFilter(''); setStatusFilter('all'); setSourceFilter('all');
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteJobId) { await deleteJob(deleteJobId); setDeleteJobId(null); }
  }, [deleteJobId, deleteJob]);

  const handleChangeStatus = useCallback(async (id: string, s: JobStatus) => {
    await updateJobStatus(id, s);
  }, [updateJobStatus]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Failed to load jobs</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );

  // ── Empty state ────────────────────────────────────────────────────────
  if (jobs.length === 0) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1.5">No applications yet</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">Start tracking your job search — add your first application.</p>
          <QuickAddJobForm
            trigger={
              <Button size="default" className="gap-2">
                <Plus className="h-4 w-4" /> Add Your First Job
              </Button>
            }
          />
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0">

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section className="container shrink-0 pt-5 pb-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatPill label="Total"     value={stats.total}                 icon={Briefcase}     colorClass="text-foreground" />
            <StatPill label="Applied"   value={stats.byStatus.applied}      icon={Send}          colorClass="text-sky-400" />
            <StatPill label="Interview" value={stats.byStatus.interviewing} icon={MessageSquare} colorClass="text-amber-400" />
            <StatPill label="Offers"    value={stats.byStatus.offered}      icon={Gift}          colorClass="text-emerald-400" />
            <StatPill label="Accepted"  value={stats.byStatus.accepted}     icon={CheckCircle}   colorClass="text-green-400" />
            <StatPill label="Rejected"  value={stats.byStatus.rejected}     icon={XCircle}       colorClass="text-rose-400" />
          </div>

          {/* Company quick-filter chips */}
          {companyList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {companyList.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setSearchTerm(searchTerm === name ? '' : name)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors truncate max-w-[160px] ${
                    searchTerm === name
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border/60'
                  }`}
                >
                  {name} <span className="opacity-50">{count}</span>
                </button>
              ))}
              {(searchTerm || tagFilter || statusFilter !== 'all') && (
                <button onClick={clearFilters} className="text-[11px] px-2 py-1 text-muted-foreground hover:text-foreground">Clear</button>
              )}
            </div>
          )}

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-muted-foreground/50 self-center">Tags:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    tagFilter === tag
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border/60'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Upcoming panel ────────────────────────────────────────────── */}
        <UpcomingPanel jobs={jobs} />

        {/* ── Filters row ───────────────────────────────────────────────── */}
        <section className="container pb-3 shrink-0">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                data-search-input
                placeholder="Search… (/)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as JobStatus | 'all')}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={v => setSourceFilter(v as JobSource | 'all')}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(SOURCE_CONFIG).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {filteredSorted.length} / {jobs.length}
            </span>
          </div>
          {filteredSorted.length === 0 && jobs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              No results. <button className="underline hover:text-foreground" onClick={clearFilters}>Clear all filters</button>
            </p>
          )}
        </section>

        {/* ── Table (desktop) / Cards (mobile) ─────────────────────────── */}

        {/* Desktop table */}
        <section className="hidden md:block flex-1 overflow-y-auto container pb-8">
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="py-2.5 pl-4 pr-3 text-left">
                    <button onClick={() => toggleSort('company')} className="flex items-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground">
                      Company / Role <SortIcon field="company" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-left">
                    <button onClick={() => toggleSort('status')} className="flex items-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground">
                      Status <SortIcon field="status" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden sm:table-cell">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Source</span>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden md:table-cell">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Salary</span>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden sm:table-cell">
                    <button onClick={() => toggleSort('date')} className="flex items-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground">
                      Applied <SortIcon field="date" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-left hidden lg:table-cell">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
                  </th>
                  <th className="py-2.5 pl-3 pr-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Briefcase className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No jobs match your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map(job => (
                    <JobRow
                      key={job.id}
                      job={job}
                      onClick={() => setSelectedJobId(job.id)}
                      onDelete={e => { e.stopPropagation(); setDeleteJobId(job.id); }}
                      onChangeStatus={handleChangeStatus}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mobile cards */}
        <section className="md:hidden flex-1 overflow-y-auto container pb-8">
          <div className="space-y-2">
            {filteredSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No jobs match your filters</p>
              </div>
            ) : (
              filteredSorted.map(job => (
                <MobileJobCard
                  key={job.id}
                  job={job}
                  onClick={() => setSelectedJobId(job.id)}
                  onDelete={e => { e.stopPropagation(); setDeleteJobId(job.id); }}
                  onChangeStatus={handleChangeStatus}
                />
              ))
            )}
          </div>
        </section>
      </main>

      {/* ── Detail sheet ──────────────────────────────────────────────── */}
      {selectedJob && (
        <JobDetailSheet
          job={selectedJob}
          open={!!selectedJobId}
          onOpenChange={open => { if (!open) setSelectedJobId(null); }}
        />
      )}

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteJobId} onOpenChange={o => { if (!o) setDeleteJobId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the job and all its notes, status history, and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
