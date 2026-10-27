import type { Application } from '@/features/applications/types';
import type { ResumeWithVersions } from './queries';

export interface ResumeUsage { sent: number; interviews: number }

/** Per-resume usage across all of its versions. */
export function usageByResume(resumes: ResumeWithVersions[], apps: Application[]): Map<string, ResumeUsage> {
  const versionToResume = new Map<string, string>();
  resumes.forEach((r) => r.versions.forEach((v) => versionToResume.set(v.id, r.id)));
  const out = new Map<string, ResumeUsage>();
  apps.forEach((a) => {
    const rid = a.resume_version_id ? versionToResume.get(a.resume_version_id) : undefined;
    if (!rid) return;
    const u = out.get(rid) ?? { sent: 0, interviews: 0 };
    u.sent += 1;
    if (a.ever_interviewed) u.interviews += 1;
    out.set(rid, u);
  });
  return out;
}
