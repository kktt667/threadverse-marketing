# AI — model releases, breakthroughs, the discourse

15 scripts. Batch this whole lane before moving to the next (algorithm rewards consistency).
Each passes the 6-gate SCRIPT-CHECKLIST. ~12-18s. `[V: ...]` = visual cue; `[V: screen-record ...]` = film the app (pro session).

---

## Script 01 — [VALUE] The caching insight · lane: ai · ~15s
*Delete test: still a genuinely sharp systems observation.*
**[HOOK]** "You and a million other people run the same expensive query every morning — reading the same 5,000 posts to find the same 50 good ones. As an engineer, that should bug you."
`[V: grid of identical phones scrolling the same feed]`
**[BIG-Q]** "Anyone who's built anything sees the bug instantly. You'd cache it. Compute once, serve many. So why has nobody done that to a *feed*?"
`[V: text: "compute once, serve many?"]`
**[HEAD FAKE / ambient product]** "Turns out one app finally did — reads the 5,000 once, keeps the 50 with signal. First time I saw my feed do it, it broke my brain a little. It's just… good caching, pointed at attention."
`[V: screen-record — 5,000 collapse to 50, the app visible but not named-heavy]`
**[REHOOK]** "Which means every feed you've ever used was doing the dumb version."
`[V: a generic feed, suddenly looks primitive]`
*(no hard CTA — link in bio)*

---

## Script 02 — [STORY] Two days early · lane: ai · ~15s
*Delete test: still a relatable "how am I always early" story.*
**[HOOK]** "You know that dread when someone drops 'breaking' news in standup and you're nodding like you knew? I read today's big AI story two days ago — and I'm not more online than you."
`[V: a standup, everyone reacting to 'news' you already knew]`
**[STAKES+BIG-Q]** "Being last to know is the quiet dread of working in tech. So how do you end up early without living in the feed?"
`[V: a Slack channel lighting up late]`
**[HEAD FAKE / ambient]** "I stopped following more and started reading *higher-signal* — one feed that scans HN, X, YouTube, Bluesky and Mastodon and only shows me what matters. That story just sat there, two days before the timeline caught it."
`[V: screen-record, the post with an earlier timestamp]`
**[REHOOK]** "Which honestly makes me wonder what's sitting in there right now that I haven't opened yet."
`[V: the feed, one unread post glowing]`

---

## Script 03 — [VALUE] The reject pile is the tell · lane: ai · ~16s
*Delete test: still a real point about ranking systems + bias.*
**[HOOK]** "Every feed you use hides what it decided you shouldn't see — and you never get to check its work. One I use does the opposite, and the reject pile is the most interesting part."
`[V: a black box labeled "ranking", nothing visible]`
**[BIG-Q]** "It threw out 4,950 posts to show me 50 — and it *shows you* the 4,950. You'd expect pure spam in there, right?"
`[V: "REJECTED (4,950)" counter]`
**[HEAD FAKE]** "Mostly, yeah — rage-bait, clickbait, crypto scams. But every so often it drops something good, and you get to *rescue* it. A filter you can audit beats a black box you obey."
`[V: screen-record scrolling the reject pool, tapping "rescue"]`
**[REHOOK]** "No other feed lets you see the pile. Which should bother you more than it does."
`[V: a generic FYP, opaque]`

---

## Script 05 — [VALUE] Muting words is the wrong tool · lane: ai · ~14s
*Delete test: still a legit UX/tooling critique.*
**[HOOK]** "If your feed is still noise after muting 200 words, you're not bad at it — muting words was always the wrong tool."
`[V: an endless mute-list, noisy feed behind it]`
**[BIG-Q]** "A blocklist matches *strings*. It has no idea what a post actually *means*. So what would filtering by meaning even look like?"
`[V: text: "meaning, not keywords?"]`
**[HEAD FAKE / ambient]** "I found one that does it — you describe what you want in plain English and an AI reads each post and decides if it *means* that. First feed that ever actually got quieter."
`[V: screen-record — plain-English request → matching feed]`
**[REHOOK]** "Makes every mute button I've ever pressed feel like a hack I did because I had nothing better."
`[V: the mute-list, deleted]`

---

## Script 06 — [VALUE] Feeds have no input box · lane: ai · ~14s
*Delete test: still a sharp interface observation.*
**[HOOK]** "Here's something that'll annoy you once you notice it: you've used feeds your entire life and not one of them has an input box. You've never *told* a feed what you want."
`[V: years of feeds flashing by, none with a text field]`
**[STAKES+BIG-Q]** "You 'train' it by scrolling past stuff and hoping it infers — programming by side effect. What if you could just declare it, like a spec?"
`[V: someone scrolling, a model mis-learning]`
**[HEAD FAKE / ambient]** "One app finally added the input box. Plain English in, matching feed out, across five platforms. Declarative feeds — and now the old way feels broken."
`[V: screen-record — typing the spec, feed assembles]`
*(no hard CTA)*

---

## Script 7 — The model I almost missed · lane: ai · ~15s
*Type: S · Delete test: a huge release getting buried under a louder launch's hype is a real, relatable "the best thing isn't the loudest thing" story on its own.*
**[HOOK]** "You almost missed the best model of the month — and not because you're slacking. It dropped the same week as a louder launch and just got buried."
`[V: a release note scrolling past, drowned by a wall of hype posts]`
**[STAKES+BIG-Q]** "The good stuff doesn't always trend — sometimes the thing that changes your workflow ships quiet while everyone's dunking on the flashy one. So how do you catch the release that matters, not the one that's loud?"
`[V: two launches side by side, one screaming, one silent]`
**[HEAD FAKE]** "I only saw it because one feed I use ranks by signal, not volume — it pushed the quiet release above the hype pile. Benchmarks that actually mattered, sitting under a thousand louder takes."
`[V: screen-record, the quiet release surfaced above trending noise]`
**[REHOOK]** "Which makes me nervous about every 'best of the month' I've ever trusted — what got buried that I just never saw?"
`[V: a feed, one dim post quietly climbing to the top]`

---

## Script 08 — [VALUE] You configure everything but this · lane: ai · ~14s
*Delete test: still a real point about config culture.*
**[HOOK]** "You've got dotfiles for your editor, your shell, your whole terminal. But the interface you touch 100 times a day — your feed — you run on someone else's defaults."
`[V: a dotfiles screen, then a feed with no settings]`
**[BIG-Q]** "Every tool you respect is configurable. So why does the feed only have an algorithm's defaults, tuned for *their* metrics?"
`[V: a settings page with one useless toggle]`
**[HEAD FAKE / ambient]** "The one I use now has a config — a single plain sentence — that it enforces across every platform. Config-as-intent, for the thing you read most."
`[V: screen-record — writing the 'config line', feed obeys]`
**[REHOOK]** "A default feed now feels like typing on someone else's un-customized laptop."
`[V: a clean, self-configured feed]`

---

## Script 8 — 100% of the code · lane: ai · ~16s
*Type: V · Delete test: the Dario "AI writes all the code in a year" claim and what it actually means for a working dev is a genuine discourse worth chewing on with no product attached.*
**[HOOK]** "If a headline told you AI would write 100% of your code within a year, your gut said 'no chance' — and you're half right, but the half you're wrong about is the scary one."
`[V: the Dario claim as a big pull-quote, dev squinting at it]`
**[BIG-Q]** "Dario said it. Everyone screenshotted the number and skipped the sentence around it. So what did he actually mean — replace you, or move you up a level?"
`[V: text: "100%… of what, exactly?"]`
**[HEAD FAKE]** "Read in context, it's not 'no more devs' — it's 'you stop typing and start reviewing.' The job becomes judgment, not keystrokes. The take that went viral was the one that missed that."
`[V: a diff where the human is approving, not writing]`
**[REHOOK]** "Which flips the question — if the writing's handled, the only edge left is knowing what's worth building. And nobody's automating that yet."
`[V: a cursor hovering over 'approve', then pulling back to think]`

---

## Script 9 — The paper everyone suddenly cites · lane: ai · ~15s
*Type: S · Delete test: the phenomenon of a research paper going from zero to cited-everywhere overnight, and the edge of reading it early, stands completely on its own.*
**[HOOK]** "You've seen this — a paper nobody mentioned on Monday is suddenly in every thread by Friday, and everyone's quoting it like they read it. I actually read it a week early, by accident."
`[V: the same arXiv title reposted across a dozen threads]`
**[STAKES+BIG-Q]** "Being late to the paper everyone's citing is its own quiet tax — you argue from the abstract while others argue from page 7. So how do you find the one that's about to blow up before it does?"
`[V: a citation count going vertical]`
**[HEAD FAKE]** "It surfaced in one feed I read a week before the hype, ranked up not because it was trending but because it matched what I care about. By the time the threads hit, I'd already argued with it in my head."
`[V: screen-record, the paper with an early timestamp, pre-viral]`
**[REHOOK]** "Which makes me wonder what's sitting in there right now that becomes next Friday's obvious take."
`[V: a feed, one unread paper faintly glowing]`

---

## Script 10 — 95% noise is a filter gap · lane: ai · ~16s
*Type: V · Delete test: the idea that a noisy feed is a filtering failure, not an inevitable law of the internet, is a genuinely reframing thought with no product needed.*
**[HOOK]** "You keep treating your feed being 95% noise like weather — something that just happens to you. It's not weather. It's a filter you never built."
`[V: a feed scrolling, 19 junk posts for every 1 good one]`
**[BIG-Q]** "We accepted 'most of the feed is garbage' as a law of physics. But signal-to-noise is a solvable number — so why did nobody try to solve it instead of just muting harder?"
`[V: text: "noise = law, or gap?"]`
**[HEAD FAKE]** "Turns out it's a gap, not a law. I found one feed where you describe the signal you want in plain English and an AI reads each post for meaning — the first time 95% noise actually dropped instead of me learning to ignore it."
`[V: screen-record, a plain-English filter cutting a wall of noise to a handful]`
**[REHOOK]** "Which makes 'the algorithm' feel less like a villain and more like an excuse — the tool was always buildable, someone just had to bother."
`[V: the junk half of the feed dissolving, leaving the signal]`

---

## Script 11 — On-device AI moment · lane: ai · ~15s
*Type: S · Delete test: the real shift of a capable model running locally on your phone with nothing leaving the device — and why the hot-takes missed the point — is a solid tech story alone.*
**[HOOK]** "You saw 'Gemini Nano runs on your phone' and scrolled past it as a spec bump. It's the opposite of small — it's the moment inference stopped needing the cloud."
`[V: a phone running a model fully offline, airplane mode on]`
**[STAKES+BIG-Q]** "The hot-takes went straight to 'it's slower than the big one' and missed it entirely. So what actually changes when the model lives on-device and nothing you type ever leaves it?"
`[V: a network monitor showing zero outbound while the model works]`
**[HEAD FAKE]** "The nuance nobody led with: it's not about speed, it's about privacy and latency flipping at once — no round trip, no server seeing your prompt. I caught that framing in one feed before the 'it's worse than the flagship' takes drowned it."
`[V: screen-record, the local-model post surfaced above the dunk pile]`
**[REHOOK]** "Which reframes every 'AI needs a data center' assumption I had — what else are we sending to the cloud that never had to leave?"
`[V: a feed, the quiet on-device post sitting above the noise]`

---

## Script 12 — Too powerful to release · lane: ai · ~16s
*Type: V · Delete test: The pattern "we can't show you the scary thing, trust us" being a marketing move works as media literacy on its own.*
**[HOOK]** "If a lab says a model is 'too dangerous to release,' your first reaction shouldn't be fear — it should be: that's a great ad."
`[V: text on screen — "too dangerous to release" with a little price tag sticker on it]`
**[STAKES+BIG-Q]** "Every few months someone hints they're sitting on something too powerful to show you. You can't verify it, you can't test it — so who does that line actually serve?"
`[V: a blurred-out demo, "REDACTED" over the interesting part]`
**[HEAD FAKE]** "The models that actually moved things — DeepSeek, the open weights people ran overnight — got shipped, poked at, broken in public. Skepticism scales; awe doesn't. I only trust the ones I've watched people stress-test in my feed."
`[V: screen-record — thread of people breaking a freshly-released model]`
**[REHOOK]** "Which means the scariest model isn't the one they're hiding — it's the boring one everyone already quietly runs."
`[V: an unremarkable model card, tons of downloads ticking up]`

---

## Script 13 — The one time I was behind · lane: ai · ~16s
*Type: S · Delete test: "The last time I was genuinely behind, it was because I was reading takes instead of primary sources" is a real, transferable lesson.*
**[HOOK]** "You've been the sharp one in the room enough that being behind stings — so here's the one time I got blindsided, and what I changed after."
`[V: me, mid-standup, that half-second face when you realize you missed something]`
**[STAKES+BIG-Q]** "A model dropped, my whole feed had hot takes on it, and I confidently repeated one that turned out to be wrong. Everyone had an opinion; nobody had read the actual thing. So how do you stop mistaking volume for knowing?"
`[V: a wall of quote-tweets, all reacting, none linking the source]`
**[HEAD FAKE]** "I flipped it. I stopped optimizing for 'what's everyone saying' and started pulling the primary post — the release, the paper, the raw thread — before the takes. One feed that surfaces the source first, hot takes second. I've been wrong way less since."
`[V: screen-record — the original release note surfaced above the reaction pile]`
**[REHOOK]** "Turns out I was never behind on news. I was just early to everyone else's opinions."
`[V: the takes collapsing down, one source post left standing]`

---

## Script 14 — Following isn't knowing · lane: ai · ~15s
*Type: V · Delete test: "You followed people hoping for ideas and got a personality feed instead" is a sharp standalone observation about how follow-graphs actually work.*
**[HOOK]** "You didn't follow 800 people because you love them — you followed them hoping for ideas. And that's exactly why your feed is useless now."
`[V: a following count spinning up past 800, feed getting noisier behind it]`
**[BIG-Q]** "Following is a bet on a person staying interesting forever. But you don't want people — you want the good idea, wherever it shows up. So why is the whole system built around who, not what?"
`[V: text — "who ≠ what"]`
**[HEAD FAKE]** "I stopped following for ideas and started describing the ideas directly — the thing I actually care about, and an AI pulls it from whoever happened to post it that day, HN stranger or someone I've never heard of. The best takes almost never come from the accounts I'd have followed."
`[V: screen-record — a plain-English topic pulling posts from unknown handles]`
**[REHOOK]** "Makes following someone feel like subscribing to a person's whole personality just to catch the 2% that's signal."
`[V: an unfollow tap, the feed getting sharper]`

---

## Script 15 — The buried benchmark · lane: ai · ~16s
*Type: S · Delete test: "The model that quietly beat the benchmark got ignored while the one with the launch video got headlines" is a real critique of how AI news is driven by marketing, not results.*
**[HOOK]** "You saw the model with the launch video and the keynote. You didn't see the one that quietly beat it on the benchmark last week — and that's the whole problem."
`[V: a flashy launch trailer next to a plain GitHub release with no fanfare]`
**[STAKES+BIG-Q]** "The best result and the loudest result are almost never the same thing. A model posted numbers that beat the headline one — no thread, no hype, buried on HN page two. So how many actual wins die because nobody made a video?"
`[V: HN page two, a benchmark post sitting at 6 points]`
**[HEAD FAKE]** "I only caught it because the feed I read ranks by signal, not by who shouted loudest — that quiet post surfaced right next to the trailer everyone shared. Same day. One had a marketing team; one just had the better number."
`[V: screen-record — the buried benchmark post surfaced beside the hyped launch]`
**[REHOOK]** "Now I read the boring releases first. The ones with a trailer are usually compensating for something."
`[V: the launch trailer paused, the plain release scrolling up past it]`
