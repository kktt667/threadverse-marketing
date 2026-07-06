/**
 * Render the NICHE hook posts: visual-hook image as background → dark scrim → real Threadverse
 * card + bold HOOK headline overlaid on top. Organized by platform/lane.
 *
 * Reads library/03-raw-snaps/_hookmaster.json (each card has: tile [real card png], visual [bg img],
 * hook, caption, lane, bestPlatform, format, score).
 * Writes library/01-content-cards/<platform>/<lane>-<file>.png  + library/content-niche.json
 *
 *   node edit/render-hooks.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'library', '03-raw-snaps', '_hookmaster.json');
const W = 1080, H = 1080;

// lane accent colors (subtle, used for a thin hook underline)
const LANE_ACCENT = { ai: '#6BA6FF', gaming: '#B06BFF', crypto: '#F4C430', philosophy: '#E8E2D0', science: '#42C97A' };

async function roundedCard(imgPath, w) {
  const meta = await sharp(imgPath).metadata();
  const h = Math.round(meta.height * (w / meta.width));
  const resized = await sharp(imgPath).resize(w, h, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="20" ry="20" fill="#fff"/></svg>`);
  return { buf: await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w, h };
}

async function render(card, outPath) {
  const accent = LANE_ACCENT[card.lane] || '#FFFFFF';
  const cardImgPath = path.join(ROOT, card.tile);
  const bgPath = card.visual ? path.join(ROOT, card.visual.file) : null;

  // 1. Background: the visual-hook image (cover), darkened; fallback to brand gradient.
  let bg;
  if (bgPath && fs.existsSync(bgPath)) {
    bg = await sharp(bgPath).resize(W, H, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 0.55, saturation: 1.05 }).blur(1.5).toBuffer();
  } else {
    bg = await sharp(Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="20%" r="100%"><stop offset="0%" stop-color="#18181C"/><stop offset="100%" stop-color="${BRAND.bg}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`)).png().toBuffer();
  }

  // 2. Scrim: stronger overall darken so the card + text POP over the photo.
  const scrim = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.9"/>
      <stop offset="28%" stop-color="#000" stop-opacity="0.62"/>
      <stop offset="60%" stop-color="#000" stop-opacity="0.68"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.94"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    <rect width="${W}" height="${H}" fill="#000" opacity="0.15"/></svg>`;

  // 3. Hook headline — auto-size so it ALWAYS fits fully (never ellipsis / never cut).
  //    Try sizes from big→small until it fits in <=4 lines within the header band.
  const HEADER_TOP = 96, HEADER_MAXH = 340, TEXT_W = 30; // TEXT_W ~ chars/line budget
  let hookLines, hookSize;
  for (hookSize of [70, 64, 58, 52, 46, 42]) {
    const cpl = Math.floor((W - 120) / (hookSize * 0.5));   // rough chars-per-line at this size
    hookLines = wrapFull(card.hook, cpl, 5);                 // wrapFull never adds "…"
    const blockH = hookLines.length * (hookSize + 8);
    if (blockH <= HEADER_MAXH && hookLines.length <= 4) break;
  }
  const hookBottom = HEADER_TOP + hookLines.length * (hookSize + 8);

  // 4. Real product card — scale to FIT its slot (never crop). Slot = between hook and footer.
  const footerTop = H - 150;               // reserve for attribution + wordmark
  const slotTop = hookBottom + 46;         // below hook + accent line
  const slotH = footerTop - slotTop;
  const rc = await fitCard(cardImgPath, 620, slotH);   // fits WITHIN slot, no crop
  const cardY = slotTop + Math.round((slotH - rc.h) / 2);

  const fg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${textBlock(hookLines, { x: 60, y: HEADER_TOP, size: hookSize, lineHeight: hookSize + 8, weight: 800 })}
    <rect x="60" y="${hookBottom + 10}" width="110" height="6" fill="${accent}"/>
    <text x="60" y="${footerTop + 18}" font-family="${BRAND.bodyFont}" font-size="23" fill="#CFCFD4" letter-spacing="1">via ${esc(card.source || 'the feed')} · kept by Threadverse</text>
    <text x="60" y="${H - 50}" font-family="${BRAND.displayFont}" font-size="30" font-weight="800" fill="#FFF" letter-spacing="2">THREADVERSE</text>
    <text x="${W - 60}" y="${H - 50}" font-family="${BRAND.bodyFont}" font-size="26" fill="#B8B8BE" text-anchor="end">threadverse.ai</text>
  </svg>`;

  await sharp(bg).composite([
    { input: Buffer.from(scrim), top: 0, left: 0 },
    { input: rc.buf, top: cardY, left: Math.round((W - rc.w) / 2) },
    { input: Buffer.from(fg), top: 0, left: 0 },
  ]).png().toFile(outPath);
}

// Word-wrap that NEVER truncates (no ellipsis) — used for hooks so full title always shows.
function wrapFull(text, maxChars, maxLines) {
  const words = String(text || '').replace(/…$/, '').split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);   // if it somehow exceeds, the size loop shrinks font first
}

// Scale an image to FIT inside (maxW x maxH) with rounded corners — never crops.
async function fitCard(imgPath, maxW, maxH) {
  const meta = await sharp(imgPath).metadata();
  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const w = Math.max(1, Math.round(meta.width * scale));
  const h = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(imgPath).resize(w, h, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="20" ry="20" fill="#fff"/></svg>`);
  return { buf: await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w, h };
}

(async () => {
  const cards = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
  const sheet = [];
  let made = 0, fail = 0;
  for (const c of cards) {
    const outDir = path.join(ROOT, 'library', '01-content-cards', c.bestPlatform);
    fs.mkdirSync(outDir, { recursive: true });
    const outName = `${c.lane}-${c.slug.slice(0, 10)}-${c.file}`;
    const out = path.join(outDir, outName);
    try {
      await render(c, out);
      made++;
      sheet.push({
        platform: c.bestPlatform, lane: c.lane, topic: c.lane, format: c.format, score: c.score,
        tile: path.relative(ROOT, out), hook: c.hook, caption: c.caption, stance: c.stance || '',
        triggers: c.triggers || [], sourceUrl: c.url || null,
        visualSource: c.visual?.source || null, visualLicense: c.visual?.license || null,
      });
    } catch (e) { fail++; console.log(`  ⚠️ ${outName}: ${e.message}`); }
  }
  fs.writeFileSync(path.join(ROOT, 'library', 'content-niche.json'), JSON.stringify(sheet, null, 2));
  const byP = {}, byL = {};
  sheet.forEach(s => { byP[s.platform] = (byP[s.platform] || 0) + 1; byL[s.lane] = (byL[s.lane] || 0) + 1; });
  console.log(`\n✅ ${made} hook tiles · ${fail} failed → library/01-content-cards/<platform>/`);
  console.log('   platform:', JSON.stringify(byP), '| lane:', JSON.stringify(byL));
})().catch(e => { console.error('❌', e.message); process.exit(1); });
