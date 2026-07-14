/**
 * Build a smart posting QUEUE for X / Bluesky / Mastodon from library/content.json.
 *
 * Priority: time-sensitive formats FIRST (tabloid/drama/viral/good-news go stale), then
 * evergreen, highest viral score first, topics spread out. Reconciles against disk so tiles
 * you deleted are dropped. Emits N posts/day/platform over `days` days.
 *
 *   node autopost/build-queue.js --per-day 6 --days 20 --start 2026-07-02
 *   node autopost/build-queue.js --platforms x,bluesky,mastodon --per-day 5
 *
 * Output → autopost/queue.json
 */
const fs = require('fs');
const path = require('path');
const { withHashtags } = require('./hashtags');

const ROOT = path.resolve(__dirname, '..');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };

// Default: Bluesky + Mastodon (X dropped — no free API + blocks automation). Override with --platforms.
const PLATFORMS = (arg('platforms', 'bluesky,mastodon')).split(',').map(s => s.trim());
const PER_DAY = +(arg('per-day', 6));
const DAYS = +(arg('days', 20));
// Default START = today (UTC) so a fresh build schedules FORWARD, not back-dated (back-dating makes
// every item read as "due now", which floods the next cron run). Override with --start YYYY-MM-DD.
const START = arg('start', new Date().toISOString().slice(0, 10));
// 6 slots/day at EVEN UTC hours so the 2-hourly cron fires them promptly (no delay).
const SLOTS = ['08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

function priority(item) {
  const f = item.format, t = (item.topic || '').toLowerCase();
  if (f === 'tabloid') return 0;
  if (/drama|viral|good ?news|truecrime|true crime/.test(t)) return 1;
  if (f === 'splitProof' || f === 'bigStat') return 2;
  if (item.category === 'product-card') return 3;
  if (f === 'quote' || f === 'pov' || f === 'minimal') return 5;
  return 4;
}
function addDays(startStr, n) {
  const [y, m, d] = startStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + n);
  return base.toISOString().slice(0, 10);
}

// Load + reconcile content.json (drop deleted IMAGE tiles; keep text-only entries that have no tile).
let content = JSON.parse(fs.readFileSync(path.join(ROOT, 'library', 'content.json'), 'utf8'));
const beforeN = content.length;
content = content.filter(c => !c.tile || fs.existsSync(path.join(ROOT, c.tile)));
if (content.length !== beforeN) {
  fs.writeFileSync(path.join(ROOT, 'library', 'content.json'), JSON.stringify(content, null, 2));
  console.log(`ℹ️  reconciled: removed ${beforeN - content.length} deleted tiles`);
}

// Merge in TEXT-ONLY takes (no image). Author them in library/text-takes.json:
//   [{ caption, topic, platforms?: ["bluesky","mastodon","x"], score? }]
// If platforms omitted, the take is fanned out to all three. These pass the same anti-regurgitation
// bar as captions (HOOKS.md) — a sharp take with no image often outperforms a tile.
// Per-platform LANE MIX targets (see NICHE.md). Defined here so text-take fan-out can respect them.
// Bluesky rides gaming (winning); Mastodon leads AI/science. A lane at 0 = don't post it there.
const LANE_MIX = {
  bluesky:  { gaming: 0.60, ai: 0.20, science: 0.10, philosophy: 0.10, crypto: 0.00 },
  mastodon: { ai: 0.40, science: 0.30, philosophy: 0.20, gaming: 0.05, crypto: 0.05 },
  x:        { ai: 0.45, science: 0.25, crypto: 0.20, gaming: 0.05, philosophy: 0.05 },
};
const laneWanted = (platform, topic) => ((LANE_MIX[platform] || {})[topic] || 0) > 0;

const textTakesPath = path.join(ROOT, 'library', 'text-takes.json');
if (fs.existsSync(textTakesPath)) {
  const raw = JSON.parse(fs.readFileSync(textTakesPath, 'utf8'));
  let added = 0;
  for (const t of raw) {
    if (!t.caption || !t.topic) continue;
    // fan out ONLY to platforms where this lane has a target > 0 (respect the per-platform mix)
    const plats = (t.platforms && t.platforms.length ? t.platforms : PLATFORMS)
      .filter(p => laneWanted(p, t.topic));
    for (const p of plats) {
      content.push({ platform: p, topic: t.topic, caption: t.caption, tile: null, format: 'text', score: t.score || 6, sourceUrl: t.sourceUrl || null, category: t.category || null });
      added++;
    }
  }
  if (added) console.log(`📝 merged ${added} text-only takes (lane-aware fan-out)`);
}

const postedPath = path.join(__dirname, 'posted.json');
const posted = fs.existsSync(postedPath) ? JSON.parse(fs.readFileSync(postedPath, 'utf8')) : [];
const postedTiles = new Set(posted.map(p => p.tile));
// text-only dedup: key by caption+platform (posted.json stores tile:null for these)
const postedText = new Set(posted.filter(p => !p.tile).map(p => (p.caption || '').replace(/\s+/g, ' ').trim().slice(0, 50) + '|' + p.platform));

// The queue is filled to roughly LANE_MIX ratios (defined above) so each platform's fingerprint stays
// consistent to ITSELF. Bluesky rides gaming (winning); Mastodon leads AI/science.
const queue = [];
for (const platform of PLATFORMS) {
  let pool = content.filter(c => c.platform === platform && c.caption
    && (c.tile ? !postedTiles.has(c.tile)
               : !postedText.has(c.caption.replace(/\s+/g, ' ').trim().slice(0, 50) + '|' + platform)));
  // Safety: never queue the same caption twice for a platform (guards against a dup text-take or a
  // text-take that echoes an image card). Keyed on the caption body so tile+text versions collapse to one.
  const seenCap = new Set();
  pool = pool.filter(c => {
    const k = (c.caption || '').replace(/\s+/g, ' ').trim().slice(0, 60).toLowerCase();
    if (seenCap.has(k)) return false;
    seenCap.add(k); return true;
  });
  pool.sort((a, b) => (priority(a) - priority(b)) || ((b.score || 0) - (a.score || 0)));

  // Weighted interleave: draw topics in proportion to LANE_MIX, and CAP each lane at its target share of
  // the run so off-target surplus (e.g. extra gaming on Mastodon) is dropped, not dumped. This keeps each
  // platform's fingerprint clean even when the library is lane-imbalanced. Dropped surplus just waits for
  // a future run (more slots) or gets balanced by adding text-takes in the under-supplied lane.
  const mix = LANE_MIX[platform] || null;
  const byTopic = {};
  for (const c of pool) (byTopic[c.topic] = byTopic[c.topic] || []).push(c);
  const ordered = [];
  if (mix) {
    const capacity = DAYS * PER_DAY;                     // how many slots this platform actually has
    const runTotal = Math.min(pool.length, capacity);
    // per-lane cap = target share of the run, rounded up so small lanes still get ≥1; 0-target lanes = 0.
    const cap = {}; Object.keys(mix).forEach(t => (cap[t] = mix[t] > 0 ? Math.max(1, Math.round(mix[t] * runTotal)) : 0));
    const taken = {}; Object.keys(mix).forEach(t => (taken[t] = 0));
    const credit = {}; Object.keys(mix).forEach(t => (credit[t] = 0));
    const recent = [];
    while (ordered.length < runTotal) {
      Object.keys(mix).forEach(t => (credit[t] += mix[t]));
      // eligible = lane has stock, is under its cap, and wasn't the immediately-previous topic
      const eligible = t => (byTopic[t] || []).length && taken[t] < cap[t];
      let cand = Object.keys(credit).filter(t => eligible(t) && !recent.slice(-1).includes(t)).sort((a, b) => credit[b] - credit[a]);
      if (!cand.length) cand = Object.keys(credit).filter(eligible).sort((a, b) => credit[b] - credit[a]);
      if (!cand.length) break;                           // every wanted lane is capped or dry → stop (drop surplus)
      const t = cand[0];
      ordered.push(byTopic[t].shift()); credit[t] -= 1; taken[t]++; recent.push(t);
    }
  } else {
    const recent = [];
    while (pool.length) {
      let idx = pool.findIndex(c => !recent.slice(-2).includes(c.topic));
      if (idx === -1) idx = 0;
      const pick = pool.splice(idx, 1)[0];
      ordered.push(pick); recent.push(pick.topic);
    }
  }
  // FORMAT INTERLEAVE: priority sorting front-loads image tabloids, leaving a wall of text posts at the
  // tail — a feed that's all-images-then-all-text reads botted. Proportionally merge image and text posts
  // (preserving each group's internal priority order) so every day gets a mix of both while supply lasts.
  const imgs = ordered.filter(c => c.tile), txts = ordered.filter(c => !c.tile);
  const mixed = [];
  let ii = 0, ti = 0;
  while (ii < imgs.length || ti < txts.length) {
    const imgShare = imgs.length ? ii / imgs.length : 1;
    const txtShare = txts.length ? ti / txts.length : 1;
    if (ii < imgs.length && (imgShare <= txtShare || ti >= txts.length)) mixed.push(imgs[ii++]);
    else mixed.push(txts[ti++]);
  }

  let i = 0;
  for (let day = 0; day < DAYS && i < mixed.length; day++) {
    const date = addDays(START, day);
    for (let slot = 0; slot < PER_DAY && i < mixed.length; slot++) {
      const c = mixed[i++];
      const caption = withHashtags(c.caption, { topic: c.topic, format: c.format, category: c.category }, platform);
      queue.push({ date, timeUTC: SLOTS[slot % SLOTS.length], platform, tile: c.tile || null, caption, title: c.title || (c.caption || '').slice(0, 48), format: c.format, topic: c.topic, priority: priority(c), sourceUrl: c.sourceUrl || null });
    }
  }
}
queue.sort((a, b) => (a.date + a.timeUTC).localeCompare(b.date + b.timeUTC));
fs.writeFileSync(path.join(__dirname, 'queue.json'), JSON.stringify(queue, null, 2));

const byP = {}, byPrio = {};
queue.forEach(q => { byP[q.platform] = (byP[q.platform] || 0) + 1; byPrio[q.priority] = (byPrio[q.priority] || 0) + 1; });
console.log(`✅ queued ${queue.length} posts → autopost/queue.json`);
console.log('   per platform:', JSON.stringify(byP), '| priority (0=most timely):', JSON.stringify(byPrio));
queue.filter(q => q.date === START).slice(0, 6).forEach(q => console.log(`   ${q.timeUTC} ${q.platform} [${q.format}/${q.topic}] ${q.title?.slice(0, 42)}`));
