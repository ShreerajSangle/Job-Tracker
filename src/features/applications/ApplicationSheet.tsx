import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { todayISO } from '@/lib/format';
import { useResumes } from '@/features/resumes/queries';
import { useCreateApplication, useDeleteApplication, useUpdateApplication } from './queries';
import { STATUSES, STATUS_STYLE, type Application, type ApplicationInput, type ApplicationStatus } from './types';

const blank = (): ApplicationInput => ({
  company: '', role: '', location: '', url: '', status: 'applied', applied_on: todayISO(), notes: '', resume_version_id: null,
});

const field = 'space-y-1.5 text-xs font-medium uppercase tracking-[0.02em] text-ink-2';
const control = 'w-full rounded-[var(--r-sm)] border border-line bg-surface-3 px-3 py-2 text-sm normal-case text-cream outline-none focus:border-green-ink';

/** Create (application = null) or edit. Closes on save. */
export function ApplicationSheet({ open, application, onClose }: {
  open: boolean; application: Application | null; onClose: () => void;
}) {
  const [form, setForm] = useState<ApplicationInput>(blank());
  const { data: resumes = [] } = useResumes();
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const del = useDeleteApplication();

  useEffect(() => {
    if (!open) return;
    setForm(application
      ? { company: application.company, role: application.role, location: application.location ?? '', url: application.url ?? '',
          status: application.status, applied_on: application.applied_on, notes: application.notes ?? '', resume_version_id: application.resume_version_id }
      : blank());
  }, [open, application]);

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ApplicationInput = {
      ...form,
      company: form.company.trim(), role: form.role.trim(),
      location: form.location?.trim() || null, url: form.url?.trim() || null, notes: form.notes?.trim() || null,
    };
    if (application) update.mutate({ id: application.id, patch: payload }, { onSuccess: onClose });
    else create.mutate(payload, { onSuccess: onClose });
  };

  const busy = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-line bg-surface-1 sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-cream">{application ? 'Edit application' : 'New application'}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className={field}>Company
            <Input required autoFocus maxLength={120} value={form.company} onChange={(e) => set('company', e.target.value)} className={control} />
          </label>
          <label className={field}>Role
            <Input required maxLength={160} value={form.role} onChange={(e) => set('role', e.target.value)} className={control} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={field}>Status
              <select value={form.status} onChange={(e) => set('status', e.target.value as ApplicationStatus)} className={control}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
              </select>
            </label>
            <label className={field}>Date
              <Input type="date" required value={form.applied_on} onChange={(e) => set('applied_on', e.target.value)} className={control} />
            </label>
          </div>
          <label className={field}>Location
            <Input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} className={control} />
          </label>
          <label className={field}>Link
            <Input type="url" placeholder="https://" value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} className={control} />
          </label>
          <label className={field}>Resume
            <select value={form.resume_version_id ?? ''} onChange={(e) => set('resume_version_id', e.target.value || null)} className={control}>
              <option value="">None</option>
              {resumes.flatMap((r) => r.versions.map((v) => (
                <option key={v.id} value={v.id}>{r.name} · v{v.version}</option>
              )))}
            </select>
          </label>
          <label className={field}>Notes
            <Textarea rows={5} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={control} />
          </label>
          <div className="flex items-center justify-between pt-2">
            {application ? (
              <button type="button" className="text-sm text-bordo-ink hover:underline"
                onClick={() => { if (confirm('Delete this application?')) del.mutate(application.id, { onSuccess: onClose }); }}>
                Delete
              </button>
            ) : <span />}
            <Button type="submit" disabled={busy} className="rounded-full bg-bordo px-6 text-cream hover:bg-bordo-hi">
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
