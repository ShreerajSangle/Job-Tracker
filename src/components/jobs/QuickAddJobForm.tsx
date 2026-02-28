import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Command, Loader2, Upload, FileText, X,
  Building2, Briefcase, Link2, DollarSign, Calendar,
  StickyNote, AlignLeft, ChevronDown, CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useJobs } from '@/hooks/useJobs';
import { JobStatus, JobSource, STATUS_CONFIG, SOURCE_CONFIG } from '@/types/job';

// ── Validation schema ────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const jobSchema = z.object({
  company_name:    z.string().min(1, 'Company name is required').max(255, 'Too long'),
  job_title:       z.string().min(1, 'Job title is required').max(255, 'Too long'),
  status:          z.enum(['saved', 'applied', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn']),
  source:          z.enum(['linkedin', 'indeed', 'referral', 'company_site', 'recruiter', 'other']).optional(),
  job_url:         z.string().url('Must be a valid URL').optional().or(z.literal('')),
  job_description: z.string().max(10000).optional(),
  salary_min:      z.coerce.number().nonnegative().optional().nullable(),
  salary_max:      z.coerce.number().nonnegative().optional().nullable(),
  applied_date:    z.string().optional(),
  notes:           z.string().max(2000).optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface QuickAddJobFormProps {
  trigger?: React.ReactNode;
}

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1 leading-snug">{message}</p>;
}

// ── Upload progress bar ──────────────────────────────────────────────────────
function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden mt-1">
      <div
        className="h-full bg-primary transition-all duration-300 rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function QuickAddJobForm({ trigger }: QuickAddJobFormProps) {
  const [open, setOpen]               = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [resumeFile, setResumeFile]   = useState<File | null>(null);
  const [fileError, setFileError]     = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showOptional, setShowOptional]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formBodyRef  = useRef<HTMLDivElement>(null);
  const { createJob } = useJobs();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, touchedFields },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: 'onTouched',
    defaultValues: {
      status:       'applied',
      applied_date: new Date().toISOString().split('T')[0],
    },
  });

  // ── keyboard shortcut ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── reset on close ───────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setOpen(false);
    // slight delay so animation completes before reset
    setTimeout(() => {
      reset();
      setResumeFile(null);
      setFileError(null);
      setUploadProgress(0);
      setShowOptional(false);
      setSuccess(false);
    }, 300);
  }, [reset]);

  // ── file handling ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    setFileError(null);
    if (!['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setFileError('Only PDF or DOCX files are accepted');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File must be under 5 MB');
      return;
    }
    setResumeFile(file);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ── submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: JobFormData) => {
    setSubmitting(true);
    setUploadProgress(0);

    const result = await createJob({
      company_name:    data.company_name,
      job_title:       data.job_title,
      status:          data.status as JobStatus,
      source:          data.source as JobSource | undefined,
      job_url:         data.job_url || undefined,
      job_description: data.job_description || undefined,
      salary_min:      data.salary_min ?? undefined,
      salary_max:      data.salary_max ?? undefined,
      applied_date:    data.applied_date || undefined,
      notes:           data.notes || undefined,
    });

    if (!result.error && result.data && resumeFile) {
      const { supabase } = await import('@/integrations/supabase/client');
      const filePath = `${result.data.user_id}/${result.data.id}/${Date.now()}_${resumeFile.name}`;

      // simulate progress while uploading
      const ticker = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 20, 80));
      }, 150);

      const { error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(filePath, resumeFile);

      clearInterval(ticker);
      setUploadProgress(100);

      if (!uploadError) {
        await supabase.from('job_documents').insert({
          job_id:        result.data.id,
          user_id:       result.data.user_id,
          file_name:     resumeFile.name,
          file_path:     filePath,
          file_size:     resumeFile.size,
          document_type: 'resume' as const,
          is_primary:    true,
        });
      }
    }

    setSubmitting(false);

    if (!result.error) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  const statusValue = watch('status');
  const sourceValue = watch('source');

  // ── success overlay ──────────────────────────────────────────────────────
  if (success) {
    return (
      <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
        <DialogTrigger asChild>
          {trigger || <DefaultTrigger />}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[480px] p-0 gap-0 overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Job saved</p>
              <p className="text-sm text-muted-foreground mt-1">Your application has been added.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || <DefaultTrigger />}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 flex flex-col"
        style={{ maxHeight: '85vh', height: 'auto', overflow: 'hidden' }}
        aria-describedby={undefined}
      >
        {/* ── Fixed header ──────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <Briefcase className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground leading-tight">
                Add New Job
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Track a new application</p>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div
          ref={formBodyRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ minHeight: 0, maxHeight: 'calc(85vh - 140px)' }}
        >
          <form id="add-job-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-6 py-5 space-y-5">

              {/* ── 1. Company Name ──────────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="company_name" className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Company Name <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  id="company_name"
                  placeholder="e.g., Acme Corp"
                  autoFocus
                  autoComplete="organization"
                  {...register('company_name')}
                  className={`bg-muted/20 border-border/40 focus-visible:ring-1 text-sm ${
                    errors.company_name ? 'border-destructive/60' : ''
                  }`}
                />
                <FieldError message={errors.company_name?.message} />
              </div>

              {/* ── 2. Job Title ──────────────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="job_title" className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Job Title <span className="text-destructive ml-0.5">*</span>
                </Label>
                {/* Use textarea for multi-line safe job titles */}
                <textarea
                  id="job_title"
                  placeholder="e.g., Senior Software Engineer"
                  rows={2}
                  {...register('job_title')}
                  className={`flex w-full rounded-md border bg-muted/20 border-border/40 px-3 py-2 text-sm
                    ring-offset-background placeholder:text-muted-foreground/50
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1
                    disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed
                    ${errors.job_title ? 'border-destructive/60' : ''}`}
                />
                <FieldError message={errors.job_title?.message} />
              </div>

              <Separator className="bg-border/30" />

              {/* ── 3. Status ─────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <SectionLabel>Application Status</SectionLabel>
                <Select
                  value={statusValue}
                  onValueChange={(value) => setValue('status', value as JobStatus, { shouldTouch: true })}
                >
                  <SelectTrigger className="bg-muted/20 border-border/40 text-sm focus:ring-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/30" />

              {/* ── 4. Resume Upload ─────────────────────────────────── */}
              <div className="space-y-2">
                <SectionLabel>Resume</SectionLabel>
                {resumeFile ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{resumeFile.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {(resumeFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => { setResumeFile(null); setUploadProgress(0); }}
                        aria-label="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <UploadProgress progress={uploadProgress} />
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-5 text-center
                      transition-colors hover:border-border/70 hover:bg-muted/20 cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground/70">
                          Drop PDF or DOCX here
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5">or click to browse — max 5 MB</p>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                {fileError && <p className="text-xs text-destructive">{fileError}</p>}
              </div>

              <Separator className="bg-border/30" />

              {/* ── 5. Job Description ────────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="job_description" className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <AlignLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Job Description
                </Label>
                <Textarea
                  id="job_description"
                  placeholder="Paste the job description here…"
                  {...register('job_description')}
                  rows={4}
                  className="bg-muted/20 border-border/40 text-sm placeholder:text-muted-foreground/40 resize-y focus-visible:ring-1 leading-relaxed"
                />
              </div>

              <Separator className="bg-border/30" />

              {/* ── 6. Source ─────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Source
                </Label>
                <Select
                  value={sourceValue || ''}
                  onValueChange={(value) => setValue('source', value as JobSource, { shouldTouch: true })}
                >
                  <SelectTrigger className="bg-muted/20 border-border/40 text-sm focus:ring-1 w-full">
                    <SelectValue placeholder="Where did you find this job?" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Optional extras (collapsible) ─────────────────────── */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center justify-between w-full group py-0.5"
                >
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground/40 font-semibold group-hover:text-muted-foreground/60 transition-colors">
                    More Details
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${showOptional ? 'rotate-180' : ''}`}
                  />
                </button>

                {showOptional && (
                  <div className="space-y-4 pt-1 border-t border-border/20 pt-3">
                    {/* Job URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="job_url" className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Job URL
                      </Label>
                      <Input
                        id="job_url"
                        type="url"
                        placeholder="https://..."
                        {...register('job_url')}
                        className={`bg-muted/20 border-border/40 focus-visible:ring-1 text-sm ${
                          errors.job_url ? 'border-destructive/60' : ''
                        }`}
                      />
                      <FieldError message={errors.job_url?.message} />
                    </div>

                    {/* Salary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="salary_min" className="flex items-center gap-1.5 text-xs text-foreground/70">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          Salary Min
                        </Label>
                        <Input
                          id="salary_min"
                          type="number"
                          min="0"
                          placeholder="80,000"
                          {...register('salary_min')}
                          className="bg-muted/20 border-border/40 focus-visible:ring-1 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="salary_max" className="flex items-center gap-1.5 text-xs text-foreground/70">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          Salary Max
                        </Label>
                        <Input
                          id="salary_max"
                          type="number"
                          min="0"
                          placeholder="120,000"
                          {...register('salary_max')}
                          className="bg-muted/20 border-border/40 focus-visible:ring-1 text-sm"
                        />
                      </div>
                    </div>

                    {/* Applied Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="applied_date" className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Date Applied
                      </Label>
                      <Input
                        id="applied_date"
                        type="date"
                        {...register('applied_date')}
                        className="bg-muted/20 border-border/40 focus-visible:ring-1 text-sm"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes or reminders…"
                        {...register('notes')}
                        rows={3}
                        className="bg-muted/20 border-border/40 text-sm placeholder:text-muted-foreground/40 resize-y focus-visible:ring-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* bottom padding so last field isn't hidden behind sticky footer */}
              <div className="h-2" />
            </div>
          </form>
        </div>

        {/* ── Fixed footer ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2 shrink-0 bg-card/95 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-job-form"
            size="sm"
            disabled={submitting}
            className="min-w-[90px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Job'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DefaultTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  (props, ref) => (
    <Button ref={ref} className="gap-2" {...props}>
      <Plus className="h-4 w-4" />
      Add Job
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </Button>
  )
);
DefaultTrigger.displayName = 'DefaultTrigger';
