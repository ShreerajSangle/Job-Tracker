import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { syncStagesForStatus } from './stageQueries';
import type { Application, ApplicationInput, ApplicationStatus } from './types';

export const appKeys = { all: ['applications'] as const };

export function useApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: appKeys.all,
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<Application[]> => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('applied_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: appKeys.all }),
    qc.invalidateQueries({ queryKey: ['stats'] }),
    qc.invalidateQueries({ queryKey: ['resumes'] }),
    qc.invalidateQueries({ queryKey: ['stages'] }),
    qc.invalidateQueries({ queryKey: ['stage-events'] }),
  ]);
}

const fail = (title: string) => (e: Error) => toast({ title, description: e.message, variant: 'destructive' });

export function useCreateApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: ApplicationInput) => {
      const { data, error } = await supabase.from('applications').insert(input).select().single();
      if (error) throw error;
      await syncStagesForStatus(data.id, data.status);
      return data;
    },
    onSuccess: invalidate,
    onError: fail('Could not add application'),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ApplicationInput> }) => {
      const { data, error } = await supabase.from('applications').update(patch).eq('id', id).select().single();
      if (error) throw error;
      if (patch.status) await syncStagesForStatus(id, patch.status);
      return data;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: appKeys.all });
      const prev = qc.getQueryData<Application[]>(appKeys.all);
      qc.setQueryData<Application[]>(appKeys.all, (rows) => rows?.map((r) => (r.id === id ? { ...r, ...patch } as Application : r)));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(appKeys.all, ctx.prev);
      fail('Could not update application')(e);
    },
    onSettled: invalidate,
  });
}

export const useSetStatus = () => {
  const m = useUpdateApplication();
  return (id: string, status: ApplicationStatus) => m.mutate({ id, patch: { status } });
};

export function useDeleteApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail('Could not delete application'),
  });
}
