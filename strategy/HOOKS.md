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
Line 2 = the "so what" / painpoint or the twist (why it matters to YOU)
Line 3 = soft Threadverse tie ("…this is what my feed keeps" / "found before the timeline")
+ platform hashtags (per hashtags.js: X 1–2, Bluesky 3–6, Mastodon 2–5 CamelCase)
```

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
- `caption` (≤ 200 chars for the post): 3-line recipe, ends with a soft Threadverse tie, uses "you/your" where natural.
- `lane`: one of ai | science | gaming | philosophy | crypto (or `reject` if off-niche).
- `bestPlatform`: bluesky | mastodon | x (match NICHE.md tuning).
- `stance`: optional contrarian one-liner if the topic supports a hot take.
- `score` 1–10 (hook strength + on-niche fit + emotion). keep=false if off-niche or weak.
