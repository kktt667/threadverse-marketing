/**
 * High-volume harvester — grab LOTS of individual post cards from many feeds, fast.
 *
 * These are the raw "clips": memes, funny posts, cursed comments, wholesome bits, facts.
 * Each is saved as a clean, isolated card image into library/snaps/<feed>/card-NN.png
 * (the editor step then works them into finished content).
 *
 * Usage:
 *   node capture/harvest.js                       # harvest all existing feeds, ~24 cards each
 *   node capture/harvest.js --per 40              # more cards per feed
 *   node capture/harvest.js --feeds "crypto,Wildlife Wonders"
 *   node capture/harvest.js --session free
 *   node capture/harvest.js --create-pack         # first spin up meme-rich marketing feeds, then harvest
 *
 * Also dumps a manifest library/snaps/<feed>/manifest.json with the text/handle/source/likes
 * of every card, so the editor + you can pick the best ones without re-opening images.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const arg = (n, d = null) => {
  const i = process.argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = process.argv[i + 1];
  return (!v || v.startsWith('--')) ? true : v;
};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function resolveProfile() {
  const want = arg('session', 'pro');
  const p = path.join(__dirname, 'sessions', want, 'tv-profile');
  if (fs.existsSync(p)) return p;
  const legacy = path.join(__dirname, 'sessions', 'tv-profile');
  if (fs.existsSync(legacy)) return legacy;
  throw new Error(`No session "${want}". Run: node capture/login.js --email <addr> --session ${want}`);
}

// Meme/content-rich feeds worth spinning up for a big variety of editable cards.
const PACK = [
  { name: 'Cursed Comments',  query: 'the funniest single replies and cursed comments people posted online today, surreal one-liners and unhinged but hilarious takes' },
  { name: 'Wholesome',        query: 'genuinely wholesome and uplifting posts today, small kind moments, things that restore your faith in people' },
  { name: 'Mind-Blowing Facts', query: 'genuine "wait, what?" facts and surprising discoveries, weird history, science that overturns what you assumed' },
  { name: 'Internet Chaos',   query: 'the most chaotic funny viral posts and memes everyone is quoting right now' },
  { name: 'Tech Hot Takes',   query: 'spicy but smart tech and startup hot takes and arguments worth reading today' },
];

async function gotoApp(page) {
  await page.goto('https://www.threadverse.ai/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=THREADS', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
}
async function listFeeds(page) {
  return page.evaluate(() => [...document.querySelectorAll('button.flex-1.text-left')].map(e => (e.innerText || '').trim()).filter(Boolean));
}
async function openFeed(page, name) {
  // Match by exact text content in-page (quote-safe — avoids CSS :has-text escaping issues).
  const clicked = await page.evaluate((target) => {
    const btns = [...document.querySelectorAll('button.flex-1.text-left')];
    const el = btns.find(b => (b.innerText || '').trim() === target) || btns.find(b => (b.innerText || '').trim().startsWith(target.slice(0, 20)));
    if (el) { el.click(); return true; }
    return false;
  }, name);
  if (!clicked) throw new Error(`feed not found: ${name}`);
  await page.waitForTimeout(3000);
}
async function loadMore(page, times) {
  for (let i = 0; i < times; i++) {
    const btn = page.locator('button:has-text("Load More")').first();
    if (!(await btn.count())) break;
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click().catch(() => {});
    await page.waitForTimeout(2500);
  }
}

async function createFeed(page, name, query) {
  const before = await listFeeds(page);
  // Open the create screen; the textarea must appear. Retry the New-thread click if not.
  const ta = page.locator('textarea[placeholder*="ideal feed" i]').first();
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.locator('button[aria-label="New thread"], button[title="New thread"]').first().click().catch(() => {});
    try { await ta.waitFor({ state: 'visible', timeout: 6000 }); break; }
    catch { await page.waitForTimeout(1000); }
  }
  await ta.fill(query);
  await page.waitForTimeout(400);
  const build = page.locator('button:has-text("Build Feed")').first();
  await build.waitFor({ state: 'visible', timeout: 10000 });
  await build.click();
  // Wait until a NEW feed appears in the sidebar (more reliable than a fixed sleep).
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1500);
    const now = await listFeeds(page);
    const fresh = now.find(n => !before.includes(n));
    if (fresh) { await page.waitForTimeout(2500); return fresh; }
  }
  return name;
}

async function harvestFeed(page, name, per) {
  const dir = path.join(ROOT, 'library', '03-raw-snaps', slug(name));
  fs.mkdirSync(dir, { recursive: true });
  await openFeed(page, name);
  // Load enough posts to have plenty to choose from.
  await loadMore(page, Math.ceil(per / 8) + 1);

  const cards = page.locator('div.rounded-xl.border').filter({ hasText: '@' });
  const count = await cards.count();
  const manifest = [];
  let shot = 0;
  for (let i = 0; i < count && shot < per; i++) {
    const card = cards.nth(i);
    try {
      const box = await card.boundingBox();
      if (!box || box.height < 90 || box.width < 200) continue;
      // skip absurdly tall cards (broken video embeds) for clean snaps
      if (box.height > 1400) continue;
      await card.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
      const meta = await card.evaluate(el => {
        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        const handle = (txt.match(/@[a-z0-9_.\-]+/i) || [])[0] || '';
        const source = (txt.match(/\b(bluesky|mastodon|hackernews|hacker news|youtube|x)\b/i) || [])[0] || '';
        const hasVideo = !!el.querySelector('video');
        const hasImg = !!el.querySelector('img');
        return { txt: txt.slice(0, 400), handle, source, hasVideo, hasImg };
      });
      shot++;
      const file = `card-${String(shot).padStart(2, '0')}.png`;
      await card.screenshot({ path: path.join(dir, file) });
      manifest.push({ file, ...meta });
    } catch { /* skip */ }
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ feed: name, count: shot, cards: manifest }, null, 2));
  console.log(`  🧺 ${name}: ${shot} cards → library/snaps/${slug(name)}/`);
  return shot;
}

(async () => {
  const per = +(arg('per', 24));
  const ctx = await chromium.launchPersistentContext(resolveProfile(), { headless: true, viewport: { width: 1440, height: 1400 } });
  const page = ctx.pages()[0] || await ctx.newPage();
  await gotoApp(page);

  let feeds;
  if (arg('feeds')) feeds = arg('feeds').split(',').map(s => s.trim());
  else feeds = await listFeeds(page);

  if (arg('create-pack')) {
    console.log('🆕 spinning up meme-rich feeds…');
    for (const p of PACK) {
      const existing = await listFeeds(page);
      // skip if a feed whose query/name clearly matches already exists
      if (existing.some(n => {
        const nl = n.toLowerCase();
        return nl.includes(p.name.toLowerCase().slice(0, 8)) || nl.includes(p.query.toLowerCase().slice(0, 12));
      })) { console.log(`  · ${p.name} exists`); continue; }
      try {
        const real = await createFeed(page, p.name, p.query);
        console.log(`  + created "${real}"`);
        await gotoApp(page); // return to a clean app state before the next create
      } catch (e) {
        console.log(`  ⚠️ create "${p.name}" failed (${e.message.split('\n')[0]}) — continuing`);
        await gotoApp(page); // reset state so the next create/harvest isn't stuck
      }
    }
    feeds = await listFeeds(page);
  }

  console.log(`\n🌾 Harvesting ${feeds.length} feeds, up to ${per} cards each:\n`);
  let total = 0;
  for (const f of feeds) {
    try { total += await harvestFeed(page, f, per); }
    catch (e) { console.log(`  ⚠️ ${f}: ${e.message}`); }
  }
  console.log(`\n✅ Harvested ${total} cards into library/snaps/`);
  await ctx.close();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
