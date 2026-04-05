import { useState, useRef } from 'react';
import { Job, JobStatus, SOURCE_CONFIG } from '@/types/job';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import { NotesTimeline } from './NotesTimeline';
import { StatusHistoryTimeline } from './StatusHistoryTimeline';
import { useJobDocuments } from '@/hooks/useJobDocuments';
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Upload,
  FileText,
  Download,
  Trash2,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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

interface JobDetailSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onDelete?: (jobId: string) => void;
}

export function JobDetailSheet({
  job,
  open,
  onOpenChange,
  onStatusChange,
  onDelete,
}: JobDetailSheetProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { documents, uploading, bucketMissing, uploadDocument, downloadDocument, deleteDocument } =
    useJobDocuments(job?.id || '');

  // Sync description when job changes
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  if (job && job.id !== lastJobId) {
    setLastJobId(job.id);
    // Use notes as the editable description field (job_description column does not exist in schema)
    setDescription(job.notes || '');
    setDescriptionDirty(false);
    setShowHistory(false);
  }

  if (!job) return null;

  const sourceConfig = job.source ? SOURCE_CONFIG[job.source] : null;

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.currency || 'USD',
      maximumFractionDigits: 0,
    });
    if (min && max) return `${formatter.format(min)} \u2013 ${formatter.format(max)}`;
    if (min) return `${formatter.format(min)}+`;
    if (max) return `Up to ${formatter.format(max)}`;
    return null;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument(file, 'resume');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Saves description into the `notes` column (the `job_description` column
   * does not exist in the Supabase schema — using notes as the backing field).
   */
  const handleSaveDescription = async () => {
    setSavingDescription(true);
    const { error } = await supabase
      .from('jobs')
      .update({ notes: description })
      .eq('id', job.id);

    if (error) {
      toast({ title: 'Error saving notes', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Notes saved' });
      setDescriptionDirty(false);
    }
    setSavingDescription(false);
  };

  const handleDeleteJob = () => {
    if (onDelete && job) {
      onDelete(job.id);
      onOpenChange(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resumes = documents.filter((d) => d.document_type === 'resume');

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto border-border/40 bg-card p-0"
          aria-describedby={undefined}
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base font-semibold text-foreground leading-tight">
                    {job.company_name}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.job_title}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="px-6 py-5 space-y-6">
            {/* Application Status */}
            <section className="space-y-2.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                Application Status
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  status={job.status}
                  onStatusChange={(newStatus) => onStatusChange(job.id, newStatus)}
                  interactive
                />
                {sourceConfig && (
                  <Badge
                    variant="secondary"
                    className={`${sourceConfig.bgColor} ${sourceConfig.color} border-0 text-xs`}
                  >
                    {sourceConfig.label}
                  </Badge>
                )}
              </div>
            </section>

            <Separator className="bg-border/30" />

            {/* Key Details Grid */}
            <section className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                Details
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {job.location && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Location
                      </p>
                      <p className="text-sm text-foreground mt-0.5 truncate">{job.location}</p>
                    </div>
                  </div>
                )}
                {salary && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Salary
                      </p>
                      <p className="text-sm text-foreground mt-0.5 truncate">{salary}</p>
                    </div>
                  </div>
                )}
                {job.applied_date && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                        Date Applied
                      </p>
                      <p className="text-sm text-foreground mt-0.5">
                        {format(new Date(job.applied_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      Last Updated
                    </p>
                    <p className="text-sm text-foreground mt-0.5">
                      {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Job URL */}
            {job.job_url && (
              <>
                <Separator className="bg-border/30" />
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border/40 bg-muted/30 hover:bg-muted/50 text-sm"
                >
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                    View Job Posting
                  </a>
                </Button>
              </>
            )}

            <Separator className="bg-border/30" />

            {/* Resume Upload */}
            <section className="space-y-2.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                Resume
              </Label>

              {resumes.length > 0 && (
                <div className="space-y-2">
                  {resumes.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{doc.file_name}</p>
                        <p className="text-[11px] text-muted-foreground/60">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive/70 hover:text-destructive"
                        onClick={() => deleteDocument(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area — shows setup instructions if bucket is missing */}
              {bucketMissing ? (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-medium">Storage not configured</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    To enable file uploads, create a private storage bucket named{' '}
                    <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">
                      job-documents
                    </code>{' '}
                    in your Supabase project under{' '}
                    <strong>Storage → New bucket</strong>.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a resume for this application
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs border-border/40 bg-muted/30 hover:bg-muted/50"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <Separator className="bg-border/30" />

            {/* Notes / Description */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Notes &amp; Description
                </Label>
                {descriptionDirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary"
                    onClick={handleSaveDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Save
                  </Button>
                )}
              </div>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDescriptionDirty(true);
                }}
                placeholder="Paste the job description, add notes, interview prep..."
                className="min-h-[120px] bg-muted/20 border-border/40 text-sm placeholder:text-muted-foreground/40 resize-y"
              />
            </section>

            <Separator className="bg-border/30" />

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <>
                <section className="space-y-2.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Tags
                  </Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {job.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs border-border/40 text-muted-foreground bg-muted/30"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </section>
                <Separator className="bg-border/30" />
              </>
            )}

            {/* Timeline Notes */}
            <section className="space-y-2.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                Activity
              </Label>
              <NotesTimeline jobId={job.id} />
            </section>

            <Separator className="bg-border/30" />

            {/* Status History (collapsible) */}
            <section>
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowHistory(!showHistory)}
              >
                <Label className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium cursor-pointer">
                  Status History
                </Label>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
                )}
              </button>
              {showHistory && (
                <div className="mt-3">
                  <StatusHistoryTimeline jobId={job.id} />
                </div>
              )}
            </section>

            {/* Danger Zone — delete available for all statuses */}
            <>
              <Separator className="bg-border/30" />
              <section className="pt-2">
                <Button
                  variant="outline"
                  className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Job Application
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  Permanently deletes this application and all associated data.
                </p>
              </section>
            </>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>{job.company_name}</strong> — {job.job_title} and all associated notes and
              files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
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
