/** `YYYY-MM-DD` → local Date (avoids the UTC shift of `new Date('2026-01-01')`). */
export const parseDay = (s: string) => new Date(`${s}T00:00:00`);
export const formatDay = (s: string) =>
  parseDay(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
