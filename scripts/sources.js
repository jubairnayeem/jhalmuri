// Every source Jhalmuri reads. All are free to read.
// type "rss": the site's own feed. If it fails, we fall back to Google News for that site (gnews).
// section: where items land. "news" items get their category from the AI.
// lang: language of the source. max: how many new items per run we take from it.

const gnews = (site, lang) =>
  lang === 'bn'
    ? `https://news.google.com/rss/search?q=site:${site}+when:1d&hl=bn&gl=BD&ceid=BD:bn`
    : `https://news.google.com/rss/search?q=site:${site}+when:1d&hl=en-BD&gl=BD&ceid=BD:en`;

const S = (name, site, lang, rss, extra = {}) => ({
  name, site, lang, rss, fallback: gnews(site, lang), section: 'news', max: 4, ...extra,
});

export const SOURCES = [
  // ---- English, Bangladesh ----
  S('The Daily Star', 'thedailystar.net', 'en', 'https://www.thedailystar.net/frontpage/rss.xml'),
  S('The Business Standard', 'tbsnews.net', 'en', 'https://www.tbsnews.net/top-news/rss.xml'),
  S('Dhaka Tribune', 'dhakatribune.com', 'en', 'https://www.dhakatribune.com/feed'),
  S('bdnews24.com', 'bdnews24.com', 'en', 'https://bdnews24.com/rss/english'),
  S('Prothom Alo English', 'en.prothomalo.com', 'en', 'https://en.prothomalo.com/feed/'),
  S('New Age', 'newagebd.net', 'en', 'https://www.newagebd.net/rss/rss.xml', { max: 3 }),
  S('The Financial Express', 'thefinancialexpress.com.bd', 'en', 'https://thefinancialexpress.com.bd/feed', { max: 3 }),
  S('UNB', 'unb.com.bd', 'en', 'https://unb.com.bd/rss', { max: 2 }),
  S('BSS', 'bssnews.net', 'en', 'https://www.bssnews.net/rss', { max: 2 }),
  S('Daily Sun', 'daily-sun.com', 'en', 'https://www.daily-sun.com/rss', { max: 2 }),
  S('Bangladesh Post', 'bangladeshpost.net', 'en', 'https://bangladeshpost.net/rss', { max: 2 }),

  // ---- Bangla ----
  S('প্রথম আলো', 'prothomalo.com', 'bn', 'https://www.prothomalo.com/feed/'),
  S('বিবিসি বাংলা', 'bbc.com/bengali', 'bn', 'https://feeds.bbci.co.uk/bengali/rss.xml'),
  S('বিডিনিউজ২৪', 'bangla.bdnews24.com', 'bn', 'https://bangla.bdnews24.com/rss'),
  S('বাংলা ট্রিবিউন', 'banglatribune.com', 'bn', 'https://www.banglatribune.com/feed/'),
  S('ডয়চে ভেলে বাংলা', 'dw.com/bn', 'bn', 'https://rss.dw.com/rdf/rss-ben-all', { max: 3 }),
  S('সমকাল', 'samakal.com', 'bn', 'https://samakal.com/feed', { max: 3 }),
  S('কালের কণ্ঠ', 'kalerkantho.com', 'bn', 'https://www.kalerkantho.com/rss.xml', { max: 3 }),
  S('যুগান্তর', 'jugantor.com', 'bn', 'https://www.jugantor.com/feed/rss.xml', { max: 3 }),
  S('ইত্তেফাক', 'ittefaq.com.bd', 'bn', 'https://www.ittefaq.com.bd/feed/', { max: 2 }),
  S('বাংলাদেশ প্রতিদিন', 'bd-pratidin.com', 'bn', 'https://www.bd-pratidin.com/rss.xml', { max: 2 }),
  S('জাগো নিউজ', 'jagonews24.com', 'bn', 'https://www.jagonews24.com/rss/rss.xml', { max: 2 }),
  S('ঢাকা পোস্ট', 'dhakapost.com', 'bn', 'https://www.dhakapost.com/rss/rss.xml', { max: 2 }),
  S('প্রথম আলো বিনোদন', 'prothomalo.com/entertainment', 'bn', 'https://www.prothomalo.com/feed/entertainment', { max: 2, hint: 'showbiz' }),

  // ---- World, tech, sport ----
  S('BBC News', 'bbc.com/news', 'en', 'https://feeds.bbci.co.uk/news/world/rss.xml', { max: 3, hint: 'world' }),
  S('Al Jazeera', 'aljazeera.com', 'en', 'https://www.aljazeera.com/xml/rss/all.xml', { max: 3, hint: 'world' }),
  S('The Guardian', 'theguardian.com', 'en', 'https://www.theguardian.com/world/rss', { max: 2, hint: 'world' }),
  S('Rest of World', 'restofworld.org', 'en', 'https://restofworld.org/feed/latest/', { max: 2, hint: 'tech' }),
  S('TechCrunch', 'techcrunch.com', 'en', 'https://techcrunch.com/feed/', { max: 2, hint: 'tech' }),
  S('ESPNcricinfo', 'espncricinfo.com', 'en', 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', { max: 3, hint: 'khela' }),

  // ---- Bhabna (philosophy) ----
  S('Aeon', 'aeon.co', 'en', 'https://aeon.co/feed.rss', { section: 'bhabna', max: 1 }),
  S('Psyche', 'psyche.co', 'en', 'https://psyche.co/feed', { section: 'bhabna', max: 1 }),
  S('Daily Nous', 'dailynous.com', 'en', 'https://dailynous.com/feed/', { section: 'bhabna', max: 1 }),
  S('1000-Word Philosophy', '1000wordphilosophy.com', 'en', 'https://1000wordphilosophy.com/feed/', { section: 'bhabna', max: 1 }),

  // ---- Hasi (funny, weird, satire) ----
  S('UPI Odd News', 'upi.com', 'en', 'https://rss.upi.com/news/odd_news.rss', { section: 'hasi', max: 2 }),
  S('Oddity Central', 'odditycentral.com', 'en', 'https://www.odditycentral.com/feed', { section: 'hasi', max: 1 }),
  S('The Onion', 'theonion.com', 'en', 'https://theonion.com/feed/', { section: 'hasi', max: 1, satire: true }),
  S('eArki', 'earki.co', 'bn', 'https://www.earki.co/feed', { section: 'hasi', max: 1, satire: true }),
];

export const CATEGORIES = ['desh', 'politics', 'money', 'khela', 'tech', 'showbiz', 'world', 'campus', 'lifestyle'];
