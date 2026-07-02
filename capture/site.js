/**
 * Capture landing-page + product-UI sections as raw material for hero/explainer/feature tiles.
 * Saves clean section crops into library/snaps/_site/.
 *
 *   node capture/site.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', 'snaps', '_site');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  // scroll through to trigger animations/lazy content
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1200);

  // Full hero (viewport)
  await page.screenshot({ path: path.join(OUT, 'hero.png') });

  // Capture labeled sections by their anchor / heading text.
  const sections = [
    { name: 'demo', sel: '#demo' },
    { name: 'how-it-works', sel: '#how' },
    { name: 'platforms', text: 'All your platforms' },
    { name: 'pricing', sel: '#pricing' },
  ];
  for (const s of sections) {
    try {
      let el;
      if (s.sel) el = await page.$(s.sel);
      if (!el && s.text) el = await page.locator(`text=${s.text}`).first().elementHandle().catch(() => null);
      if (!el) { console.log(`  · ${s.name}: not found`); continue; }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      const box = await el.boundingBox();
      if (box) {
        await page.screenshot({ path: path.join(OUT, `${s.name}.png`), clip: { x: 0, y: box.y, width: 1440, height: Math.min(box.height + 120, 1400) } });
        console.log(`  📸 ${s.name}.png`);
      }
    } catch (e) { console.log(`  · ${s.name}: ${e.message}`); }
  }

  // A clean full-page tall capture for cropping anything later.
  await page.screenshot({ path: path.join(OUT, 'fullpage.png'), fullPage: true });
  console.log('  📸 fullpage.png');
  await browser.close();
  console.log('✅ site assets → library/snaps/_site/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
