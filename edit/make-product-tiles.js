/**
 * Build product/brand content tiles (not post-cards):
 *   - describe-your-feed : the magic moment — a plain-English prompt → curated result
 *   - data/stat          : proof-by-numbers ("read 5,000, kept 50", "rejected 53 / kept 30")
 *   - hero/manifesto     : the positioning lines as bold brand tiles
 *   - before/after       : noise-wall → clean-feed (uses a captured before/after pair if present)
 *
 * Output: library/edited/_product/*.png  (1080x1080)
 *   node edit/make-product-tiles.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', 'edited', '_product');
fs.mkdirSync(OUT, { recursive: true });
const W = 1080, H = 1080;

function footer(y) {
  return `<text x="64" y="${y}" font-family="${BRAND.displayFont}" font-size="32" font-weight="800" fill="${BRAND.fg}" letter-spacing="2">${BRAND.wordmark}</text>
          <text x="${W - 64}" y="${y}" font-family="${BRAND.bodyFont}" font-size="28" font-weight="600" fill="${BRAND.dim}" text-anchor="end">${BRAND.url}</text>`;
}
const bg = `<defs><radialGradient id="g" cx="50%" cy="18%" r="100%"><stop offset="0%" stop-color="#18181B"/><stop offset="100%" stop-color="${BRAND.bg}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;

async function svgTile(name, inner) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${bg}${inner}${footer(H - 60)}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`));
  console.log(`  🎨 ${name}.png`);
}

// 1) DESCRIBE-YOUR-FEED — the magic moment, several prompt variants
const PROMPTS = [
  { prompt: 'what are YC founders actually building right now', sub: '→ 30 posts. 0 noise. 5 platforms.' },
  { prompt: 'best indie games released this month', sub: '→ curated in seconds, not 3 hours of scrolling' },
  { prompt: 'only the AI news that actually matters today', sub: '→ it read 5,000 posts. you read the 50 that count.' },
  { prompt: 'wildlife photography that makes me feel something', sub: '→ no rage-bait. no ads. just the good stuff.' },
];
async function describeTiles() {
  for (let i = 0; i < PROMPTS.length; i++) {
    const p = PROMPTS[i];
    const lines = wrap(`"${p.prompt}"`, 24, 4);
    const inner = `
      <text x="64" y="150" font-family="${BRAND.bodyFont}" font-size="30" fill="${BRAND.dim}" letter-spacing="3">YOU TYPE</text>
      ${textBlock(lines, { x: 64, y: 250, size: 70, lineHeight: 82, weight: 800 })}
      <text x="64" y="${250 + lines.length * 82 + 90}" font-family="${BRAND.bodyFont}" font-size="36" fill="${BRAND.fg}" font-weight="600">${esc(p.sub)}</text>
      <text x="64" y="${250 + lines.length * 82 + 150}" font-family="${BRAND.bodyFont}" font-size="28" fill="${BRAND.dim}">Describe your feed in plain English. Threadverse does the rest.</text>`;
    await svgTile(`describe-${String(i + 1).padStart(2, '0')}`, inner);
  }
}

// 2) DATA / STAT tiles
const STATS = [
  { big: '5,000 → 50', small: 'We read 5,000 posts a day so you see the 50 worth your time.' },
  { big: '~95%', small: 'of every feed is noise. Threadverse throws it out before you ever scroll it.' },
  { big: '5', small: 'platforms. One feed. Hacker News · X · YouTube · Bluesky · Mastodon.' },
  { big: '0', small: 'algorithm. 0 ads. 0 rage-bait. You describe it, you own it.' },
  { big: '3 hrs → 30s', small: 'Catching up used to take all morning across five apps. Now it doesn\'t.' },
];
async function statTiles() {
  for (let i = 0; i < STATS.length; i++) {
    const s = STATS[i];
    const small = wrap(s.small, 30, 4);
    const inner = `
      <text x="64" y="440" font-family="${BRAND.displayFont}" font-size="170" font-weight="800" fill="${BRAND.fg}" letter-spacing="1">${esc(s.big)}</text>
      ${textBlock(small, { x: 64, y: 560, size: 40, lineHeight: 52, weight: 500, fill: BRAND.dim, font: BRAND.bodyFont })}`;
    await svgTile(`stat-${String(i + 1).padStart(2, '0')}`, inner);
  }
}

// 3) HERO / MANIFESTO tiles
const HEROES = [
  ['One feed.', 'Every platform.', 'Zero noise.'],
  ['Your feed is', '95% noise.', "Here's the 5%."],
  ['Stop scrolling', 'five apps.'],
  ['No algorithm.', 'You\'re in control,', 'not the feed.'],
];
async function heroTiles() {
  for (let i = 0; i < HEROES.length; i++) {
    const lines = HEROES[i];
    const size = lines.length >= 3 ? 110 : 130;
    const startY = Math.round((H - lines.length * (size + 6)) / 2) + size - 30;
    const inner = `${textBlock(lines, { x: 64, y: startY, size, lineHeight: size + 6, weight: 800 })}
      <text x="64" y="${startY + lines.length * (size + 6) + 30}" font-family="${BRAND.bodyFont}" font-size="32" fill="${BRAND.dim}">threadverse.ai · free to start, no card</text>`;
    await svgTile(`hero-${String(i + 1).padStart(2, '0')}`, inner);
  }
}

// 4) BEFORE/AFTER — if a captured before/after pair exists in library, compose a split tile.
async function beforeAfterTiles() {
  // Look for any feed snaps that include a 'before.png'/'after.png' (from capture/capture.js).
  const rawRoot = path.join(ROOT, 'assets', 'raw');
  let pair = null;
  if (fs.existsSync(rawRoot)) {
    for (const date of fs.readdirSync(rawRoot)) {
      const dd = path.join(rawRoot, date);
      if (!fs.statSync(dd).isDirectory()) continue;
      for (const feed of fs.readdirSync(dd)) {
        const b = path.join(dd, feed, 'before.png'), a = path.join(dd, feed, 'after.png');
        if (fs.existsSync(b) && fs.existsSync(a)) { pair = { b, a, feed }; break; }
      }
      if (pair) break;
    }
  }
  if (!pair) { console.log('  · before/after: no captured pair yet (run capture/capture.js --refresh) — skipped'); return; }
  // Side-by-side on a 1080 square with labels.
  const half = 470, top = 230, h = 620;
  const bImg = await sharp(pair.b).resize(half, h, { fit: 'cover', position: 'top' }).toBuffer();
  const aImg = await sharp(pair.a).resize(half, h, { fit: 'cover', position: 'top' }).toBuffer();
  const inner = `
    <text x="64" y="120" font-family="${BRAND.displayFont}" font-size="72" font-weight="800" fill="${BRAND.fg}">FEED vs THREADVERSE</text>
    <text x="${64 + half/2}" y="${top - 20}" font-family="${BRAND.bodyFont}" font-size="34" fill="#FF6B6B" text-anchor="middle" font-weight="700">BEFORE</text>
    <text x="${W - 64 - half/2}" y="${top - 20}" font-family="${BRAND.bodyFont}" font-size="34" fill="#6BCB77" text-anchor="middle" font-weight="700">AFTER</text>`;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${bg}${inner}${footer(H - 60)}</svg>`;
  await sharp(Buffer.from(svg))
    .composite([
      { input: bImg, top, left: 64 },
      { input: aImg, top, left: W - 64 - half },
    ]).png().toFile(path.join(OUT, 'before-after.png'));
  console.log('  🎨 before-after.png');
}

(async () => {
  await describeTiles();
  await statTiles();
  await heroTiles();
  await beforeAfterTiles();
  console.log(`\n✅ product tiles → library/edited/_product/`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
