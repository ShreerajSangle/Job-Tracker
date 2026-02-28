import { useState, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { JobDetailSheet } from '@/components/jobs/JobDetailSheet';
import { QuickAddJobForm } from '@/components/jobs/QuickAddJobForm';
import { useJobs } from '@/hooks/useJobs';
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
import { Loader2, Search, Briefcase, Plus, Send, MessageSquare, CheckCircle, XCircle, Gift } from 'lucide-react';
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

// ── Kanban columns ──────────────────────────────────────────────────────────
const KANBAN_COLUMNS: { key: JobStatus; label: string }[] = [
  { key: 'saved',        label: 'Saved' },
  { key: 'applied',      label: 'Applied' },
  { key: 'interviewing', label: 'Interview' },
  { key: 'offered',      label: 'Offer' },
  { key: 'accepted',     label: 'Accepted' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'withdrawn',    label: 'Withdrawn' },
];

// ── Compact stat pill ───────────────────────────────────────────────────────
function StatPill({ label, value, icon: Icon, accent }: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 min-w-0">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${accent} opacity-70`} />
      <span className="text-lg font-semibold tabular-nums text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider truncate">{label}</span>
    </div>
  );
}

// ── Mini Kanban card ────────────────────────────────────────────────────────
function KanbanCard({ job, isDragging, onDragStart, onDragEnd, onClick, onDelete }: {
  job: Job;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const canDelete = job.status === 'rejected' || job.status === 'withdrawn';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isDragging
          ? 'opacity-40 scale-95 border-border/60'
          : 'border-border/30 hover:border-border/60 hover:bg-muted/20'
      }`}
    >
      {canDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all z-10"
          title="Delete application"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}

      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 pr-5">{job.job_title}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{job.company_name}</p>
      {job.source && (
        <span className={`inline-block text-[10px] mt-1.5 px-1.5 py-0.5 rounded ${SOURCE_CONFIG[job.source]?.bgColor ?? 'bg-muted'} ${SOURCE_CONFIG[job.source]?.color ?? 'text-muted-foreground'}`}>
          {SOURCE_CONFIG[job.source]?.label ?? job.source}
        </span>
      )}
      {job.applied_date && (
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          {new Date(job.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ── Main unified dashboard ──────────────────────────────────────────────────
export default function Dashboard() {
  const { jobs, loading, updateJobStatus, deleteJob } = useJobs();
  const stats = useJobStats(jobs);

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  // Get the most up-to-date job data for the selected job
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // drag state
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<JobStatus | null>(null);

  // filtered jobs for kanban (search + source only, status determined by column)
  const matchesFilters = useCallback((job: Job) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      job.company_name.toLowerCase().includes(q) ||
      job.job_title.toLowerCase().includes(q);
    const matchesSource = sourceFilter === 'all' || job.source === sourceFilter;
    return matchesSearch && matchesSource;
  }, [searchTerm, sourceFilter]);

  // unique companies for the compact list
  const companyList = useMemo(() => {
    const map = new Map<string, { count: number; statuses: JobStatus[] }>();
    jobs.forEach((j) => {
      const existing = map.get(j.company_name);
      if (existing) {
        existing.count++;
        existing.statuses.push(j.status as JobStatus);
      } else {
        map.set(j.company_name, { count: 1, statuses: [j.status as JobStatus] });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8);
  }, [jobs]);

  // handlers
  const handleStatusChange = useCallback(async (jobId: string, newStatus: JobStatus) => {
    await updateJobStatus(jobId, newStatus);
  }, [updateJobStatus]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteJobId) {
      await deleteJob(deleteJobId);
      setDeleteJobId(null);
    }
  }, [deleteJobId, deleteJob]);

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
    if (job && job.status !== col) {
      await updateJobStatus(draggingJobId, col);
    }
    setDraggingJobId(null);
  }, [draggingJobId, jobs, updateJobStatus]);

  const handleDragEnd = useCallback(() => {
    setDraggingJobId(null);
    setDragOverCol(null);
  }, []);

  // loading
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

  // empty state
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
            <p className="text-muted-foreground mb-5 max-w-xs text-sm">
              Start tracking your job applications.
            </p>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col min-h-0">

        {/* ── Top bar: stats + company list ──────────────────────────────── */}
        <section className="container shrink-0 pt-5 pb-3 space-y-3">
          {/* Stats row */}
          <div className="flex flex-wrap gap-2">
            <StatPill label="Total" value={stats.total} icon={Briefcase} accent="text-foreground" />
            <StatPill label="Applied" value={stats.byStatus.applied} icon={Send} accent="text-[hsl(var(--status-applied))]" />
            <StatPill label="Interview" value={stats.byStatus.interviewing} icon={MessageSquare} accent="text-[hsl(var(--status-interviewing))]" />
            <StatPill label="Offers" value={stats.byStatus.offered} icon={Gift} accent="text-[hsl(var(--status-offered))]" />
            <StatPill label="Accepted" value={stats.byStatus.accepted} icon={CheckCircle} accent="text-[hsl(var(--status-accepted))]" />
            <StatPill label="Rejected" value={stats.byStatus.rejected} icon={XCircle} accent="text-[hsl(var(--status-rejected))]" />
          </div>

          {/* Compact company chips */}
          {companyList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {companyList.map(([name, info]) => (
                <button
                  key={name}
                  onClick={() => setSearchTerm(name)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors truncate max-w-[160px] ${
                    searchTerm === name
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border/60'
                  }`}
                >
                  {name}
                  <span className="ml-1 opacity-50">{info.count}</span>
                </button>
              ))}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <section className="container pb-3 shrink-0">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search company or title…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as JobSource | 'all')}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* ── Kanban board ───────────────────────────────────────────────── */}
        <section className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 min-h-0">
          <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map((col) => {
              const config = STATUS_CONFIG[col.key];
              const colJobs = jobs.filter((j) => j.status === col.key && matchesFilters(j));
              const isOver = dragOverCol === col.key;

              return (
                <div
                  key={col.key}
                  className={`flex flex-col w-56 rounded-xl border transition-colors duration-150 ${
                    isOver
                      ? 'border-border bg-muted/20'
                      : 'border-border/30 bg-card/30'
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                >
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b border-border/20 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                        <span className={`text-[11px] font-semibold tracking-wider uppercase ${config.color}`}>
                          {col.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/50 tabular-nums">{colJobs.length}</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                    {colJobs.length === 0 && (
                      <div className="flex items-center justify-center h-12 rounded-lg border border-dashed border-border/20">
                        <span className="text-[10px] text-muted-foreground/30">Drop here</span>
                      </div>
                    )}
                    {colJobs.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        isDragging={draggingJobId === job.id}
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedJobId(job.id)}
                        onDelete={(e) => {
                          e.stopPropagation();
                          setDeleteJobId(job.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJobId}
        onOpenChange={(open) => !open && setSelectedJobId(null)}
        onStatusChange={handleStatusChange}
        onDelete={(id) => deleteJob(id)}
      />

      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the application and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
