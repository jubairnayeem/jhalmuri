// Runs every 3 hours: finds what people are talking about, ranks Burning,
// writes Today's Social Gossip, picks Meme of the Week, and refreshes Gaan Chart once a day.
import path from 'node:path';
import Parser from 'rss-parser';
import { VOICE } from './voice.js';
import { DATA, STATE, readJSON, writeJSON, get, claude, parseJSON, clean, log, spentToday, DAILY_BUDGET } from './lib.js';

const FEED = path.join(DATA, 'feed.json');
const TRENDS = path.join(DATA, 'trends.json');
const MEME = path.join(DATA, 'meme.json');
const SONGS = path.join(DATA, 'songs.json');
const SCAN_HOURS = 3;
const YT = process.env.YOUTUBE_API_KEY;
const LASTFM = process.env.LASTFM_API_KEY;

const trendParser = new Parser({ customFields: { item: [['ht:approx_traffic', 'traffic'], ['ht:news_item', 'news', { keepArray: true }]] } });

// ---------- signals ----------
async function googleTrends() {
  try {
    const xml = await get('https://trends.google.com/trending/rss?geo=BD');
    const f = await trendParser.parseString(xml);
    return f.items.slice(0, 20).map((i) => ({
      q: clean(i.title), traffic: i.traffic || '',
      news: (i.news || []).map((n) => clean(n['ht:news_item_title']?.[0] || '')).filter(Boolean).slice(0, 2),
    }));
  } catch (e) { log('google trends failed:', e.message); return []; }
}

async function reddit(sub, sort = 'hot', t = 'day', limit = 25) {
  try {
    const j = await get(`https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&t=${t}&raw_json=1`, { json: true });
    return j.data.children.map((c) => c.data).filter((p) => !p.over_18 && !p.stickied).map((p) => ({
      title: clean(p.title), score: p.score, comments: p.num_comments, flair: p.link_flair_text || '',
      url: `https://www.reddit.com${p.permalink}`, image: /\.(jpe?g|png|gif)$/i.test(p.url) ? p.url : null, sub,
    }));
  } catch (e) { log(`reddit r/${sub} failed:`, e.message); return []; }
}

async function youtubePopular(category) {
  if (!YT) return [];
  try {
    const u = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=BD&maxResults=30${category ? `&videoCategoryId=${category}` : ''}&key=${YT}`;
    const j = await get(u, { json: true });
    return j.items.map((v) => ({ id: v.id, title: v.snippet.title, channel: v.snippet.channelTitle, views: +v.statistics.viewCount || 0 }));
  } catch (e) { log('youtube failed:', e.message); return []; }
}

// ---------- burning + gossip ----------
async function editor(feed, signals) {
  const recent = feed.items.filter((i) => i.section === 'news' && Date.now() - Date.parse(i.added) < 30 * 3600e3)
    .slice(0, 140).map((i) => ({ id: i.id, t: i.en.title, cat: i.cat, src: i.src }));
  if (recent.length < 5) { log('not enough stories yet for Burning'); return null; }
  const prompt = `STORIES from the last day (id, title, category, source):
${JSON.stringify(recent)}

SOCIAL SIGNALS right now in Bangladesh:
Google Trends BD: ${JSON.stringify(signals.trends)}
Reddit r/bangladesh: ${JSON.stringify(signals.reddit.slice(0, 20).map((p) => ({ t: p.title, score: p.score, comments: p.comments })))}
YouTube trending BD: ${JSON.stringify(signals.youtube.slice(0, 20).map((v) => v.title))}

Tasks:
1. "burning": the 5 stories people are talking about most today, ranked. Weigh how many outlets cover the same topic plus the social signals. Use story ids from STORIES only. heat is 1-5.
2. "gossip": 3 to 5 topics trending on social media today. Each MUST be backed by one story in STORIES (give its id) — if you cannot link a trend to a story, leave it out. Never include rumours about private people, never mock victims or tragedies, stay neutral on politics. "platforms" lists where it is trending, only from: "Google", "Reddit", "YouTube", and only if the signal shows it. "tag" is a short hashtag-style label (English or Bangla).

Return ONLY JSON:
{"burning":[{"id":"...","heat":5,"why":{"en":"one short line","bn":"এক লাইন"}}],
 "gossip":[{"id":"...","tag":"#...","platforms":["Google"],"heat":4,"en":{"title":"3-5 words","text":"1-2 sentences"},"bn":{"title":"৩-৫ শব্দ","text":"১-২ বাক্য"}}]}`;
  const { text, cost } = await claude({ system: VOICE, prompt, maxTokens: 2500 });
  log(`editor pass $${cost.toFixed(4)}`);
  const out = parseJSON(text);
  const ids = new Set(recent.map((r) => r.id));
  return {
    burning: (out.burning || []).filter((b) => ids.has(b.id)).slice(0, 5).map((b, n) => ({ ...b, rank: n + 1 })),
    gossip: (out.gossip || []).filter((g) => ids.has(g.id)).slice(0, 5),
  };
}

// ---------- meme of the week ----------
async function memeOfWeek() {
  const current = readJSON(MEME, null);
  if (current && Date.now() - Date.parse(current.pickedAt) < 7 * 86400e3) return;
  const bd = (await reddit('bangladesh', 'top', 'week', 50)).filter((p) => p.image && /meme|humou?r|funny|shitpost/i.test(p.flair + ' ' + p.title));
  const global = (await reddit('memes', 'top', 'week', 25)).filter((p) => p.image);
  const cands = [...bd.slice(0, 8), ...global.slice(0, 8)];
  if (!cands.length) { log('no meme candidates this week'); return; }
  const prompt = `Meme candidates (Reddit posts with images, titles only):
${JSON.stringify(cands.map((c, n) => ({ n, sub: c.sub, title: c.title, score: c.score })))}
Pick ONE for "Meme of the Week". Prefer Bangladesh ones if any are good. Avoid anything political, religious, cruel, or about real private people.
Return ONLY JSON: {"n":0,"en":{"title":"short","text":"1 sentence on why it hits"},"bn":{"title":"ছোট","text":"১ বাক্য"}}`;
  const { text } = await claude({ system: VOICE, prompt, maxTokens: 400 });
  const pickd = parseJSON(text);
  const c = cands[pickd.n];
  if (!c) return;
  writeJSON(MEME, { pickedAt: new Date().toISOString(), image: c.image, url: c.url, sub: c.sub, redditTitle: c.title, en: pickd.en, bn: pickd.bn });
  log('new meme of the week picked');
}

// ---------- Gaan Chart ----------
async function songs() {
  const prev = readJSON(SONGS, null);
  if (prev && Date.now() - Date.parse(prev.updatedAt) < 20 * 3600e3) return;
  const lastPos = (list = []) => Object.fromEntries(list.map((s) => [s.key, s.rank]));
  const withMove = (list, before) => list.map((s) => ({ ...s, prev: before[s.key] ?? null }));

  // English: Apple Music most played (free, no key)
  let english = [];
  try {
    const j = await get('https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json', { json: true });
    english = j.feed.results.map((r, n) => ({ rank: n + 1, title: r.name, artist: r.artistName, url: r.url, key: `${r.name}|${r.artistName}`.toLowerCase() }));
  } catch (e) { log('apple music failed:', e.message); }

  // Bangla: YouTube trending music in BD, or Last.fm Bangladesh chart
  let bangla = [];
  const yt = await youtubePopular(10);
  if (yt.length) {
    const prompt = `YouTube trending music videos in Bangladesh:
${JSON.stringify(yt.map((v, n) => ({ n, title: v.title, channel: v.channel })))}
Which of these are Bangla-language songs? For each, give a clean song title and artist from the video title/channel (do not invent).
Return ONLY JSON array, in the given order, max 10: [{"n":0,"title":"...","artist":"..."}]`;
    try {
      const { text } = await claude({ system: VOICE, prompt, maxTokens: 900 });
      bangla = parseJSON(text).slice(0, 10).map((s, i) => ({ rank: i + 1, title: s.title, artist: s.artist, url: `https://www.youtube.com/watch?v=${yt[s.n]?.id}`, key: `${s.title}|${s.artist}`.toLowerCase() }));
    } catch (e) { log('bangla song pick failed:', e.message); }
  } else if (LASTFM) {
    try {
      const j = await get(`https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=bangladesh&limit=10&format=json&api_key=${LASTFM}`, { json: true });
      bangla = j.tracks.track.map((t, n) => ({ rank: n + 1, title: t.name, artist: t.artist.name, url: t.url, key: `${t.name}|${t.artist.name}`.toLowerCase() }));
    } catch (e) { log('last.fm failed:', e.message); }
  }

  writeJSON(SONGS, {
    updatedAt: new Date().toISOString(),
    english: { source: 'Apple Music · most played (US)', items: withMove(english, lastPos(prev?.english?.items)) },
    bangla: { source: yt.length ? 'YouTube trending music · Bangladesh' : LASTFM ? 'Last.fm · Bangladesh' : null, items: withMove(bangla, lastPos(prev?.bangla?.items)) },
  });
  log(`gaan chart: ${english.length} English, ${bangla.length} Bangla`);
}

async function main() {
  const trends = readJSON(TRENDS, null);
  const force = process.argv.includes('--force');
  if (!force && trends && Date.now() - Date.parse(trends.updatedAt) < (SCAN_HOURS - 0.25) * 3600e3) {
    log('social scan ran recently, skipping'); return;
  }
  if (spentToday() >= DAILY_BUDGET + 0.05) { log('over daily budget, skipping social scan'); return; }
  const signals = {
    trends: await googleTrends(),
    reddit: await reddit('bangladesh', 'hot'),
    youtube: await youtubePopular(null),
  };
  log(`signals: ${signals.trends.length} trends, ${signals.reddit.length} reddit, ${signals.youtube.length} youtube`);
  const feed = readJSON(FEED, { items: [] });
  try {
    const ed = await editor(feed, signals);
    if (ed) writeJSON(TRENDS, { updatedAt: new Date().toISOString(), ...ed, signalCounts: { google: signals.trends.length, reddit: signals.reddit.length, youtube: signals.youtube.length } });
  } catch (e) { log('editor failed:', e.message); }
  try { await memeOfWeek(); } catch (e) { log('meme failed:', e.message); }
  try { await songs(); } catch (e) { log('songs failed:', e.message); }
}

main().catch((e) => { console.error(e); process.exit(1); });
