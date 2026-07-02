/**
 * Brand constants + sharp/SVG helpers for turning raw card snaps into finished content.
 * Threadverse aesthetic: near-black, white condensed type, high contrast, minimal.
 */
const BRAND = {
  bg: '#0A0A0B',
  bgCard: '#101012',
  fg: '#FFFFFF',
  dim: '#8A8A90',
  accent: '#FFFFFF',
  // Condensed industrial display font available on macOS; falls back gracefully.
  displayFont: "'Avenir Next Condensed', 'Helvetica Neue', Arial, sans-serif",
  bodyFont: "'Helvetica Neue', Arial, sans-serif",
  wordmark: 'THREADVERSE',
  url: 'threadverse.ai',
  tagline: 'One feed. Every platform. Zero noise.',
};

// XML-escape text for embedding in SVG.
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Word-wrap a string into <= maxChars lines (rough; SVG has no auto-wrap).
function wrap(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
    if (maxLines && lines.length >= maxLines) break;
  }
  if (cur && (!maxLines || lines.length < maxLines)) lines.push(cur);
  if (maxLines && lines.length >= maxLines) { lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '…'); }
  return lines.slice(0, maxLines || lines.length);
}

// Build an SVG <text> block of stacked lines.
function textBlock(lines, { x, y, size, lineHeight, weight = 700, fill = BRAND.fg, font = BRAND.displayFont, anchor = 'start' }) {
  return lines.map((ln, i) =>
    `<text x="${x}" y="${y + i * lineHeight}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="0.2">${esc(ln)}</text>`
  ).join('');
}

module.exports = { BRAND, esc, wrap, textBlock };
