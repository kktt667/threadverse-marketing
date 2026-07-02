/**
 * Video overlay assets for CapCut / TikTok / Reels — TRANSPARENT PNGs you drop ON TOP of clips,
 * plus solid end-cards. All 1080x1920 (9:16).
 *
 * Output → library/05-video-assets/
 *   end-cards/       solid branded outro frames (CTA)
 *   hook-overlays/   big transparent hook text (top-third safe zone) to start a video
 *   lower-thirds/    transparent caption bars for mid-video context
 *   progress-labels/ transparent "1/5", "wait for it", "the filter" style stingers
 *
 *   node edit/video-overlays.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', '05-video-assets');
const W = 1080, H = 1920;
const dir = (s) => { const d = path.join(OUT, s); fs.mkdirSync(d, { recursive: true }); return d; };

// transparent PNG from an SVG
async function transparent(svgInner, out) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
}

// ---- END CARDS (solid) ----
async function endCards() {
  const d = dir('end-cards');
  const cards = [
    { big: ['Build your', 'free feed.'], sub: 'threadverse.ai · no credit card' },
    { big: ['One feed.', 'Every platform.', 'Zero noise.'], sub: 'threadverse.ai' },
    { big: ['Stop scrolling', 'five apps.'], sub: 'Try Threadverse free → threadverse.ai' },
  ];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const size = c.big.length >= 3 ? 120 : 140;
    const startY = Math.round((H - c.big.length * (size + 8)) / 2);
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g" cx="50%" cy="35%" r="90%"><stop offset="0%" stop-color="#1A1A1F"/><stop offset="100%" stop-color="${BRAND.bg}"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      ${textBlock(c.big, { x: 70, y: startY, size, lineHeight: size + 8, weight: 800 })}
      <text x="70" y="${startY + c.big.length * (size + 8) + 60}" font-family="${BRAND.bodyFont}" font-size="40" fill="${BRAND.dim}">${esc(c.sub)}</text>
      <text x="70" y="${H - 90}" font-family="${BRAND.displayFont}" font-size="40" font-weight="800" fill="${BRAND.fg}" letter-spacing="3">${BRAND.wordmark}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(d, `end-${i + 1}.png`));
  }
  console.log('  🎬 end-cards/ (3)');
}

// ---- HOOK OVERLAYS (transparent, top third) ----
async function hookOverlays() {
  const d = dir('hook-overlays');
  const hooks = [
    'POV: you deleted 5 apps',
    'this is 5,000 posts',
    'wait for the filter…',
    'your feed is 95% noise',
    'I let an AI read my feed',
    'the app that saved my attention span',
  ];
  for (let i = 0; i < hooks.length; i++) {
    const lines = wrap(hooks[i], 18, 3);
    const size = 90;
    // dark scrim behind text for legibility on any clip
    const scrimH = 120 + lines.length * (size + 10);
    const inner = `
      <rect x="0" y="120" width="${W}" height="${scrimH}" fill="#000" opacity="0.35"/>
      ${textBlock(lines, { x: 60, y: 240, size, lineHeight: size + 10, weight: 800 })}`;
    await transparent(inner, path.join(d, `hook-${i + 1}.png`));
  }
  console.log('  🎬 hook-overlays/ (transparent, ' + hooks.length + ')');
}

// ---- LOWER THIRDS (transparent, bottom) ----
async function lowerThirds() {
  const d = dir('lower-thirds');
  const bars = [
    'via Threadverse — it read 5,000 posts today',
    'no algorithm. you described this feed.',
    'found this before the timeline did',
    'free to start · threadverse.ai',
  ];
  for (let i = 0; i < bars.length; i++) {
    const lines = wrap(bars[i], 30, 2);
    const y = H - 360;
    const inner = `
      <rect x="40" y="${y - 20}" width="${W - 80}" height="${40 + lines.length * 56}" rx="20" fill="#0A0A0B" opacity="0.82"/>
      ${textBlock(lines, { x: 70, y: y + 40, size: 40, lineHeight: 52, weight: 600, fill: BRAND.fg, font: BRAND.bodyFont })}`;
    await transparent(inner, path.join(d, `lower-${i + 1}.png`));
  }
  console.log('  🎬 lower-thirds/ (transparent, ' + bars.length + ')');
}

// ---- PROGRESS LABELS (transparent stingers) ----
async function progressLabels() {
  const d = dir('progress-labels');
  const labels = ['1/5', '2/5', '3/5', '4/5', '5/5', 'BEFORE', 'AFTER', 'wait for it', 'the filter', 'kept ✓', 'rejected ✕'];
  for (const l of labels) {
    const inner = `<rect x="60" y="150" width="${Math.min(120 + l.length * 46, 700)}" height="110" rx="24" fill="${BRAND.fg}"/>
      <text x="100" y="228" font-family="${BRAND.displayFont}" font-size="70" font-weight="800" fill="#0A0A0B">${esc(l)}</text>`;
    await transparent(inner, path.join(d, `label-${l.replace(/[^a-z0-9]/gi, '_')}.png`));
  }
  console.log('  🎬 progress-labels/ (transparent, ' + labels.length + ')');
}

(async () => {
  await endCards();
  await hookOverlays();
  await lowerThirds();
  await progressLabels();
  console.log('\n✅ video overlays → library/05-video-assets/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
