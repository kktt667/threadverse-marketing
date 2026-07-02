/**
 * Add the real source-post URL to each card in every library/snaps/<feed>/manifest.json.
 * Cards in the app contain anchors to the original post; we match cards to manifest entries
 * by order (same order harvest.js captured them) and attach the primary external link.
 *
 *   node capture/enrich-urls.js [--session pro]
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };
const SESSION = arg('session', 'pro');
const PROFILE = path.join(__dirname, 'sessions', SESSION, 'tv-profile');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

async function gotoApp(page) {
  await page.goto('https://www.threadverse.ai/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
}
async function listFeeds(page) {
  return page.evaluate(() => [...document.querySelectorAll('button.flex-1.text-left')].map(e => (e.innerText || '').trim()).filter(Boolean));
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 1400 } });
  const page = ctx.pages()[0] || await ctx.newPage();
  await gotoApp(page);
  const feeds = await listFeeds(page);

  for (const feed of feeds) {
    const dir = path.join(ROOT, 'library', '03-raw-snaps', slug(feed));
    const mPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(mPath)) continue;
    const man = JSON.parse(fs.readFileSync(mPath, 'utf8'));

    await page.locator(`button.flex-1.text-left`, { hasText: feed.slice(0, 20) }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
    // load enough
    for (let i = 0; i < Math.ceil(man.count / 8) + 1; i++) {
      const b = page.locator('button:has-text("Load More")').first();
      if (!(await b.count())) break;
      await b.click().catch(() => {}); await page.waitForTimeout(2000);
    }
    const urls = await page.evaluate(() => {
      return [...document.querySelectorAll('div.rounded-xl.border')]
        .filter(el => /@/.test(el.innerText))
        .map(el => {
          const ext = [...el.querySelectorAll('a[href]')].map(a => a.href)
            .filter(h => !/threadverse\.ai/.test(h));
          return ext[0] || null;
        });
    });
    let n = 0;
    man.cards.forEach((c, i) => { if (urls[i]) { c.url = urls[i]; n++; } });
    fs.writeFileSync(mPath, JSON.stringify(man, null, 2));
    console.log(`  🔗 ${feed}: ${n}/${man.cards.length} urls`);
  }
  await ctx.close();
  console.log('✅ urls enriched');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
