import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Resume = Database['public']['Tables']['resumes']['Row'];
export type ResumeVersion = Database['public']['Tables']['resume_versions']['Row'];
export type ResumeWithVersions = Resume & { versions: ResumeVersion[] };

// Resume files live in the existing private bucket (user-id-first paths).
const BUCKET = 'job-documents';
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function useResumes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['resumes'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<ResumeWithVersions[]> => {
      const [r, v] = await Promise.all([
        supabase.from('resumes').select('*').is('archived_at', null).order('created_at', { ascending: false }),
        supabase.from('resume_versions').select('*').order('version', { ascending: false }),
      ]);
      if (r.error) throw r.error;
      if (v.error) throw v.error;
      return (r.data ?? []).map((res) => ({ ...res, versions: (v.data ?? []).filter((x) => x.resume_id === res.id) }));
    },
  });
}

export async function openVersion(v: Pick<ResumeVersion, 'file_path'>) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(v.file_path, 60);
  if (error || !data) {
    toast({ title: 'Could not open file', description: error?.message, variant: 'destructive' });
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

/** Upload a file as a new version of `resumeId`, or as v1 of a new resume named after the file. */
export function useUploadVersion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, resumeId }: { file: File; resumeId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!ALLOWED_MIME.includes(file.type)) throw new Error('Only PDF or DOCX files are accepted');
      if (file.size > MAX_FILE_SIZE) throw new Error('File must be under 5 MB');

      let id = resumeId;
      let createdResume = false;
      if (!id) {
        const name = file.name.replace(/\.[A-Za-z0-9]+$/, '').slice(0, 80) || 'Resume';
        const { data, error } = await supabase.from('resumes').insert({ name }).select().single();
        if (error) throw error;
        id = data.id;
        createdResume = true;
      }
      const ext = /\.[A-Za-z0-9]+$/.exec(file.name)?.[0] ?? '';
      const path = `${user.id}/resumes/${crypto.randomUUID()}${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file);
      const cleanup = async () => { if (createdResume && id) await supabase.from('resumes').delete().eq('id', id); };
      if (up.error) { await cleanup(); throw up.error; }
      const { error } = await supabase.rpc('add_resume_version', {
        p_resume: id, p_path: path, p_name: file.name, p_size: file.size,
      });
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        await cleanup();
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
    onError: (e: Error) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });
}

export function useRenameResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('resumes').update({ name: name.trim().slice(0, 80) }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
    onError: (e: Error) => toast({ title: 'Rename failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resume: ResumeWithVersions) => {
      const paths = resume.versions.map((v) => v.file_path);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await supabase.from('resumes').delete().eq('id', resume.id);
      if (error) throw error;
    },
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['resumes'] }),
      qc.invalidateQueries({ queryKey: ['applications'] }),
    ]),
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });
}
