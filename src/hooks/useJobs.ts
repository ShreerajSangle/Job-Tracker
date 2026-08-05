import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobStatus, JobSource } from '@/types/job';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);
  // Job IDs that reached "interviewing" at any point, even if later rejected —
  // current `status` alone under-counts the interview funnel for such jobs.
  const [everInterviewedJobIds, setEverInterviewedJobIds] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setEverInterviewedJobIds(new Set()); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data || []) as Job[]);
      setError(null);

      const { data: historyRows, error: historyError } = await supabase
        .from('job_status_history')
        .select('job_id')
        .eq('user_id', user.id)
        .eq('to_status', 'interviewing');
      if (!historyError) {
        setEverInterviewedJobIds(new Set((historyRows || []).map(r => r.job_id)));
      }
    } catch (err) {
      setError(err as Error);
      toast({ title: 'Error fetching jobs', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => prev.some(j => j.id === (payload.new as Job).id) ? prev : [payload.new as Job, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(job => job.id === payload.new.id ? (payload.new as Job) : job));
          } else if (payload.eventType === 'DELETE') {
            // Only use realtime for DELETE — do NOT also call setJobs manually in deleteJob
            setJobs(prev => prev.filter(job => job.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const createJob = async (input: {
    company_name: string;
    job_title: string;
    job_url?: string;
    status?: JobStatus;
    source?: JobSource;
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    location?: string;
    applied_date?: string;
    deadline_date?: string;
    job_description?: string;
    notes?: string;
    tags?: string[];
  }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...input, user_id: user.id, status: input.status || 'saved' })
      .select().single();
    if (error) {
      toast({ title: 'Error creating job', description: error.message, variant: 'destructive' });
      return { error };
    }
    // De-duplicated local update — don't rely solely on the Realtime INSERT event
    setJobs(prev => (prev.some(j => j.id === data.id) ? prev : [data as Job, ...prev]));
    const { error: historyError } = await supabase.from('job_status_history').insert({
      job_id: data.id, user_id: user.id,
      from_status: null, to_status: input.status || 'saved',
    });
    if (historyError) {
      toast({ title: 'Job added, but history log failed', description: historyError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Job added!', description: `${input.company_name} - ${input.job_title}` });
    }
    return { data };
  };

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('jobs').update(updates).eq('id', jobId).eq('user_id', user.id).select().single();
    if (error) {
      toast({ title: 'Error updating job', description: error.message, variant: 'destructive' });
      return { error };
    }
    setJobs(prev => prev.map(job => job.id === jobId ? (data as Job) : job));
    return { data };
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus, reason?: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const job = jobs.find(j => j.id === jobId);
    if (!job) return { error: new Error('Job not found') };
    const oldStatus = job.status;
    const { data, error } = await supabase
      .from('jobs').update({ status: newStatus }).eq('id', jobId).eq('user_id', user.id).select().single();
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
      return { error };
    }
    setJobs(prev => prev.map(j => j.id === jobId ? (data as Job) : j));
    if (newStatus === 'interviewing') {
      setEverInterviewedJobIds(prev => new Set(prev).add(jobId));
    }
    const { error: historyError } = await supabase.from('job_status_history').insert({
      job_id: jobId, user_id: user.id, from_status: oldStatus, to_status: newStatus, reason,
    });
    if (historyError) {
      toast({ title: 'Status updated, but history log failed', description: historyError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated', description: `Changed to ${newStatus}` });
    }
    return { data };
  };

  const deleteJob = async (jobId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Clean up storage objects first — deleting the job row cascades the
    // job_documents metadata rows, but does NOT remove the underlying
    // Storage objects, which would otherwise be orphaned.
    const { data: docs } = await supabase
      .from('job_documents')
      .select('file_path')
      .eq('job_id', jobId)
      .eq('user_id', user.id);
    if (docs && docs.length > 0) {
      await supabase.storage.from('job-documents').remove(docs.map(d => d.file_path));
    }

    // Optimistic UI: remove immediately, realtime will confirm
    setJobs(prev => prev.filter(job => job.id !== jobId));
    const { error } = await supabase.from('jobs').delete().eq('id', jobId).eq('user_id', user.id);
    if (error) {
      // Rollback optimistic update on failure
      fetchJobs();
      toast({ title: 'Error deleting job', description: error.message, variant: 'destructive' });
      return { error };
    }
    toast({ title: 'Job deleted' });
    return { success: true };
  };

  return { jobs, loading, error, everInterviewedJobIds, createJob, updateJob, updateJobStatus, deleteJob, refetch: fetchJobs };
}
