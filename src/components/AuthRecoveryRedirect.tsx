import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase's password-recovery link redirects to whatever "Site URL" is
 * configured in the dashboard, appending the session as a URL hash — if
 * that Site URL doesn't happen to be /reset-password (e.g. it's just the
 * bare origin, or was never updated from a default), the user lands
 * somewhere else with a perfectly valid recovery session that never gets
 * used. This catches that: the moment supabase-js parses the hash and
 * fires PASSWORD_RECOVERY, jump to /reset-password regardless of which
 * page we're actually on, so a misconfigured Site URL doesn't waste an
 * otherwise-valid link.
 */
export function AuthRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/reset-password') {
        navigate('/reset-password', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}
