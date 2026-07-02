/**
 * Persist an authenticated Threadverse session for capture.
 *
 *   node capture/login.js --email donkabc73@gmail.com --session pro
 *   node capture/login.js --email keshu.trehan@gmail.com --session free
 *
 * Flow: opens a HEADED browser, navigates to login, submits the email so Privy emails a code,
 * then polls capture/sessions/<session>/CODE.txt for the 6-digit code. The assistant (or you)
 * writes that file once the code arrives; the script enters it and persists the session under
 * capture/sessions/<session>/tv-profile so future capture runs reuse it (no re-login).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (!v || v.startsWith('--')) ? true : v;
}

const EMAIL = arg('email');
const SESSION = arg('session', 'default');
if (!EMAIL) { console.error('Usage: node capture/login.js --email <addr> --session <name>'); process.exit(1); }

const SESSION_DIR = path.resolve(__dirname, 'sessions', SESSION);
const PROFILE_DIR = path.join(SESSION_DIR, 'tv-profile');
const CODE_FILE = path.join(SESSION_DIR, 'CODE.txt');
fs.mkdirSync(SESSION_DIR, { recursive: true });
if (fs.existsSync(CODE_FILE)) fs.unlinkSync(CODE_FILE);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 1000 },
    args: ['--no-first-run'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto('https://threadverse.ai', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  for (const s of ['text=Build Your Free Feed', 'text=Get Started Free', 'text=Log in', 'text=Sign in']) {
    const el = await page.$(s);
    if (el) { await el.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(3000);

  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  if (emailInput) {
    await emailInput.fill(EMAIL);
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter').catch(() => {});
    await page.waitForTimeout(800);
    const cont = await page.$('button:has-text("Continue"), button:has-text("Submit"), button[type="submit"]');
    if (cont) await cont.click().catch(() => {});
    console.log('>>> Email submitted for', EMAIL, '— waiting for code in', CODE_FILE);
  } else {
    await page.screenshot({ path: path.join(SESSION_DIR, 'login-state.png') });
    console.log('!!! No email input found; saved login-state.png for inspection.');
  }

  let code = null;
  for (let i = 0; i < 240; i++) {
    if (fs.existsSync(CODE_FILE)) {
      const c = fs.readFileSync(CODE_FILE, 'utf8').trim();
      if (/^\d{4,8}$/.test(c)) { code = c; break; }
    }
    await page.waitForTimeout(2000);
  }

  if (code) {
    console.log('>>> Entering code', code);
    const boxes = await page.$$('input[inputmode="numeric"], input[autocomplete="one-time-code"], input[maxlength="1"]');
    if (boxes.length >= code.length) {
      for (let i = 0; i < code.length; i++) { await boxes[i].fill(code[i]); await page.waitForTimeout(80); }
    } else {
      const single = await page.$('input[autocomplete="one-time-code"], input[inputmode="numeric"], input[type="text"]');
      if (single) await single.fill(code);
    }
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter').catch(() => {});
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(SESSION_DIR, 'after-login.png') });
    console.log('>>> Logged in. Session persisted at', PROFILE_DIR);
  } else {
    console.log('!!! No code received in time.');
  }
  await page.waitForTimeout(2000);
  await ctx.close();
})();
