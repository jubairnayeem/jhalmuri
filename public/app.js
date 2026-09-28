// Jhalmuri front end. Reads the JSON files the hourly job writes into /data.
const SHOW_SOURCE_IMAGES = false; // true = use the publisher's photo on cards (check their terms first)

const CHILI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.5 3c.6 0 1 .4 1 1v1.1c2.4.5 4 2.6 3.9 5.2-.3 5.6-6.6 10.6-14.1 10.7-1 0-1.6-1-1-1.8 3.1-3.8 4.6-8.2 6.4-11.1.9-1.5 2.4-2.6 3.8-3V4c0-.6.4-1 1-1z"/></svg>';

const CATS = {
  desh: { en: 'Desh', bn: 'দেশ', c: 'var(--leaf)' },
  politics: { en: 'Politics', bn: 'রাজনীতি', c: 'var(--onion)' },
  money: { en: 'Money', bn: 'টাকা-পয়সা', c: 'var(--mustard)', m: 1 },
  khela: { en: 'Khela', bn: 'খেলা', c: 'var(--sky)' },
  tech: { en: 'Tech', bn: 'টেক', c: 'var(--cyan)' },
  showbiz: { en: 'Showbiz', bn: 'বিনোদন', c: '#D2477A' },
  world: { en: 'World', bn: 'বিশ্ব', c: 'var(--teal)' },
  campus: { en: 'Campus', bn: 'ক্যাম্পাস', c: 'var(--violet)' },
  lifestyle: { en: 'Lifestyle', bn: 'লাইফস্টাইল', c: '#C0662B' },
  bhabna: { en: 'Bhabna', bn: 'ভাবনা', c: '#3B3A8C' },
  hasi: { en: 'Hasi', bn: 'হাসি', c: 'var(--mustard)', m: 1 },
};

const TABS = [
  { id: 'all', en: 'For you', bn: 'সব' },
  { id: 'burning', en: 'Burning', bn: 'জ্বলন্ত', hot: 1 },
  { id: 'gossip', en: 'Social Gossip', bn: 'আজকের গসিপ' },
  { id: 'gaan', en: 'Gaan Chart', bn: 'গানের চার্ট' },
  { id: 'meme', en: 'Meme of the Week', bn: 'সপ্তাহের মিম' },
  { id: 'hasi', en: 'Hasi', bn: 'হাসি' },
  { id: 'bhabna', en: 'Bhabna', bn: 'ভাবনা' },
  ...['desh', 'politics', 'money', 'khela', 'tech', 'showbiz', 'world', 'campus', 'lifestyle'].map((id) => ({ id, ...CATS[id] })),
];

const T = {
  en: {
    tagline: 'news, mixed',
    intro: {
      all: ['Today, in 5 lines each', 'Short, spicy summaries. Tap through for the full story.'],
      burning: ['What Bangladesh is talking about', 'Ranked by how hot the conversation is right now.'],
      gossip: ['Today’s Social Gossip', 'What’s trending online, checked every 3 hours. Every trend links to a real report.'],
      gaan: ['Gaan Chart', 'What people are playing right now. Refreshed daily.'],
      meme: ['Meme of the Week', 'One meme. Picked weekly. Credit to the original post.'],
      hasi: ['Hasi', 'Weird, funny and satirical stories from around the internet.'],
      bhabna: ['Bhabna', 'One big idea at a time, explained simply.'],
    },
    catIntro: 'Latest in', read: 'Read full story', heat: 'jhal level', updated: 'Updated', lastScan: 'Last scan', next: 'Next scan in',
    linked: 'The story behind it', satire: 'Satire', bangla: 'Bangla', english: 'English', newEntry: 'NEW',
    emptyT: 'Nothing here yet', emptyP: 'Fresh stories land every hour. Check back soon.',
    songsEmpty: 'Bangla chart switches on once a free YouTube or Last.fm key is added.',
    bhabnaTop: 'Bhabna of the day', hasiTop: 'Something funny',
    foot: 'Jhalmuri summarises and links to the original publishers. Summaries are written by AI; tap through for the full report.',
    ago: (m) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`),
  },
  bn: {
    tagline: 'খবর, মাখানো',
    intro: {
      all: ['আজকের খবর, ৫ লাইনে', 'ছোট, ঝাল সারসংক্ষেপ। পুরোটা পড়তে ট্যাপ করুন।'],
      burning: ['দেশ এখন কী নিয়ে কথা বলছে', 'আলোচনা কতটা গরম, সেই হিসাবে সাজানো।'],
      gossip: ['আজকের সোশ্যাল গসিপ', 'অনলাইনে কী ট্রেন্ড করছে, প্রতি ৩ ঘণ্টায় দেখা হয়। প্রতিটার পেছনে আসল খবর আছে।'],
      gaan: ['গানের চার্ট', 'মানুষ এখন কী শুনছে। প্রতিদিন আপডেট।'],
      meme: ['সপ্তাহের মিম', 'সপ্তাহে একটা মিম। ক্রেডিট মূল পোস্টের।'],
      hasi: ['হাসি', 'ইন্টারনেটের অদ্ভুত, মজার আর ব্যঙ্গাত্মক খবর।'],
      bhabna: ['ভাবনা', 'একটা বড় আইডিয়া, সহজ করে।'],
    },
    catIntro: 'সর্বশেষ', read: 'পুরো খবর পড়ুন', heat: 'ঝাল লেভেল', updated: 'আপডেট', lastScan: 'শেষ স্ক্যান', next: 'পরের স্ক্যান',
    linked: 'পেছনের খবর', satire: 'ব্যঙ্গ', bangla: 'বাংলা', english: 'ইংরেজি', newEntry: 'নতুন',
    emptyT: 'এখনো কিছু নেই', emptyP: 'প্রতি ঘণ্টায় নতুন খবর আসে। একটু পরে দেখুন।',
    songsEmpty: 'ফ্রি YouTube বা Last.fm কী যোগ করলেই বাংলা চার্ট চালু হবে।',
    bhabnaTop: 'আজকের ভাবনা', hasiTop: 'একটু হাসি',
    foot: 'Jhalmuri মূল সংবাদমাধ্যমের খবর সংক্ষেপ করে লিংক দেয়। সারসংক্ষেপ AI-এর লেখা; পুরো খবর পড়তে ট্যাপ করুন।',
    ago: (m) => bnNum(m < 60 ? `${m} মিনিট আগে` : m < 1440 ? `${Math.floor(m / 60)} ঘণ্টা আগে` : `${Math.floor(m / 1440)} দিন আগে`),
  },
};

function bnNum(s) { return String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]); }

let lang = 'en', tab = 'all';
try { lang = localStorage.getItem('jm-lang') || (navigator.language.startsWith('bn') ? 'bn' : 'en'); } catch (e) {}
const initial = location.hash.slice(1);
if (TABS.some((t) => t.id === initial)) tab = initial;

const D = { feed: { items: [] }, trends: null, meme: null, songs: null };
const $ = (id) => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const minsAgo = (iso) => Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 6e4));
const num = (s) => (lang === 'bn' ? bnNum(s) : String(s));

function chilis(n) {
  return '<span class="c">' + [1, 2, 3, 4, 5].map((i) => `<span style="color:${i <= n ? 'var(--chili)' : 'var(--line)'}">${CHILI}</span>`).join('') + '</span>';
}

function storyHTML(s, opts = {}) {
  const key = s.section === 'news' ? s.cat : s.section;
  const c = CATS[key] || CATS.desh;
  const L = s[lang] || s.en;
  const t = T[lang];
  const img = SHOW_SOURCE_IMAGES && s.image;
  const cls = ['card', img ? 'img' : s.tone === 'serious' ? 'serious' : c.m ? 'm' : ''].join(' ');
  const bg = img ? `background:url('${esc(s.image)}')` : `background:${c.c}`;
  const when = t.ago(minsAgo(s.published || s.added));
  return `<article class="story">
    ${opts.rank ? `<div class="rankrow"><span class="rank">#${num(opts.rank)}</span><span class="heat">${t.heat} ${chilis(opts.heat)}</span></div>` : ''}
    ${opts.why ? `<p class="why">${esc(opts.why)}</p>` : ''}
    <div class="${cls}" style="${bg}">
      <div class="top"><b>Jhalmuri</b><span>${s.satire ? `<span class="satire">${t.satire}</span>` : c[lang]}</span></div>
      <h2>${esc(L.title)}</h2>
      <div class="foot">${esc(s.src)} · ${when}</div>
    </div>
    <div class="body"><p>${esc(L.summary)}</p>
      <div class="meta"><span><span class="src">${esc(s.src)}</span> · ${when}</span>
        <a class="read" href="${esc(s.url)}" target="_blank" rel="noopener">${t.read} ↗</a></div></div>
  </article>`;
}

function empty(msg) {
  const t = T[lang];
  return `<div class="empty"><b>${t.emptyT}</b>${msg || t.emptyP}</div>`;
}

function nextScan() {
  const last = D.trends?.updatedAt ? Date.parse(D.trends.updatedAt) : Date.now();
  const ms = Math.max(0, last + 3 * 3600e3 - Date.now());
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return num(`${h}h ${String(m).padStart(2, '0')}m`);
}

function byId(id) { return D.feed.items.find((i) => i.id === id); }

function render() {
  const t = T[lang];
  document.documentElement.lang = lang;
  $('tagline').textContent = t.tagline;
  ['en', 'bn'].forEach((l) => $('l-' + l).setAttribute('aria-pressed', l === lang));
  $('chips').innerHTML = TABS.map((c) => `<button class="chip${c.hot ? ' hot' : ''}" data-c="${c.id}" aria-pressed="${c.id === tab}">${c.hot ? CHILI : ''}${c[lang]}</button>`).join('');
  document.querySelector(`[data-c="${tab}"]`)?.scrollIntoView({ inline: 'nearest', block: 'nearest' });

  const intro = t.intro[tab] || [`${t.catIntro}: ${CATS[tab][lang]}`, t.intro.all[1]];
  let head = `<h1>${intro[0]}</h1><p>${intro[1]}</p>`;
  if (D.feed.updatedAt && tab !== 'gossip') head += `<div class="scan"><span>${t.updated} ${t.ago(minsAgo(D.feed.updatedAt))}</span></div>`;
  if (tab === 'gossip' && D.trends) head += `<div class="scan"><span class="live">● ${t.lastScan} ${t.ago(minsAgo(D.trends.updatedAt))}</span><span>${t.next} ${nextScan()}</span></div>`;
  $('intro').innerHTML = head;

  const news = D.feed.items.filter((i) => i.section === 'news');
  let html = '';
  if (tab === 'all') {
    const bhabna = D.feed.items.find((i) => i.section === 'bhabna');
    const hasi = D.feed.items.find((i) => i.section === 'hasi');
    news.slice(0, 60).forEach((s, n) => {
      html += storyHTML(s);
      if (n === 4 && bhabna) html += `<div class="inset">${t.bhabnaTop}</div>` + storyHTML(bhabna);
      if (n === 11 && hasi) html += `<div class="inset">${t.hasiTop}</div>` + storyHTML(hasi);
    });
  } else if (tab === 'burning') {
    html = (D.trends?.burning || []).map((b) => { const s = byId(b.id); return s ? storyHTML(s, { rank: b.rank, heat: b.heat, why: b.why?.[lang] }) : ''; }).join('');
  } else if (tab === 'gossip') {
    html = (D.trends?.gossip || []).map((g) => {
      const s = byId(g.id); if (!s) return '';
      const L = g[lang] || g.en;
      return `<article class="trend"><div class="head"><div><div class="plats">${(g.platforms || []).map((p) => `<span class="plat">${esc(p)}</span>`).join('')}</div>
        <h3 style="margin-top:8px">${esc(g.tag)}</h3></div></div>
        <div class="heat">${t.heat} ${chilis(g.heat)}</div>
        <p><b>${esc(L.title)}:</b> ${esc(L.text)}</p>
        <a class="link" href="${esc(s.url)}" target="_blank" rel="noopener">${t.linked}: ${esc((s[lang] || s.en).title)} <small>· ${esc(s.src)} ↗</small></a></article>`;
    }).join('');
  } else if (tab === 'meme') {
    const m = D.meme;
    if (m) {
      const L = m[lang] || m.en;
      html = `<article class="meme"><img src="${esc(m.image)}" alt="${esc(m.redditTitle)}" loading="lazy" referrerpolicy="no-referrer">
        <div class="body"><h3>${esc(L.title)}</h3><p>${esc(L.text)}</p>
        <div class="meta"><span>r/${esc(m.sub)}</span><a class="read" href="${esc(m.url)}" target="_blank" rel="noopener">${t.read} ↗</a></div></div></article>`;
    }
  } else if (tab === 'gaan') {
    const chart = (title, block, note) => {
      const items = block?.items || [];
      if (!items.length) return `<section class="chart"><h3>${title}</h3><p class="srcline">${note || ''}</p></section>`;
      return `<section class="chart"><h3>${title}</h3><p class="srcline">${esc(block.source || '')}</p>${items.map((s) => {
        const mv = s.prev == null ? `<span class="mv new">${t.newEntry}</span>` : s.prev > s.rank ? `<span class="mv up">▲${num(s.prev - s.rank)}</span>` : s.prev < s.rank ? `<span class="mv down">▼${num(s.rank - s.prev)}</span>` : '<span class="mv same">–</span>';
        return `<a class="song" href="${esc(s.url)}" target="_blank" rel="noopener"><span class="n">${num(s.rank)}</span><span><div class="t">${esc(s.title)}</div><div class="a">${esc(s.artist)}</div></span>${mv}</a>`;
      }).join('')}</section>`;
    };
    if (D.songs) html = chart(t.bangla, D.songs.bangla, t.songsEmpty) + chart(t.english, D.songs.english);
  } else if (tab === 'hasi' || tab === 'bhabna') {
    html = D.feed.items.filter((i) => i.section === tab).map((s) => storyHTML(s)).join('');
  } else {
    html = news.filter((i) => i.cat === tab).map((s) => storyHTML(s)).join('');
  }
  $('feed').innerHTML = html || empty();
  $('foot').textContent = t.foot;
}

async function load(name) {
  try { const r = await fetch(`/data/${name}.json`, { cache: 'no-cache' }); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

async function refresh() {
  const [feed, trends, meme, songs] = await Promise.all(['feed', 'trends', 'meme', 'songs'].map(load));
  if (feed) D.feed = feed;
  D.trends = trends; D.meme = meme; D.songs = songs;
  render();
}

document.addEventListener('click', (e) => {
  const l = e.target.closest('[data-l]');
  if (l) { lang = l.dataset.l; try { localStorage.setItem('jm-lang', lang); } catch (_) {} render(); return; }
  const c = e.target.closest('[data-c]');
  if (c) { tab = c.dataset.c; history.replaceState(null, '', tab === 'all' ? location.pathname : '#' + tab); render(); window.scrollTo({ top: 0 }); }
});

render();
refresh();
setInterval(refresh, 10 * 60e3);
