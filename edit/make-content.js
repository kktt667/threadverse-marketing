/**
 * Turn harvested cards + their BESPOKE copy (copy.json, written by vision agents) into finished,
 * post-ready content tiles. One 1080x1080 tile per KEPT card, with its custom title baked on.
 *
 * Reads:  library/snaps/<feed>/{manifest.json, copy.json}
 * Writes: library/edited/<feed>/<card>.png  +  library/edited/CONTENT_SHEET.md  +  content.json
 *
 *   node edit/make-content.js                 # all feeds, kept cards only
 *   node edit/make-content.js --feed cursed
 *   node edit/make-content.js --all           # include keep:false too (override curation)
 *   node edit/make-content.js --min 6         # only score >= 6
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND, esc, wrap, textBlock } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };

function footerSVG(w) {
  return `
    <text x="64" y="0" font-family="${BRAND.displayFont}" font-size="34" font-weight="800" fill="${BRAND.fg}" letter-spacing="2">${BRAND.wordmark}</text>
    <text x="${w - 64}" y="0" font-family="${BRAND.bodyFont}" font-size="30" font-weight="600" fill="${BRAND.dim}" text-anchor="end">${BRAND.url}</text>`;
}

async function compose(cardPath, outPath, { title, source }) {
  const W = 1080, H = 1080;
  const pad = Math.round(W * 0.07);
  const titleLines = wrap(title, 26, 3);
  const titleSize = titleLines.length >= 3 ? 56 : 64;
  const headerH = Math.round(80 + titleLines.length * (titleSize + 8));
  const footerH = 96;
  const maxCardW = W - pad * 2;
  const maxCardH = H - headerH - footerH - pad;

  const meta = await sharp(cardPath).metadata();
  const scale = Math.min(maxCardW / meta.width, maxCardH / meta.height, 1.7);
  const cw = Math.round(meta.width * scale);
  const ch = Math.round(meta.height * scale);
  const radius = 22;
  const resized = await sharp(cardPath).resize(cw, ch, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const mask = Buffer.from(`<svg width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  const card = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  const cardX = Math.round((W - cw) / 2);
  const cardY = headerH + Math.round((maxCardH - ch) / 2);

  const bgSVG = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="20%" r="95%">
      <stop offset="0%" stop-color="#17171A"/><stop offset="100%" stop-color="${BRAND.bg}"/>
    </radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`;

  const fgSVG = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${textBlock(titleLines, { x: 64, y: 96, size: titleSize, lineHeight: titleSize + 8, weight: 800 })}
    <rect x="${cardX - 2}" y="${cardY - 2}" width="${cw + 4}" height="${ch + 4}" rx="${radius}" fill="none" stroke="#2A2A2E" stroke-width="2"/>
    ${source ? `<text x="${cardX}" y="${cardY - 16}" font-family="${BRAND.bodyFont}" font-size="25" fill="${BRAND.dim}" letter-spacing="1">via ${esc(source)} · kept by Threadverse</text>` : ''}
    <g transform="translate(0, ${H - footerH + footerH * 0.55})">${footerSVG(W)}</g></svg>`;

  await sharp({ create: { width: W, height: H, channels: 4, background: BRAND.bg } })
    .composite([
      { input: Buffer.from(bgSVG), top: 0, left: 0 },
      { input: card, top: cardY, left: cardX },
      { input: Buffer.from(fgSVG), top: 0, left: 0 },
    ]).png().toFile(outPath);
}

// Map raw-snap slugs → clean topic folder names for output.
const SLUG_TO_TOPIC = {
  '1-ai-model-releases-breakthroughs-pro': 'ai', 'crypto': 'crypto',
  'genuinely-wholesome-and-uplifting-posts': 'wholesome', 'gimme-some-good-youtube-content-for-bust': 'youtube',
  'i-love-games-show-me-great-new-release': 'gaming', 'random-philosophy': 'philosophy',
  'the-funniest-single-replies-and-cursed-c': 'funny', 'wildlife-wonders': 'wildlife',
};

(async () => {
  const snapsRoot = path.join(ROOT, 'library', '03-raw-snaps');
  const only = arg('feed');
  const includeAll = !!arg('all');
  const min = arg('min') ? +arg('min') : 0;

  const feeds = fs.readdirSync(snapsRoot)
    .filter(d => !d.startsWith('_') && fs.statSync(path.join(snapsRoot, d)).isDirectory())
    .filter(d => !only || d.includes(String(only).toLowerCase()));

  const sheet = [];
  let made = 0, skipped = 0;
  for (const slug of feeds) {
    const dir = path.join(snapsRoot, slug);
    const copyPath = path.join(dir, 'copy.json');
    const manPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(copyPath)) { console.log(`  · ${slug}: no copy.json (run the copy workflow) — skip`); continue; }
    const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    const urlByFile = Object.fromEntries(man.cards.map(c => [c.file, c.url || null]));
    const srcByFile = Object.fromEntries(man.cards.map(c => [c.file, c.source || '']));

    const outDir = path.join(ROOT, 'library', '01-content-cards', SLUG_TO_TOPIC[slug] || slug);
    fs.mkdirSync(outDir, { recursive: true });

    for (const c of copy.cards) {
      if (!includeAll && !c.keep) { skipped++; continue; }
      if (c.score < min) { skipped++; continue; }
      const fileName = path.basename(c.file);   // agents sometimes wrote absolute paths
      const cardPath = path.join(dir, fileName);
      if (!fs.existsSync(cardPath)) continue;
      const out = path.join(outDir, fileName);
      try {
        await compose(cardPath, out, { title: c.title, source: srcByFile[fileName] });
        made++;
        sheet.push({
          feed: copy.feed, slug, score: c.score, vibe: c.vibe,
          tile: path.relative(ROOT, out),
          title: c.title, caption: c.caption, triggers: c.triggers,
          sourceUrl: urlByFile[fileName] || null, source: srcByFile[fileName] || '',
        });
      } catch (e) { /* skip bad card */ }
    }
    console.log(`  🎨 ${copy.feed}: ${copy.cards.filter(c => includeAll || c.keep).length} tiles`);
  }

  // Sheet ranked by viral score.
  sheet.sort((a, b) => b.score - a.score);
  let md = `# Threadverse Content Sheet — ${sheet.length} ready tiles (ranked by viral score)\n\nGrab tile → paste caption → post. Source link deep-links to the original post.\n\n`;
  for (const s of sheet) {
    md += `\n### ${s.score}/10 · ${s.vibe} · ${s.feed}\n`;
    md += `**${s.title}**\n\n`;
    md += `🖼️ \`${s.tile}\`\n`;
    md += `📝 ${s.caption}\n`;
    md += `🎯 ${s.triggers.join(', ')}`;
    if (s.sourceUrl) md += `  ·  🔗 source: ${s.sourceUrl}`;
    md += `\n`;
  }
  fs.writeFileSync(path.join(ROOT, 'library', 'edited', 'CONTENT_SHEET.md'), md);
  fs.writeFileSync(path.join(ROOT, 'library', 'edited', 'content.json'), JSON.stringify(sheet, null, 2));
  console.log(`\n✅ ${made} tiles made · ${skipped} skipped (curated out). Sheet → library/edited/CONTENT_SHEET.md`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
