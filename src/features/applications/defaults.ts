import { todayISO } from '@/lib/format';
import type { ApplicationInput } from './types';

/** A new application is created at the moment it is submitted: Applied, dated today. */
export const newApplicationDefaults = (now?: string): Pick<ApplicationInput, 'status' | 'applied_on'> => ({
  status: 'applied',
  applied_on: now ?? todayISO(),
});
