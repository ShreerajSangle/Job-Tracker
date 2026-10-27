import { describe, it, expect } from 'vitest';
import { newApplicationDefaults } from '@/features/applications/defaults';

describe('newApplicationDefaults', () => {
  it('is applied and dated today', () => {
    expect(newApplicationDefaults('2026-10-27')).toEqual({ status: 'applied', applied_on: '2026-10-27' });
    expect(newApplicationDefaults().applied_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
