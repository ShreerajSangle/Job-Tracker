import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobDocument, DocumentType } from '@/types/job';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

/** Returns true if a Supabase StorageError is a "bucket not found" error */
function isBucketNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const msg = (e.message as string | undefined) ?? '';
  const errCode = (e.error as string | undefined) ?? '';
  return (
    msg.toLowerCase().includes('bucket not found') ||
    errCode.toLowerCase().includes('no_such_bucket') ||
    (e as { statusCode?: string }).statusCode === '404'
  );
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function extensionFor(fileName: string): string {
  const match = /\.[a-zA-Z0-9]+$/.exec(fileName);
  return match ? match[0] : '';
}

export function useJobDocuments(jobId: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  /** true when the storage bucket hasn't been created in Supabase yet */
  const [bucketMissing, setBucketMissing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user || !jobId) { setDocuments([]); setLoading(false); return; }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_documents')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as JobDocument[]);
    } catch (err) {
      toast({
        title: 'Error fetching documents',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, jobId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File, documentType: DocumentType = 'resume') => {
    if (!user) return { error: new Error('Not authenticated') };

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const error = new Error('Only PDF or DOCX files are accepted');
      toast({ title: 'Invalid file type', description: error.message, variant: 'destructive' });
      return { error };
    }
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error('File must be under 5 MB');
      toast({ title: 'File too large', description: error.message, variant: 'destructive' });
      return { error };
    }

    try {
      setUploading(true);
      // Random storage key — never embed the user-controlled file name in the
      // object path (path traversal / collision risk). The original name is
      // kept only in the file_name metadata column for display.
      const filePath = `${user.id}/${jobId}/${crypto.randomUUID()}${extensionFor(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(filePath, file);

      if (uploadError) {
        if (isBucketNotFound(uploadError)) {
          setBucketMissing(true);
          toast({
            title: 'Storage not set up',
            description:
              'The "job-documents" storage bucket does not exist in your Supabase project. Go to Supabase → Storage → New bucket, create a bucket named "job-documents" and set it to private.',
            variant: 'destructive',
          });
          return { error: uploadError };
        }
        throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from('job_documents')
        .insert({
          job_id: jobId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: documentType,
          is_primary:
            documents.filter((d) => d.document_type === documentType).length === 0,
        })
        .select()
        .single();

      if (insertError) {
        // Compensate: the metadata row failed, so remove the now-orphaned
        // Storage object instead of leaving it stranded.
        await supabase.storage.from('job-documents').remove([filePath]);
        throw insertError;
      }

      toast({ title: 'File uploaded!' });
      await fetchDocuments();
      return { data };
    } catch (err) {
      toast({
        title: 'Error uploading file',
        description: (err as Error).message,
        variant: 'destructive',
      });
      return { error: err };
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc: JobDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('job-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Error downloading file',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const deleteDocument = async (doc: JobDocument) => {
    if (!user) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('job-documents')
        .remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from('job_documents')
        .delete()
        .eq('id', doc.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'File deleted' });
      await fetchDocuments();
    } catch (err) {
      toast({
        title: 'Error deleting file',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  return {
    documents,
    loading,
    uploading,
    bucketMissing,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
