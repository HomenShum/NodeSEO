# Integrations

Everything this repository talks to that is not a file on your disk, what it
needs, and how to exercise it without credentials.

## The short version

**One command needs nothing at all — `audit`, the one the quickstart runs.** Two
more (`frames:video`, `compress-video`) need nothing when given `--dry-run`.
Everything else needs a browser, a binary, or a credential.

| Command | External thing | Credential | Keyless path |
|---|---|---|---|
| `audit` | none | — | it *is* the keyless path |
| `journey` | a web page over HTTP | — | defaults to `https://example.com`; point it at your own site |
| `frames:video` | ffmpeg binary | — | `--dry-run` prints the exact ffmpeg command |
| `compress-video` | ffmpeg binary | — | `--dry-run` prints the exact ffmpeg command |
| `perf` | headless Chromium | — | needs `npx playwright install chromium` |
| `search-console` | Google Search Console API | token or service account | `--dry-run` writes a shaped report |
| `judge-video` | Google Gemini API | `GOOGLE_GENERATIVE_AI_API_KEY` | `--dry-run` writes all-zero scores |
| `capture:cdp` | **your own Chrome**, over the DevTools protocol | none, but see below | none — this one has no dry run |

## Google Search Console — `npm run search-console`

**File:** `src/search-console-report.ts`
**Endpoint:** `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`

Two ways to authenticate, checked in this order:

1. `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` — a bearer token you already hold. Used
   verbatim.
2. `GOOGLE_APPLICATION_CREDENTIALS` — a path to a service-account JSON file. The
   command builds and signs a JWT itself (`node:crypto` `createSign`, RS256,
   scope `webmasters.readonly`), exchanges it at
   `https://oauth2.googleapis.com/token`, and uses the returned access token.
   There is no Google auth library in `package.json`; `serviceAccountJwt` at
   `src/search-console-report.ts:149` is the whole implementation, about fifteen
   lines.

It issues exactly two requests per run — one for the `query` dimension, one for
`page` — over a date window that defaults to the last month ending three days
ago, because Search Console data lags.

**The boundary that matters:** this reads the site owner's own measured
performance data. It does not scrape search results and does not simulate
clicks. The README states that as a product rule and the rendered report repeats
it in a blockquote.

## Google Gemini — `npm run judge-video`

**File:** `src/judge-video-gemini.ts`
**Via:** the Vercel AI SDK, `generateObject` with the `@ai-sdk/google` provider.
**Model:** `GEMINI_SEO_VIDEO_JUDGE_MODEL`, default `gemini-3.5-flash`.
**Credential:** `GOOGLE_GENERATIVE_AI_API_KEY`, checked before anything is sent.

The whole MP4 is read into memory and attached to the message as bytes, so this
is not suitable for a long recording — the intended input is the ~10-second
review MP4 that `frames:video` produces. Temperature is pinned to 0.2.

Output is constrained by a Zod schema, not by prompt instructions alone; see
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Your real Chrome — `npm run capture:cdp`

**File:** `src/chrome-cdp-capture.ts`
**Connects to:** `CHROME_CDP_URL`, default `http://127.0.0.1:9222`, via
`chromium.connectOverCDP`.

This is the one integration that touches your personal browser, and it is the
one to be careful with. It attaches to a Chrome you started yourself with remote
debugging enabled, runs one Google search, and follows the first result matching
your target host, screenshotting frames along the way. The point is that the
search-results page is a real one from a real session — which is exactly why the
receipt is sanitised.

Start a *separate* Chrome profile for it rather than attaching to your daily
browser:

```powershell
Start-Process "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" `
  -ArgumentList "--remote-debugging-port=9222 --user-data-dir=$env:TEMP\nodeseo-chrome"
```

**What the receipt deliberately does not keep** (`sanitizeHref`,
`src/chrome-cdp-capture.ts:79`): for a Google URL it keeps only origin, path and
the `q` parameter; for any other URL it strips the query string and fragment
entirely. Account, sign-out, location and personalization parameters never reach
`recording-state.json`. The README lists this as a safety rule; this function is
where it is enforced.

**One query per run**, on purpose. This is manual QA, not a crawler.

## ffmpeg — `frames:video`, `compress-video`

Shelled out to with `execFileSync("ffmpeg", args, { stdio: "inherit" })`. Not
installed by `npm install`, not checked for at startup. `--dry-run` prints the
exact command line so you can run it by hand or paste it into a bug report.

`compress-video` wraps the call and tells you to install ffmpeg or use
`--dry-run` if it fails. `frames-to-video` does not, so a missing ffmpeg there
surfaces as a raw `ENOENT`; see [`CONCERNS.md`](CONCERNS.md).

## Chromium — `journey`, `perf`

Installed separately with `npx playwright install chromium`. This is the only
setup step beyond `npm install`, and **the headline command `npm run validate`
does not need it.**

`journey` runs the Playwright test runner; `perf` drives `chromium.launch()`
directly. Both come from the one `@playwright/test` package.

`journey` has an optional live-Google branch, off unless
`SEO_ALLOW_LIVE_GOOGLE=1`. Left off, the journey never loads a Google URL at
all.

## Environment variables, all of them

From `.env.example`, loaded by `src/utils.ts` from `.env` then `.env.local`,
with your real shell environment winning over both.

| Variable | Used by |
|---|---|
| `SEO_BASE_URL` | `audit`, `perf`, `capture:cdp`, `playwright.config.ts` |
| `SEO_WORKFLOW_CONFIG` | any command, as an alternative to `--config` |
| `SEO_TARGET_PHRASE`, `SEO_TARGET_HOST` | `capture:cdp`, `journey` |
| `SEO_DIRECT_PATH`, `SEO_PRIMARY_HEADING`, `SEO_PRIMARY_CTA_TEXT` | `journey` |
| `SEO_ALLOW_LIVE_GOOGLE` | `journey` — `1` enables the live-Google branch |
| `PLAYWRIGHT_BASE_URL` | `playwright.config.ts`, `perf` |
| `PLAYWRIGHT_RECORD_VIDEO` | `playwright.config.ts` — `1` records every run |
| `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_SEO_VIDEO_JUDGE_MODEL` | `judge-video` |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS` | `search-console` |
| `CHROME_CDP_URL` | `capture:cdp` |
| `JOURNEY_GATE_PORT` | `verify:journey-gate` — override when 4313 is taken |

`.env` and `.env.local` are gitignored. Never commit a service-account JSON.
