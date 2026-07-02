# Auto-posting — X · Bluesky · Mastodon (free, no server)

Posts your library to X/Bluesky/Mastodon on a schedule via **GitHub Actions** (runs in the cloud,
so your Mac can be off). No Postiz, no VPS. Instagram + TikTok stay manual.

## How it works
- `autopost/build-queue.js` → builds `queue.json`: a smart schedule, **time-sensitive first**
  (tabloid/drama/viral/good-news), then evergreen, 6/day/platform. Auto-drops tiles you deleted.
- `autopost/post.js` → posts everything in the queue whose time has passed, via each platform's
  native API. Records `posted.json` so nothing double-posts.
- `.github/workflows/autopost.yml` → runs `post.js` every 2 hours in GitHub's cloud and commits
  `posted.json` back.

## One-time setup

### A. Get your tokens

**Bluesky** (2 min)
1. Bluesky → Settings → **App Passwords** → Add App Password → copy it.
2. You'll use your handle (e.g. `you.bsky.social`) + that app password.

**Mastodon** (2 min)
1. Your instance → Preferences → **Development** → New Application.
2. Scopes: check `write:statuses` and `write:media`. Create → copy **Your access token**.
3. Note your instance URL (e.g. `https://mastodon.social`).

**X / Twitter** (~15 min — the fiddly one)
1. developer.x.com → sign up for the **Free** tier → create a **Project + App**.
2. In the app's **User authentication settings**: enable OAuth 1.0a, permission **Read and write**.
3. Keys and tokens tab → generate: **API Key + Secret** (consumer) and **Access Token + Secret**
   (make sure the access token shows "Read and Write" — regenerate it after setting permissions).
   Free tier = ~500 posts/month, plenty for a few/day.

### B. Put the repo on GitHub
```bash
cd threadverse_marketing
git init && git add -A && git commit -m "threadverse marketing + autopost"
# create a PRIVATE repo on github.com, then:
git remote add origin git@github.com:YOU/threadverse-marketing.git
git push -u origin main
```
> `.gitignore` already excludes `capture/sessions/` (login cookies) and `assets/raw/`. The library
> images ARE committed (the poster needs them in the cloud). Keep the repo **private**.

### C. Add the secrets
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret | Value |
|---|---|
| `BLUESKY_HANDLE` | `you.bsky.social` |
| `BLUESKY_APP_PASSWORD` | the app password |
| `MASTODON_BASE_URL` | `https://mastodon.social` (your instance) |
| `MASTODON_ACCESS_TOKEN` | the access token |
| `X_API_KEY` | consumer API key |
| `X_API_SECRET` | consumer API secret |
| `X_ACCESS_TOKEN` | access token (read+write) |
| `X_ACCESS_SECRET` | access token secret |

*(Only add the ones you want — if you skip X's secrets, X posts just error and the others still go.)*

## Go live
```bash
node autopost/build-queue.js --per-day 6 --days 20   # build/refresh the schedule
git add autopost/queue.json library/content.json && git commit -m "queue" && git push
```
Then in GitHub → **Actions → autopost → Run workflow**:
- First run: tick **Dry run** to confirm it sees due items (no real posts).
- Then tick **Post now** once to fire one test post per platform and confirm your tokens work.
- After that, leave it — the 2-hourly schedule posts everything at its queued time automatically.

## Test locally first (optional)
```bash
export BLUESKY_HANDLE=... BLUESKY_APP_PASSWORD=...
export MASTODON_BASE_URL=... MASTODON_ACCESS_TOKEN=...
DRY_RUN=1 node autopost/post.js        # see what's due
POST_NOW=1 node autopost/post.js       # actually post one per platform (real!)
```

## Day-to-day
- **Add content?** Re-run `build-queue.js`, commit `queue.json` + `content.json`, push. New items schedule automatically.
- **Change cadence?** `--per-day 5`, or edit the cron in `autopost.yml`.
- **Reorder priority?** Edit `priority()` in `build-queue.js`.
- `posted.json` is the "already sent" ledger — don't delete it.
