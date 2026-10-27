import { useAuth } from '@/hooks/useAuth';
import { useShortcuts } from '@/lib/shortcuts';

/** Registers the global shortcuts once, only for signed-in users. */
export function ShortcutsMount() {
  const { user } = useAuth();
  useShortcuts(!!user);
  return null;
}
