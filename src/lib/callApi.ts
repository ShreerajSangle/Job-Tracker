import { supabase } from '@/integrations/supabase/client';

export type ApiResult<T> = { data: T } | { error: string };

/** Calls one of our Vercel /api routes with the current Supabase session's access token. */
export async function callApi<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: 'Network error — please try again.' };
  }

  let payload: { data?: T; error?: string } = {};
  try {
    payload = await res.json();
  } catch {
    return { error: `Request failed (${res.status})` };
  }

  if (!res.ok) return { error: payload.error || `Request failed (${res.status})` };
  return { data: payload.data as T };
}
