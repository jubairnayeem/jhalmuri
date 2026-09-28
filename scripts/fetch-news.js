// Runs every hour: reads all sources, picks new stories, writes short EN + BN summaries.
import path from 'node:path';
import { SOURCES, CATEGORIES } from './sources.js';
import { VOICE } from './voice.js';
import {
  DATA, STATE, readJSON, writeJSON, readFeed, readArticle, trimSourceSuffix, similar, hash,
  claude, parseJSON, spentToday, DAILY_BUDGET, log,
} from './lib.js';

const MAX_PER_RUN = Number(process.env.JHALMURI_MAX_PER_RUN || 14);
const BATCH = 7;
const KEEP_HOURS = 72;
const FRESH_HOURS = 36;

const FEED = path.join(DATA, 'feed.json');
const SEEN = path.join(STATE, 'seen.json');
const HEALTH = path.join(STATE, 'sources-health.json');

async function collect() {
  const health = {};
  const out = [];
  await Promise.all(SOURCES.map(async (src) => {
    let items = [], via = 'rss';
    try { items = await readFeed(src.rss); } catch (e) { health[src.name] = `rss failed: ${e.message}`; }
    if (!items.length) {
      via = 'gnews';
      try { items = (await readFeed(src.fallback)).map((i) => ({ ...i, title: trimSourceSuffix(i.title) })); }
      catch (e) { health[src.name] = `${health[src.name] || ''}; google news failed: ${e.message}`; }
    }
    if (items.length) health[src.name] = `ok via ${via} (${items.length})`;
    items.forEach((i, rank) => out.push({ ...i, src, via, rank }));
  }));
  writeJSON(HEALTH, { checkedAt: new Date().toISOString(), sources: health });
  return out;
}

function pick(all, feed, seen) {
  const now = Date.now();
  const taken = [];
  const perSource = {};
  const existingTitles = feed.items.map((i) => i.origTitle);
  // Lower rank = nearer the top of the source's own feed = more important to them.
  for (const it of all.sort((a, b) => a.rank - b.rank)) {
    const id = hash(it.url);
    if (seen[id]) continue;
    if (it.date && now - Date.parse(it.date) > FRESH_HOURS * 3600e3) continue;
    if ((perSource[it.src.name] || 0) >= it.src.max) continue;
    if ([...existingTitles, ...taken.map((t) => t.title)].some((t) => similar(t, it.title) >= 0.75)) continue;
    perSource[it.src.name] = (perSource[it.src.name] || 0) + 1;
    taken.push({ ...it, id });
    if (taken.length >= MAX_PER_RUN) break;
  }
  return taken;
}

async function summarize(batch) {
  const list = batch.map((it, n) => ({
    n,
    source: it.src.name,
    source_language: it.src.lang,
    section: it.src.section,
    hint: it.src.hint || null,
    satire: !!it.src.satire,
    headline: it.title,
    text: (it.text || it.excerpt || '').slice(0, 1800),
  }));
  const prompt = `Here are ${list.length} articles as JSON:
${JSON.stringify(list)}

For EACH article return an object:
{"n": <same n>,
 "skip": true if it is not a real story (ad, horoscope, job list, live-blog stub, photo gallery with no text, or text too thin to summarise honestly),
 "category": one of ${JSON.stringify(CATEGORIES)} (use "hint" if given and it fits; for section "bhabna" or "hasi" still pick the closest),
 "tone": "light" or "serious",
 "en": {"title": "max 12 words", "summary": "4-5 short sentences, 55-75 words"},
 "bn": {"title": "সর্বোচ্চ ১২ শব্দ", "summary": "৪-৫টি ছোট বাক্য"}}
Write both languages for every article, translating as needed. For section "bhabna", explain the core idea simply and why it matters to a 20-year-old. For section "hasi", keep it fun.
Return ONLY a JSON array.`;
  const { text, cost } = await claude({ system: VOICE, prompt, maxTokens: 700 * list.length });
  log(`summarised ${list.length} for $${cost.toFixed(4)}`);
  return parseJSON(text);
}

async function main() {
  const feed = readJSON(FEED, { updatedAt: null, items: [] });
  const seen = readJSON(SEEN, {});
  const all = await collect();
  log(`collected ${all.length} items from ${SOURCES.length} sources`);

  const budgetLeft = DAILY_BUDGET - spentToday();
  if (budgetLeft <= 0.01) { log(`daily budget $${DAILY_BUDGET} used up, skipping summaries`); return finish(feed, seen); }
  const cap = Math.min(MAX_PER_RUN, Math.floor(budgetLeft / 0.004));
  const fresh = pick(all, feed, seen).slice(0, cap);
  log(`${fresh.length} new stories to summarise`);

  // Read article pages (not possible for Google News redirect links).
  await Promise.all(fresh.map(async (it) => {
    if (it.via === 'rss') {
      const a = await readArticle(it.url);
      it.text = a.text; it.image = it.image || a.image;
    }
  }));

  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH);
    let results = [];
    try { results = await summarize(batch); } catch (e) { log('summary failed:', e.message); continue; }
    for (const r of results) {
      const it = batch[r.n];
      if (!it) continue;
      seen[it.id] = Date.now();
      if (r.skip || !r.en?.summary || !r.bn?.summary) continue;
      feed.items.unshift({
        id: it.id,
        section: it.src.section,
        cat: CATEGORIES.includes(r.category) ? r.category : 'desh',
        tone: r.tone === 'serious' ? 'serious' : 'light',
        satire: !!it.src.satire,
        src: it.src.name,
        srcLang: it.src.lang,
        url: it.url,
        image: it.image || null,
        published: it.date || new Date().toISOString(),
        added: new Date().toISOString(),
        origTitle: it.title,
        en: r.en,
        bn: r.bn,
      });
    }
  }
  finish(feed, seen);
}

function finish(feed, seen) {
  const cutoff = Date.now() - KEEP_HOURS * 3600e3;
  feed.items = feed.items.filter((i) => Date.parse(i.added) > cutoff).slice(0, 400);
  feed.updatedAt = new Date().toISOString();
  writeJSON(FEED, feed);
  const seenCut = Date.now() - 7 * 86400e3;
  writeJSON(SEEN, Object.fromEntries(Object.entries(seen).filter(([, t]) => t > seenCut)));
  log(`feed now has ${feed.items.length} stories`);
}

main().catch((e) => { console.error(e); process.exit(1); });
