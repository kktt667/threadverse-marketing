/**
 * Branded MEME CARDS rendered via HEADLESS CHROMIUM (Playwright) so real COLOR EMOJI work
 * (sharp/librsvg can't render color emoji). Durable meme formats + Threadverse jokes.
 * 1080x1350 portrait → library/08-meme-cards/
 *
 *   node edit/meme-cards-html.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'library', '08-meme-cards');
fs.mkdirSync(OUT, { recursive: true });

const BG = '#0A0A0B', FG = '#FFFFFF', DIM = '#8A8A90';
const RED = '#E5322D', GREEN = '#42C97A', YEL = '#F4C430', PURP = '#B78BFF';
const DISP = `'Avenir Next Condensed','Helvetica Neue',Arial,sans-serif`;
const BODY = `'Helvetica Neue',Arial,sans-serif`;

const shell = (inner, bg = BG) => `<!doctype html><html><head><meta charset="utf8"><style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
  html,body{width:1080px;height:1350px}
  body{background:${bg};color:${FG};font-family:${BODY};position:relative;overflow:hidden}
  .emoji{font-family:'Apple Color Emoji';font-weight:normal}
  .wm{position:absolute;left:44px;bottom:34px;font-family:${DISP};font-weight:800;font-size:26px;letter-spacing:2px}
  .url{position:absolute;right:44px;bottom:34px;color:${DIM};font-size:22px}
</style></head><body>${inner}
  <div class="wm">THREADVERSE</div><div class="url">threadverse.ai</div>
</body></html>`;

// ---- format builders (return inner HTML) ----
const drake = (no, yes) => `
  <div style="position:absolute;top:0;left:0;width:1080px;height:673px;background:#1E1416;display:flex;align-items:center">
    <div style="width:340px;text-align:center"><div class="emoji" style="font-size:150px">🙅‍♂️</div><div style="font-family:${DISP};font-size:64px;font-weight:800;color:${RED}">NOPE</div></div>
    <div style="flex:1;font-size:58px;font-weight:700;color:#EDEDF0;padding-right:50px;line-height:1.15">${no}</div>
  </div>
  <div style="position:absolute;top:677px;left:0;width:1080px;height:673px;background:#131E17;display:flex;align-items:center">
    <div style="width:340px;text-align:center"><div class="emoji" style="font-size:150px">😌👉</div><div style="font-family:${DISP};font-size:64px;font-weight:800;color:${GREEN}">THIS</div></div>
    <div style="flex:1;font-size:58px;font-weight:700;color:${GREEN};padding-right:50px;line-height:1.15">${yes}</div>
  </div>`;

const twoButtons = (a, b, sub) => `
  <div style="text-align:center;padding-top:90px;color:${DIM};font-size:44px">${sub}</div>
  <div style="display:flex;justify-content:center;gap:40px;margin-top:60px">
    <div style="width:400px;height:230px;background:#DCDCE2;color:#0A0A0B;border-radius:26px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:46px;font-weight:700;transform:rotate(-3deg);padding:20px">${a}</div>
    <div style="width:400px;height:230px;background:#DCDCE2;color:#0A0A0B;border-radius:26px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:46px;font-weight:700;transform:rotate(2deg);padding:20px">${b}</div>
  </div>
  <div style="text-align:center;margin-top:70px"><span class="emoji" style="font-size:300px">😰</span></div>
  <div style="text-align:center;margin-top:20px;color:${DIM};font-size:42px">(Threadverse does both, btw)</div>`;

const nobody = (who, does) => `
  <div style="padding:180px 60px 0">
    <div style="font-family:${DISP};font-size:72px;font-weight:800;color:${DIM}">Nobody:</div>
    <div style="font-family:${DISP};font-size:72px;font-weight:800;color:${DIM};margin-top:8px">Absolutely nobody:</div>
    <div style="height:3px;background:#26262C;margin:40px 0"></div>
    <div style="font-family:${DISP};font-size:76px;font-weight:800">${who} <span class="emoji" style="font-size:64px">😤</span></div>
    <div style="font-size:66px;font-weight:700;line-height:1.2;margin-top:30px">${does}</div>
  </div>`;

const brain = (tiers) => {
  const glows = ['#33333c', '#4a4a7a', '#6a5acd', PURP];
  const emo = ['🧠', '🧠', '✨🧠', '🌌🧠'];
  const rowH = Math.round((1350 - 40) / tiers.length);
  return tiers.map((t, i) => `
    <div style="display:flex;align-items:center;height:${rowH}px;background:${i % 2 ? '#141418' : '#0F0F13'};padding:0 40px">
      <div style="width:220px;text-align:center"><span class="emoji" style="font-size:${70 + i * 22}px;filter:drop-shadow(0 0 ${10 + i * 12}px ${glows[i]})">${emo[i]}</span></div>
      <div style="flex:1;font-size:44px;font-weight:700;line-height:1.15;color:${i === tiers.length - 1 ? PURP : '#E7E7EA'}">${t}</div>
    </div>`).join('');
};

const meExplaining = (topic, listener) => `
  <div style="height:760px;background:#17171D;padding:60px">
    <div style="color:${YEL};font-size:38px;letter-spacing:2px">ME, GESTURING WILDLY:</div>
    <div style="text-align:center;margin:20px 0"><span class="emoji" style="font-size:240px">🗣️</span></div>
    <div style="font-size:56px;font-weight:800;line-height:1.15">${topic}</div>
  </div>
  <div style="padding:60px">
    <div style="color:${DIM};font-size:36px;letter-spacing:2px">${listener}</div>
    <div style="text-align:center;margin-top:20px"><span class="emoji" style="font-size:220px">😐</span></div>
  </div>`;

const thisIsFine = (line) => `
  <div style="width:1080px;height:1350px;background:linear-gradient(#3A1D10,#120a06);padding:60px;position:relative">
    <div style="color:#E7B84E;font-size:40px;letter-spacing:3px;padding-top:60px">CURRENT SITUATION:</div>
    <div style="font-size:74px;font-weight:800;color:${YEL};line-height:1.15;margin-top:30px">${line}</div>
    <div style="text-align:center;margin-top:60px"><span class="emoji" style="font-size:260px">🔥</span></div>
    <div style="font-family:${DISP};font-size:64px;font-weight:800;color:#E7B84E;margin-top:20px">…this is fine. <span class="emoji" style="font-size:56px">🙂</span></div>
  </div>`;

const CARDS = [
  ['drake-01', shell(drake('opening 5 apps to catch up', 'one Threadverse feed'))],
  ['drake-02', shell(drake('letting the algorithm decide', 'describing what I actually want'))],
  ['drake-03', shell(drake('doomscrolling till 2am', 'the 50 posts that matter, then bed'))],
  ['drake-04', shell(drake('ads, rage-bait, engagement traps', 'a feed with zero noise'))],
  ['twobtn-01', shell(twoButtons('check the news', 'protect my peace', 'me every morning:'))],
  ['twobtn-02', shell(twoButtons('stay informed', 'stop doomscrolling', 'the eternal dilemma:'))],
  ['nobody-01', shell(nobody('My Threadverse feed:', 'here are the 50 things actually worth your time today — no ads'))],
  ['nobody-02', shell(nobody('Me at 1am:', 'let me just build ONE more feed'))],
  ['brain-01', shell(brain(['refreshing 5 apps all day', 'muting words on each one', 'building a custom RSS pipeline', 'just describing your feed in plain English']))],
  ['brain-02', shell(brain(['follow more accounts', 'follow fewer accounts', 'quit social media entirely', 'let an AI keep only the good posts']))],
  ['explain-01', shell(meExplaining("why I check ONE app now and I'm more informed than all of you", 'MY FRIENDS WHO STILL DOOMSCROLL:'))],
  ['explain-02', shell(meExplaining('that the algorithm was the problem, not my willpower', 'EVERYONE WHO BLAMED THEIR SCREEN TIME:'))],
  ['fine-01', shell(thisIsFine('my feed is 95% ads and rage-bait'))],
  ['fine-02', shell(thisIsFine('opening the app "just for 5 minutes"'))],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const [name, html] of CARDS) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForTimeout(200); // let emoji font paint
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`  😹 ${name}.png`);
  }
  await browser.close();
  console.log(`\n✅ ${CARDS.length} meme cards (real emoji) → library/08-meme-cards/`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
