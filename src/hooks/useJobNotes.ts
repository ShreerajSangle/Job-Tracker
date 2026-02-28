import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobNote, NoteCategory } from '@/types/job';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useJobNotes(jobId: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user || !jobId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_notes')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as JobNote[]);
    } catch (err) {
      toast({
        title: 'Error fetching notes',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, jobId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (!user || !jobId) return;

    const channel = supabase
      .channel(`job-notes-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_notes',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes((prev) => [payload.new as JobNote, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotes((prev) =>
              prev.map((note) =>
                note.id === payload.new.id ? (payload.new as JobNote) : note
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((note) => note.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, jobId]);

  const createNote = async (content: string, category: NoteCategory = 'general') => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('job_notes')
      .insert({
        job_id: jobId,
        user_id: user.id,
        content,
        category,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error adding note',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({ title: 'Note added!' });
    return { data };
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('job_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting note',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({ title: 'Note deleted' });
    return { success: true };
  };

  return {
    notes,
    loading,
    createNote,
    deleteNote,
    refetch: fetchNotes,
  };
}
