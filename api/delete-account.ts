// Vercel Edge Function: permanently deletes the calling user's account.
//
// Runs with the service-role key (server-only Vercel env var, never exposed
// to the browser) so it can bypass RLS to clean up Storage objects and
// delete the Auth user directly via Supabase's REST APIs. Deleting the Auth
// user cascades (via ON DELETE CASCADE foreign keys) to jobs, job_notes,
// job_status_history and job_documents — this function only needs to remove
// the Storage objects those job_documents rows point to, since Storage
// isn't covered by DB cascades.
import { verifySupabaseUser, json, corsHeaders } from './_lib/auth';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const user = await verifySupabaseUser(req.headers.get('authorization'));

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server is missing Supabase service-role configuration');
    }
    const adminHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    };

    const docsRes = await fetch(
      `${supabaseUrl}/rest/v1/job_documents?user_id=eq.${user.id}&select=file_path`,
      { headers: adminHeaders },
    );
    if (!docsRes.ok) throw new Error('Failed to look up stored documents');
    const docs: { file_path: string }[] = await docsRes.json();

    if (docs.length > 0) {
      const removeRes = await fetch(`${supabaseUrl}/storage/v1/object/job-documents`, {
        method: 'DELETE',
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: docs.map((d) => d.file_path) }),
      });
      if (!removeRes.ok) throw new Error('Failed to remove stored documents');
    }

    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    if (!deleteRes.ok) throw new Error('Failed to delete the account');

    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 400);
  }
}
