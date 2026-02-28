import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobStatus, JobSource } from '@/types/job';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Error fetching jobs',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Job, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === payload.new.id ? (payload.new as Job) : job
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createJob = async (input: {
    company_name: string;
    job_title: string;
    job_url?: string;
    status?: JobStatus;
    source?: JobSource;
    salary_min?: number;
    salary_max?: number;
    applied_date?: string;
    job_description?: string;
    notes?: string;
    tags?: string[];
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...input,
        user_id: user.id,
        status: input.status || 'saved',
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating job',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    // Create initial status history entry
    await supabase.from('job_status_history').insert({
      job_id: data.id,
      user_id: user.id,
      from_status: null,
      to_status: input.status || 'saved',
    });

    toast({
      title: 'Job added!',
      description: `${input.company_name} - ${input.job_title}`,
    });

    return { data };
  };

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    return { data };
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus, reason?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return { error: new Error('Job not found') };

    const oldStatus = job.status;

    const { data, error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    // Create status history entry
    await supabase.from('job_status_history').insert({
      job_id: jobId,
      user_id: user.id,
      from_status: oldStatus,
      to_status: newStatus,
      reason,
    });

    toast({
      title: 'Status updated',
      description: `Changed to ${newStatus}`,
    });

    return { data };
  };

  const deleteJob = async (jobId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting job',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    // Manually update local state for immediate feedback
    setJobs((prev) => prev.filter((job) => job.id !== jobId));

    toast({
      title: 'Job deleted',
    });

    return { success: true };
  };

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    refetch: fetchJobs,
  };
}
