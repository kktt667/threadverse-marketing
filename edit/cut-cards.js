/**
 * CUT-CARDS / CUT-PAGES for video — full-screen 9:16 (1080x1920) cards you cut into a TikTok/Reel
 * between your own clips. Big, bold, on-brand. Lots of variety.
 *
 * Types → library/07-cut-cards/<type>/
 *   hooks/        openers to start a video (0-2s attention grabbers)
 *   breaks/       section dividers ("meanwhile…", "part 2")
 *   punchlines/   payoff cards to land a joke/point
 *   stats/        big-number reveal cards
 *   transitions/  single-word smash cards ("BEFORE", "AFTER", "wait…")
 *   questions/    engagement bait to end on ("what's YOUR feed?")
 *   cta/          closing call-to-action cards
 *
 *   node edit/cut-cards.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', '07-cut-cards');
const W = 1080, H = 1920;
const dir = (s) => { const d = path.join(OUT, s); fs.mkdirSync(d, { recursive: true }); return d; };

// palette accents used sparingly for punch
const RED = '#E5322D', GREEN = '#42C97A', YEL = '#F4C430';

function bgSolid(color = BRAND.bg) { return `<rect width="${W}" height="${H}" fill="${color}"/>`; }
function bgGrad(c0 = '#1B1B20', cy = '30%') {
  return `<defs><radialGradient id="g" cx="50%" cy="${cy}" r="95%"><stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${BRAND.bg}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;
}
function wordmark(y = H - 90, color = BRAND.fg) {
  return `<text x="60" y="${y}" font-family="${BRAND.displayFont}" font-size="38" font-weight="800" fill="${color}" letter-spacing="3">${BRAND.wordmark}</text>
          <text x="${W - 60}" y="${y}" font-family="${BRAND.bodyFont}" font-size="30" fill="${BRAND.dim}" text-anchor="end">${BRAND.url}</text>`;
}
async function save(type, name, svgInner) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir(type), `${name}.png`));
}
// centered big text block
function centerText(lines, { size, color = BRAND.fg, weight = 800, lh = null, shiftY = 0 }) {
  lh = lh || size + 12;
  const startY = Math.round((H - lines.length * lh) / 2) + size - 30 + shiftY;
  return textBlock(lines, { x: 60, y: startY, size, lineHeight: lh, weight, fill: color });
}

// ── HOOKS (openers) ──────────────────────────────────────────────────────────
const HOOKS = [
  'your feed is 95% noise', 'POV: you deleted 5 apps', 'stop doomscrolling. seriously.',
  'I let an AI read my feed', 'this app fixed my attention span', 'watch it delete the slop',
  '5,000 posts. you see 50.', 'the last feed you\'ll need', 'your algorithm is lying to you',
  'what if your feed was… good?', 'I read 5,000 posts so you don\'t', 'nobody talks about this app',
];
async function hooks() {
  for (let i = 0; i < HOOKS.length; i++) {
    const lines = wrap(HOOKS[i], 15, 4);
    const size = lines.length >= 3 ? 110 : 130;
    await save('hooks', `hook-${String(i + 1).padStart(2, '0')}`,
      `${bgGrad('#201C14', '25%')}${centerText(lines, { size })}
       <text x="60" y="${Math.round(H / 2) + lines.length * (size + 12) / 2 + 60}" font-family="${BRAND.bodyFont}" font-size="34" fill="${BRAND.dim}">keep watching ↓</text>
       ${wordmark()}`);
  }
  console.log(`  🎬 hooks/ (${HOOKS.length})`);
}

// ── BREAKS (section dividers) ────────────────────────────────────────────────
const BREAKS = ['meanwhile, on my feed…', 'but here\'s the thing', 'part 2', 'so I tried this', 'here\'s what happened', 'plot twist', 'now watch this', 'the best part?'];
async function breaks() {
  for (let i = 0; i < BREAKS.length; i++) {
    const lines = wrap(BREAKS[i], 16, 3);
    await save('breaks', `break-${String(i + 1).padStart(2, '0')}`,
      `${bgSolid()}<rect x="0" y="${H / 2 - 4}" width="${W}" height="8" fill="${BRAND.fg}" opacity="0.1"/>
       ${centerText(lines, { size: 96, weight: 800 })}${wordmark()}`);
  }
  console.log(`  🎬 breaks/ (${BREAKS.length})`);
}

// ── PUNCHLINES (payoff) ──────────────────────────────────────────────────────
const PUNCH = ['and that\'s the whole app.', 'zero ads. zero algorithm.', 'it just… works.', 'no notes.', 'the feed was the problem.', 'that\'s it. that\'s the tweet.', 'you\'re welcome.', 'try explaining that to your FYP.'];
async function punchlines() {
  for (let i = 0; i < PUNCH.length; i++) {
    const lines = wrap(PUNCH[i], 16, 3);
    await save('punchlines', `punch-${String(i + 1).padStart(2, '0')}`,
      `${bgGrad('#14201A', '70%')}${centerText(lines, { size: 100, color: GREEN, weight: 800 })}${wordmark()}`);
  }
  console.log(`  🎬 punchlines/ (${PUNCH.length})`);
}

// ── STATS (big number reveals) ───────────────────────────────────────────────
const STATS = [
  ['5,000', 'posts read every day'], ['50', 'worth your time'], ['~95%', 'thrown out as noise'],
  ['5', 'platforms, one feed'], ['0', 'ads. 0 algorithm.'], ['£25', 'less than ChatGPT + X Premium'],
  ['3 hrs', '→ 30 seconds'], ['1', 'feed to rule them all'],
];
async function stats() {
  for (let i = 0; i < STATS.length; i++) {
    const [big, sub] = STATS[i];
    const subL = wrap(sub, 20, 3);
    await save('stats', `stat-${String(i + 1).padStart(2, '0')}`,
      `${bgGrad()}
       <text x="${W / 2}" y="${H / 2 - 40}" font-family="${BRAND.displayFont}" font-size="300" font-weight="800" fill="${BRAND.fg}" text-anchor="middle">${esc(big)}</text>
       ${subL.map((l, j) => `<text x="${W / 2}" y="${H / 2 + 100 + j * 60}" font-family="${BRAND.bodyFont}" font-size="50" fill="${BRAND.dim}" text-anchor="middle">${esc(l)}</text>`).join('')}
       ${wordmark()}`);
  }
  console.log(`  🎬 stats/ (${STATS.length})`);
}

// ── TRANSITIONS (single smash words) ─────────────────────────────────────────
const TRANS = [
  { t: 'BEFORE', c: RED }, { t: 'AFTER', c: GREEN }, { t: 'wait…', c: BRAND.fg }, { t: 'watch', c: BRAND.fg },
  { t: 'noise', c: RED }, { t: 'signal', c: GREEN }, { t: 'vs', c: YEL }, { t: 'nope.', c: RED }, { t: 'this.', c: GREEN },
  { t: 'IS', c: GREEN }, { t: 'now', c: BRAND.fg }, { t: 'gone.', c: RED }, { t: 'yep.', c: GREEN },
];
async function transitions() {
  for (let i = 0; i < TRANS.length; i++) {
    const { t, c } = TRANS[i];
    await save('transitions', `trans-${t.replace(/[^a-z0-9]/gi, '') || i}`,
      `${bgSolid()}<text x="${W / 2}" y="${H / 2 + 60}" font-family="${BRAND.displayFont}" font-size="200" font-weight="800" fill="${c}" text-anchor="middle" letter-spacing="4">${esc(t.toUpperCase())}</text>`);
  }
  console.log(`  🎬 transitions/ (${TRANS.length})`);
}

// ── QUESTIONS (engagement bait) ──────────────────────────────────────────────
const Q = ['what would YOUR feed be?', 'what app fixed your brain?', 'be honest — how bad is your FYP?', 'would you use this?', 'what should I search next?', 'tag someone who needs this'];
async function questions() {
  for (let i = 0; i < Q.length; i++) {
    const lines = wrap(Q[i], 16, 3);
    await save('questions', `q-${String(i + 1).padStart(2, '0')}`,
      `${bgGrad('#1C1622', '30%')}
       <text x="60" y="360" font-family="${BRAND.displayFont}" font-size="80" fill="#33333A" font-weight="800">?</text>
       ${centerText(lines, { size: 92 })}
       <text x="60" y="${Math.round(H / 2) + lines.length * 52 + 120}" font-family="${BRAND.bodyFont}" font-size="38" fill="${BRAND.dim}">comment below 👇</text>
       ${wordmark()}`);
  }
  console.log(`  🎬 questions/ (${Q.length})`);
}

// ── CTA (closers) ────────────────────────────────────────────────────────────
const CTA = [
  ['Build your', 'free feed.'], ['One feed.', 'Every platform.', 'Zero noise.'], ['Stop scrolling', 'five apps.'],
  ['Try it free.', 'No card.'], ['Link in bio.', 'threadverse.ai'],
];
async function cta() {
  for (let i = 0; i < CTA.length; i++) {
    const lines = CTA[i];
    const size = lines.length >= 3 ? 120 : 140;
    await save('cta', `cta-${String(i + 1).padStart(2, '0')}`,
      `${bgGrad('#1B1B20', '35%')}${centerText(lines, { size, shiftY: -40 })}
       <text x="60" y="${Math.round(H / 2) + lines.length * (size + 12) / 2 + 30}" font-family="${BRAND.bodyFont}" font-size="44" fill="${BRAND.fg}">threadverse.ai · free to start</text>
       ${wordmark()}`);
  }
  console.log(`  🎬 cta/ (${CTA.length})`);
}

(async () => {
  await hooks(); await breaks(); await punchlines(); await stats();
  await transitions(); await questions(); await cta();
  const total = fs.readdirSync(OUT).reduce((a, d) => a + fs.readdirSync(path.join(OUT, d)).filter(f => f.endsWith('.png')).length, 0);
  console.log(`\n✅ ${total} cut-cards → library/07-cut-cards/`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
