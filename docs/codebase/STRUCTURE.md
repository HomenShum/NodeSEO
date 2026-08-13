# Structure

Where everything lives and which directory you are allowed to ignore on day one.

```
NodeSEO/
├── src/                 the seven commands + one shared module   ← the code
├── tests/               one Playwright journey + three broken-page fixtures
├── scripts/             committed producers: things that regenerate evidence
├── examples/site/       a small static site the tools are demonstrated against
├── config/              an example workflow config
├── docs/                this packet, plus generated receipts (gitignored)
├── promotion/           the product-loop ledger: goal, journeys, defects, evidence
├── .tours/              CodeTour walkthroughs of the three main flows
└── .github/workflows/   CI: validate, verify:cli, verify:citations
```

## `src/` — one file per command, plus one shared module

Every file except `utils.ts` is a **program, not a library**. It has no exports;
its module body runs top to bottom and the process exits. Importing one would
run it.

| File | npm script | What it does | Needs |
|---|---|---|---|
| `audit-static.ts` | `audit` | Reads HTML files on disk and checks titles, descriptions, canonicals, one-H1, sitemap, robots.txt, private-route noindex | nothing |
| `performance-check.ts` | `perf` | Loads pages in headless Chromium and records FCP/LCP/CLS/load against fixed budgets | chromium |
| `search-console-report.ts` | `search-console` | Pulls query and page rows from the Google Search Console API | a Google credential |
| `chrome-cdp-capture.ts` | `capture:cdp` | Attaches to your real Chrome, runs one Google search, follows the result, screenshots frames | Chrome on a debug port |
| `frames-to-video.ts` | `frames:video` | Turns a directory of frames into a review MP4 | ffmpeg |
| `compress-video.ts` | `compress-video` | Shrinks an MP4 for review or reading | ffmpeg |
| `judge-video-gemini.ts` | `judge-video` | Sends an MP4 to Gemini and stores structured visual-QA scores | a Gemini API key |
| `utils.ts` | — | **The only shared module.** Flags, config, `.env`, path resolution, receipt writing | nothing |

`utils.ts` is the one file every other one imports, and the one file with a
committed check (`npm run verify:cli`). Read it first — it is 119 lines and
explains most of the repetition you will see elsewhere.

## `tests/` — one spec, three deliberately broken pages

| Path | What it is |
|---|---|
| `search-origin.spec.ts` | The whole automated browser surface: one test that loads the landing page, asserts the headline and CTA, and asserts zero console errors and zero failed requests |
| `fixtures/first-party-error/` | A page that throws an error whose message contains "google" |
| `fixtures/first-party-console-error/` | A page whose `console.error` contains "favicon" |
| `fixtures/failed-request/` | A page with a `fetch` aborted mid-flight, which Chrome logs nothing about |

The three fixtures are **not** combined into one page, and that is deliberate: a
refused subresource also prints to the console, so a combined fixture would fail
through the error channel while proving nothing about the request channel. Each
fixture trips exactly one thing.

## `scripts/` — producers, not utilities

Nothing here is imported by anything. Each file regenerates a committed artifact
or proves a committed claim, and each has an npm script so it is discoverable.

| File | npm script | Regenerates / proves |
|---|---|---|
| `capture-validate-receipt.mjs` | `capture:receipt` | The README terminal image and `docs/reports/examples/SEO_AUDIT.example.md`, from a real `npm run validate` run |
| `verify-journey-problem-gate.mjs` | `verify:journey-gate` | That the browser journey's quality gate can actually fail. Writes `promotion/evidence/journey-problem-gate.md` |
| `verify-cli-contract.ts` | `verify:cli` | The flag/config/env/path contract in `src/utils.ts`, and that an unconfigured command prints one sentence rather than a stack |
| `verify-citations.mjs` | `verify:citations` | That every documented citation — tour step or `path:line` in markdown — matches the code on the cited line, and that only `promotion/PRODUCT_GOAL.md` states the scorecard |

## `examples/site/` — the demo surface

A five-file static site — `index.html`, `public/pricing/index.html`,
`public/faq/index.html`, `public/robots.txt`, `public/sitemap.xml` — that the
quickstart audits and the journey loads. It is
**markup under test**, not a design artifact — it carries zero stylesheets. Do
not judge it as a web page.

## `docs/`

| Path | Committed? | What |
|---|---|---|
| `START_HERE.md` | yes | The runtime-order walkthrough. Start here. |
| `SIMPLIFICATION_REPORT.md` | yes | What Wave 3 removed, with the command that measures each row |
| `codebase/` | yes | This packet |
| `WORKFLOW.md`, `KEYWORD_CLUSTER.md`, `FEATURE_PROOF_STORYBOARD.md` | yes | SEO practice guidance — *how to use the tool well*, not how it is built |
| `media/validate-terminal.png` | yes | The README screenshot, produced by `npm run capture:receipt` |
| `reports/examples/` | yes | One committed receipt, so a reader sees the output without running anything |
| `reports/*` | **no** — gitignored | Everything a run writes |

## `promotion/` — the product loop, not the code

`PRODUCT_GOAL.md` (who this is for, and the 12-condition scorecard),
`PRODUCT_JOURNEYS.md` (the work queue), `PROMOTION_LOG.md` (**the defect
ledger** — four open defects with reproductions), `SKILLS.md`, and
`evidence/` (committed proof).

If you are wondering "is this odd thing a bug or a decision?", the ledger in
`PROMOTION_LOG.md` is the first place to look. Four known defects are open there
on purpose.

## Where a change usually goes

| You want to… | Edit |
|---|---|
| add an SEO check | `src/audit-static.ts` — one function, plus one call in `buildReport` |
| change what counts as pass/warn/fail | `src/audit-static.ts`, `pushRequired` |
| add a command-line flag | the top of the relevant `src/*.ts`; read it via `optionValue` |
| change how any receipt looks | the `renderMarkdown` in that command's own file |
| change what the model is asked | `src/judge-video-gemini.ts`, `prompt()` and `schema` |
| make the browser journey stricter | `tests/search-origin.spec.ts`, then re-run `npm run verify:journey-gate` |
