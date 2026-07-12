/**
 * Direct auto-poster for X · Bluesky · Mastodon — no Postiz, no server. Zero npm deps
 * (native fetch). Reads postiz/queue.json, posts every item whose scheduled time is due
 * (<= now), uploads its image + caption via each platform's native API, records posted.json.
 *
 * Designed to run on a cron (GitHub Actions or local). Each run posts what's due since last run.
 *
 * Env (set as GitHub secrets or local exports):
 *   BLUESKY_HANDLE, BLUESKY_APP_PASSWORD
 *   MASTODON_BASE_URL (e.g. https://mastodon.social), MASTODON_ACCESS_TOKEN
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET     (OAuth 1.0a user context)
 *   POST_NOW=1    optional — ignore schedule, post the next due-or-future item per platform
 *   DRY_RUN=1     optional — log what would post, no API calls
 *   MAX_PER_RUN=10  optional — cap posts per run
 *
 *   node autopost/post.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const QUEUE = path.join(__dirname, 'queue.json');
const POSTED = path.join(__dirname, 'posted.json');
const DRY = process.env.DRY_RUN === '1';
const NOW_MODE = process.env.POST_NOW === '1';
const MAX = parseInt(process.env.MAX_PER_RUN || '20', 10);
// Cap posts PER PLATFORM per run so a backlog of overdue items drips instead of dumping.
const MAX_PER_PLATFORM = parseInt(process.env.MAX_PER_PLATFORM || '1', 10);

const nowISO = () => new Date().toISOString();

// ---- image helpers (compress for Bluesky's 1MB blob limit) ------------------
let sharp = null; try { sharp = require('sharp'); } catch { /* optional */ }
async function readImage(absPath, maxBytes = 976000) {
  let buf = fs.readFileSync(absPath);
  if (buf.length <= maxBytes || !sharp) return { buf, mime: 'image/png' };
  // Re-encode to JPEG, dropping quality until under the limit.
  for (const q of [90, 80, 70, 60, 50]) {
    const out = await sharp(absPath).jpeg({ quality: q }).toBuffer();
    if (out.length <= maxBytes) return { buf: out, mime: 'image/jpeg' };
  }
  const out = await sharp(absPath).resize(1080, 1080, { fit: 'inside' }).jpeg({ quality: 55 }).toBuffer();
  return { buf: out, mime: 'image/jpeg' };
}

// ============================ BLUESKY =======================================
async function blueskyPost({ caption, imgPath }) {
  const handle = process.env.BLUESKY_HANDLE, pw = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !pw) throw new Error('BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set');
  const svc = 'https://bsky.social';
  // 1. session
  const s = await (await fetch(`${svc}/xrpc/com.atproto.server.createSession`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: pw }),
  })).json();
  if (!s.accessJwt) throw new Error('bluesky auth failed: ' + JSON.stringify(s).slice(0, 160));
  // 2. upload blob (image posts only)
  let embed = null;
  if (imgPath) {
    const { buf, mime } = await readImage(imgPath, 976000);
    const blobRes = await fetch(`${svc}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST', headers: { 'Content-Type': mime, Authorization: `Bearer ${s.accessJwt}` }, body: buf,
    });
    const blobJson = await blobRes.json();
    if (!blobJson.blob) throw new Error('bluesky blob upload failed: ' + JSON.stringify(blobJson).slice(0, 160));
    embed = { $type: 'app.bsky.embed.images', images: [{ alt: 'Threadverse', image: blobJson.blob }] };
  }
  // 3. create post (embed omitted for text-only)
  const record = {
    $type: 'app.bsky.feed.post', text: caption, createdAt: nowISO(),
    ...(embed ? { embed } : {}),
  };
  const post = await (await fetch(`${svc}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.accessJwt}` },
    body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }),
  })).json();
  if (!post.uri) throw new Error('bluesky post failed: ' + JSON.stringify(post).slice(0, 160));
  return post.uri;
}

// ============================ MASTODON ======================================
async function mastodonPost({ caption, imgPath }) {
  const base = (process.env.MASTODON_BASE_URL || '').replace(/\/$/, ''), tok = process.env.MASTODON_ACCESS_TOKEN;
  if (!base || !tok) throw new Error('MASTODON_BASE_URL / MASTODON_ACCESS_TOKEN not set');
  // 1. upload media (v2) — image posts only
  const media_ids = [];
  if (imgPath) {
    const { buf, mime } = await readImage(imgPath, 8_000_000);
    const form = new FormData();
    form.append('file', new Blob([buf], { type: mime }), 'tile.' + (mime === 'image/png' ? 'png' : 'jpg'));
    form.append('description', 'Threadverse');
    const media = await (await fetch(`${base}/api/v2/media`, { method: 'POST', headers: { Authorization: `Bearer ${tok}` }, body: form })).json();
    if (!media.id) throw new Error('mastodon media failed: ' + JSON.stringify(media).slice(0, 160));
    media_ids.push(media.id);
  }
  // 2. status (media_ids omitted when empty = text-only)
  const status = await (await fetch(`${base}/api/v1/statuses`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
    body: JSON.stringify(media_ids.length ? { status: caption, media_ids } : { status: caption }),
  })).json();
  if (!status.id) throw new Error('mastodon status failed: ' + JSON.stringify(status).slice(0, 160));
  return status.url;
}

// ============================ X (Twitter) ===================================
// OAuth 1.0a user-context. Media upload (v1.1) + tweet (v2).
function oauthHeader(method, url, extraParams, { key, secret, token, tokenSecret }) {
  const oauth = {
    oauth_consumer_key: key, oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token, oauth_version: '1.0',
  };
  const all = { ...oauth, ...extraParams };
  const paramStr = Object.keys(all).sort().map(k => `${enc(k)}=${enc(all[k])}`).join('&');
  const baseStr = [method.toUpperCase(), enc(url), enc(paramStr)].join('&');
  const signingKey = `${enc(secret)}&${enc(tokenSecret)}`;
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');
  return 'OAuth ' + Object.keys(oauth).sort().map(k => `${enc(k)}="${enc(oauth[k])}"`).join(', ');
}
const enc = s => encodeURIComponent(s).replace(/[!*'()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function xPost({ caption, imgPath }) {
  const creds = { key: process.env.X_API_KEY, secret: process.env.X_API_SECRET, token: process.env.X_ACCESS_TOKEN, tokenSecret: process.env.X_ACCESS_SECRET };
  if (!creds.key || !creds.token) throw new Error('X_API_* / X_ACCESS_* not set');
  // 1. upload media (v1.1, multipart) — image posts only
  let mediaId = null;
  if (imgPath) {
    const { buf } = await readImage(imgPath, 5_000_000);
    const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const form = new FormData();
    form.append('media', new Blob([buf]), 'tile.png');
    const mediaRes = await fetch(mediaUrl, { method: 'POST', headers: { Authorization: oauthHeader('POST', mediaUrl, {}, creds) }, body: form });
    const media = await mediaRes.json();
    if (!media.media_id_string) throw new Error('x media failed: ' + JSON.stringify(media).slice(0, 160));
    mediaId = media.media_id_string;
  }
  // 2. tweet (v2 JSON) — OAuth1 header with no body params in signature base; media omitted for text-only
  const tweetUrl = 'https://api.twitter.com/2/tweets';
  const res = await fetch(tweetUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: oauthHeader('POST', tweetUrl, {}, creds) },
    body: JSON.stringify(mediaId ? { text: caption, media: { media_ids: [mediaId] } } : { text: caption }),
  });
  const j = await res.json();
  if (!j.data?.id) throw new Error('x tweet failed: ' + JSON.stringify(j).slice(0, 200));
  return `https://x.com/i/status/${j.data.id}`;
}

const POSTERS = { bluesky: blueskyPost, mastodon: mastodonPost, x: xPost };

// ============================ RUNNER ========================================
(async () => {
  if (!fs.existsSync(QUEUE)) { console.error('No queue.json — run: node postiz/build-queue.js'); process.exit(1); }
  const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
  const posted = fs.existsSync(POSTED) ? JSON.parse(fs.readFileSync(POSTED, 'utf8')) : [];
  // dedup key: tile for image posts; a short caption-based key for text-only (no tile)
  const keyOf = p => (p.tile || ('txt:' + (p.id || (p.caption || '').replace(/\s+/g, ' ').trim().slice(0, 50)))) + '|' + p.platform;
  const doneKey = new Set(posted.map(keyOf));
  const now = new Date();

  // due = scheduled time already passed and not yet posted; NOW_MODE = ignore time
  let due = queue.filter(q => !doneKey.has(keyOf(q)))
    .filter(q => NOW_MODE || new Date(`${q.date}T${q.timeUTC}:00.000Z`) <= now);
  due.sort((a, b) => (a.date + a.timeUTC).localeCompare(b.date + b.timeUTC));
  // Cap per platform (drip, don't dump). Keeps chronological order within each platform.
  const perPlat = {};
  due = due.filter(q => {
    perPlat[q.platform] = (perPlat[q.platform] || 0);
    if (perPlat[q.platform] >= MAX_PER_PLATFORM) return false;
    perPlat[q.platform]++;
    return true;
  });
  due = due.slice(0, MAX);

  console.log(`${DRY ? 'DRY RUN — ' : ''}${due.length} due at ${now.toISOString()}`);
  let ok = 0, fail = 0;
  for (const q of due) {
    const poster = POSTERS[q.platform];
    // text-only post = no tile (or empty). Image post = tile must exist on disk.
    const textOnly = !q.tile;
    const imgPath = textOnly ? null : path.join(ROOT, q.tile);
    if (!poster) { console.log(`  ⏭️  ${q.platform} (no poster)`); continue; }
    if (!textOnly && !fs.existsSync(imgPath)) { console.log(`  ⏭️  ${q.platform} ${q.tile} (image missing)`); continue; }
    const label = q.title || q.caption?.slice(0, 44);
    if (DRY) { console.log(`  • ${q.date} ${q.timeUTC} ${q.platform}${textOnly ? ' [text]' : ''} — ${label}`); ok++; continue; }
    try {
      const url = await poster({ caption: q.caption, imgPath });
      posted.push({ tile: q.tile || null, platform: q.platform, at: now.toISOString(), url });
      fs.writeFileSync(POSTED, JSON.stringify(posted, null, 2));
      console.log(`  ✅ ${q.platform} — ${url}`);
      ok++;
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { console.log(`  ❌ ${q.platform} ${q.title?.slice(0, 30)}: ${e.message}`); fail++; }
  }
  console.log(`\nDone. ${ok} posted · ${fail} failed`);
  if (fail && !ok) process.exit(1);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
