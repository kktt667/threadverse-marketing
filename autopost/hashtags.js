/**
 * Platform-tailored hashtags, research-backed (2026):
 *   X:        1-2 max  (3+ = -17% engagement, 5+ = -40%). Evergreen topical.
 *   Bluesky:  3-6      mix broad + niche. Hashtags ARE discovery (no algorithm).
 *   Mastodon: 2-5      CamelCase (screen-reader accessibility). Discovery engine.
 *
 * We pick topic-relevant tags + a couple brand/reach tags, per platform, respecting limits.
 */

// Topic → candidate tags (stored CamelCase; lowercased per-platform where that's the norm).
const TOPIC_TAGS = {
  ai:        ['AI', 'MachineLearning', 'LLM', 'TechNews', 'ArtificialIntelligence'],
  science:   ['Science', 'Physics', 'QuantumComputing', 'Research', 'ScienceNews'],
  crypto:    ['Crypto', 'Bitcoin', 'Web3', 'DeFi', 'CryptoNews'],
  gaming:    ['Gaming', 'IndieGames', 'GameDev', 'Gamer', 'VideoGames'],
  philosophy:['Philosophy', 'DeepThoughts', 'Thinking', 'Ideas', 'Wisdom'],
  funny:     ['Humor', 'Funny', 'Comedy', 'Memes', 'LOL'],
  wildlife:  ['Wildlife', 'Nature', 'Animals', 'NaturePhotography', 'Wild'],
  youtube:   ['YouTube', 'Video', 'Creator', 'Streaming', 'Content'],
  goodnews:  ['GoodNews', 'Positivity', 'Hope', 'Uplifting', 'HappyNews'],
  founders:  ['Startup', 'Founder', 'BuildInPublic', 'Entrepreneur', 'SaaS'],
  drama:     ['InternetDrama', 'Trending', 'HotTake', 'Discourse', 'Viral'],
  truecrime: ['TrueCrime', 'Mystery', 'Crime', 'ColdCase', 'Investigation'],
  viral:     ['Viral', 'Trending', 'FYP', 'MustSee', 'Internet'],
  travel:    ['Travel', 'Wanderlust', 'TravelTips', 'Explore', 'Adventure'],
  product:   ['Feedreader', 'DigitalWellbeing', 'Productivity', 'Tech', 'Doomscrolling'],
};

// Broad, high-traffic reach tags per platform culture.
const REACH = {
  x:        ['Tech'],
  bluesky:  ['tech', 'feeds'],
  mastodon: ['Tech', 'Fediverse'],
};
// Always-on brand/positioning tags (help cluster our content + hit the ICP).
const BRAND = {
  x:        ['Threadverse'],
  bluesky:  ['threadverse', 'feedreader'],
  mastodon: ['Threadverse', 'FeedReader'],
};

const LIMITS = { x: 2, bluesky: 6, mastodon: 5 };

function casePlatform(tag, platform) {
  // X + Bluesky: lowercase reads native. Mastodon: CamelCase (accessibility) — keep as-is.
  if (platform === 'mastodon') return tag;         // already CamelCase in the tables
  return tag; // keep the readable CamelCase for multi-word (e.g. #DigitalWellbeing) on X/Bsky too
}

/** Return an array of hashtag strings (with #) for a post on a platform. */
function tagsFor({ topic, format, category }, platform) {
  const limit = LIMITS[platform] || 3;
  const picks = [];
  const push = t => { const tag = casePlatform(t, platform); if (tag && !picks.includes(tag) && picks.length < limit) picks.push(tag); };

  // 1. topic tag(s) FIRST — the lane tag matters most for discovery + fingerprint (Gate 0).
  //    On X (limit 2) this guarantees the lane tag always lands, even when the caption is long.
  const topicKey = TOPIC_TAGS[topic] ? topic : (category === 'product-card' ? 'product' : null);
  const pool = TOPIC_TAGS[topicKey] || TOPIC_TAGS.product;
  const nTopic = platform === 'x' ? 1 : (platform === 'mastodon' ? 3 : 3);
  pool.slice(0, nTopic).forEach(push);

  // 2. brand tag — second, so it's the one that drops when space is tight (product stays ambient).
  (BRAND[platform] || []).slice(0, 1).forEach(push);

  // 3. a reach tag if room (skip on X — it's tight at 2)
  if (platform !== 'x') (REACH[platform] || []).forEach(push);

  return picks.slice(0, limit).map(t => '#' + t);
}

// Hard platform character limits. Bluesky rejects >300 outright — an over-length caption fails
// createRecord on EVERY cron run and (before the retry fix) blocked the whole platform pipeline.
const CHAR_LIMITS = { x: 280, bluesky: 300, mastodon: 500 };

/** Append hashtags to a caption, respecting platform norms AND hard length limits.
 *  Tags are added one at a time while they fit; the body is never truncated. */
function withHashtags(caption, meta, platform) {
  const tags = tagsFor(meta, platform);
  const limit = CHAR_LIMITS[platform] || 500;
  if (!tags.length) return caption;
  if (platform === 'x') {
    let out = caption;
    for (const t of tags) { if ((out + ' ' + t).length <= limit) out += ' ' + t; }
    return out;
  }
  // bluesky/mastodon: tags on their own line; add tags only while the total stays under the limit
  let out = caption, sep = '\n\n';
  for (const t of tags) {
    const cand = out + sep + t;
    if ([...cand].length <= limit) { out = cand; sep = ' '; }
  }
  return out;
}

module.exports = { tagsFor, withHashtags };
