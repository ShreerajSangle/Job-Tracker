import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CounterStats {
  applied: number;
  rejections: number;
  interviews: number;
}

/** Counter-page numbers. Interviews include jobs that passed through
 *  "interviewing" at any time, not just those currently in it. */
export function useCounterStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stats', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<CounterStats> => {
      const [jobsRes, historyRes] = await Promise.all([
        supabase.from('jobs').select('id,status').eq('user_id', user!.id),
        supabase.from('job_status_history').select('job_id').eq('user_id', user!.id).eq('to_status', 'interviewing'),
      ]);
      if (jobsRes.error) throw jobsRes.error;
      const jobs = jobsRes.data ?? [];
      const everInterviewed = new Set((historyRes.data ?? []).map((r) => r.job_id));
      const submitted = jobs.filter((j) => j.status !== 'saved');
      return {
        applied: submitted.length,
        rejections: jobs.filter((j) => j.status === 'rejected').length,
        interviews: jobs.filter(
          (j) => ['interviewing', 'offered', 'accepted'].includes(j.status) || everInterviewed.has(j.id),
        ).length,
      };
    },
  });
}
