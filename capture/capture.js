/**
 * Threadverse product-shot capture — generates REAL marketing assets from the live app.
 *
 * Reuses the persisted authenticated session (capture/sessions/tv-profile).
 *
 * Modes
 * ─────
 *  Capture existing threads (before/after, desktop + true mobile):
 *    node capture/capture.js --date 2026-06-29
 *    node capture/capture.js --thread "Cursed Comments" --refresh
 *
 *  Create a NEW marketing feed, then capture it:
 *    node capture/capture.js --create "10 funny videos to fix a doomscroll" \
 *         --query "the funniest short videos and posts today that would brighten someone's day" \
 *         --platforms "Bluesky,Mastodon"
 *
 *  Spotlight individual standout posts ("Threadverse found it first"):
 *    node capture/capture.js --thread "Latest Events" --spotlight 5
 *
 * Flags
 *   --date <str>        output folder under assets/raw/ (default "session")
 *   --thread <name>     capture only this thread
 *   --create <name>     create a feed with this name (uses --query, optional --platforms)
 *   --query <text>      the natural-language feed prompt (defaults to the name)
 *   --platforms <list>  comma list e.g. "Hacker News,Bluesky,Mastodon" (free plan)
 *   --refresh           click Refresh before shooting (fresh posts)
 *   --spotlight <n>     also crop the first N individual post cards as standalone shots
 *   --mobile-only       skip desktop shots
 *   --desktop-only      skip mobile shots
 *
 * Output: assets/raw/<date>/<slug>/
 *   after.png  before.png                 (desktop, full feed)
 *   mobile-after.png  mobile-before.png    (TRUE mobile render, iPhone 13 Pro @2x)
 *   spotlight-01.png … (individual post cards, when --spotlight)
 */
const { chromium, devices } = require('playwright');
const { sanitize } = require('./sanitize');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const APP_URL = 'https://www.threadverse.ai/app';
const MOBILE = devices['iPhone 13 Pro'];

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (!v || v.startsWith('--')) ? true : v;
}

// --session free|pro  (default: pro if it exists, else free). Selects which login profile to use.
function resolveProfile() {
  const want = arg('session');
  const candidates = want ? [want] : ['pro', 'free'];
  for (const c of candidates) {
    const p = path.join(__dirname, 'sessions', c, 'tv-profile');
    if (fs.existsSync(p)) return { dir: p, name: c };
  }
  // Back-compat with the old flat location.
  const legacy = path.join(__dirname, 'sessions', 'tv-profile');
  if (fs.existsSync(legacy)) return { dir: legacy, name: 'legacy' };
  throw new Error('No session found. Run: node capture/login.js --email <addr> --session <free|pro>');
}
const PROFILE = resolveProfile();
const PROFILE_DIR = PROFILE.dir;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const date = () => arg('date', 'session');

async function newCtx(mobile) {
  return chromium.launchPersistentContext(PROFILE_DIR, mobile
    ? { headless: true, ...MOBILE }
    : { headless: true, viewport: { width: 1440, height: 1100 } });
}

async function gotoApp(page) {
  // The app holds a live connection open, so 'networkidle' never fires — use domcontentloaded
  // then wait for an actual app element (the sidebar THREADS header) to confirm it loaded.
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  if (!page.url().includes('/app')) {
    throw new Error('Session expired — re-run capture/login.js to refresh login.');
  }
}

async function listThreads(page) {
  return page.evaluate(() => {
    const names = [];
    document.querySelectorAll('button.flex-1.text-left').forEach(el => {
      const t = (el.innerText || '').trim().replace(/\s+/g, ' ');
      if (t && t.length <= 60) names.push(t);
    });
    return [...new Set(names)];
  });
}

async function openThread(page, name) {
  await page.locator(`button.flex-1.text-left:has-text("${name}")`).first().click();
  await page.waitForTimeout(3000);
}

async function closeMobileDrawer(page) {
  // On mobile the sidebar drawer overlays the feed. The collapse control is a small
  // unlabeled chevron button (~22x22) sitting on the drawer's right edge. Find the
  // narrow unlabeled button in the upper-left region and click it; fall back to tapping
  // the exposed feed area on the right.
  const vp = page.viewportSize();
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const handle = btns.find(b => {
      const r = b.getBoundingClientRect();
      const labelled = (b.innerText || b.getAttribute('aria-label') || b.getAttribute('title') || '').trim();
      return !labelled && r.width > 10 && r.width < 34 && r.height > 10 && r.height < 40 && r.x < 400 && r.y > 60 && r.y < 700;
    });
    if (handle) { handle.click(); return true; }
    return false;
  });
  if (!clicked && vp) {
    // Tap the visible feed strip on the far right to dismiss the drawer.
    await page.mouse.click(vp.width - 20, Math.round(vp.height / 2)).catch(() => {});
  }
  await page.waitForTimeout(1200);
}

async function setRejected(page, on) {
  const btn = page.locator('button:has-text("rejected")').first();
  if (!(await btn.count())) return;
  const label = (await btn.innerText().catch(() => '')).toLowerCase();
  const isOn = label.includes('hide');
  if (on !== isOn) { await btn.click().catch(() => {}); await page.waitForTimeout(2500); }
}

async function refresh(page) {
  const btn = page.locator('button:has-text("Refresh")').first();
  if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(6000); }
}

async function renameThread(page, fromName, toName) {
  // Hover the thread row to reveal the "Rename thread" control, click it, type the new name.
  const row = page.locator(`button.flex-1.text-left:has-text("${fromName}")`).first();
  if (!(await row.count())) return false;
  await row.hover().catch(() => {});
  await page.waitForTimeout(400);
  const rename = row.locator('xpath=following-sibling::button[@aria-label="Rename thread" or @title="Rename thread"]')
    .or(page.locator('button[aria-label="Rename thread"], button[title="Rename thread"]')).first();
  if (!(await rename.count())) return false;
  await rename.click().catch(() => {});
  await page.waitForTimeout(600);
  // An inline input/textarea appears; replace its contents.
  const input = page.locator('input:visible, textarea:visible').first();
  await input.fill(toName).catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(1200);
  return true;
}

async function createFeed(page, name, query, platforms) {
  const before = await listThreads(page);
  await page.locator('button[aria-label="New thread"], button[title="New thread"]').first().click();
  await page.waitForTimeout(2000);
  // Toggle platform chips: turn OFF any active chip not requested, ON any requested chip that's off.
  if (platforms) {
    const want = new Set(platforms.split(',').map(s => s.trim().toLowerCase()));
    const chips = await page.locator('button', { hasText: /^(Hacker News|Bluesky|Mastodon|YouTube|X|Medium|Lemmy|arXiv)/ }).all();
    for (const chip of chips) {
      const label = (await chip.innerText()).trim().toLowerCase();
      const base = label.split(/\s|·/)[0];
      const active = await chip.evaluate(el => !/text-white\/4|opacity/.test(el.className) && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)');
      const isWanted = [...want].some(w => label.startsWith(w) || w.startsWith(base));
      if (isWanted !== active && !/pro|soon/i.test(label)) { await chip.click().catch(() => {}); await page.waitForTimeout(300); }
    }
  }
  const ta = page.locator('textarea[placeholder*="ideal feed" i]').first();
  await ta.fill(query || name);
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Build Feed")').first().click();
  console.log(`  ⏳ building "${name}" — waiting for AI curation…`);
  // Wait for the feed to render (post count / cards appear).
  await page.waitForTimeout(18000);
  // The app auto-names the thread from the query. Find the new one and rename it to our name.
  const after = await listThreads(page);
  const created = after.find(n => !before.includes(n)) || after[after.length - 1];
  if (created && created !== name) {
    const ok = await renameThread(page, created, name);
    if (!ok) {
      console.log(`  ℹ️ couldn't rename — capturing under its auto-name: "${created}"`);
      return created;
    }
  }
  return name;
}

async function shootDesktop(page, dir, base) {
  fs.mkdirSync(dir, { recursive: true });
  await sanitize(page);
  await page.screenshot({ path: path.join(dir, `${base}.png`) });
  console.log(`  📸 ${path.relative(ROOT, dir)}/${base}.png`);
}

async function shootMobile(page, dir, base) {
  fs.mkdirSync(dir, { recursive: true });
  await closeMobileDrawer(page);
  await sanitize(page);
  await page.screenshot({ path: path.join(dir, `mobile-${base}.png`) });
  console.log(`  📱 ${path.relative(ROOT, dir)}/mobile-${base}.png`);
}

async function spotlightPosts(page, dir, n) {
  fs.mkdirSync(dir, { recursive: true });
  // Feed post cards have this exact signature: div.rounded-xl.border with a faint bg.
  const cards = page.locator('div.rounded-xl.border').filter({ hasText: '@' });
  const count = await cards.count();
  let shot = 0;
  for (let i = 0; i < count && shot < n; i++) {
    const card = cards.nth(i);
    try {
      const box = await card.boundingBox();
      if (!box || box.height < 90 || box.width < 200) continue;
      await card.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(300);
      shot++;
      await card.screenshot({ path: path.join(dir, `spotlight-${String(shot).padStart(2, '0')}.png`) });
      console.log(`  ✨ spotlight-${String(shot).padStart(2, '0')}.png`);
    } catch { /* skip cards that fail to shoot (e.g. mid-scroll) */ }
  }
  if (!shot) console.log('  (no spotlight cards matched)');
}

async function captureThread(name, opts) {
  const dir = path.join(ROOT, 'assets', 'raw', date(), slug(name));

  if (!opts.mobileOnly) {
    const ctx = await newCtx(false);
    const page = ctx.pages()[0] || await ctx.newPage();
    await gotoApp(page);
    await openThread(page, name);
    if (opts.refresh) await refresh(page);
    await setRejected(page, false);
    await shootDesktop(page, dir, 'after');
    if (opts.spotlight) await spotlightPosts(page, dir, opts.spotlight);
    await setRejected(page, true);
    await shootDesktop(page, dir, 'before');
    await setRejected(page, false);
    await ctx.close();
  }

  if (!opts.desktopOnly) {
    const ctx = await newCtx(true);
    const page = ctx.pages()[0] || await ctx.newPage();
    await gotoApp(page);
    await openThread(page, name);
    await setRejected(page, false);
    await shootMobile(page, dir, 'after');
    await setRejected(page, true);
    await shootMobile(page, dir, 'before');
    await setRejected(page, false);
    await ctx.close();
  }
}

(async () => {
  const opts = {
    refresh: !!arg('refresh'),
    spotlight: arg('spotlight') ? parseInt(arg('spotlight'), 10) : 0,
    mobileOnly: !!arg('mobile-only'),
    desktopOnly: !!arg('desktop-only'),
  };

  console.log(`🔐 session: ${PROFILE.name}  (${PROFILE_DIR.replace(ROOT + '/', '')})`);

  const createName = arg('create');
  if (createName && typeof createName === 'string') {
    const ctx = await newCtx(false);
    const page = ctx.pages()[0] || await ctx.newPage();
    await gotoApp(page);
    const realName = await createFeed(page, createName, arg('query'), arg('platforms'));
    await ctx.close();
    console.log(`✅ Created feed "${realName}". Capturing it…`);
    await captureThread(realName, opts);
    console.log('\n✅ Done. assets/raw/' + date() + '/' + slug(realName));
    return;
  }

  // Discover threads to capture.
  let threads;
  const only = arg('thread');
  if (only && typeof only === 'string') {
    threads = [only];
  } else {
    const ctx = await newCtx(false);
    const page = ctx.pages()[0] || await ctx.newPage();
    await gotoApp(page);
    threads = await listThreads(page);
    await ctx.close();
  }
  console.log('🧵 Threads:', threads.join(', ') || '(none)');

  for (const name of threads) {
    console.log(`\n▶ ${name}`);
    await captureThread(name, opts);
  }
  console.log('\n✅ Done. assets/raw/' + date() + '/');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
