# Jhalmuri — news, mixed

Free Bangladeshi news in 5 lines, in English and Bangla. Includes Burning (today's hot talk), Today's Social Gossip, Gaan Chart, Meme of the Week, Hasi (funny and satire) and Bhabna (philosophy).

## How it works

```
GitHub Actions (every hour)
  ├─ scripts/fetch-news.js   reads ~38 free sources → Claude writes EN + BN summaries → public/data/feed.json
  └─ scripts/social-scan.js  every 3rd hour: Google Trends BD, Reddit, YouTube → Burning + Gossip
                             weekly: Meme of the Week · daily: Gaan Chart
        ↓ commits the JSON
Vercel serves /public (static site) and redeploys on every commit
```

There's no database or server to manage. All data lives in `public/data/`.

## Settings (GitHub → Settings → Secrets and variables → Actions)

| Name | Kind | Needed? | What it does |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | **Yes** | Writes the summaries |
| `YOUTUBE_API_KEY` | Secret | Optional | Turns on the Bangla Gaan Chart and adds YouTube to the social scan |
| `LASTFM_API_KEY` | Secret | Optional | Backup source for the Bangla chart |
| `JHALMURI_DAILY_BUDGET_USD` | Variable | Optional | Max AI spend per day (default `0.35`) |

## Handy things

- **Run it now:** Actions → Update Jhalmuri → Run workflow.
- **Which sources work:** `state/sources-health.json`, updated every run. A source whose own feed fails falls back to Google News automatically.
- **Add or remove a source:** edit `scripts/sources.js`.
- **Change the voice:** edit `scripts/voice.js`.
- **Use publishers' photos instead of text cards:** set `SHOW_SOURCE_IMAGES = true` in `public/app.js` (check each publisher's terms first).
- **Offline test:** `node test/mock.js ../scripts/fetch-news.js`
