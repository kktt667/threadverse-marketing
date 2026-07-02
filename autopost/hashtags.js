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

  // 1. brand tag (1) — always first
  (BRAND[platform] || []).slice(0, platform === 'x' ? 1 : 1).forEach(push);

  // 2. topic tags — the bulk of relevance
  const topicKey = TOPIC_TAGS[topic] ? topic : (category === 'product-card' ? 'product' : null);
  const pool = TOPIC_TAGS[topicKey] || TOPIC_TAGS.product;
  // X gets just 1 strong topical tag; others get 2-3
  const nTopic = platform === 'x' ? 1 : (platform === 'mastodon' ? 3 : 3);
  pool.slice(0, nTopic).forEach(push);

  // 3. a reach tag if room (skip on X — it's tight at 2)
  if (platform !== 'x') (REACH[platform] || []).forEach(push);

  return picks.slice(0, limit).map(t => '#' + t);
}

/** Append hashtags to a caption, respecting platform norms. */
function withHashtags(caption, meta, platform) {
  const tags = tagsFor(meta, platform);
  if (!tags.length) return caption;
  // X: append tags only if they fit within 280 without cutting mid-tag; else drop to what fits.
  if (platform === 'x') {
    let out = caption;
    for (const t of tags) { if ((out + ' ' + t).length <= 280) out += ' ' + t; }
    return out;
  }
  return `${caption}\n\n${tags.join(' ')}`;
}

module.exports = { tagsFor, withHashtags };
