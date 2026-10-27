import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Days until the job-search end date stored in user_settings. */
export function useDaysLeft() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: endsOn = null } = useQuery({
    queryKey: ['settings', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_settings').select('search_ends_on').maybeSingle();
      if (error) throw error;
      return data?.search_ends_on ?? null;
    },
  });
  const m = useMutation({
    mutationFn: async (v: string) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user!.id, search_ends_on: v || null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
  const daysLeft = endsOn
    ? Math.max(0, Math.ceil((new Date(endsOn + 'T23:59:59').getTime() - Date.now()) / 864e5))
    : null;
  return { endsOn, daysLeft, setEndsOn: (v: string) => m.mutate(v) };
}
