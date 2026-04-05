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
  CheckCircle, XCircle, Gift, List, Columns, AlertCircle,
  Calendar, Bell, Checkbox
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

const KANBAN_COLUMNS: { key: JobStatus; label: string }[] = [
  { key: 'saved',        label: 'Saved' },
  { key: 'applied',      label: 'Applied' },
  { key: 'interviewing', label: 'Interview' },
  { key: 'offered',      label: 'Offer' },
  { key: 'accepted',     label: 'Accepted' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'withdrawn',    label: 'Withdrawn' },
];

function StatPill({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 min-w-0">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${accent} opacity-70`} />
      <span className="text-lg font-semibold tabular-nums text-foreground leading-none">{value}</span>
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
      title={`Deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        daysLeft <= 2 ? 'bg-red-500' : 'bg-amber-500'
      } animate-pulse`}
    />
  );
}

function KanbanCard({ job, isDragging, onDragStart, onDragEnd, onClick, onDelete, selected, onSelect }: {
  job: Job; isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isDragging ? 'opacity-40 scale-95 border-border/60' :
        selected ? 'border-primary/50 bg-primary/5' :
        'border-border/30 hover:border-border/60 hover:bg-muted/20'
      }`}
    >
      {/* Checkbox for bulk select */}
      <button
        onClick={onSelect}
        className="absolute top-2 left-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all z-10"
        title="Select"
      >
        <div className={`h-3.5 w-3.5 rounded border ${
          selected ? 'bg-primary border-primary' : 'border-border/60'
        }`} />
      </button>

      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all z-10"
        title="Delete application"
      >
        <XCircle className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-1.5 pr-5 pl-5">
        <UrgencyDot deadline={job.deadline_date} />
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{job.job_title}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate pl-5">{job.company_name}</p>
      {job.location && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">📍 {job.location}</p>
      )}
      {job.salary_min && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          💰 {job.currency || '$'}{job.salary_min.toLocaleString()}{job.salary_max ? `–${job.salary_max.toLocaleString()}` : '+'}
        </p>
      )}
      {job.deadline_date && (() => {
        const daysLeft = Math.floor((new Date(job.deadline_date).getTime() - Date.now()) / (1000*60*60*24));
        if (daysLeft <= 7) return (
          <p className={`text-[10px] mt-0.5 font-medium ${ daysLeft <= 2 ? 'text-red-500' : 'text-amber-500' }`}>
            ⏰ Deadline in {daysLeft}d
          </p>
        );
        return null;
      })()}
      {job.source && (
        <span className={`inline-block text-[10px] mt-1.5 px-1.5 py-0.5 rounded ${
          SOURCE_CONFIG[job.source]?.bgColor ?? 'bg-muted'
        } ${SOURCE_CONFIG[job.source]?.color ?? 'text-muted-foreground'}`}>
          {SOURCE_CONFIG[job.source]?.label ?? job.source}
        </span>
      )}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {job.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
          ))}
          {job.tags.length > 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+{job.tags.length - 2}</span>
          )}
        </div>
      )}
      {job.applied_date && (
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          {new Date(job.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}

function MobileJobRow({ job, onClick, onDelete, selected, onSelect }: {
  job: Job; onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}) {
  const config = STATUS_CONFIG[job.status];
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
        selected ? 'border-primary/50 bg-primary/5' : 'border-border/30 bg-card hover:border-border/60 hover:bg-muted/20'
      }`}
    >
      <button onClick={onSelect} className="mt-1 shrink-0" title="Select">
        <div className={`h-3.5 w-3.5 rounded border ${
          selected ? 'bg-primary border-primary' : 'border-border/60'
        }`} />
      </button>
      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${config.bgColor} border ${config.borderColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <UrgencyDot deadline={job.deadline_date} />
          <p className="text-sm font-medium text-foreground truncate">{job.job_title}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>{config.label}</span>
          {job.source && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              SOURCE_CONFIG[job.source]?.bgColor ?? 'bg-muted'
            } ${SOURCE_CONFIG[job.source]?.color ?? 'text-muted-foreground'}`}>
              {SOURCE_CONFIG[job.source]?.label ?? job.source}
            </span>
          )}
          {job.applied_date && (
            <span className="text-[10px] text-muted-foreground/60">
              {new Date(job.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground/30 transition-all shrink-0"
        title="Delete"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Upcoming interviews / follow-up reminders panel
function UpcomingPanel({ jobs }: { jobs: Job[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in14 = new Date(today);
  in14.setDate(in14.getDate() + 14);

  const upcoming = jobs
    .filter(j => j.deadline_date && new Date(j.deadline_date) >= today && new Date(j.deadline_date) <= in14)
    .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
    .slice(0, 5);

  const interviewing = jobs.filter(j => j.status === 'interviewing').slice(0, 5);

  if (upcoming.length === 0 && interviewing.length === 0) return null;

  return (
    <section className="container shrink-0 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {interviewing.length > 0 && (
          <div className="rounded-xl border border-border/30 bg-card/60 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" /> Active Interviews
            </p>
            <div className="space-y-1.5">
              {interviewing.map(j => (
                <div key={j.id} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  <span className="text-xs font-medium truncate">{j.job_title}</span>
                  <span className="text-[10px] text-muted-foreground truncate ml-auto">{j.company_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <Bell className="h-3 w-3" /> Deadlines in 14 days
            </p>
            <div className="space-y-1.5">
              {upcoming.map(j => {
                const daysLeft = Math.floor((new Date(j.deadline_date!).getTime() - today.getTime()) / (1000*60*60*24));
                return (
                  <div key={j.id} className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold tabular-nums ${ daysLeft <= 2 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400' }`}>
                      {daysLeft}d
                    </span>
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

export default function Dashboard() {
  const { jobs, loading, error, updateJobStatus, deleteJob } = useJobsContext();
  const stats = useJobStats(jobs);

  const [searchTerm, setSearchTerm]     = useState('');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [tagFilter, setTagFilter]       = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId]     = useState<string | null>(null);
  const [viewMode, setViewMode]           = useState<'kanban' | 'list'>('kanban');
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<JobStatus>('applied');

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol]     = useState<JobStatus | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach(j => j.tags?.forEach(t => set.add(t)));
    return Array.from(set).slice(0, 12);
  }, [jobs]);

  // Keyboard shortcuts: N = new job, / = focus search, Escape = close sheet
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === 'Escape') { setSelectedJobId(null); return; }
      if (inInput) return;
      if (e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const matchesFilters = useCallback((job: Job) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      job.company_name.toLowerCase().includes(q) ||
      job.job_title.toLowerCase().includes(q);
    const matchesSource = sourceFilter === 'all' || job.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesTag    = !tagFilter || (job.tags?.includes(tagFilter) ?? false);
    return matchesSearch && matchesSource && matchesStatus && matchesTag;
  }, [searchTerm, sourceFilter, statusFilter, tagFilter]);

  const companyList = useMemo(() => {
    const map = new Map<string, { count: number; statuses: JobStatus[] }>();
    jobs.forEach((j) => {
      const ex = map.get(j.company_name);
      if (ex) { ex.count++; ex.statuses.push(j.status as JobStatus); }
      else map.set(j.company_name, { count: 1, statuses: [j.status as JobStatus] });
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [jobs]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteJobId) { await deleteJob(deleteJobId); setDeleteJobId(null); }
  }, [deleteJobId, deleteJob]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) await deleteJob(id);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  }, [selectedIds, deleteJob]);

  const handleBulkStatusChange = useCallback(async () => {
    for (const id of selectedIds) await updateJobStatus(id, bulkTargetStatus);
    setSelectedIds(new Set());
    setBulkStatusOpen(false);
  }, [selectedIds, bulkTargetStatus, updateJobStatus]);

  const toggleSelect = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, jobId: string) => {
    setDraggingJobId(jobId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, col: JobStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, col: JobStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggingJobId) return;
    const job = jobs.find((j) => j.id === draggingJobId);
    if (job && job.status !== col) await updateJobStatus(draggingJobId, col);
    setDraggingJobId(null);
  }, [draggingJobId, jobs, updateJobStatus]);

  const handleDragEnd = useCallback(() => {
    setDraggingJobId(null);
    setDragOverCol(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
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
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1.5">No jobs yet</h2>
            <p className="text-muted-foreground mb-5 max-w-xs text-sm">Start tracking your job applications.</p>
            <QuickAddJobForm
              trigger={
                <Button size="default" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Job
                </Button>
              }
            />
          </div>
        </main>
      </div>
    );
  }

  const filteredJobs = jobs.filter(matchesFilters);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col min-h-0">

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className="container shrink-0 pt-5 pb-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatPill label="Total"     value={stats.total}                    icon={Briefcase}     accent="text-foreground" />
            <StatPill label="Applied"   value={stats.byStatus.applied}         icon={Send}          accent="text-[hsl(var(--status-applied))]" />
            <StatPill label="Interview" value={stats.byStatus.interviewing}    icon={MessageSquare} accent="text-[hsl(var(--status-interviewing))]" />
            <StatPill label="Offers"    value={stats.byStatus.offered}         icon={Gift}          accent="text-[hsl(var(--status-offered))]" />
            <StatPill label="Accepted"  value={stats.byStatus.accepted}        icon={CheckCircle}   accent="text-[hsl(var(--status-accepted))]" />
            <StatPill label="Rejected"  value={stats.byStatus.rejected}        icon={XCircle}       accent="text-[hsl(var(--status-rejected))]" />
          </div>

          {/* Company chips — no arbitrary cap */}
          {companyList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {companyList.map(([name, info]) => (
                <button
                  key={name}
                  onClick={() => setSearchTerm(searchTerm === name ? '' : name)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors truncate max-w-[160px] ${
                    searchTerm === name
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border/60'
                  }`}
                >
                  {name} <span className="opacity-50">{info.count}</span>
                </button>
              ))}
              {(searchTerm || tagFilter || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setTagFilter(''); setStatusFilter('all'); }}
                  className="text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-muted-foreground/60 self-center">Tags:</span>
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

        {/* ── Upcoming interviews / deadlines panel ─────────────────────── */}
        <UpcomingPanel jobs={jobs} />

        {/* ── Bulk action bar ───────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <section className="container pb-2 shrink-0">
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <span className="text-xs font-medium">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-2"
                onClick={() => setBulkStatusOpen(true)}>
                Change Status
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1"
                onClick={() => setBulkDeleteOpen(true)}>
                Delete All
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto"
                onClick={() => setSelectedIds(new Set())}>
                Cancel
              </Button>
            </div>
          </section>
        )}

        {/* ── Filters + view toggle ─────────────────────────────────────── */}
        <section className="container pb-3 shrink-0">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                data-search-input
                placeholder="Search… (/)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | 'all')}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as JobSource | 'all')}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center border border-border/40 rounded-md overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 transition-colors ${
                  viewMode === 'kanban' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Kanban view (default)"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {filteredJobs.length === 0 && jobs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              No jobs match your filters. <button className="underline" onClick={() => { setSearchTerm(''); setTagFilter(''); setStatusFilter('all'); setSourceFilter('all'); }}>Clear all</button>
            </p>
          )}
        </section>

        {/* ── Kanban board ─────────────────────────────────────────────── */}
        {viewMode === 'kanban' ? (
          <section className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 min-h-0">
            <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
              {KANBAN_COLUMNS.map((col) => {
                const config  = STATUS_CONFIG[col.key];
                const colJobs = jobs.filter((j) => j.status === col.key && matchesFilters(j));
                const isOver  = dragOverCol === col.key;
                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    onDragLeave={() => setDragOverCol(null)}
                    className={`flex flex-col w-[200px] rounded-xl border transition-colors duration-150 ${
                      isOver ? 'border-primary/50 bg-primary/5' : 'border-border/20 bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                        <span className="text-xs font-medium text-foreground">{col.label}</span>
                      </div>
                      <span className={`text-xs tabular-nums font-semibold ${config.color}`}>{colJobs.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0">
                      {colJobs.map((job) => (
                        <KanbanCard
                          key={job.id}
                          job={job}
                          isDragging={draggingJobId === job.id}
                          onDragStart={(e) => handleDragStart(e, job.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedJobId(job.id)}
                          onDelete={(e) => { e.stopPropagation(); setDeleteJobId(job.id); }}
                          selected={selectedIds.has(job.id)}
                          onSelect={(e) => toggleSelect(e, job.id)}
                        />
                      ))}
                      {colJobs.length === 0 && (
                        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/20">
                          <p className="text-[11px] text-muted-foreground/40">Drop here</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* ── List view (mobile-first) ─────────────────────────────── */
          <section className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2 max-w-2xl mx-auto">
              {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No jobs match your filters</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <MobileJobRow
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedJobId(job.id)}
                    onDelete={(e) => { e.stopPropagation(); setDeleteJobId(job.id); }}
                    selected={selectedIds.has(job.id)}
                    onSelect={(e) => toggleSelect(e, job.id)}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── Job detail sheet ──────────────────────────────────────────── */}
      {selectedJob && (
        <JobDetailSheet
          job={selectedJob}
          open={!!selectedJobId}
          onOpenChange={(open) => { if (!open) setSelectedJobId(null); }}
        />
      )}

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteJobId} onOpenChange={(o) => { if (!o) setDeleteJobId(null); }}>
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

      {/* ── Bulk delete confirmation ──────────────────────────────────── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} applications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected jobs and their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk status change ────────────────────────────────────────── */}
      <AlertDialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change status for {selectedIds.size} jobs</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new status to apply to all selected applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Select value={bulkTargetStatus} onValueChange={(v) => setBulkTargetStatus(v as JobStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusChange}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
