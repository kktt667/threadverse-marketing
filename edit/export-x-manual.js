/**
 * Export all X content for MANUAL posting into a self-contained folder outside the library.
 *  - copies each X tile → x-manual/images/<NN>-<name>.png (numbered in posting order)
 *  - applies X hashtag rules (1-2 tags, no threadverse.ai link cost concern — you post by hand)
 *  - prioritizes time-sensitive (tabloid/drama/viral) first, then evergreen
 *  - assigns N/day and writes x-manual/X_SCHEDULE.md (per-day, paste-ready) + x-posts.json
 *
 *   node edit/export-x-manual.js --per-day 4 --start 2026-07-03
 */
const fs = require('fs');
const path = require('path');
const { withHashtags } = require('../autopost/hashtags');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'x-manual');
const IMG = path.join(OUT, 'images');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };
const PER_DAY = +(arg('per-day', 4));
const START = arg('start', '2026-07-03');
// Posting times to schedule each day's posts at — good X engagement windows (UK local).
// One time per slot; if PER_DAY > SLOT_TIMES.length, extra posts reuse the last time.
const SLOT_TIMES = ['09:00', '13:00', '17:00', '21:00', '11:00', '15:00', '19:00', '23:00'];
const dayName = dstr => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(dstr + 'T12:00:00Z').getUTCDay()];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(IMG, { recursive: true });

function priority(c) {
  const f = c.format, t = (c.topic || '').toLowerCase();
  if (f === 'tabloid') return 0;
  if (/drama|viral|good ?news|truecrime|true crime/.test(t)) return 1;
  if (f === 'splitProof' || f === 'bigStat') return 2;
  if (c.category === 'product-card') return 3;
  if (f === 'quote' || f === 'pov' || f === 'minimal') return 5;
  return 4;
}
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); const b = new Date(Date.UTC(y, m - 1, d)); b.setUTCDate(b.getUTCDate() + n); return b.toISOString().slice(0, 10); }
const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

// X IMAGE content, reconciled to disk, in priority order.
let items = JSON.parse(fs.readFileSync(path.join(ROOT, 'library', 'content.json'), 'utf8'))
  .filter(c => c.platform === 'x' && c.tile && fs.existsSync(path.join(ROOT, c.tile)));
items.sort((a, b) => (priority(a) - priority(b)) || ((b.score || 0) - (a.score || 0)));

// spread topics so consecutive image posts differ
const orderedImgs = []; const recent = [];
while (items.length) {
  let idx = items.findIndex(c => !recent.slice(-2).includes(c.topic));
  if (idx === -1) idx = 0;
  const pick = items.splice(idx, 1)[0]; orderedImgs.push(pick); recent.push(pick.topic);
}

// X TEXT-ONLY takes — same source as the auto-poster, filtered to lanes X actually posts.
// A sharp text take often outperforms an image on X (pure signal, no image to parse).
const X_LANES = new Set(['ai', 'science', 'crypto', 'gaming', 'founders']);
let textTakes = [];
const ttPath = path.join(ROOT, 'library', 'text-takes.json');
if (fs.existsSync(ttPath)) {
  textTakes = JSON.parse(fs.readFileSync(ttPath, 'utf8'))
    .filter(t => t.caption && t.topic && X_LANES.has(t.topic)
      && (!t.platforms || t.platforms.length === 0 || t.platforms.includes('x')))
    .sort((a, b) => (b.score || 6) - (a.score || 6));
}

// INTERLEAVE image + text so the schedule is a mix (target ~40% text-only), not all-image.
// Walk both lists proportionally, spreading topics so consecutive posts differ.
const mixed = [];
let ii = 0, ti = 0; const recentMix = [];
const pushSpread = (arr, key) => {
  // pick the next item whose topic isn't in the last 2, else the next in order
  let idx = arr.findIndex((c, k) => k >= (key === 'img' ? ii : ti) && !recentMix.slice(-2).includes(c.topic));
  return idx;
};
while (ii < orderedImgs.length || ti < textTakes.length) {
  const imgShare = orderedImgs.length ? ii / orderedImgs.length : 1;
  const txtShare = textTakes.length ? ti / textTakes.length : 1;
  const takeText = ti < textTakes.length && (txtShare <= imgShare || ii >= orderedImgs.length);
  if (takeText) { const t = textTakes[ti++]; mixed.push({ ...t, _text: true }); recentMix.push(t.topic); }
  else { const c = orderedImgs[ii++]; mixed.push({ ...c, _text: false }); recentMix.push(c.topic); }
}

// build posts (copy images for image posts; text-only posts have no image)
const posts = [];
mixed.forEach((c, i) => {
  const caption = withHashtags(c.caption, { topic: c.topic, format: c.format, category: c.category }, 'x');
  if (c._text) {
    posts.push({ n: i + 1, image: null, caption, topic: c.topic, format: 'text', score: c.score || 6, sourceUrl: c.sourceUrl || null });
  } else {
    const n = String(i + 1).padStart(3, '0');
    const name = `${n}-${slug(c.topic)}-${c.format}.png`;
    fs.copyFileSync(path.join(ROOT, c.tile), path.join(IMG, name));
    posts.push({ n: i + 1, image: `images/${name}`, caption, topic: c.topic, format: c.format, score: c.score || 0, sourceUrl: c.sourceUrl || null });
  }
});

// ── CALENDAR markdown: one dated section per day, each post with a TIME, image + caption together ──
const nImg = posts.filter(p => p.image).length, nTxt = posts.length - nImg;
const days = Math.ceil(posts.length / PER_DAY);
let md = `# X — Posting Calendar\n\n`;
md += `**${posts.length} posts** · ${nImg} image · ${nTxt} text-only · ${PER_DAY}/day over ${days} days (${dayName(START)} ${START} → ${dayName(addDays(START, days - 1))} ${addDays(START, days - 1)})\n\n`;
md += `Times are UK local — post at (or near) the time shown, no need to calculate.\n`;
md += `**IMG** = attach the image file + paste the caption.  **TXT** = just paste the text, no image.\n`;
md += `Bio tip: put **threadverse.ai** in your X bio + a pinned comment; keep captions link-free.\n\n---\n`;

let i = 0, day = 0;
while (i < posts.length) {
  const date = addDays(START, day++);
  const n = Math.min(PER_DAY, posts.length - i);
  md += `\n# 📅 ${dayName(date)} ${date}  ·  ${n} posts\n`;
  for (let s = 0; s < PER_DAY && i < posts.length; s++, i++) {
    const p = posts[i];
    const time = SLOT_TIMES[Math.min(s, SLOT_TIMES.length - 1)];
    const kind = p.image ? 'IMG' : 'TXT';
    md += `\n### 🕘 ${time}  ·  ${kind}  ·  ${p.topic}${p.image ? ` (${p.format})` : ''}\n`;
    if (p.image) md += `**Image:** \`x-manual/${p.image}\`\n\n`;
    md += `**${p.image ? 'Caption' : 'Post'}:**\n> ${p.caption.replace(/\n/g, '\n> ')}\n`;
    if (p.sourceUrl) md += `\n*(optional reply source: ${p.sourceUrl})*\n`;
  }
  md += `\n---\n`;
}

// stamp date + time onto each post in the data file too (so x-posts.json is a real calendar)
posts.forEach((p, idx) => {
  const d = Math.floor(idx / PER_DAY), s = idx % PER_DAY;
  p.date = addDays(START, d);
  p.time = SLOT_TIMES[Math.min(s, SLOT_TIMES.length - 1)];
});
fs.writeFileSync(path.join(OUT, 'X_SCHEDULE.md'), md);
fs.writeFileSync(path.join(OUT, 'x-posts.json'), JSON.stringify(posts, null, 2));
console.log(`✅ ${posts.length} X posts (${nImg} image · ${nTxt} text-only) → x-manual/`);
console.log(`   ${PER_DAY}/day over ${days} days (${START} → ${addDays(START, days - 1)}) · times: ${SLOT_TIMES.slice(0, PER_DAY).join(', ')} UK`);
console.log(`   X_SCHEDULE.md = dated calendar with times · images/ numbered in order`);
