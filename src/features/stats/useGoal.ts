import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Daily application target, stored in user_settings.daily_goal. */
export function useGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: goal = 5 } = useQuery({
    queryKey: ['goal', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_settings').select('daily_goal').maybeSingle();
      if (error) throw error;
      return data?.daily_goal ?? 5;
    },
  });
  const m = useMutation({
    mutationFn: async (n: number) => {
      const { error } = await supabase.from('user_settings').upsert({ user_id: user!.id, daily_goal: Math.min(100, Math.max(1, Math.round(n))) });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goal'] }),
  });
  return { goal, setGoal: (n: number) => m.mutate(n) };
}
