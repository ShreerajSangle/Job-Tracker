import { useEffect, useRef, useState } from 'react';
import { Paperclip, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ALLOWED_MIME, MAX_FILE_SIZE, useResumes, useUploadVersion } from '@/features/resumes/queries';
import { LifecyclePanel } from './LifecyclePanel';
import { importJobFromUrl, isHttpUrl } from './importJob';
import { newApplicationDefaults } from './defaults';
import { useCreateApplication, useDeleteApplication, useUpdateApplication } from './queries';
import { STATUSES, STATUS_STYLE, type Application, type ApplicationInput, type ApplicationStatus } from './types';
import { formatDay } from '@/lib/format';

const blank = (): ApplicationInput => ({
  company: '', role: '', location: '', url: '', ...newApplicationDefaults(), notes: '', resume_version_id: null, source: '', jd_text: '',
});

const label = 'block space-y-1.5 text-xs font-medium uppercase tracking-[0.02em] text-ink-2';
const control = 'w-full rounded-[var(--r-sm)] border-0 bg-surface-3 px-3 py-2.5 text-sm normal-case text-cream outline-none placeholder:text-ink-2 focus:ring-2 focus:ring-ring';
const section = 'space-y-3';
const sectionTitle = 'font-display text-sm font-semibold tracking-[-0.01em] text-cream';

/** Centered dialog for adding (application = null) or editing an application. */
export function ApplicationDialog({ open, application, onClose }: {
  open: boolean; application: Application | null; onClose: () => void;
}) {
  const editing = !!application;
  const [form, setForm] = useState<ApplicationInput>(blank());
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: resumes = [] } = useResumes();
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const del = useDeleteApplication();
  const upload = useUploadVersion();

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setForm(application
      ? { company: application.company, role: application.role, location: application.location ?? '', url: application.url ?? '',
          status: application.status, applied_on: application.applied_on, notes: application.notes ?? '',
          resume_version_id: application.resume_version_id, source: application.source ?? '', jd_text: application.jd_text ?? '' }
      : blank());
  }, [open, application]);

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const runImport = async () => {
    const url = (form.url ?? '').trim();
    if (!isHttpUrl(url)) return toast({ title: 'Enter a valid http(s) job link first', variant: 'destructive' });
    setImporting(true);
    const res = await importJobFromUrl(url);
    setImporting(false);
    if ('error' in res) return toast({ title: 'Import failed', description: res.error, variant: 'destructive' });
    const r = res.data;
    setForm((f) => ({
      ...f, role: (r.job_title || f.role).slice(0, 160), company: (r.company || f.company).slice(0, 120),
      location: (r.location || f.location || '').slice(0, 200), source: (r.source || f.source || '').slice(0, 80),
      jd_text: r.notes || f.jd_text, url: r.job_link || f.url,
    }));
    toast({ title: 'Imported — review the details below' });
  };

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type)) return toast({ title: 'Only PDF or DOCX files are accepted', variant: 'destructive' });
    if (f.size > MAX_FILE_SIZE) return toast({ title: 'File must be under 5 MB', variant: 'destructive' });
    setFile(f);
    set('resume_version_id', null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let resumeVersionId = form.resume_version_id;
      if (file) {
        const v = await upload.mutateAsync({ file });
        resumeVersionId = v?.id ?? null;
      }
      const payload: ApplicationInput = {
        ...form, company: form.company.trim(), role: form.role.trim(), resume_version_id: resumeVersionId,
        location: form.location?.trim() || null, source: form.source?.trim().slice(0, 80) || null, url: form.url?.trim() || null,
        notes: form.notes?.trim() || null, jd_text: form.jd_text?.trim() || null,
      };
      if (application) await update.mutateAsync({ id: application.id, patch: payload });
      else await create.mutateAsync({ ...payload, ...newApplicationDefaults() });
      onClose();
    } catch { /* the mutations already toast their own errors */ } finally { setSaving(false); }
  };

  const resumeOptions = resumes.flatMap((r) => r.versions.map((v) => ({ id: v.id, text: `${r.name} · v${v.version}` })));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg gap-0 overflow-y-auto rounded-[var(--r-md)] border-0 bg-surface-1 p-6 text-cream shadow-2xl shadow-black/40 sm:rounded-[var(--r-md)] sm:p-8">
        <DialogHeader className="mb-6 text-left">
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.02em]">{editing ? 'Edit application' : 'Add application'}</DialogTitle>
          <DialogDescription className="text-sm text-ink-2">
            {editing ? `${form.company || 'Application'}` : `Saves as Applied · ${formatDay(newApplicationDefaults().applied_on)}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-7">
          <div className={section}>
            <h3 className={sectionTitle}>{editing ? 'Link' : '1 · Link'}</h3>
            <div className="flex gap-2">
              <Input type="url" placeholder="https://company.com/jobs/…" value={form.url ?? ''} aria-label="Job link"
                onChange={(e) => set('url', e.target.value)} className={control} autoFocus={!editing} />
              <button type="button" onClick={runImport} disabled={importing || !form.url}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-green px-4 text-sm text-cream transition-transform hover:bg-surface-3 active:scale-[0.97] disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={label}>Role
                <Input required maxLength={160} value={form.role} onChange={(e) => set('role', e.target.value)} className={control} />
              </label>
              <label className={label}>Company
                <Input required maxLength={120} value={form.company} onChange={(e) => set('company', e.target.value)} className={control} />
              </label>
              <label className={label}>Location
                <Input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} className={control} />
              </label>
              <label className={label}>Source
                <Input list="dlg-sources" maxLength={80} value={form.source ?? ''} onChange={(e) => set('source', e.target.value)} className={control} placeholder="LinkedIn, Referral…" />
                <datalist id="dlg-sources">{['LinkedIn', 'Indeed', 'Company site', 'Referral', 'Recruiter', 'Other'].map((x) => <option key={x} value={x} />)}</datalist>
              </label>
            </div>
            <label className={label}>Job description
              <Textarea rows={4} value={form.jd_text ?? ''} onChange={(e) => set('jd_text', e.target.value)} className={control} />
            </label>
          </div>

          <div className={section}>
            <h3 className={sectionTitle}>{editing ? 'Resume' : '2 · Resume'}</h3>
            <input ref={fileInput} type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
            {file ? (
              <div className="flex items-center justify-between rounded-[var(--r-sm)] bg-surface-3 px-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-green-ink" /><span className="truncate">{file.name}</span></span>
                <button type="button" aria-label="Remove file" onClick={() => setFile(null)} className="text-ink-2 hover:text-cream"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={form.resume_version_id ?? ''} onChange={(e) => set('resume_version_id', e.target.value || null)} className={control} aria-label="Existing resume">
                  <option value="">{resumeOptions.length ? 'Choose an existing resume…' : 'No resumes yet'}</option>
                  {resumeOptions.map((o) => <option key={o.id} value={o.id}>{o.text}</option>)}
                </select>
                <button type="button" onClick={() => fileInput.current?.click()}
                  className="shrink-0 rounded-full bg-surface-3 px-4 text-sm text-cream transition-transform hover:bg-surface-2 active:scale-[0.97]">Upload new</button>
              </div>
            )}
          </div>

          {editing && (
            <div className={section}>
              <h3 className={sectionTitle}>Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className={label}>Status
                  <select value={form.status} onChange={(e) => set('status', e.target.value as ApplicationStatus)} className={control}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                  </select>
                </label>
                <label className={label}>Date
                  <Input type="date" required value={form.applied_on} onChange={(e) => set('applied_on', e.target.value)} className={control} />
                </label>
              </div>
              <label className={label}>Notes
                <Textarea rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={control} />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {application ? (
              <button type="button" className="text-sm text-bordo-ink hover:underline"
                onClick={() => { if (confirm('Delete this application?')) del.mutate(application.id, { onSuccess: onClose }); }}>Delete</button>
            ) : <span />}
            <button type="submit" disabled={saving}
              className="rounded-full bg-bordo px-7 py-2.5 text-sm font-medium text-cream transition-transform hover:bg-bordo-hi active:scale-[0.97] disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save' : 'Add application'}
            </button>
          </div>
        </form>

        {application && <div className="mt-8"><LifecyclePanel applicationId={application.id} /></div>}
      </DialogContent>
    </Dialog>
  );
}
