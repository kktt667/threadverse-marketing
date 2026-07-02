/**
 * VISUAL product content cards — the product IS the hero, not text on black.
 * Many distinct formats, each engineered around a viral tactic. Output 1080x1080 (feed)
 * and 1080x1920 (story) where it makes sense.
 *
 * Formats:
 *   phone-hero      : a real feed inside a phone frame + a bold hook   (awe / social currency)
 *   split-compare   : BEFORE (noise) | AFTER (signal), device-framed   (emotional contrast)
 *   prompt-to-feed  : "you type X" chat bubble → real curated result   (novelty / the magic)
 *   floating-cards  : real post cards scattered on a gradient + hook    (delight / browse-y)
 *   stat-on-feed    : big number sitting over a dimmed real feed        (social currency)
 *   platform-web    : the 5 platform logos → one feed                   (identity / "all my apps")
 *   ranked-list     : "top 3 my feed caught today" mini-leaderboard     (participation)
 *
 * Output: library/02-product-cards/<format>/*.png
 *   node edit/product-visual.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', '02-product-cards');

function outdir(fmt) { const d = path.join(OUT, fmt); fs.mkdirSync(d, { recursive: true }); return d; }
const W = 1080, H = 1080, HV = 1920;

// ---- shared building blocks -------------------------------------------------
function gradientBG(w, h, cx = '50%', cy = '15%') {
  return `<defs>
    <radialGradient id="g" cx="${cx}" cy="${cy}" r="110%">
      <stop offset="0%" stop-color="#1B1B20"/><stop offset="60%" stop-color="#0E0E10"/><stop offset="100%" stop-color="${BRAND.bg}"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
    </linearGradient>
  </defs><rect width="${w}" height="${h}" fill="url(#g)"/>`;
}
function footer(w, y) {
  return `<text x="60" y="${y}" font-family="${BRAND.displayFont}" font-size="30" font-weight="800" fill="${BRAND.fg}" letter-spacing="2">${BRAND.wordmark}</text>
          <text x="${w - 60}" y="${y}" font-family="${BRAND.bodyFont}" font-size="26" font-weight="600" fill="${BRAND.dim}" text-anchor="end">${BRAND.url}</text>`;
}

// Wrap a screenshot in a rounded "phone" frame (bezel + rounded screen).
async function phoneFrame(imgPath, screenW, screenH) {
  const bezel = 18, radius = 60;
  const fw = screenW + bezel * 2, fh = screenH + bezel * 2;
  const screen = await sharp(imgPath).resize(screenW, screenH, { fit: 'cover', position: 'top' }).ensureAlpha().png().toBuffer();
  const screenMask = Buffer.from(`<svg width="${screenW}" height="${screenH}"><rect width="${screenW}" height="${screenH}" rx="${radius - 8}" ry="${radius - 8}" fill="#fff"/></svg>`);
  const roundedScreen = await sharp(screen).composite([{ input: screenMask, blend: 'dest-in' }]).png().toBuffer();
  const body = Buffer.from(`<svg width="${fw}" height="${fh}"><rect width="${fw}" height="${fh}" rx="${radius}" ry="${radius}" fill="#000"/><rect x="1" y="1" width="${fw - 2}" height="${fh - 2}" rx="${radius - 1}" ry="${radius - 1}" fill="none" stroke="#2E2E34" stroke-width="2"/></svg>`);
  const frame = await sharp(body).composite([{ input: roundedScreen, top: bezel, left: bezel }]).png().toBuffer();
  return { buf: frame, fw, fh };
}

// Pull a rounded real post card image (from raw snaps) for decorative use.
async function roundedCard(imgPath, w) {
  const meta = await sharp(imgPath).metadata();
  const h = Math.round(meta.height * (w / meta.width));
  const resized = await sharp(imgPath).resize(w, h, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="20" ry="20" fill="#fff"/></svg>`);
  return { buf: await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w, h };
}

function firstMobileFeed(prefer) {
  const rawRoot = path.join(ROOT, 'assets', 'raw');
  const hits = [];
  if (fs.existsSync(rawRoot)) for (const d of fs.readdirSync(rawRoot)) {
    const dd = path.join(rawRoot, d); if (!fs.statSync(dd).isDirectory()) continue;
    for (const f of fs.readdirSync(dd)) {
      const p = path.join(dd, f, 'mobile-after.png');
      if (fs.existsSync(p)) hits.push({ p, feed: f });
      const pb = path.join(dd, f, 'mobile-before.png');
      if (fs.existsSync(pb)) hits.push({ p: pb, feed: f, before: true });
    }
  }
  const after = hits.filter(h => !h.before);
  return (prefer && after.find(h => h.feed.includes(prefer))) || after[0] || hits[0] || null;
}
function beforeAfterPair() {
  const rawRoot = path.join(ROOT, 'assets', 'raw');
  if (fs.existsSync(rawRoot)) for (const d of fs.readdirSync(rawRoot)) {
    const dd = path.join(rawRoot, d); if (!fs.statSync(dd).isDirectory()) continue;
    for (const f of fs.readdirSync(dd)) {
      const b = path.join(dd, f, 'before.png'), a = path.join(dd, f, 'after.png');
      if (fs.existsSync(b) && fs.existsSync(a)) return { b, a, feed: f };
    }
  }
  return null;
}
function rawCards(topicSlug, n) {
  const dir = path.join(ROOT, 'library', '03-raw-snaps', topicSlug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^card-\d+\.png$/.test(f)).slice(0, n).map(f => path.join(dir, f));
}

// ============================================================================
// FORMAT 1 — phone-hero: a real feed inside a phone + bold hook. (awe)
// ============================================================================
async function phoneHero() {
  const dir = outdir('phone-hero');
  const feed = firstMobileFeed();
  if (!feed) { console.log('  · phone-hero: no mobile feed capture'); return; }
  const HOOKS = [
    { t: ['This is', 'your feed', 'on Threadverse.'], s: 'No ads. No rage-bait.' },
    { t: ['5,000 read.', '50 shown.'], s: 'Every morning. Automatically.' },
    { t: ['I deleted', 'four apps', 'for this.'], s: 'One feed. Zero noise.' },
  ];
  const { buf, fw, fh } = await phoneFrame(feed.p, 620, 1240);   // scaled below
  for (let i = 0; i < HOOKS.length; i++) {
    const hk = HOOKS[i];
    const targetH = 900; const scale = targetH / fh; const pw = Math.round(fw * scale), ph = targetH;
    const phone = await sharp(buf).resize(pw, ph).png().toBuffer();
    const px = W - pw - 30, py = Math.round((H - ph) / 2) + 10;
    // Text column must stay left of the phone; wrap to fit that width.
    const colRight = px - 30;                 // right edge available for text
    const size = 74, lh = 82;
    const lines = hk.t;
    const startY = Math.round((H - lines.length * lh) / 2) + size - 20;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${gradientBG(W, H, '30%', '30%')}
      ${textBlock(lines, { x: 56, y: startY, size, lineHeight: lh, weight: 800 })}
      <text x="56" y="${startY + lines.length * lh + 30}" font-family="${BRAND.bodyFont}" font-size="30" fill="${BRAND.dim}">${esc(hk.s)}</text>
      ${footer(W, H - 54)}</svg>`;
    await sharp(Buffer.from(svg)).composite([{ input: phone, top: py, left: px }]).png().toFile(path.join(dir, `phone-hero-${i + 1}.png`));
    console.log(`  🎨 phone-hero/phone-hero-${i + 1}.png`);
  }
}

// ============================================================================
// FORMAT 2 — split-compare: BEFORE|AFTER device columns. (emotional contrast)
// ============================================================================
async function splitCompare() {
  const dir = outdir('split-compare');
  const pair = beforeAfterPair();
  if (!pair) { console.log('  · split-compare: no before/after pair'); return; }
  const colW = 468, colH = 720, top = 250;
  const b = await roundedCardFixed(pair.b, colW, colH);
  const a = await roundedCardFixed(pair.a, colW, colH);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${gradientBG(W, H)}
    <text x="60" y="130" font-family="${BRAND.displayFont}" font-size="66" font-weight="800" fill="${BRAND.fg}">SAME MORNING. TWO FEEDS.</text>
    <text x="${60 + colW/2}" y="${top - 24}" font-family="${BRAND.bodyFont}" font-size="34" fill="#FF6B6B" text-anchor="middle" font-weight="700">WITHOUT</text>
    <text x="${W - 60 - colW/2}" y="${top - 24}" font-family="${BRAND.bodyFont}" font-size="34" fill="#6BCB77" text-anchor="middle" font-weight="700">WITH THREADVERSE</text>
    <text x="60" y="${top + colH + 70}" font-family="${BRAND.bodyFont}" font-size="30" fill="${BRAND.dim}">It threw out the noise on the left so you only see the right.</text>
    ${footer(W, H - 54)}</svg>`;
  await sharp(Buffer.from(svg)).composite([{ input: b.buf, top, left: 60 }, { input: a.buf, top, left: W - 60 - colW }]).png().toFile(path.join(dir, 'split-compare-1.png'));
  console.log('  🎨 split-compare/split-compare-1.png');
}
async function roundedCardFixed(imgPath, w, h) {
  const resized = await sharp(imgPath).resize(w, h, { fit: 'cover', position: 'top' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="24" ry="24" fill="#fff"/></svg>`);
  return { buf: await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), w, h };
}

// ============================================================================
// FORMAT 3 — prompt-to-feed: a chat bubble prompt → real curated card. (novelty/magic)
// ============================================================================
async function promptToFeed() {
  const dir = outdir('prompt-to-feed');
  const combos = [
    { slug: 'wildlife-wonders', prompt: 'wildlife that makes me gasp', card: 'card-01.png' },
    { slug: 'the-funniest-single-replies-and-cursed-c', prompt: 'make me laugh, no politics', card: 'card-04.png' },
    { slug: '1-ai-model-releases-breakthroughs-pro', prompt: 'only AI news that actually matters', card: 'card-01.png' },
  ];
  for (let i = 0; i < combos.length; i++) {
    const c = combos[i];
    const cardPath = path.join(ROOT, 'library', '03-raw-snaps', c.slug, c.card);
    if (!fs.existsSync(cardPath)) continue;
    const promptLines = wrap(`"${c.prompt}"`, 26, 2);
    const bubbleH = 60 + promptLines.length * 56;
    const cardY = 120 + bubbleH + 110;
    const footerY = H - 130;                    // keep card above footer + caption
    const rc = await roundedCard(cardPath, 640);
    // Crop the card if it would run past the available space.
    const avail = footerY - cardY;
    const cardBuf = rc.h > avail ? await sharp(rc.buf).extract({ left: 0, top: 0, width: rc.w, height: Math.max(200, avail) }).png().toBuffer() : rc.buf;
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${gradientBG(W, H)}
      <text x="60" y="90" font-family="${BRAND.bodyFont}" font-size="26" fill="${BRAND.dim}" letter-spacing="3">YOU TYPE</text>
      <rect x="56" y="110" width="${W - 340}" height="${bubbleH}" rx="28" fill="#F2F2F4"/>
      ${textBlock(promptLines, { x: 90, y: 175, size: 44, lineHeight: 56, weight: 700, fill: '#0A0A0B', font: BRAND.bodyFont })}
      <text x="60" y="${110 + bubbleH + 62}" font-family="${BRAND.bodyFont}" font-size="26" fill="${BRAND.dim}" letter-spacing="3">THREADVERSE RETURNS ↓</text>
      ${footer(W, H - 54)}</svg>`;
    await sharp(Buffer.from(svg)).composite([{ input: cardBuf, top: cardY, left: Math.round((W - rc.w) / 2) }]).png().toFile(path.join(dir, `prompt-to-feed-${i + 1}.png`));
    console.log(`  🎨 prompt-to-feed/prompt-to-feed-${i + 1}.png`);
  }
}

// ============================================================================
// FORMAT 4 — floating-cards: real cards scattered on gradient + hook. (delight)
// ============================================================================
async function floatingCards() {
  const dir = outdir('floating-cards');
  const picks = [
    ...rawCards('wildlife-wonders', 2),
    ...rawCards('the-funniest-single-replies-and-cursed-c', 2),
    ...rawCards('genuinely-wholesome-and-uplifting-posts', 2),
  ].slice(0, 5);
  if (picks.length < 3) { console.log('  · floating-cards: not enough raw cards'); return; }
  const comps = [];
  const spots = [ { x: 40, y: 300, w: 360 }, { x: 430, y: 250, w: 330 }, { x: 720, y: 330, w: 320 }, { x: 150, y: 640, w: 340 }, { x: 560, y: 680, w: 340 } ];
  for (let i = 0; i < picks.length; i++) {
    const rc = await roundedCard(picks[i], spots[i].w);
    const cap = Math.min(rc.h, 380);
    const cropped = await sharp(rc.buf).extract({ left: 0, top: 0, width: rc.w, height: cap }).png().toBuffer();
    comps.push({ input: cropped, top: spots[i].y, left: spots[i].x });
  }
  // background gradient first, then cards, then text/footer on top — single pass.
  const bgBuf = await sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${gradientBG(W, H)}</svg>`)).png().toBuffer();
  const textSVG = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="260" fill="#0A0A0B" opacity="0.55"/>
    <text x="60" y="150" font-family="${BRAND.displayFont}" font-size="76" font-weight="800" fill="${BRAND.fg}">50 good posts.</text>
    <text x="60" y="230" font-family="${BRAND.displayFont}" font-size="76" font-weight="800" fill="${BRAND.fg}">0 doomscroll.</text>
    ${footer(W, H - 54)}</svg>`;
  await sharp(bgBuf)
    .composite([...comps, { input: Buffer.from(textSVG), top: 0, left: 0 }])
    .png().toFile(path.join(dir, 'floating-cards-1.png'));
  console.log('  🎨 floating-cards/floating-cards-1.png');
}

// ============================================================================
// FORMAT 5 — stat-on-feed: big number over a dimmed real feed. (social currency)
// ============================================================================
async function statOnFeed() {
  const dir = outdir('stat-on-feed');
  const feed = firstMobileFeed();
  if (!feed) { console.log('  · stat-on-feed: no mobile feed'); return; }
  const STATS = [
    { big: '94%', sub: 'of what your feed shows you is noise.' },
    { big: '5,000', sub: 'posts read for you. every single day.' },
    { big: '5 apps', sub: 'in one feed. HN · X · YT · Bluesky · Mastodon.' },
  ];
  const bg = await sharp(feed.p).resize(W, H, { fit: 'cover', position: 'top' }).modulate({ brightness: 0.4 }).blur(2).toBuffer();
  for (let i = 0; i < STATS.length; i++) {
    const s = STATS[i];
    const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#000" opacity="0.45"/>
      <text x="${W/2}" y="${H/2 - 20}" font-family="${BRAND.displayFont}" font-size="240" font-weight="800" fill="${BRAND.fg}" text-anchor="middle">${esc(s.big)}</text>
      <text x="${W/2}" y="${H/2 + 90}" font-family="${BRAND.bodyFont}" font-size="42" fill="#E5E5E7" text-anchor="middle">${esc(s.sub)}</text>
      ${footer(W, H - 54)}</svg>`;
    await sharp(bg).composite([{ input: Buffer.from(overlay) }]).png().toFile(path.join(dir, `stat-on-feed-${i + 1}.png`));
    console.log(`  🎨 stat-on-feed/stat-on-feed-${i + 1}.png`);
  }
}

// ============================================================================
// FORMAT 6 — platform-web: 5 sources funnel into one feed. (identity)
// ============================================================================
async function platformWeb() {
  const dir = outdir('platform-web');
  const feed = firstMobileFeed();
  const names = ['HACKER NEWS', 'X', 'YOUTUBE', 'BLUESKY', 'MASTODON'];
  const chips = names.map((n, i) => {
    const y = 250 + i * 110;
    return `<rect x="60" y="${y}" width="360" height="76" rx="38" fill="#151518" stroke="#2A2A2E"/>
            <text x="240" y="${y + 50}" font-family="${BRAND.bodyFont}" font-size="34" fill="${BRAND.fg}" text-anchor="middle" font-weight="600">${n}</text>
            <path d="M420 ${y + 38} L640 540" stroke="#2A2A2E" stroke-width="2" fill="none"/>`;
  }).join('');
  let comp = [];
  if (feed) { const { buf, fw, fh } = await phoneFrame(feed.p, 520, 1040); const sc = 620 / fh; const p = await sharp(buf).resize(Math.round(fw * sc), 620).png().toBuffer(); comp = [{ input: p, top: 250, left: 660 }]; }
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${gradientBG(W, H)}
    <text x="60" y="150" font-family="${BRAND.displayFont}" font-size="70" font-weight="800" fill="${BRAND.fg}">Five feeds.</text>
    <text x="60" y="225" font-family="${BRAND.displayFont}" font-size="70" font-weight="800" fill="${BRAND.fg}">One place.</text>
    ${chips}
    ${footer(W, H - 54)}</svg>`;
  await sharp(Buffer.from(svg)).composite(comp).png().toFile(path.join(dir, 'platform-web-1.png'));
  console.log('  🎨 platform-web/platform-web-1.png');
}

(async () => {
  console.log('Building VISUAL product cards…');
  await phoneHero();
  await splitCompare();
  await promptToFeed();
  await floatingCards();
  await statOnFeed();
  await platformWeb();
  console.log('\n✅ visual product cards → library/02-product-cards/<format>/');
})().catch(e => { console.error('❌', e.message, e.stack); process.exit(1); });
