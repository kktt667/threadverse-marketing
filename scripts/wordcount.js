/**
 * Honest spoken-word + runtime counter for scripts. Counts ONLY the quoted text on spoken
 * beat lines (HOOK/STAKES/BIG-Q/HEAD FAKE/REHOOK/CTA) — excludes [TEXT ON SCREEN] and [V:] cues.
 *   node scripts/wordcount.js            # table for every script
 *   node scripts/wordcount.js --over 23  # only scripts longer than N seconds
 * Speech rate assumed 2.5 words/sec.
 */
const fs = require('fs');
const path = require('path');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const RATE = 2.8;   // measured from the user's actual voice (~100 words = 36s)
// Target band: aim 56-70 words (~20-25s). Hard max ~84 words (~30s).
const DIR = path.join(__dirname, 'generated');
const BEAT = /^\*\*\[(HOOK|STAKES|BIG-?Q|HEAD FAKE|REHOOK|CTA)/i;

function scriptsIn(file) {
  const txt = fs.readFileSync(path.join(DIR, file), 'utf8');
  return txt.split(/(?=^## Script )/m).filter(b => /^## Script /.test(b)).map(block => {
    const head = block.match(/^## Script (\S+) — (.+?) · lane: (\w+)/) || [];
    let words = 0;
    for (const line of block.split('\n')) {
      if (BEAT.test(line)) {
        const q = line.match(/"([^"]+)"/) || line.match(/“([^”]+)”/);
        if (q) words += q[1].trim().split(/\s+/).filter(w => w && /[a-z0-9]/i.test(w)).length; // ignore standalone —, punctuation
      }
    }
    return { num: head[1], title: (head[2] || '').slice(0, 34), lane: head[3], words, sec: Math.round(words / RATE), file };
  });
}

const files = fs.readdirSync(DIR).filter(f => /^batch-\d+\.md$/.test(f)).sort();
const seen = new Map();
for (const f of files) for (const s of scriptsIn(f)) {
  const k = (s.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 22);
  if (!seen.has(k)) seen.set(k, s);
}
let all = [...seen.values()];
const over = arg('over') ? +arg('over') : null;
if (over) all = all.filter(s => s.sec > over);

all.forEach(s => console.log(`${String(s.sec).padStart(3)}s ${String(s.words).padStart(3)}w  [${s.lane}] ${s.title}  (${s.file})`));
const src = [...seen.values()];
console.log(`\n${all.length} shown · ${src.length} total · avg ${Math.round(src.reduce((a, s) => a + s.words, 0) / src.length)}w ~${Math.round(src.reduce((a, s) => a + s.sec, 0) / src.length)}s · in-range(<=23s): ${src.filter(s => s.sec <= 23).length}`);
