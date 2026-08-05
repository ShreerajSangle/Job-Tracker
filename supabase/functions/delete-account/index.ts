// Supabase Edge Function: permanently deletes the calling user's account.
//
// Runs with the service-role key so it can bypass RLS to clean up Storage
// objects and delete the Auth user directly. Deleting the Auth user cascades
// (via ON DELETE CASCADE foreign keys) to jobs, job_notes, job_status_history
// and job_documents — this function only needs to remove the Storage objects
// those job_documents rows point to, since Storage isn't covered by DB cascades.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Scoped to the caller's own JWT — only used to identify who is calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) throw new Error('Invalid or expired session');

    // Service-role client — bypasses RLS for the cleanup + admin delete below.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: docs, error: docsError } = await adminClient
      .from('job_documents')
      .select('file_path')
      .eq('user_id', user.id);
    if (docsError) throw docsError;

    if (docs && docs.length > 0) {
      const { error: removeError } = await adminClient.storage
        .from('job-documents')
        .remove(docs.map((d: { file_path: string }) => d.file_path));
      if (removeError) throw removeError;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
