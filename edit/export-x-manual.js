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

// X content, reconciled to disk, in priority order.
let items = JSON.parse(fs.readFileSync(path.join(ROOT, 'library', 'content.json'), 'utf8'))
  .filter(c => c.platform === 'x' && c.tile && fs.existsSync(path.join(ROOT, c.tile)));
items.sort((a, b) => (priority(a) - priority(b)) || ((b.score || 0) - (a.score || 0)));

// spread topics so consecutive posts differ
const ordered = []; const recent = [];
while (items.length) {
  let idx = items.findIndex(c => !recent.slice(-2).includes(c.topic));
  if (idx === -1) idx = 0;
  const pick = items.splice(idx, 1)[0]; ordered.push(pick); recent.push(pick.topic);
}

// copy images (numbered) + build schedule
const posts = [];
ordered.forEach((c, i) => {
  const n = String(i + 1).padStart(3, '0');
  const name = `${n}-${slug(c.topic)}-${c.format}.png`;
  fs.copyFileSync(path.join(ROOT, c.tile), path.join(IMG, name));
  const caption = withHashtags(c.caption, { topic: c.topic, format: c.format, category: c.category }, 'x');
  posts.push({ n: i + 1, image: `images/${name}`, caption, topic: c.topic, format: c.format, score: c.score || 0, sourceUrl: c.sourceUrl || null });
});

// per-day markdown
let md = `# X — Manual Posting Schedule\n\n`;
md += `${posts.length} posts · ${PER_DAY}/day · time-sensitive first (tabloid/drama/viral), then evergreen.\n`;
md += `Each morning: open that day's images, copy the caption, attach the image, post.\n`;
md += `> Tip: put **threadverse.ai** in your X bio + a pinned comment; keep captions link-free for max reach.\n\n`;

let i = 0, day = 0;
while (i < posts.length) {
  const date = addDays(START, day++);
  md += `\n## ${date}  (${Math.min(PER_DAY, posts.length - i)} posts)\n`;
  for (let s = 0; s < PER_DAY && i < posts.length; s++, i++) {
    const p = posts[i];
    md += `\n**#${p.n}** · ${p.score}/10 · ${p.format} · ${p.topic}\n\n`;
    md += `🖼️ \`x-manual/${p.image}\`\n\n`;
    md += `📋 Caption (copy):\n\n> ${p.caption.replace(/\n/g, '\n> ')}\n`;
    if (p.sourceUrl) md += `\n🔗 source (optional, for a reply): ${p.sourceUrl}\n`;
    md += `\n---\n`;
  }
}

fs.writeFileSync(path.join(OUT, 'X_SCHEDULE.md'), md);
fs.writeFileSync(path.join(OUT, 'x-posts.json'), JSON.stringify(posts, null, 2));
const days = Math.ceil(posts.length / PER_DAY);
console.log(`✅ ${posts.length} X posts → x-manual/`);
console.log(`   ${PER_DAY}/day over ${days} days (${START} → ${addDays(START, days - 1)})`);
console.log(`   images/ (numbered in posting order) · X_SCHEDULE.md (per-day, paste-ready)`);
