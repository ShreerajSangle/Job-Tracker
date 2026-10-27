import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Stage, StageEvent, StageState } from './types';

/** All of the user's stages (small set) — used for per-row "current stage" labels. */
export function useAllStages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stages'],
    enabled: !!user,
    queryFn: async (): Promise<Stage[]> => {
      const { data, error } = await supabase.from('application_stages').select('*').order('position').order('created_at');
      if (error) throw error;
      return (data ?? []) as Stage[];
    },
  });
}

export function useStageEvents(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['stage-events', applicationId],
    enabled: !!applicationId,
    queryFn: async (): Promise<StageEvent[]> => {
      const { data, error } = await supabase.from('application_stage_events').select('*')
        .eq('application_id', applicationId!).order('occurred_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Stage changes touch application status via triggers, so refresh everything derived. */
function useRefresh() {
  const qc = useQueryClient();
  return () => Promise.all(['stages', 'stage-events', 'applications', 'stats'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}
const fail = (e: Error) => toast({ title: 'Stage update failed', description: e.message, variant: 'destructive' });

export function useAddStage() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ applicationId, name, stageType, position }: { applicationId: string; name: string; stageType: string; position: number }) => {
      const { error } = await supabase.from('application_stages')
        .insert({ application_id: applicationId, name: name.trim(), stage_type: stageType, position });
      if (error) throw error;
    },
    onSuccess: refresh, onError: fail,
  });
}

/** Move a stage to a state. Starting one completes the current stage first (only one may be current). */
export function useSetStageState() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ stage, state, current }: { stage: Stage; state: StageState; current?: Stage }) => {
      const now = new Date().toISOString();
      if (state === 'current' && current && current.id !== stage.id) {
        const { error } = await supabase.from('application_stages').update({ state: 'completed', completed_at: now }).eq('id', current.id);
        if (error) throw error;
      }
      const patch: { state: StageState; started_at?: string; completed_at?: string | null } = { state };
      if (state === 'current') { patch.started_at = stage.started_at ?? now; patch.completed_at = null; }
      if (state === 'completed' || state === 'skipped' || state === 'rejected') patch.completed_at = now;
      if (state === 'pending') { patch.completed_at = null; }
      const { error } = await supabase.from('application_stages').update(patch).eq('id', stage.id);
      if (error) throw error;
    },
    onSuccess: refresh, onError: fail,
  });
}

export function useMoveStage() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ a, b }: { a: Stage; b: Stage }) => {
      // swap positions of two stages
      const r1 = await supabase.from('application_stages').update({ position: b.position }).eq('id', a.id);
      if (r1.error) throw r1.error;
      const r2 = await supabase.from('application_stages').update({ position: a.position }).eq('id', b.id);
      if (r2.error) throw r2.error;
    },
    onSuccess: refresh, onError: fail,
  });
}

export function useDeleteStage() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('application_stages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh, onError: fail,
  });
}

/** Keep the lifecycle consistent with a status chosen by hand (mirrors the reference tracker). */
export async function syncStagesForStatus(applicationId: string, status: string) {
  const { data } = await supabase.from('application_stages').select('*').eq('application_id', applicationId);
  const stages = (data ?? []) as Stage[];
  if (status === 'bookmarked') {
    if (stages.some((s) => s.state !== 'pending')) {
      await supabase.from('application_stages').update({ state: 'pending', started_at: null, completed_at: null }).eq('application_id', applicationId);
    }
    await supabase.from('applications').update({ rejected_at: null, rejected_stage_name: null }).eq('id', applicationId);
    return;
  }
  const now = new Date().toISOString();
  if (!stages.some((s) => s.stage_type === 'application')) {
    await supabase.from('application_stages').insert({
      application_id: applicationId, name: 'Applied', stage_type: 'application', position: 0,
      state: 'completed', started_at: now, completed_at: now,
    });
  }
  const current = stages.find((s) => s.state === 'current');
  if (status === 'rejected' && !stages.some((s) => s.state === 'rejected')) {
    const target = current ?? [...stages].filter((s) => s.state === 'completed').sort((a, b) => b.position - a.position)[0];
    if (target) await supabase.from('application_stages').update({ state: 'rejected', completed_at: now }).eq('id', target.id);
  } else if (status === 'offer' && current) {
    await supabase.from('application_stages').update({ state: 'completed', completed_at: now }).eq('id', current.id);
  }
}
