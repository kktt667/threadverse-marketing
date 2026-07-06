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

  // 2. Scrim: top+bottom darken so hook + footer read; center a touch lighter to show the image.
  const scrim = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.8"/>
      <stop offset="30%" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
    </linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/></svg>`;

  // 3. Hook headline (top).
  const hookLines = wrap(card.hook, 24, 3);
  const hookSize = hookLines.length >= 3 ? 56 : 64;

  // 4. Real product card (center-lower, as proof).
  const rc = await roundedCard(cardImgPath, 560);
  const maxCardH = 470;
  const cardBuf = rc.h > maxCardH ? await sharp(rc.buf).extract({ left: 0, top: 0, width: rc.w, height: maxCardH }).png().toBuffer() : rc.buf;
  const cardH = Math.min(rc.h, maxCardH);
  const cardY = H - cardH - 150;

  const fg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${textBlock(hookLines, { x: 60, y: 120, size: hookSize, lineHeight: hookSize + 8, weight: 800 })}
    <rect x="60" y="${120 + hookLines.length * (hookSize + 8) + 6}" width="120" height="6" fill="${accent}"/>
    <text x="60" y="${cardY - 24}" font-family="${BRAND.bodyFont}" font-size="24" fill="#D8D8DC" letter-spacing="1">via ${esc(card.source || 'the feed')} · kept by Threadverse</text>
    <text x="60" y="${H - 54}" font-family="${BRAND.displayFont}" font-size="30" font-weight="800" fill="#FFF" letter-spacing="2">THREADVERSE</text>
    <text x="${W - 60}" y="${H - 54}" font-family="${BRAND.bodyFont}" font-size="26" fill="#B8B8BE" text-anchor="end">threadverse.ai</text>
  </svg>`;

  await sharp(bg).composite([
    { input: Buffer.from(scrim), top: 0, left: 0 },
    { input: cardBuf, top: cardY, left: Math.round((W - rc.w) / 2) },
    { input: Buffer.from(fg), top: 0, left: 0 },
  ]).png().toFile(outPath);
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
