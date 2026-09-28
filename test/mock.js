const V='alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu'.split(' ');const W=()=>V[Math.floor(Math.random()*V.length)]+Math.floor(Math.random()*999);
// Offline test: fakes every website and the Claude API, then runs the real scripts.
const rss = (site, n = 6) => `<?xml version="1.0"?><rss version="2.0"><channel><title>${site}</title>${Array.from({ length: n }, (_, i) => `<item><title>${W()} ${W()} ${W()} ${W()} ${W()} ${W()}</title><link>https://${site}/story-${i}</link><pubDate>${new Date(Date.now() - i * 3600e3).toUTCString()}</pubDate><description>Some excerpt text for ${site} story ${i}.</description></item>`).join('')}</channel></rss>`;
const page = `<html><head><meta property="og:image" content="https://img.example/x.jpg"></head><body><article><p>${'This is a long enough paragraph of article body text for testing purposes. '.repeat(3)}</p></article></body></html>`;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  const ok = (body, json) => ({ ok: true, status: 200, text: async () => body, json: async () => (json ?? JSON.parse(body)) });
  if (url.includes('api.anthropic.com')) {
    const prompt = JSON.parse(opts.body).messages[0].content;
    let out;
    if (prompt.includes('articles as JSON')) {
      const list = JSON.parse(prompt.slice(prompt.indexOf('['), prompt.indexOf('\n\nFor EACH')));
      out = list.map((a) => ({ n: a.n, skip: false, category: a.hint || ['desh', 'politics', 'money', 'khela'][a.n % 4], tone: a.n === 3 ? 'serious' : 'light',
        en: { title: `EN title ${a.source} ${a.n}`, summary: 'Line one of a summary. Line two. Line three. Line four.' },
        bn: { title: `বাংলা শিরোনাম ${a.n}`, summary: 'প্রথম লাইন। দ্বিতীয় লাইন। তৃতীয় লাইন।' } }));
    } else if (prompt.includes('STORIES from the last day')) {
      const ids = [...prompt.matchAll(/"id":"([a-z0-9]+)"/g)].map((m) => m[1]);
      out = { burning: ids.slice(0, 5).map((id, i) => ({ id, heat: 5 - i, why: { en: 'Everyone is on it.', bn: 'সবাই এটা নিয়েই।' } })),
        gossip: ids.slice(0, 3).map((id, i) => ({ id, tag: '#Trend' + i, platforms: ['Google', 'Reddit'], heat: 4 - i, en: { title: 'Trend title', text: 'Why it trends.' }, bn: { title: 'ট্রেন্ড', text: 'কেন ট্রেন্ড।' } })) };
    } else if (prompt.includes('Meme candidates')) out = { n: 0, en: { title: 'Meme', text: 'It hits.' }, bn: { title: 'মিম', text: 'লাগছে।' } };
    else out = [];
    return ok(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }], usage: { input_tokens: 3000, output_tokens: 2000 } }));
  }
  if (url.includes('trends.google.com')) return ok(`<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss" version="2.0"><channel><item><title>fuel price</title><ht:approx_traffic>20000+</ht:approx_traffic></item></channel></rss>`);
  if (url.includes('reddit.com')) return ok('', { data: { children: [{ data: { title: 'Funny meme', score: 900, num_comments: 40, link_flair_text: 'Meme', permalink: '/r/x/1', url: 'https://i.redd.it/a.jpg', over_18: false } }] } });
  if (url.includes('applemarketingtools')) return ok('', { feed: { results: Array.from({ length: 10 }, (_, i) => ({ name: 'Song ' + i, artistName: 'Artist ' + i, url: 'https://music.apple.com/' + i })) } });
  if (url.includes('dhakatribune.com/feed')) return { ok: false, status: 403, text: async () => '' }; // force a Google News fallback
  if (/story-\d/.test(url)) return ok(page);
  const host = new URL(url).hostname;
  return ok(rss(host));
};
process.env.ANTHROPIC_API_KEY = 'test';
await import(process.argv[2]);
