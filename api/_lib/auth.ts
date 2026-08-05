// Shared by every /api function: verifies the caller's Supabase session via
// a direct REST call to Supabase's Auth API. Avoids importing @supabase/supabase-js
// into the Edge runtime — a plain fetch call is lighter and has no edge-runtime
// compatibility surface to worry about.
export interface SupabaseUser {
  id: string;
}

export async function verifySupabaseUser(authHeader: string | null): Promise<SupabaseUser> {
  if (!authHeader) throw new Error('Missing authorization header');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Server is missing Supabase configuration');

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: anonKey },
  });
  if (!res.ok) throw new Error('Invalid or expired session');

  const user = await res.json();
  if (!user?.id) throw new Error('Invalid or expired session');
  return user as SupabaseUser;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
