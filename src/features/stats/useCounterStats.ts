import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CounterStats {
  applied: number;
  rejections: number;
  interviews: number;
  offers: number;
}

export function useCounterStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stats', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<CounterStats> => {
      const { data, error } = await supabase.from('application_stats').select('*').maybeSingle();
      if (error) throw error;
      return {
        applied: data?.applied ?? 0,
        rejections: data?.rejections ?? 0,
        interviews: data?.interviews ?? 0,
        offers: data?.offers ?? 0,
      };
    },
  });
}
