/**
 * Capture the website + app in VIDEO-READY formats for TikTok / Instagram Reels.
 * Produces clean, chrome-free frames you can drop straight into CapCut.
 *
 * Output → library/05-video-assets/
 *   site-9x16/         full landing page rendered at 1080x1920 (vertical hero b-roll)
 *   site-16x9/         landing sections at 1920x1080 (horizontal b-roll)
 *   scroll-frames/     a numbered frame sequence scrolling the landing page (→ CapCut "scroll" effect)
 *   app-scroll/        a numbered frame sequence scrolling a real feed on mobile (→ scrolling b-roll)
 *   hero-stills/       key moments: hero, demo before/after, pricing, "stupidly simple"
 *
 *   node capture/video-assets.js [--session pro] [--feed "Wildlife Wonders"]
 */
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', '05-video-assets');
const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); if (i === -1) return d; const v = process.argv[i + 1]; return (!v || v.startsWith('--')) ? true : v; };
const SESSION = arg('session', 'pro');
const dir = (s) => { const d = path.join(OUT, s); fs.mkdirSync(d, { recursive: true }); return d; };

(async () => {
  const browser = await chromium.launch();

  // ---- 1. Landing page, vertical 9:16 (tall b-roll) --------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    const d = dir('site-9x16');
    await page.screenshot({ path: path.join(d, 'landing-9x16.png') });
    // full page tall for panning
    await page.screenshot({ path: path.join(d, 'landing-9x16-full.png'), fullPage: true });
    console.log('  📱 site-9x16/ (2)');
    await page.close();
  }

  // ---- 2. Landing sections, horizontal 16:9 ----------------------------------
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1000);
    const d = dir('site-16x9');
    await page.screenshot({ path: path.join(d, 'hero-16x9.png') });
    // capture the "stupidly simple" and pricing regions at 16:9
    for (const [name, sel] of [['how', '#how'], ['demo', '#demo'], ['pricing', '#pricing']]) {
      const el = await page.$(sel);
      if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(700); await page.screenshot({ path: path.join(d, `${name}-16x9.png`) }); }
    }
    console.log('  🖥️  site-16x9/');
    await page.close();
  }

  // ---- 3. Scroll-frame sequence of the landing page (for CapCut motion) ------
  {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const d = dir('scroll-frames');
    const total = await page.evaluate(() => document.body.scrollHeight);
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const y = Math.round((total - 1920) * (i / (steps - 1)));
      await page.evaluate(_y => window.scrollTo(0, _y), y);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(d, `frame-${String(i).padStart(3, '0')}.png`) });
    }
    console.log(`  🎞️  scroll-frames/ (${steps} frames → import as image sequence)`);
    await page.close();
  }

  // ---- 4. App feed scroll sequence on mobile (real product b-roll) ----------
  {
    const ctx = await chromium.launchPersistentContext(path.join(__dirname, 'sessions', SESSION, 'tv-profile'), { headless: true, ...devices['iPhone 13 Pro'] });
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto('https://www.threadverse.ai/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    // open a visual feed
    const feed = arg('feed', 'Wildlife Wonders');
    await page.evaluate((t) => { const b = [...document.querySelectorAll('button.flex-1.text-left')].find(x => (x.innerText || '').trim().startsWith(t.slice(0, 15))); if (b) b.click(); }, feed);
    await page.waitForTimeout(3000);
    // close mobile drawer
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => { const r = x.getBoundingClientRect(); const l = (x.innerText || x.getAttribute('aria-label') || '').trim(); return !l && r.width > 10 && r.width < 34 && r.x < 400 && r.y > 60 && r.y < 700; }); if (b) b.click(); });
    await page.waitForTimeout(1000);
    const d = dir('app-scroll');
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      await page.screenshot({ path: path.join(d, `feed-${String(i).padStart(3, '0')}.png`) });
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(280);
    }
    console.log(`  🎞️  app-scroll/ (${steps} frames of a real feed scrolling)`);
    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ video assets → library/05-video-assets/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
