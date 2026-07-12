# Hook & Caption Framework (distilled from the short-form playbooks)

The caption's first line IS the hook. On a static post it's what stops the scroll. Every rewrite
must pass this framework. This doubles as the spec the caption-writer (vision agents) writes to.

## A hook has ONE job
Make the viewer opt in. It does that with exactly two things:
1. **Topic clarity** — instantly clear what this is about (no vague "you won't believe…").
2. **On-target curiosity** — they believe it's *for them* and want to know what's next.

## The 4 hook mistakes to eliminate (checklist)
1. **Delay** → get to the topic/value in the FIRST line. No wind-up. Speed to value.
2. **Confusion** → 6th-grade clarity. Short, simple, ACTIVE voice. One possible interpretation only.
3. **Irrelevance** → use **"you / your"** (not "I / me"); agitate a painpoint they *already have*.
4. **Disinterest** → build **contrast**: A (what they believe) vs B (your surprising alternative).
   - Stated: "Most X do Y, but this does Z 3× faster."
   - Implied: "This does Z 8× better." (baseline understood)

## The caption recipe (static post)
```
Line 1 = HOOK: topic clarity + contrast/curiosity (the surprising fact itself, framed sharp)
Line 2 = THE TAKE (mandatory): a contrarian angle, a non-obvious mechanism, or a reframe the reader
         hasn't heard. NOT a summary of line 1. This is the whole point — see the anti-regurgitation rule.
Line 3 = feed tie — VARIED and OPTIONAL (~60% of posts; drop it on the strongest takes). Rotate wording;
         never reuse "my feed keeps"/"before the timeline" back-to-back. Bio carries the funnel.
+ platform hashtags (per hashtags.js: X 1–2, Bluesky 3–6, Mastodon 2–5 CamelCase) — MUST match the lane.
```

## THE anti-regurgitation rule (the one that decides solution vs entertainment bucket)
The avatar is a sharp HN-reading dev — they already saw the headline this morning. A caption that just
**restates the news files as "entertainment"** (pleasant scroll, zero trust, zero convert) or worse,
"irrelevant." Only a genuinely **new take** files as "potential solution" — the bucket that builds trust and
drives the bio-tap. (See PSYCHOLOGY.md Checkpoint 0.)
- **The test:** would this dev think *"huh, hadn't thought of that"* — or *"yeah, I know"*? If "I know" → reject, rewrite the take.
- **Line 2 fails if it's a summary.** "Alibaba beats DeepSeek. China's model war has a second front." ← both lines
  are the news. No take. ❌ Fix: add the non-obvious angle — *why* it matters to a builder, the mechanism, the
  contrarian read. "Alibaba beats DeepSeek — and open weights mean the West's closed-model moat just sprung a leak
  the labs can't patch." ✅ (now there's something to agree/disagree with).
- **Never end 60+ posts on the same 6 taglines.** To the fingerprint AND a human, identical closers = "botted."

## Text-only takes (no image — extends content runtime)
A sharp take needs no tile. On X/Bluesky/Mastodon a pure text take often *outperforms* an image post — no
picture to "explain," just signal, and text is exactly what the algorithm's fingerprint reads as the
"solution" bucket. Decoupling takes from rendered cards means our runtime isn't capped by how many tiles exist.
- **Author them in `library/text-takes.json`:** `[{ caption, topic, platforms?: [...], score? }]`. Omit
  `platforms` to fan out to all autopost platforms (Bluesky + Mastodon; X is manual). `build-queue.js` merges
  them in as tile-less posts; `post.js` posts them with no media.
- **Same bar as captions:** every text take MUST pass the anti-regurgitation rule above — a real take, not a
  restated headline. These are pure takes (no news peg needed), so the bar is *higher*, not lower.
- **Mix, don't flood:** aim for a healthy ratio of text takes to image posts so the feed looks human, not botted.

## Engagement / comment drivers (use, don't overuse)
- **Hard, contrarian stance** — pick a side; contrarian > hedging. (Great for AI/philosophy takes.)
- **Emotion** — surprise, awe, mild outrage. Feeling → comment.
- **Cult-loved entities** — name the AI models, studios, chains, thinkers people already have opinions on.
- **A question that invites a reply** — but only when natural.

## Good vs bad (our niches)
- ❌ "This AI news is crazy, wait for it." (delay + vague)
- ✅ "A Chinese lab trained a frontier model on 11× less compute. The brute-force era might be over. This is the stuff my feed catches before the timeline. #AI"
- ❌ "I love this philosophy quote." (I/me, no contrast)
- ✅ "Everyone thinks 'losing an argument' means being wrong. This 516-like post says it means your ideology was never a philosophy. Found in my Threadverse feed. #Philosophy"

## Rewriter spec (for the vision agents)
For each card, LOOK at the image, then write:
- `hook` (≤ 12 words, on-image title): line 1 above — clarity + contrast, no "wait really".
- `take` (**mandatory**): the non-obvious angle/mechanism/reframe = line 2. MUST pass the anti-regurgitation
  test above. If you can only summarize the headline, the card is weak → set keep=false. This is line 2 of the caption.
- `caption` (≤ 200 chars): hook + take, optional varied feed tie (~60%), "you/your" where natural. NO template closer.
- `lane`: one of ai | science | gaming | philosophy | crypto (or `reject` if off-niche).
- `bestPlatform`: bluesky | mastodon | x (match NICHE.md tuning).
- `score` 1–10 = **take strength first**, then hook + on-niche fit + emotion. keep=false if the take is a summary,
  off-niche, or the hashtags wouldn't match the lane. A sharp fact with no take is NOT a keep.
- Verify: does `lane` match what the hashtags will be? (e.g. an antitrust story is not #Crypto.)
