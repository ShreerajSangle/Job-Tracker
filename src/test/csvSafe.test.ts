import { describe, it, expect } from 'vitest';
import { csvSafe } from '@/pages/Insights';

describe('csvSafe', () => {
  it('leaves ordinary text untouched', () => {
    expect(csvSafe('Acme Corp')).toBe('Acme Corp');
  });

  it('neutralizes formulas starting with =', () => {
    expect(csvSafe('=cmd|/c calc')).toBe("'=cmd|/c calc");
  });

  it('neutralizes formulas starting with +, -, or @', () => {
    expect(csvSafe('+1+1')).toBe("'+1+1");
    expect(csvSafe('-1+1')).toBe("'-1+1");
    expect(csvSafe('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
  });

  it('does not flag values that merely contain those characters mid-string', () => {
    expect(csvSafe('Salary: -5000')).toBe('Salary: -5000');
  });
});
