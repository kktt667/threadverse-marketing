# Threadverse content library

Start with **`CONTENT_SHEET.md`** (every tile, grouped by platform, with caption + triggers + source link).

```
library/
├── CONTENT_SHEET.md          ← grab a tile, paste its caption, post
├── content.json              ← same data, machine-readable
│
├── 01-content-cards/         ← 218 post tiles, ORGANIZED BY PLATFORM, in 7 varied formats
│   ├── x/  bluesky/  mastodon/  instagram/  tiktok/
│   └── filename = <topic>-<card>-<format>.png   (e.g. drama-card-24-tabloid.png)
│       formats: quote · banner · splitProof · tabloid · pov · minimal · bigStat
│
├── 02-product-cards/         ← 12 VISUAL product tiles (the product is the hero)
│   └── phone-hero/ split-compare/ prompt-to-feed/ stat-on-feed/ floating-cards/ platform-web/
│
├── 05-video-assets/          ← everything for TikTok / Reels (kept separate)
│   ├── site-9x16/            landing page rendered vertical (b-roll)
│   ├── site-16x9/            landing sections horizontal (b-roll)
│   ├── scroll-frames/        24-frame landing scroll → import as image sequence in CapCut
│   ├── app-scroll/           20-frame product scroll → scrolling b-roll
│   ├── end-cards/            solid 9:16 outro frames (CTA)
│   ├── hook-overlays/        TRANSPARENT big hook text — drop on top of a clip to start it
│   ├── lower-thirds/         TRANSPARENT caption bars for mid-video context
│   └── progress-labels/      TRANSPARENT "1/5", "BEFORE", "wait for it" stingers
│
├── 03-raw-snaps/             ← source: raw card screenshots + manifest.json + copy.json (per feed)
└── 04-site-captures/         ← source: landing page + UI section captures
```

## The 7 content-card formats (why the feed never looks samey)
| Format | Looks like | Best for |
|---|---|---|
| **quote** | big typographic pull-quote, no screenshot | great one-liners, hot opinions |
| **banner** | screenshot + bold hook banner | default for visual posts |
| **splitProof** | bold claim on top → screenshot proof below | facts, hot takes |
| **tabloid** | red "caught this early" breaking strip | drama, viral, true-crime, news |
| **pov** | portrait "POV:" meme over screenshot | relatable, funny |
| **minimal** | tiny screenshot, lots of space, one line | wholesome, premium, quiet |
| **bigStat** | huge engagement number as hero | when the likes/impact are the story |

Each card's format + target platform was chosen by a vision pass that read the actual post.

## Make a TikTok/Reel fast (CapCut)
1. Base clip: a `05-video-assets/app-scroll/` or `scroll-frames/` sequence (import as image sequence) OR a `site-9x16/` still with a slow zoom.
2. Start with a `hook-overlays/` PNG (transparent) for the first 1-2s.
3. Add a `lower-thirds/` bar for context mid-clip.
4. End on an `end-cards/` frame (CTA).
5. Trending sound + captions → post.

## Regenerate / grow
```bash
node capture/harvest.js --per 40                 # more raw cards → 03-raw-snaps
#   → run the copy workflow (reads each card, writes copy.json with format+platform)
node edit/format-run.js                          # render kept cards by platform → 01-content-cards
node edit/product-visual.js                      # visual product cards → 02-product-cards
node capture/video-assets.js && node edit/video-overlays.js   # refresh video stock
node edit/build-sheet.js                         # rebuild CONTENT_SHEET.md
```
