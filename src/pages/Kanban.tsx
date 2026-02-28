import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { JobDetailSheet } from '@/components/jobs/JobDetailSheet';
import { useJobs } from '@/hooks/useJobs';
import { Job, JobStatus, STATUS_CONFIG } from '@/types/job';
import { Loader2, Plus } from 'lucide-react';
import { QuickAddJobForm } from '@/components/jobs/QuickAddJobForm';
import { Button } from '@/components/ui/button';

const KANBAN_COLUMNS: { key: JobStatus; label: string }[] = [
  { key: 'saved',        label: 'Saved' },
  { key: 'applied',      label: 'Applied' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offered',      label: 'Offered' },
  { key: 'accepted',     label: 'Accepted' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'withdrawn',    label: 'Withdrawn' },
];

export default function Kanban() {
  const { jobs, loading, updateJobStatus } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<JobStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggingJobId(jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: JobStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDrop = async (e: React.DragEvent, col: JobStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggingJobId) return;
    const job = jobs.find(j => j.id === draggingJobId);
    if (job && job.status !== col) {
      await updateJobStatus(draggingJobId, col);
    }
    setDraggingJobId(null);
  };

  const handleDragEnd = () => {
    setDraggingJobId(null);
    setDragOverCol(null);
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    await updateJobStatus(jobId, newStatus);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header row */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-foreground">Kanban Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Drag cards to move them between stages
            </p>
          </div>
          <QuickAddJobForm
            trigger={
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Job
              </Button>
            }
          />
        </div>

        {/* Kanban columns — horizontally scrollable */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
          <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => {
              const config = STATUS_CONFIG[col.key];
              const colJobs = jobs.filter(j => j.status === col.key);
              const isOver = dragOverCol === col.key;

              return (
                <div
                  key={col.key}
                  className={`flex flex-col w-64 rounded-xl border transition-colors duration-150 ${
                    isOver
                      ? 'border-border bg-muted/30'
                      : 'border-border/30 bg-card/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                  onDragLeave={() => setDragOverCol(null)}
                >
                  {/* Column header */}
                  <div className="px-3.5 py-3 border-b border-border/30 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                        <span className={`text-xs font-semibold tracking-wide uppercase ${config.color}`}>
                          {col.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        {colJobs.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colJobs.length === 0 && (
                      <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-border/30">
                        <span className="text-xs text-muted-foreground/40">No applications</span>
                      </div>
                    )}
                    {colJobs.map(job => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        isDragging={draggingJobId === job.id}
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedJob(job)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

interface KanbanCardProps {
  job: Job;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function KanbanCard({ job, isDragging, onDragStart, onDragEnd, onClick }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isDragging
          ? 'opacity-40 scale-95 border-border/60'
          : 'border-border/30 hover:border-border/60 hover:bg-muted/20'
      }`}
    >
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
        {job.job_title}
      </p>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {job.company_name}
      </p>
      {job.location && (
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 truncate">
          {job.location}
        </p>
      )}
      {job.applied_date && (
        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
          {new Date(job.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}
