/**
 * A library of GENUINELY DISTINCT tile formats. Each has a different composition — not the
 * same "text on top, screenshot below" stack. Screenshots are always scaled to FIT (never
 * cropped), so no post ever gets cut off.
 */
const sharp = require('sharp');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

// ---- helpers ----------------------------------------------------------------
function grad(w, h, id = 'g', c0 = '#1A1A1F', c1 = BRAND.bg, cx = '50%', cy = '18%') {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="115%"><stop offset="0%" stop-color="${c0}"/><stop offset="65%" stop-color="#0E0E11"/><stop offset="100%" stop-color="${c1}"/></radialGradient>`;
}
function foot(w, y) {
  return `<text x="60" y="${y}" font-family="${BRAND.displayFont}" font-size="28" font-weight="800" fill="${BRAND.fg}" letter-spacing="2">${BRAND.wordmark}</text>
          <text x="${w - 60}" y="${y}" font-family="${BRAND.bodyFont}" font-size="24" font-weight="600" fill="${BRAND.dim}" text-anchor="end">${BRAND.url}</text>`;
}
// Scale a screenshot to FIT inside (maxW x maxH) — never crop. Returns {buf,w,h}.
async function fitCard(imgPath, maxW, maxH, radius = 20) {
  const meta = await sharp(imgPath).metadata();
  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const w = Math.max(1, Math.round(meta.width * scale));
  const h = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(imgPath).resize(w, h, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  return { buf: await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w, h };
}
async function paint(w, h, defs, svgInner, comps = []) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${svgInner}</svg>`;
  const bg = await sharp(Buffer.from(svg)).png().toBuffer();
  return sharp(bg).composite(comps).png().toBuffer();
}
const stripPrefix = (s, p) => (s || '').replace(new RegExp(`^\\s*${p}[:\\s]*`, 'i'), '').trim();

// ── FORMAT: quote — pure typography, NO screenshot ───────────────────────────
async function quote({ text, handle, source }) {
  const W = 1080, H = 1080;
  const q = wrap(`“${text}”`, 22, 6);
  const size = q.length > 5 ? 56 : q.length > 3 ? 68 : 82;
  const startY = Math.round((H - q.length * (size + 12)) / 2) - 10;
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="56" y="140" font-family="${BRAND.displayFont}" font-size="150" fill="#26262C" font-weight="800">“</text>
    ${textBlock(q, { x: 60, y: startY, size, lineHeight: size + 12, weight: 700 })}
    <text x="60" y="${startY + q.length * (size + 12) + 46}" font-family="${BRAND.bodyFont}" font-size="27" fill="${BRAND.dim}">${esc(handle || '')} · via ${esc(source || 'the feed')}</text>
    ${foot(W, H - 54)}`;
  return paint(W, H, grad(W, H), inner);
}

// ── FORMAT: banner — screenshot is the HERO (fills frame), thin hook strip on top ─
async function banner({ cardPath, hook, source }) {
  const W = 1080, H = 1080;
  const stripH = 150, footH = 90;
  const card = await fitCard(cardPath, W - 120, H - stripH - footH - 40, 22);
  const hookLines = wrap(hook, 30, 2);
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>
    ${textBlock(hookLines, { x: 60, y: 78, size: 50, lineHeight: 56, weight: 800 })}
    <text x="60" y="${H - 44}" font-family="${BRAND.bodyFont}" font-size="24" fill="${BRAND.dim}">via ${esc(source || 'the feed')} · kept by Threadverse</text>
    <text x="${W - 60}" y="${H - 44}" font-family="${BRAND.displayFont}" font-size="26" font-weight="800" fill="${BRAND.fg}" text-anchor="end" letter-spacing="2">${BRAND.wordmark}</text>`;
  const y = stripH + Math.round((H - stripH - footH - card.h) / 2);
  return paint(W, H, grad(W, H), inner, [{ input: card.buf, top: Math.max(stripH, y), left: Math.round((W - card.w) / 2) }]);
}

// ── FORMAT: splitProof — HARD split: colored claim panel (top) | screenshot (bottom) ─
async function splitProof({ statement, cardPath, source }) {
  const W = 1080, H = 1080;
  const panelH = 380;               // solid claim panel
  const st = wrap(statement, 22, 4);
  const size = st.length > 3 ? 60 : 72;
  const card = await fitCard(cardPath, W - 120, H - panelH - 130, 22);
  const inner = `<rect width="${W}" height="${H}" fill="${BRAND.bg}"/>
    <rect width="${W}" height="${panelH}" fill="#F4F4F6"/>
    <rect y="${panelH - 6}" width="${W}" height="6" fill="${BRAND.fg}"/>
    ${textBlock(st, { x: 60, y: Math.round((panelH - st.length * (size + 6)) / 2) + size, size, lineHeight: size + 6, weight: 800, fill: '#0A0A0B' })}
    ${foot(W, H - 44)}`;
  const y = panelH + Math.round((H - panelH - 90 - card.h) / 2);
  return paint(W, H, grad(W, H), inner, [{ input: card.buf, top: y, left: Math.round((W - card.w) / 2) }]);
}

// ── FORMAT: tabloid — screenshot + red diagonal BREAKING sash + bottom headline bar ─
async function tabloid({ cardPath, kicker, source }) {
  const W = 1080, H = 1080;
  const barH = 220;
  const card = await fitCard(cardPath, W - 120, H - barH - 80, 22);
  const cy = Math.round((H - barH - card.h) / 2) + 20;
  const k = wrap(kicker, 28, 2);
  // diagonal sash top-left
  const sash = `<g transform="translate(-60,120) rotate(-45)"><rect x="-200" y="0" width="600" height="70" fill="#E5322D"/>
    <text x="100" y="50" font-family="${BRAND.displayFont}" font-size="40" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="3">BREAKING</text></g>`;
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>
    ${sash}
    <rect y="${H - barH}" width="${W}" height="${barH}" fill="#0A0A0B"/>
    <rect y="${H - barH}" width="${W}" height="5" fill="#E5322D"/>
    <text x="60" y="${H - barH + 60}" font-family="${BRAND.bodyFont}" font-size="24" fill="#E5322D" letter-spacing="3" font-weight="700">THREADVERSE CAUGHT THIS EARLY</text>
    ${textBlock(k, { x: 60, y: H - barH + 115, size: 52, lineHeight: 58, weight: 800 })}
    <text x="${W - 60}" y="${H - 30}" font-family="${BRAND.displayFont}" font-size="24" font-weight="800" fill="${BRAND.dim}" text-anchor="end" letter-spacing="2">${BRAND.wordmark}</text>`;
  return paint(W, H, grad(W, H), inner, [{ input: card.buf, top: cy, left: Math.round((W - card.w) / 2) }]);
}

// ── FORMAT: pov — PORTRAIT, screenshot centered on a color gradient, small POV caption ─
async function pov({ cardPath, povText, source }) {
  const W = 1080, H = 1350;
  const clean = stripPrefix(povText, 'POV');
  const lines = wrap(`POV: ${clean}`, 26, 3);
  const capH = 60 + lines.length * 66;
  const card = await fitCard(cardPath, W - 120, H - capH - 200, 26);
  const inner = `<rect width="${W}" height="${H}" fill="url(#g2)"/>
    ${textBlock(lines, { x: 60, y: 120, size: 58, lineHeight: 66, weight: 800 })}
    ${foot(W, H - 50)}`;
  const y = capH + 80 + Math.round((H - capH - 80 - 90 - card.h) / 2);
  return paint(W, H, grad(W, H, 'g2', '#221E2C', BRAND.bg, '50%', '30%'), inner, [{ input: card.buf, top: y, left: Math.round((W - card.w) / 2) }]);
}

// ── FORMAT: minimal — small centered screenshot, huge negative space, one quiet line ─
async function minimal({ cardPath, hook, source }) {
  const W = 1080, H = 1080;
  const card = await fitCard(cardPath, 560, 560, 22);
  const lines = wrap(hook, 34, 2);
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>
    ${textBlock(lines, { x: 60, y: 170, size: 46, lineHeight: 54, weight: 700, fill: BRAND.fg })}
    <text x="60" y="${H - 120}" font-family="${BRAND.bodyFont}" font-size="24" fill="${BRAND.dim}">via ${esc(source || 'the feed')}</text>
    ${foot(W, H - 54)}`;
  const y = 250 + Math.round((H - 250 - 160 - card.h) / 2);
  return paint(W, H, grad(W, H), inner, [{ input: card.buf, top: Math.max(250, y), left: Math.round((W - card.w) / 2) }]);
}

// ── FORMAT: bigStat — engagement number as hero + small screenshot below ─────
async function bigStat({ number, label, cardPath }) {
  const W = 1080, H = 1080;
  const card = await fitCard(cardPath, 620, 480, 20);
  const lbl = wrap(label, 30, 2);
  const inner = `<rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="56" y="210" font-family="${BRAND.displayFont}" font-size="190" font-weight="800" fill="${BRAND.fg}">${esc(number)}</text>
    ${textBlock(lbl, { x: 62, y: 270, size: 38, lineHeight: 46, weight: 600, fill: BRAND.dim, font: BRAND.bodyFont })}
    ${foot(W, H - 54)}`;
  const y = 360 + Math.round((H - 360 - 90 - card.h) / 2);
  return paint(W, H, grad(W, H), inner, [{ input: card.buf, top: Math.max(360, y), left: Math.round((W - card.w) / 2) }]);
}

module.exports = { quote, banner, splitProof, tabloid, pov, minimal, bigStat };
