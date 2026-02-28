import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobDocument, DocumentType } from '@/types/job';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useJobDocuments(jobId: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user || !jobId) return;

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

    try {
      setUploading(true);
      const filePath = `${user.id}/${jobId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('job_documents')
        .insert({
          job_id: jobId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: documentType,
          is_primary: documents.filter(d => d.document_type === documentType).length === 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

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
      await supabase.storage.from('job-documents').remove([doc.file_path]);

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
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
