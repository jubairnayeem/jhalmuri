import fs from 'node:fs';
import path from 'node:path';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const DATA = path.join(ROOT, 'public', 'data');
export const STATE = path.join(ROOT, 'state');

const UA = 'Mozilla/5.0 (compatible; JhalmuriBot/1.0; +https://github.com/jubairnayeem/jhalmuri)';

export function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
export function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
}

export async function get(url, { timeout = 15000, json = false } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return json ? await res.json() : await res.text();
  } finally { clearTimeout(t); }
}

const parser = new Parser({ customFields: { item: [['media:content', 'media'], ['media:thumbnail', 'thumb']] } });

export async function readFeed(url) {
  const xml = await get(url);
  const feed = await parser.parseString(xml);
  return (feed.items || []).map((i) => ({
    title: clean(i.title),
    url: i.link,
    date: i.isoDate || i.pubDate || null,
    excerpt: clean(stripHtml(i.contentSnippet || i.content || i.summary || '')).slice(0, 600),
    image: i.enclosure?.url || i.media?.$?.url || i.thumb?.$?.url || null,
  })).filter((i) => i.title && i.url);
}

export function stripHtml(s) { return cheerio.load(`<div>${s}</div>`)('div').text(); }
export function clean(s = '') { return String(s).replace(/\s+/g, ' ').trim(); }

// Pulls the readable paragraphs and share image from an article page.
export async function readArticle(url) {
  try {
    const html = await get(url, { timeout: 12000 });
    const $ = cheerio.load(html);
    const image = $('meta[property="og:image"]').attr('content') || null;
    const desc = $('meta[property="og:description"]').attr('content') || '';
    $('script,style,nav,header,footer,aside,figure,form').remove();
    const paras = $('article p, main p, .content p, p').map((_, el) => clean($(el).text())).get()
      .filter((p) => p.length > 60);
    const text = [...new Set(paras)].join('\n').slice(0, 2200);
    return { text: text || desc, image };
  } catch { return { text: '', image: null }; }
}

// Google News titles look like "Headline - Source". Drop the source part.
export function trimSourceSuffix(title) { return title.replace(/\s+[-–|]\s+[^-–|]{2,40}$/, ''); }

// Rough duplicate check on headline words.
export function words(s) {
  return new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2));
}
export function similar(a, b) {
  const A = words(a), B = words(b);
  if (A.size < 4 || B.size < 4) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

export function hash(s) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// ---- Claude API ----
export const MODEL = process.env.JHALMURI_MODEL || 'claude-haiku-4-5-20251001';
const PRICE = { in: 1 / 1e6, out: 5 / 1e6 }; // Haiku 4.5 list price in USD per token

export async function claude({ system, prompt, maxTokens = 4000 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${body?.error?.message || JSON.stringify(body)}`);
  const text = body.content.map((c) => c.text || '').join('');
  const cost = body.usage.input_tokens * PRICE.in + body.usage.output_tokens * PRICE.out;
  trackSpend(cost);
  return { text, cost };
}

export function parseJSON(text) {
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  return JSON.parse(text.slice(start, end + 1));
}

// Keeps a running tally so a daily cap can stop spending.
const SPEND = () => path.join(STATE, 'spend.json');
export function today() { return new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); } // Dhaka date
export function trackSpend(cost) {
  const s = readJSON(SPEND(), {});
  s[today()] = +((s[today()] || 0) + cost).toFixed(5);
  const keep = Object.keys(s).sort().slice(-45);
  writeJSON(SPEND(), Object.fromEntries(keep.map((k) => [k, s[k]])));
}
export function spentToday() { return readJSON(SPEND(), {})[today()] || 0; }
export const DAILY_BUDGET = Number(process.env.JHALMURI_DAILY_BUDGET_USD || 0.35);

export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
