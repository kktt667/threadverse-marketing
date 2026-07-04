/**
 * Reusable branded THREADVERSE card on the real site wave background (9:16).
 * Drop-in / cut-in card for videos. Uses video-src/wave-bg-9x16.png as the base.
 *   node edit/brand-card.js
 * → library/07-cut-cards/brand/threadverse-wave.png (+ a tagline variant)
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { BRAND } = require('./brandkit');

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'video-src', 'wave-bg-9x16.png');
const OUT = path.join(ROOT, 'library', '07-cut-cards', 'brand');
fs.mkdirSync(OUT, { recursive: true });
const W = 1080, H = 1920;

async function make(name, overlaySVG) {
  if (!fs.existsSync(BASE)) throw new Error('missing video-src/wave-bg-9x16.png — capture it first');
  const bg = await sharp(BASE).resize(W, H, { fit: 'cover', position: 'center' }).toBuffer();
  await sharp(bg).composite([{ input: Buffer.from(overlaySVG), top: 0, left: 0 }]).png().toFile(path.join(OUT, `${name}.png`));
  console.log(`  🌊 brand/${name}.png`);
}

// central radial darken so the wordmark reads clearly on the busy waves
const vignette = `
  <defs><radialGradient id="v" cx="50%" cy="50%" r="60%">
    <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
    <stop offset="55%" stop-color="#000" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>`;

(async () => {
  // 1) Wordmark only — the clean reusable one.
  await make('threadverse-wave', `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${vignette}
    <text x="${W / 2}" y="${H / 2 + 30}" font-family="${BRAND.displayFont}" font-size="104" font-weight="800"
      fill="#FFFFFF" text-anchor="middle" letter-spacing="6">THREADVERSE</text>
  </svg>`);

  // 2) Wordmark + tagline (for intros/outros).
  await make('threadverse-wave-tagline', `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${vignette}
    <text x="${W / 2}" y="${H / 2 - 30}" font-family="${BRAND.displayFont}" font-size="100" font-weight="800"
      fill="#FFFFFF" text-anchor="middle" letter-spacing="5">THREADVERSE</text>
    <text x="${W / 2}" y="${H / 2 + 70}" font-family="${BRAND.bodyFont}" font-size="42"
      fill="#C9C9CE" text-anchor="middle" letter-spacing="4">One feed. Every platform. Zero noise.</text>
    <text x="${W / 2}" y="${H / 2 + 150}" font-family="${BRAND.bodyFont}" font-size="36"
      fill="#8A8A90" text-anchor="middle">threadverse.ai</text>
  </svg>`);

  console.log('\n✅ branded wave cards → library/07-cut-cards/brand/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
