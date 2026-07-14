/**
 * Render kept cards through their AGENT-CHOSEN format, organized BY PLATFORM.
 *
 * Reads library/03-raw-snaps/<slug>/{copy.json, manifest.json}. For each kept card, calls the
 * matching renderer in formats.js and writes to:
 *   library/01-content-cards/<platform>/<topic>-<card>-<format>.png
 * where <platform> = the agent's bestPlatform (x/bluesky/mastodon/instagram/tiktok).
 *
 *   node edit/format-run.js                       # all feeds, kept cards — MERGES into content.json
 *   node edit/format-run.js --min 6               # score gate
 *   node edit/format-run.js --feeds slug1,slug2   # only these raw-snap dirs
 *   node edit/format-run.js --overwrite           # legacy: replace content.json wholesale (dangerous)
 */
const fs = require('fs');
const path = require('path');
const F = require('./formats');

const ROOT = path.resolve(__dirname, '..');
const SNAPS = path.join(ROOT, 'library', '03-raw-snaps');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };

const TOPIC = {
  '1-ai-model-releases-breakthroughs-pro': 'ai', 'crypto': 'crypto',
  'genuinely-wholesome-and-uplifting-posts': 'wholesome', 'gimme-some-good-youtube-content-for-bust': 'youtube',
  'i-love-games-show-me-great-new-release': 'gaming', 'random-philosophy': 'philosophy',
  'create-a-live-gaming-intelligence-fe': 'gaming',
  'the-funniest-single-replies-and-cursed-c': 'funny', 'wildlife-wonders': 'wildlife',
  'good-news-today': 'goodnews', 'honest-founder-stories-with-engagement': 'founders',
  'latest-internet-drama-feuds-callouts': 'drama', 'true-crime-files': 'truecrime',
  'viral-right-now': 'viral', 'where-to-next': 'travel',
};
const VALID_PLATFORM = ['x', 'bluesky', 'mastodon', 'instagram', 'tiktok'];

async function renderCard(c, cardPath, meta) {
  const src = meta.source || 'the feed';
  const handle = meta.handle || '';
  const likes = (meta.txt.match(/(\d[\d,\.]*[km]?)\s*(?:likes|♥|❤)/i) || [])[1];
  switch (c.format) {
    case 'quote':      return F.quote({ text: c.quote || meta.txt, handle, source: src, hook: c.title });
    case 'bigStat':    return F.bigStat({ number: likes || '★', label: (c.title || 'people agree'), cardPath });
    case 'pov':        return F.pov({ cardPath, povText: c.povText || c.title, source: src });
    case 'splitProof': return F.splitProof({ statement: c.title, cardPath, source: src });
    case 'tabloid':    return F.tabloid({ cardPath, kicker: c.title, source: src });
    case 'minimal':    return F.minimal({ cardPath, hook: c.title, source: src });
    case 'banner':
    default:           return F.banner({ cardPath, hook: c.title, source: src });
  }
}

(async () => {
  const min = arg('min') ? +arg('min') : 0;
  // --feeds slug1,slug2 → only process these raw-snap dirs (default: all)
  const onlyFeeds = arg('feeds') ? String(arg('feeds')).split(',').map(s => s.trim()).filter(Boolean) : null;
  const sheet = [];
  let made = 0, skipped = 0;

  for (const slug of fs.readdirSync(SNAPS)) {
    const dir = path.join(SNAPS, slug);
    if (slug.startsWith('_') || !fs.statSync(dir).isDirectory()) continue;
    if (onlyFeeds && !onlyFeeds.includes(slug)) continue;
    const copyPath = path.join(dir, 'copy.json');
    const manPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(copyPath)) continue;
    const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    const metaByFile = Object.fromEntries(man.cards.map(m => [path.basename(m.file), m]));
    const topic = TOPIC[slug] || slug;

    for (const c of copy.cards) {
      const fileName = path.basename(c.file);
      if (!c.keep || c.score < min) { skipped++; continue; }
      const cardPath = path.join(dir, fileName);
      if (!fs.existsSync(cardPath)) continue;
      const meta = metaByFile[fileName] || { txt: '', source: '' };
      const platform = VALID_PLATFORM.includes(c.bestPlatform) ? c.bestPlatform : 'x';
      const outDir = path.join(ROOT, 'library', '01-content-cards', platform);
      fs.mkdirSync(outDir, { recursive: true });
      // include a feed-slug fragment: both gaming feeds have card-NN.png files, and topic+file alone
      // collides across feeds (second feed silently overwrote the first's tiles).
      const outName = `${topic}-${slug.slice(0, 12)}-${fileName.replace('.png', '')}-${c.format}.png`;
      const out = path.join(outDir, outName);
      try {
        const buf = await renderCard(c, cardPath, meta);
        fs.writeFileSync(out, buf);
        made++;
        sheet.push({
          platform, topic, format: c.format, score: c.score, vibe: c.vibe,
          tile: path.relative(ROOT, out), title: c.title, caption: c.caption,
          triggers: c.triggers || [], sourceUrl: meta.url || null,
        });
      } catch (e) { console.log(`  ⚠️ ${slug}/${fileName} (${c.format}): ${e.message}`); }
    }
  }

  // per-platform / per-format tallies
  const byP = {}, byF = {};
  sheet.forEach(s => { byP[s.platform] = (byP[s.platform] || 0) + 1; byF[s.format] = (byF[s.format] || 0) + 1; });

  // MERGE into content.json by default: replace any existing entry whose tile matches a re-rendered
  // one, keep everything else (hand-edited captions, other feeds, text-take state), append the new.
  // The old wholesale overwrite destroyed curated content — it's now opt-in via --overwrite.
  const contentPath = path.join(ROOT, 'library', 'content.json');
  if (arg('overwrite')) {
    fs.writeFileSync(contentPath, JSON.stringify(sheet, null, 2));
  } else {
    const existing = fs.existsSync(contentPath) ? JSON.parse(fs.readFileSync(contentPath, 'utf8')) : [];
    const newTiles = new Set(sheet.map(s => s.tile));
    const kept = existing.filter(c => !newTiles.has(c.tile));
    fs.writeFileSync(contentPath, JSON.stringify(kept.concat(sheet), null, 2));
    console.log(`   content.json: kept ${kept.length} existing + added ${sheet.length} (merge)`);
  }
  console.log(`\n✅ ${made} tiles · ${skipped} skipped`);
  console.log('   by platform:', Object.entries(byP).map(([k, v]) => `${k}:${v}`).join(' '));
  console.log('   by format:  ', Object.entries(byF).map(([k, v]) => `${k}:${v}`).join(' '));
})().catch(e => { console.error('❌', e.message); process.exit(1); });
