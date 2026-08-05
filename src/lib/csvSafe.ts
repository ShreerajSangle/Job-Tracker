// Neutralizes CSV/spreadsheet formula injection: a cell whose text starts
// with =, +, -, or @ can be interpreted as a formula by Excel/Sheets when
// opened. Prefixing with an apostrophe forces it to be read as plain text.
export function csvSafe(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
