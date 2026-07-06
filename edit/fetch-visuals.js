/**
 * Fetch a visual-hook background image per kept card, via Openverse (keyless, CC-licensed,
 * commercial-use filtered). Saves to library/09-visual-hooks/<lane>/<file> and records the
 * source + license in _hookmaster.json (so anything can be swapped/attributed later).
 *
 *   node edit/fetch-visuals.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'library', '03-raw-snaps', '_hookmaster.json');
const OUT = path.join(ROOT, 'library', '09-visual-hooks');

// Lane → search terms that reliably return striking, on-theme, dark-friendly imagery.
const LANE_QUERIES = {
  ai: ['artificial intelligence abstract', 'neural network', 'circuit board macro', 'robot dark'],
  gaming: ['video game controller neon', 'arcade neon', 'gaming setup dark', 'pixel art'],
  crypto: ['cryptocurrency abstract', 'blockchain network', 'trading chart dark', 'bitcoin macro'],
  philosophy: ['marble statue dark', 'ancient philosophy statue', 'library books dark', 'greek sculpture'],
  science: ['science laboratory dark', 'physics abstract', 'space nebula', 'microscope macro'],
};

// Derive extra keywords from the card's own text for a closer match (best-effort).
function cardKeywords(txt) {
  const words = (txt || '').toLowerCase().match(/\b(openai|anthropic|deepseek|nvidia|tesla|metroid|xbox|nintendo|playstation|bitcoin|ethereum|solana|gpu|chip|robot|space|quantum)\b/g);
  return words ? [...new Set(words)] : [];
}

async function openverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=8&mature=false`;
  const res = await fetch(url, { headers: { 'User-Agent': 'threadverse-marketing/1.0' } });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.results || []).filter(r => r.url && /\.(jpe?g|png)/i.test(r.url));
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'threadverse-marketing/1.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error('status ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error('too small');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  const cards = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  const usedUrls = new Set();
  let ok = 0, fail = 0;

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const laneDir = path.join(OUT, c.lane);
    fs.mkdirSync(laneDir, { recursive: true });
    const outName = `${c.slug.slice(0, 12)}-${c.file}`;
    const dest = path.join(laneDir, outName);

    // Try card-specific keyword first, then lane defaults.
    const kws = cardKeywords(c.txt + ' ' + c.hook);
    const queries = [...kws.map(k => `${k} ${c.lane}`), ...(LANE_QUERIES[c.lane] || LANE_QUERIES.ai)];

    let done = false;
    for (const q of queries) {
      if (done) break;
      let results;
      try { results = await openverse(q); } catch { continue; }
      for (const r of results) {
        if (usedUrls.has(r.url)) continue;         // avoid repeats
        try {
          await download(r.url, dest);
          usedUrls.add(r.url);
          c.visual = { file: path.relative(ROOT, dest), source: r.foreign_landing_url || r.url, license: r.license, creator: r.creator || '', query: q };
          ok++; done = true;
          console.log(`  🖼️  ${c.lane}/${outName}  (${q}, ${r.license})`);
          break;
        } catch { /* try next result */ }
      }
      await new Promise(r => setTimeout(r, 150)); // be polite to the API
    }
    if (!done) { fail++; console.log(`  ⚠️  no image for ${c.lane} card ${c.file} (${c.hook?.slice(0, 30)})`); }
  }

  fs.writeFileSync(MASTER, JSON.stringify(cards, null, 2));
  console.log(`\n✅ ${ok} images fetched · ${fail} missing → library/09-visual-hooks/`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
