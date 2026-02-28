import { useMemo } from 'react';
import { Job, JobStatus, JobSource, SOURCE_CONFIG } from '@/types/job';

export interface JobStats {
  total: number;
  byStatus: Record<JobStatus, number>;
  bySource: Record<JobSource, {
    total: number;
    applied: number;
    interviewing: number;
    offered: number;
    accepted: number;
  }>;
  successRate: number;
  bestSource: { source: JobSource; rate: number } | null;
  worstSource: { source: JobSource; rate: number } | null;
}

export function useJobStats(jobs: Job[]): JobStats {
  return useMemo(() => {
    const byStatus: Record<JobStatus, number> = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    const bySource: Record<JobSource, {
      total: number;
      applied: number;
      interviewing: number;
      offered: number;
      accepted: number;
    }> = {
      linkedin: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      indeed: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      referral: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      company_site: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      recruiter: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      other: { total: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
    };

    jobs.forEach((job) => {
      byStatus[job.status]++;

      if (job.source) {
        const source = job.source as JobSource;
        bySource[source].total++;
        if (job.status === 'applied') bySource[source].applied++;
        if (job.status === 'interviewing') bySource[source].interviewing++;
        if (job.status === 'offered') bySource[source].offered++;
        if (job.status === 'accepted') bySource[source].accepted++;
      }
    });

    const totalApplied = jobs.filter((j) => j.status !== 'saved').length;
    const totalSuccessful = byStatus.offered + byStatus.accepted;
    const successRate = totalApplied > 0 ? (totalSuccessful / totalApplied) * 100 : 0;

    // Find best and worst performing sources
    let bestSource: { source: JobSource; rate: number } | null = null;
    let worstSource: { source: JobSource; rate: number } | null = null;

    Object.entries(bySource).forEach(([source, data]) => {
      if (data.total >= 2) {
        const rate = ((data.offered + data.accepted) / data.total) * 100;
        if (!bestSource || rate > bestSource.rate) {
          bestSource = { source: source as JobSource, rate };
        }
        if (!worstSource || rate < worstSource.rate) {
          worstSource = { source: source as JobSource, rate };
        }
      }
    });

    return {
      total: jobs.length,
      byStatus,
      bySource,
      successRate,
      bestSource,
      worstSource,
    };
  }, [jobs]);
}
