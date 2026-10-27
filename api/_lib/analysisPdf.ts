import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Snapshot } from './analysis.js';

export interface Insights { summary: string; strengths: string[]; bottlenecks: string[]; patterns: string[]; recommendations: string[]; next7Days: string[] }

const W = 595, H = 842, M = 48;
const ink = rgb(0.08, 0.12, 0.12), muted = rgb(0.42, 0.4, 0.36), bordo = rgb(0.42, 0.08, 0.12), green = rgb(0.06, 0.24, 0.23);
// Standard fonts are WinAnsi only: strip anything else.
const ascii = (t: string) => t.normalize('NFKD').replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();

export async function buildAnalysisPdf(s: Snapshot, ins: Insights, generatedAt: Date): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let y = 0;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const need = (h: number) => { if (y - h < M + 20) newPage(); };
  const wrap = (text: string, font: PDFFont, size: number, width: number) => {
    const words = ascii(text).split(' '); const lines: string[] = []; let line = '';
    for (const w of words) { const t = line ? `${line} ${w}` : w; if (font.widthOfTextAtSize(t, size) > width && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  };
  const para = (text: string, size = 10, font = reg, color = ink, indent = 0, gap = 4) => {
    for (const l of wrap(text, font, size, W - 2 * M - indent)) { need(size + 4); page.drawText(l, { x: M + indent, y: y - size, size, font, color }); y -= size + 4; }
    y -= gap;
  };
  const h2 = (t: string) => { need(34); y -= 8; page.drawText(ascii(t).toUpperCase(), { x: M, y: y - 9, size: 9, font: bold, color: bordo }); y -= 20; };
  const bullets = (items: string[]) => items.forEach((i) => { need(14); page.drawText('-', { x: M, y: y - 10, size: 10, font: bold, color: green }); para(i, 10, reg, ink, 14, 2); });
  const row = (a: string, b: string) => { need(15); page.drawText(ascii(a), { x: M, y: y - 10, size: 9.5, font: reg, color: ink }); page.drawText(ascii(b), { x: W - M - 60, y: y - 10, size: 9.5, font: bold, color: ink }); y -= 15; };

  newPage();
  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: green });
  page.drawText('JOB TRACKER', { x: M, y: H - 52, size: 10, font: bold, color: rgb(0.96, 0.85, 0.75) });
  page.drawText('Application Analysis Report', { x: M, y: H - 82, size: 24, font: bold, color: rgb(0.96, 0.85, 0.75) });
  y = H - 110 - 24;
  para(`Generated ${generatedAt.toISOString().slice(0, 10)} (UTC)`, 9, reg, muted);

  const cards: [string, number][] = [['Applications', s.tracked], ['Interview activity', s.interviewActivity], ['Offers', s.offers], ['Stale', s.stale]];
  const cw = (W - 2 * M - 30) / 4;
  cards.forEach(([label, v], i) => {
    const x = M + i * (cw + 10);
    page.drawRectangle({ x, y: y - 52, width: cw, height: 52, color: rgb(0.95, 0.93, 0.9) });
    page.drawText(String(v), { x: x + 10, y: y - 30, size: 20, font: bold, color: green });
    page.drawText(label, { x: x + 10, y: y - 45, size: 8, font: reg, color: muted });
  });
  y -= 68;
  para(`Last 30 days: ${s.last30} applications | Interview-activity rate: ${s.interviewRate}% | Offer from interview: ${s.offerRate}%`, 9.5, reg, muted);

  h2('Executive summary'); para(ins.summary);
  h2('Status breakdown'); Object.entries(s.statusCounts).filter(([, n]) => n > 0).forEach(([k, n]) => row(k, String(n)));
  if (s.monthly.some((m) => m.applications)) { h2('Applications per month'); s.monthly.forEach((m) => row(m.month, String(m.applications))); }
  if (s.sources.length) { h2('Source performance'); s.sources.slice(0, 6).forEach((x) => row(x.source, `${x.total} / ${x.interviewActivity} int / ${x.offers} off`)); }
  if (s.rejectionStages.length) { h2('Rejection-stage signals'); s.rejectionStages.slice(0, 6).forEach((x) => row(x.stage, String(x.count))); }
  if (ins.strengths.length) { h2('What is working'); bullets(ins.strengths); }
  if (ins.bottlenecks.length) { h2('Bottlenecks'); bullets(ins.bottlenecks); }
  if (ins.patterns.length) { h2('Patterns'); bullets(ins.patterns); }
  if (ins.recommendations.length) { h2('Recommended actions'); bullets(ins.recommendations); }
  if (ins.next7Days.length) { h2('Next 7 days'); bullets(ins.next7Days); }
  y -= 6;
  para('Generated from your pipeline metadata only. Resume files, notes, job descriptions and your email were not sent to the AI model.', 8, reg, muted);

  const pages = pdf.getPages();
  pages.forEach((p, i) => p.drawText(`Job Tracker - Page ${i + 1} of ${pages.length}`, { x: M, y: 24, size: 8, font: reg, color: muted }));
  return pdf.save();
}
