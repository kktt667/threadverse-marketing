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

const PLATFORMS = (arg('platforms', 'x,bluesky,mastodon')).split(',').map(s => s.trim());
const PER_DAY = +(arg('per-day', 6));
const DAYS = +(arg('days', 20));
const START = arg('start', '2026-07-02');
const SLOTS = ['08:00', '12:00', '14:00', '17:00', '19:00', '21:00', '23:00'];

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

// Load + reconcile content.json (drop deleted tiles).
let content = JSON.parse(fs.readFileSync(path.join(ROOT, 'library', 'content.json'), 'utf8'));
const beforeN = content.length;
content = content.filter(c => c.tile && fs.existsSync(path.join(ROOT, c.tile)));
if (content.length !== beforeN) {
  fs.writeFileSync(path.join(ROOT, 'library', 'content.json'), JSON.stringify(content, null, 2));
  console.log(`ℹ️  reconciled: removed ${beforeN - content.length} deleted tiles`);
}

const postedPath = path.join(__dirname, 'posted.json');
const posted = fs.existsSync(postedPath) ? JSON.parse(fs.readFileSync(postedPath, 'utf8')) : [];
const postedTiles = new Set(posted.map(p => p.tile));

const queue = [];
for (const platform of PLATFORMS) {
  let pool = content.filter(c => c.platform === platform && !postedTiles.has(c.tile) && c.tile && c.caption);
  pool.sort((a, b) => (priority(a) - priority(b)) || ((b.score || 0) - (a.score || 0)));
  const ordered = [];
  const recent = [];
  while (pool.length) {
    let idx = pool.findIndex(c => !recent.slice(-2).includes(c.topic));
    if (idx === -1) idx = 0;
    const pick = pool.splice(idx, 1)[0];
    ordered.push(pick); recent.push(pick.topic);
  }
  let i = 0;
  for (let day = 0; day < DAYS && i < ordered.length; day++) {
    const date = addDays(START, day);
    for (let slot = 0; slot < PER_DAY && i < ordered.length; slot++) {
      const c = ordered[i++];
      const caption = withHashtags(c.caption, { topic: c.topic, format: c.format, category: c.category }, platform);
      queue.push({ date, timeUTC: SLOTS[slot % SLOTS.length], platform, tile: c.tile, caption, title: c.title, format: c.format, topic: c.topic, priority: priority(c), sourceUrl: c.sourceUrl || null });
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
