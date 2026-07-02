/**
 * Master CONTENT_SHEET.md grouped BY PLATFORM, then format. Reads library/content.json
 * (written by format-run.js) + adds the product-cards + video-assets sections.
 *   node edit/build-sheet.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'library');

const content = fs.existsSync(path.join(LIB, 'content.json'))
  ? JSON.parse(fs.readFileSync(path.join(LIB, 'content.json'))) : [];

const PLAT_LABEL = { x: 'X / Twitter', bluesky: 'Bluesky', mastodon: 'Mastodon', instagram: 'Instagram', tiktok: 'TikTok' };
const PLAT_ORDER = ['x', 'bluesky', 'mastodon', 'instagram', 'tiktok'];

let md = `# Threadverse — Master Content Sheet\n\n`;
md += `**${content.length} content-card tiles**, organized by platform. Each uses a format matched to the post.\n`;
md += `Grab a tile → paste its caption → post. Source link deep-links to the original.\n\n`;

// summary table
const byP = {};
content.forEach(c => { byP[c.platform] = (byP[c.platform] || 0) + 1; });
md += `| Platform | Tiles | Folder |\n|---|---|---|\n`;
for (const p of PLAT_ORDER) if (byP[p]) md += `| ${PLAT_LABEL[p]} | ${byP[p]} | \`library/01-content-cards/${p}/\` |\n`;

const prodCount = content.filter(c => c.category === 'product-card').length;
md += `\nIncludes **${prodCount} product cards** (in each platform's \`product/\` subfolder — these explain the product; lead new accounts with them) and content cards (curated posts).\n`;
md += `\n**Also in the library:** \`07-cut-cards/\` + \`08-meme-cards/\` (video pieces — see VIDEO_KIT.md), \`05-video-assets/\` (b-roll + overlays).\n`;

// per platform — product cards first (they explain the product), then content cards by score
for (const p of PLAT_ORDER) {
  const items = content.filter(c => c.platform === p);
  if (!items.length) continue;
  const products = items.filter(c => c.category === 'product-card');
  const posts = items.filter(c => c.category !== 'product-card').sort((a, b) => b.score - a.score);
  md += `\n---\n## ${PLAT_LABEL[p]}  (${items.length})\n`;
  if (products.length) {
    md += `\n### 📣 Product cards (lead with these)\n`;
    for (const c of products) {
      md += `\n**${c.title}**\n\n🖼️ \`${c.tile}\`\n📝 ${c.caption}\n`;
    }
    md += `\n### Content cards\n`;
  }
  for (const c of posts) {
    md += `\n**${c.title}**  ·  ${c.score}/10 · ${c.format} · ${c.topic}\n\n`;
    md += `🖼️ \`${c.tile}\`\n📝 ${c.caption}\n🎯 ${(c.triggers || []).join(', ')}`;
    if (c.sourceUrl) md += `  ·  🔗 ${c.sourceUrl}`;
    md += `\n`;
  }
}

fs.writeFileSync(path.join(LIB, 'CONTENT_SHEET.md'), md);
console.log(`✅ ${content.length} tiles → library/CONTENT_SHEET.md (grouped by platform)`);
console.log('   ' + PLAT_ORDER.filter(p => byP[p]).map(p => `${p}:${byP[p]}`).join(' '));
