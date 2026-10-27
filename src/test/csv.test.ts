import { describe, it, expect } from 'vitest';
import { csvCell, toCsv } from '@/lib/csv';

describe('csv', () => {
  it('quotes and escapes', () => expect(csvCell('a"b')).toBe('"a""b"'));
  it('neutralises formulas', () => {
    for (const v of ['=1+1', '+1', '-1', '@x', '\tx']) expect(csvCell(v).startsWith('"\'')).toBe(true);
  });
  it('builds rows', () => expect(toCsv([{ a: 1, b: null }], ['a', 'b'])).toBe('"a","b"\r\n"1",""'));
});
