import { useMemo } from 'react';
import { Job, JobStatus, JobSource } from '@/types/job';

export interface JobStats {
  total: number;
  byStatus: Record<JobStatus, number>;
  bySource: Record<JobSource, {
    total: number;
    submitted: number;
    applied: number;
    interviewing: number;
    offered: number;
    accepted: number;
  }>;
  successRate: number;
  interviewRate: number;
  bestSource: { source: JobSource; rate: number } | null;
  worstSource: { source: JobSource; rate: number } | null;
  avgDaysToApply: number | null;
  weeklyApplications: { week: string; count: number }[];
}

export function useJobStats(jobs: Job[], everInterviewedJobIds?: Set<string>): JobStats {
  return useMemo(() => {
    const byStatus: Record<JobStatus, number> = {
      saved: 0, applied: 0, interviewing: 0, offered: 0,
      accepted: 0, rejected: 0, withdrawn: 0,
    };

    const bySource: Record<JobSource, { total: number; submitted: number; applied: number; interviewing: number; offered: number; accepted: number }> = {
      linkedin:     { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      indeed:       { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      referral:     { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      company_site: { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      recruiter:    { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
      other:        { total: 0, submitted: 0, applied: 0, interviewing: 0, offered: 0, accepted: 0 },
    };

    // A job counts as "interviewed" for funnel purposes if it's currently in
    // (or past) the interviewing stage, OR it passed through interviewing at
    // some point in its history before being rejected/withdrawn.
    const wasInterviewed = (job: Job) =>
      job.status === 'interviewing' || job.status === 'offered' || job.status === 'accepted' ||
      (everInterviewedJobIds?.has(job.id) ?? false);

    jobs.forEach((job) => {
      byStatus[job.status]++;
      if (job.source) {
        const s = job.source as JobSource;
        bySource[s].total++;
        if (job.status !== 'saved') bySource[s].submitted++;
        if (job.status === 'applied')      bySource[s].applied++;
        if (job.status === 'interviewing') bySource[s].interviewing++;
        if (job.status === 'offered')      bySource[s].offered++;
        if (job.status === 'accepted')     bySource[s].accepted++;
      }
    });

    // Correct: only count actually submitted applications (not saved)
    const submitted = jobs.filter(j => j.status !== 'saved');
    const totalSubmitted = submitted.length;
    const totalSuccessful = byStatus.offered + byStatus.accepted;
    const totalInterviewed = submitted.filter(wasInterviewed).length;

    const successRate  = totalSubmitted > 0 ? (totalSuccessful / totalSubmitted) * 100 : 0;
    const interviewRate = totalSubmitted > 0 ? (totalInterviewed / totalSubmitted) * 100 : 0;

    // Best/worst source — fixed: separate loops, skip 0-offer sources as "worst" if
    // there are sources with actual negative outcomes. Denominator excludes
    // "saved" jobs (not yet submitted) to match the overall successRate calc.
    let bestSource: { source: JobSource; rate: number } | null = null;
    let worstSource: { source: JobSource; rate: number } | null = null;

    const sourcesWithData = Object.entries(bySource)
      .filter(([, data]) => data.submitted >= 2)
      .map(([source, data]) => ({
        source: source as JobSource,
        rate: ((data.offered + data.accepted) / data.submitted) * 100,
      }));

    if (sourcesWithData.length > 0) {
      sourcesWithData.sort((a, b) => b.rate - a.rate);
      bestSource = sourcesWithData[0];
      // Worst is only flagged if it's different from best
      if (sourcesWithData.length > 1) {
        worstSource = sourcesWithData[sourcesWithData.length - 1];
      }
    }

    // Weekly application velocity (last 8 weeks)
    const weeklyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = `W${String(d.getMonth() + 1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
      weeklyMap.set(key, 0);
    }
    jobs.forEach(j => {
      if (!j.applied_date) return;
      const d = new Date(j.applied_date);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      // Skip out-of-range dates: further back than 8 weeks, or in the future
      // (a future applied_date would otherwise land in a bucket not built above).
      if (diffDays > 56 || diffDays < 0) return;
      const weekIdx = Math.floor(diffDays / 7);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekIdx * 7);
      const key = `W${String(weekStart.getMonth() + 1).padStart(2,'0')}/${String(weekStart.getDate()).padStart(2,'0')}`;
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
    });
    const weeklyApplications = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }));

    // Avg days from created to applied
    const daysToApply = jobs
      .filter(j => j.applied_date && j.created_at)
      .map(j => Math.max(0, Math.floor((new Date(j.applied_date!).getTime() - new Date(j.created_at).getTime()) / (1000*60*60*24))));
    const avgDaysToApply = daysToApply.length > 0
      ? Math.round(daysToApply.reduce((a, b) => a + b, 0) / daysToApply.length)
      : null;

    return {
      total: jobs.length,
      byStatus,
      bySource,
      successRate,
      interviewRate,
      bestSource,
      worstSource,
      avgDaysToApply,
      weeklyApplications,
    };
  }, [jobs, everInterviewedJobIds]);
}
