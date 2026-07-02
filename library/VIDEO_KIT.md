# Threadverse Video Kit

Everything here is for building TikToks / Reels in CapCut. **You film/screen-record the app clips
yourself**; drop these branded pieces between and over your footage.

All cards are 9:16 (1080×1920) or portrait (1080×1350) — full-screen, ready to cut in.

```
library/
├── 07-cut-cards/          ← full-screen cards to CUT BETWEEN your clips
│   ├── hooks/       (12)  open the video (0-2s attention grab) — "your feed is 95% noise"
│   ├── transitions/ (9)   single smash words — BEFORE / AFTER / noise / signal / vs
│   ├── breaks/      (8)   section dividers — "meanwhile…", "plot twist", "part 2"
│   ├── punchlines/  (8)   land the point — "and that's the whole app.", "no notes."
│   ├── stats/       (8)   big-number reveals — 5,000 / 50 / ~95% / £25
│   ├── questions/   (6)   end-on engagement — "what would YOUR feed be?"
│   └── cta/         (5)   closers — "Build your free feed."
│
├── 08-meme-cards/         ← branded meme FORMATS (our own art, safe to post)
│   ├── drake-*      NO/YES two-panel
│   ├── twobtn-*     two-buttons dilemma
│   ├── nobody-*     "Nobody: / Me:"
│   ├── brain-*      expanding/galaxy brain (escalating tiers)
│   ├── explain-*    "me explaining X to my friends who still doomscroll"
│   └── fine-*       "this is fine" (95% ads/rage-bait)
│
└── 05-video-assets/       ← extra b-roll stills + transparent overlays (from earlier)
    ├── site-9x16/ site-16x9/   landing-page hero stills
    ├── end-cards/              solid outro frames
    ├── hook-overlays/          TRANSPARENT text to lay OVER a clip
    ├── lower-thirds/           TRANSPARENT caption bars
    └── progress-labels/        TRANSPARENT "1/5", "BEFORE", "wait for it"
```

## How to build a 10-15s video (CapCut)
A reliable structure — each piece is one item above:

1. **HOOK** (`07-cut-cards/hooks/`) — 1-1.5s. Grab attention.
2. **YOUR CLIP** — 2-4s. Screen-record the app (scroll a feed / toggle Show rejected). *You film this.*
3. **TRANSITION** (`transitions/`) — 0.3s smash cut. e.g. "BEFORE" → your noisy clip → "AFTER" → clean clip.
4. **YOUR CLIP** — 2-4s. The clean/curated result.
5. **PUNCHLINE or STAT** (`punchlines/` or `stats/`) — 1.5s. Land it.
6. **CTA** (`cta/`) — 1.5s. Close.

Add a `05-video-assets/lower-thirds/` bar over your clips for context, and a trending sound.

## Meme-first variant (even faster)
1. A `08-meme-cards/` card as the whole first 3s (static, with a trending sound).
2. Cut to 1 short app clip proving the joke.
3. End on a `cta/` card.

## Volume math (a month of videos)
- **56 cut-cards + 14 meme cards = 70 branded pieces**, reusable across videos.
- Mix-and-match: any hook × any clip × any punchline × any CTA = hundreds of combinations.
- That's comfortably a month+ of daily 10-15s videos without repeating a combo.

## Regenerate / add more
```bash
node edit/cut-cards.js     # regenerate / edit the text arrays to add cards
node edit/meme-cards.js    # add meme variants (drake/twoButtons/nobody/brain/…)
```
Edit the text arrays at the bottom of each script to spin up more variants instantly.
```
```
