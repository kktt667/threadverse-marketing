/**
 * Capture high-res SOURCE material for video clips:
 *   - tall full-page site capture (for scroll b-roll)
 *   - tall feed captures per feed (mobile, full column) → scroll b-roll of real content
 *   - before/after pairs for the reveal clip
 *   - hero + section stills for pan/zoom
 *
 * Output → video-src/
 *   node capture/video-src.js [--session pro]
 */
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const { sanitize } = require('./sanitize');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'video-src');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };
const SESSION = arg('session', 'pro');
fs.mkdirSync(OUT, { recursive: true });
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

// Collapse the mobile sidebar drawer via the small unlabeled ‹ handle, and confirm it worked
// (a feed post card should be visible near the left edge afterward).
async function collapseSidebar(page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const open = await page.evaluate(() => {
      // sidebar considered OPEN if a THREADS sidebar item is visible in the left ~60% of screen
      const t = [...document.querySelectorAll('button.flex-1.text-left')].some(b => {
        const r = b.getBoundingClientRect(); return r.width > 0 && r.x < 300 && r.y > 100;
      });
      return t;
    });
    if (!open) return true;
    // click the collapse handle: small unlabeled square button on the drawer's right edge
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => {
        const r = x.getBoundingClientRect();
        const l = (x.innerText || x.getAttribute('aria-label') || x.getAttribute('title') || '').trim();
        return !l && r.width > 12 && r.width < 34 && r.height > 12 && r.height < 40 && r.x > 220 && r.x < 340 && r.y > 200 && r.y < 700;
      });
      if (b) { b.click(); return true; }
      return false;
    });
    if (!clicked) {
      // fallback: tap far-right feed area to dismiss
      const vp = page.viewportSize();
      await page.mouse.click(vp.width - 15, Math.round(vp.height / 2)).catch(() => {});
    }
    await page.waitForTimeout(900);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();

  // Site: tall full page + hero + sections (high DPI)
  {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
    await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'site-tall.png'), fullPage: true });
    await page.screenshot({ path: path.join(OUT, 'site-hero.png') });
    console.log('  📄 site-tall.png + site-hero.png');
    await page.close();
  }

  // App feeds: tall mobile capture per feed (real content to scroll) + a couple before/after
  {
    const ctx = await chromium.launchPersistentContext(path.join(__dirname, 'sessions', SESSION, 'tv-profile'), { headless: true, ...devices['iPhone 13 Pro'], deviceScaleFactor: 2 });
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto('https://www.threadverse.ai/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const feeds = await page.evaluate(() => [...document.querySelectorAll('button.flex-1.text-left')].map(e => (e.innerText || '').trim()).filter(Boolean));
    // Prefer visual feeds for b-roll
    const want = ['Wildlife', 'Viral', 'Good News', 'I love games', 'genuinely wholesome', 'True Crime', 'Where To Next', 'crypto'];
    const pick = feeds.filter(f => want.some(w => f.toLowerCase().includes(w.toLowerCase()))).slice(0, 8);
    for (const feed of (pick.length ? pick : feeds.slice(0, 6))) {
      await page.evaluate((t) => { const b = [...document.querySelectorAll('button.flex-1.text-left')].find(x => (x.innerText || '').trim().startsWith(t.slice(0, 15))); if (b) b.click(); }, feed);
      await page.waitForTimeout(2800);
      // Collapse the sidebar with the ‹ button, then CONFIRM the feed is visible before capturing.
      await collapseSidebar(page);
      // load more so the tall capture has lots of content
      for (let i = 0; i < 3; i++) { const btn = page.locator('button:has-text("Load More")').first(); if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(2000); } }
      // re-assert collapsed (loading can nudge layout), then capture the clean feed column
      await collapseSidebar(page);
      await sanitize(page);
      await page.screenshot({ path: path.join(OUT, `feed-${slug(feed)}-tall.png`), fullPage: true });
      console.log(`  📱 feed-${slug(feed)}-tall.png`);
    }
    await ctx.close();
  }

  // Desktop before/after for the reveal
  {
    const ctx = await chromium.launchPersistentContext(path.join(__dirname, 'sessions', SESSION, 'tv-profile'), { headless: true, viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto('https://www.threadverse.ai/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button.flex-1.text-left')].find(x => /wildlife|viral|good news/i.test(x.innerText || '')); if (b) b.click(); });
    await page.waitForTimeout(3000);
    await sanitize(page);
    // AFTER (clean)
    await page.screenshot({ path: path.join(OUT, 'ba-after.png') });
    // toggle Show rejected → BEFORE (noise)
    const rej = page.locator('button:has-text("rejected")').first();
    if (await rej.count()) { await rej.click().catch(() => {}); await page.waitForTimeout(2500); await sanitize(page); await page.screenshot({ path: path.join(OUT, 'ba-before.png') }); }
    console.log('  🔀 ba-before.png + ba-after.png');
    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ video source → video-src/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
