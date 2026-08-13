# Canonical journeys — NodeSEO

Three to five real workflows. Not feature tours: a journey is one person, one
goal, and the artifact they hold when it worked. These are the promotion loop's
work queue, exercised in order of importance.

**A journey with no browser evidence is unfinished**, regardless of test status.

NodeSEO ships no product web UI. Its surface is a set of npm scripts that write
Markdown and JSON receipts, plus a bundled static site at `examples/site/` that
the quickstart audits and that two of the scripts load in a real browser. The
journeys below therefore name npm scripts and file paths rather than routes, and
each one says which concrete file in this repo it drives.

## Journey shape

Each journey states, in this order:

- **Persona and situation** — who arrived, and why today.
- **Goal** — what they want to be true when they leave.
- **Steps** — what they actually do, in the UI, in order.
- **Done when** — the observable artifact or state that proves completion.
- **Evidence** — path to the capture that shows it working. Empty until proven.

---

## J1 — "Show me it works before I point it at anything of mine"

- **Persona and situation:** A solo founder found this repo from a link and has
  about ten minutes. They have no Google account connected to anything, no API
  keys, and no patience for a tool that demands credentials before it will show
  a single line of output.
- **Goal:** See the toolkit produce a real, readable result on something that is
  already in the box, so they can decide whether it is worth wiring up to their
  own site.
- **Drives:** the `validate` script in `package.json` → `src/audit-static.ts`
  against `config/seo-workflow.config.example.json` and `examples/site/`.
- **Steps:**
  1. `git clone` the repo and `npm install`.
  2. `npm run validate` with no `.env`, no keys, no config edits.
  3. Open `docs/reports/SEO_AUDIT.md` and read the per-route table and findings.
- **Done when:** the terminal prints `pass=23 warn=0 fail=0` and exits 0, and
  `docs/reports/SEO_AUDIT.md` exists with one row per public route plus a
  findings table — reproducing the committed
  `docs/reports/examples/SEO_AUDIT.example.md` that the README shows.
- **Evidence:** `promotion/evidence/validate-run.txt` — verbatim stdout, exit 0,
  node v22.22.2, no keys set. Generated receipt matched the committed example
  line for line apart from the timestamp.

## J2 — "Point it at my own build and give me a list I can hand to a developer"

- **Persona and situation:** Same person the next day, now with their own static
  build in `dist/`. They need the failures, not the passes — a work list.
- **Goal:** A per-route report naming every missing title, description,
  canonical, sitemap entry and private-route guard on *their* pages, and a
  non-zero exit code so it can gate a build later.
- **Drives:** `src/audit-static.ts` via `npm run audit -- --config <theirs>`,
  configured by a copy of `config/seo-workflow.config.example.json`
  (`baseUrl`, `siteRoot`, `publicDir`, `publicRoutes`, `privatePatterns`).
- **Steps:**
  1. Copy the example config, set `siteRoot` to their build output and list
     their real public routes and private query patterns.
  2. `npm run audit -- --config config/mine.json`.
  3. Read `docs/reports/SEO_AUDIT.md`, fix the fails, re-run.
- **Done when:** failing checks appear as `fail` rows naming the file and the
  reason, the summary counts them, and the process exits non-zero so CI can use
  it.
- **Evidence:** partial. Exercised against a deliberately broken synthetic site
  (missing title, missing description, missing canonical, two `<h1>`s, missing
  `/faq/` route): `pass=2 warn=0 fail=13`, exit 1 — the fail path and the
  non-zero exit are both real. Not yet exercised against a genuine third-party
  build, which is the part that would surface config ergonomics.

## J3 — "Prove in a real browser that the landing page actually works"

- **Persona and situation:** An agency contractor who has to show a client that
  the page a searcher lands on really renders the headline and the call to
  action — a claim a static file scan cannot make.
- **Goal:** A recorded browser run ending in a screenshot of the landing page
  with the expected heading and CTA asserted visible, and no console errors.
- **Drives:** `tests/search-origin.spec.ts` via `npm run journey`, configured by
  `playwright.config.ts` (chromium, 1440x920) and the `SEO_PRIMARY_HEADING` /
  `SEO_PRIMARY_CTA_TEXT` / `PLAYWRIGHT_BASE_URL` environment variables.
- **Steps:**
  1. `npx playwright install chromium`.
  2. `PLAYWRIGHT_BASE_URL=<their site> SEO_PRIMARY_HEADING=... npm run journey`.
  3. Open the attached `direct-landing.png` in the Playwright HTML report.
- **Done when:** the spec passes, the heading and CTA assertions hold, and a
  full-page screenshot of the landing exists as a test attachment. With
  `SEO_ALLOW_LIVE_GOOGLE=1` the same spec starts from one real Google query
  instead; without it, it annotates the skip and lands directly.
- **Evidence:** `promotion/evidence/journey-direct-landing.png` — real chromium,
  `1 passed`, exit 0, driven against `examples/site` served locally on
  `127.0.0.1:4321`. The Google-origin branch was **not** exercised: it issues a
  live query against Google, which this baseline deliberately did not do.

## J4 — "Tell me whether the page is fast enough to bother a visitor"

- **Persona and situation:** The same contractor, asked "is it slow?" and
  wanting numbers rather than an opinion.
- **Goal:** Paint and layout-stability numbers per public route, scored against
  stated budgets, in a file they can attach to a status update.
- **Drives:** `src/performance-check.ts` via `npm run perf -- --base-url ...`,
  which launches headless chromium and installs paint/LCP/CLS observers.
- **Steps:**
  1. `npm run perf -- --base-url <their site>`.
  2. Read `docs/reports/PERFORMANCE_QA_REPORT.md`.
- **Done when:** the report has one row per public route with FCP, LCP, CLS,
  load time and transfer size, a `pass`/`warn`/`fail` verdict against the
  2500ms / 0.1 / 3500ms budgets, and exit 1 if any route fails.
- **Evidence:** `promotion/evidence/performance-qa-local-demo-site.md` — exit 0,
  `/` scored `pass` with FCP 128ms, LCP 128ms, CLS 0.000, load 27ms, 2 KB.
  Only the single local route was measured; the multi-route and `fail`-verdict
  paths are unproven.

## J5 — "Connect the Google data and the video review"

- **Persona and situation:** A maintainer a week in, who now wants the parts
  that need accounts: how often their pages appeared in Google results, and a
  model's structured review of a recorded browser journey.
- **Goal:** A Search Console receipt with real query and page rows, and a video
  QA verdict — labelled as visual QA, not as ranking proof.
- **Drives:** `src/search-console-report.ts` (`npm run search-console`),
  `src/chrome-cdp-capture.ts` (`npm run capture:cdp`),
  `src/frames-to-video.ts`, and `src/judge-video-gemini.ts`
  (`npm run judge-video`).
- **Steps:**
  1. Set `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` (or a service account) and
     `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`.
  2. `npm run search-console -- --site-url https://their-site/`.
  3. Launch Chrome with `--remote-debugging-port=9222`, then
     `npm run capture:cdp`, `npm run frames:video`, `npm run judge-video`.
- **Done when:** `docs/reports/SEARCH_CONSOLE_REPORT.md` holds real query and
  page rows, and the judge writes a structured verdict for the recorded MP4.
- **Evidence:** _none_. **Not drivable in this environment** — it requires
  Google credentials this baseline deliberately did not obtain or create, and a
  local Chrome running with remote debugging. What was observed instead: the
  designed empty path `npm run search-console -- --dry-run` exits 0 and writes a
  shaped report, while all three credentialed commands fail with a raw Node
  stack trace rather than a stated prerequisite (defect D1).

---

## Journeys every agent surface owes

NodeSEO runs a model in exactly one place: `src/judge-video-gemini.ts` sends a
finished MP4 to Gemini and asks for a structured visual-QA verdict. It is a
single non-interactive call at the end of a pipeline, not an agent working on
the user's behalf over time. Mapping the three required journeys onto it:

- **Recovery** — **does not apply as a UI journey, but is unmet as a CLI one.**
  There is no long-running session to lose, so nothing needs to survive a
  reload. There *is* a mid-run failure story and it is bad: every failure path
  observed in this baseline surfaces as an unhandled Node exception (D1). The
  gap is a stated prerequisite and a clean exit, not a recovery UI.
- **Steering** — **does not apply.** The user cannot correct the model partway
  through: the judging call is one request with one response, and the entire
  input is decided before it is issued. Correcting the run means changing the
  scenario argument and running it again.
- **Receipt** — **applies, and is the product's core idea.** Every command
  writes both a machine-readable JSON file and a human-readable Markdown file
  under `docs/reports/`, naming what was checked, in which file, and with what
  result. Covered by J1 (`SEO_AUDIT.md`) and J4 (`PERFORMANCE_QA_REPORT.md`),
  both with committed evidence. The Gemini verdict's own receipt is inside J5
  and remains unproven.
