import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job, JobStatus, JobSource, SOURCE_CONFIG, STATUS_CONFIG } from '@/types/job';
import { ExternalLink, MoreHorizontal, Trash2, Pencil, MapPin, DollarSign, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState, useCallback } from 'react';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onDelete: (jobId: string) => void;
  onViewDetails: (job: Job) => void;
}

export function JobCard({ job, onStatusChange, onDelete, onViewDetails }: JobCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // optimistic local status for instant UI feedback
  const [localStatus, setLocalStatus] = useState<JobStatus>(job.status);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const sourceConfig = job.source ? SOURCE_CONFIG[job.source] : null;
  const statusConfig = STATUS_CONFIG[localStatus];
  
  // Allow transitioning to any other status
  const availableStatuses = (Object.keys(STATUS_CONFIG) as JobStatus[]).filter(s => s !== localStatus);

  const handleStatusChange = useCallback(async (newStatus: JobStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (statusUpdating) return;
    const prev = localStatus;
    // optimistic update
    setLocalStatus(newStatus);
    setStatusUpdating(true);
    try {
      await onStatusChange(job.id, newStatus);
    } catch {
      // rollback on failure
      setLocalStatus(prev);
    } finally {
      setStatusUpdating(false);
    }
  }, [job.id, localStatus, onStatusChange, statusUpdating]);

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    const fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.currency || 'USD',
      maximumFractionDigits: 0,
    });
    if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
    if (min) return `${fmt.format(min)}+`;
    return `Up to ${fmt.format(max!)}`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  const canDelete = localStatus === 'rejected' || localStatus === 'withdrawn';

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all duration-150 border-border/40
          hover:border-border/70 hover:bg-card/80 cursor-pointer"
        onClick={() => onViewDetails(job)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate text-foreground leading-tight">
                {job.company_name}
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5 truncate leading-snug">
                {job.job_title}
              </p>
            </div>
            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Job actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-popover">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(job); }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  View Details
                </DropdownMenuItem>
                {job.job_url && (
                  <DropdownMenuItem asChild>
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open Job URL
                    </a>
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
          {/* ── Inline status chip + source ─────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status chip with inline transitions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium
                    transition-all duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1
                    focus-visible:ring-ring ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}
                    ${statusUpdating ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                  aria-label={`Current status: ${statusConfig.label}. Click to change.`}
                >
                  {statusConfig.label}
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-popover">
                {availableStatuses.map((next) => {
                  const nextConfig = STATUS_CONFIG[next];
                  return (
                    <DropdownMenuItem
                      key={next}
                      onClick={(e) => handleStatusChange(next, e)}
                      className="cursor-pointer text-xs gap-2"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full border ${nextConfig.bgColor} ${nextConfig.borderColor} shrink-0`} />
                      {nextConfig.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {sourceConfig && (
              <Badge
                variant="secondary"
                className={`${sourceConfig.bgColor} ${sourceConfig.color} text-xs border-0 rounded-full`}
              >
                {sourceConfig.label}
              </Badge>
            )}
          </div>

          {/* ── Location / salary ───────────────────────────────────── */}
          {(job.location || salary) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {salary}
                </span>
              )}
            </div>
          )}

          {/* ── Tags ───────────────────────────────────────────────── */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {job.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-border/50 text-muted-foreground rounded-full">
                  #{tag}
                </Badge>
              ))}
              {job.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground rounded-full">
                  +{job.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* ── Timestamp ───────────────────────────────────────────── */}
          <p className="text-[11px] text-muted-foreground/50">
            Updated {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{job.company_name}</strong> — {job.job_title} and all associated notes and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(job.id); setDeleteDialogOpen(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
