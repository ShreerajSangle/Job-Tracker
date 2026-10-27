import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PageShell, Surface } from '@/components/Surface';
import { useApplications } from '@/features/applications/queries';
import {
  openVersion, useDeleteResume, useRenameResume, useResumes, useUploadVersion, type ResumeWithVersions,
} from '@/features/resumes/queries';
import { usageByResume } from '@/features/resumes/usage';
import { formatDay } from '@/lib/format';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function ResumeCard({ resume, sent, interviews }: { resume: ResumeWithVersions; sent: number; interviews: number }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadVersion();
  const rename = useRenameResume();
  const del = useDeleteResume();
  return (
    <Surface className="reveal p-6">
      <div className="flex items-start justify-between gap-4">
        <input
          defaultValue={resume.name}
          aria-label="Resume name"
          maxLength={80}
          onBlur={(e) => { const n = e.target.value.trim(); if (n && n !== resume.name) rename.mutate({ id: resume.id, name: n }); }}
          className="min-w-0 flex-1 bg-transparent font-display text-xl font-semibold tracking-[-0.01em] text-cream outline-none focus:underline"
        />
        <button
          onClick={() => input.current?.click()}
          disabled={upload.isPending}
          aria-label="Upload new version"
          title="Upload new version"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-cream transition-transform hover:bg-bordo active:scale-[0.95]"
        >
          <Upload className="h-4 w-4" />
        </button>
        <input ref={input} type="file" accept={ACCEPT} hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate({ file: f, resumeId: resume.id }); e.target.value = ''; }} />
      </div>
      <p className="mt-1 text-sm text-ink-2">
        Used in {sent} {sent === 1 ? 'application' : 'applications'}{sent > 0 && <> · {interviews} interview{interviews === 1 ? '' : 's'}</>}
      </p>
      <ul className="mt-5 space-y-1">
        {resume.versions.map((v) => (
          <li key={v.id}>
            <button onClick={() => openVersion(v)} className="flex w-full items-center justify-between rounded-[var(--r-sm)] px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2">
              <span className="text-cream">v{v.version} <span className="text-ink-2">· {v.file_name}</span></span>
              <span className="tabular-nums text-ink-2">{formatDay(v.created_at.slice(0, 10))}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => { if (confirm(`Delete "${resume.name}" and all its versions?`)) del.mutate(resume); }}
        className="mt-4 text-xs text-bordo-ink hover:underline"
      >
        Delete resume
      </button>
    </Surface>
  );
}

export default function Resumes() {
  const { data: resumes = [], isLoading } = useResumes();
  const { data: apps = [] } = useApplications();
  const upload = useUploadVersion();
  const input = useRef<HTMLInputElement>(null);
  const usage = usageByResume(resumes, apps);
  useDocumentTitle('Resumes');

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <PageShell>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-cream">Resumes</h1>
          <button
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
            className="rounded-full bg-bordo px-5 py-2 text-sm font-medium text-cream transition-transform hover:bg-bordo-hi active:scale-[0.97]"
          >
            {upload.isPending ? 'Uploading…' : 'Add resume'}
          </button>
          <input ref={input} type="file" accept={ACCEPT} hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate({ file: f }); e.target.value = ''; }} />
        </div>
        <p className="mt-1 text-sm text-ink-2">PDF or DOCX, up to 5 MB. Upload a new version to keep the old one linked to past applications.</p>

        {isLoading ? (
          <p className="mt-16 text-center text-sm text-ink-2">Loading…</p>
        ) : resumes.length === 0 ? (
          <p className="mt-24 text-center font-display text-xl text-cream">No resumes yet</p>
        ) : (
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} sent={usage.get(r.id)?.sent ?? 0} interviews={usage.get(r.id)?.interviews ?? 0} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
