# Product goal — NodeSEO

## Who opens this, and what they are trying to finish

Someone has shipped a website and cannot tell whether search engines can
actually read it. Maybe they launched last month and the site shows up when
people type a long specific phrase but not when they type the company's own
name. Maybe a client asked "is our SEO fine?" and the honest answer today is a
shrug, because the only things available are a marketing dashboard that sells a
score and a browser tab where you squint at page source. What they want is
duller and more useful than a score: a list of concrete, checkable facts about
their own pages — does every public page have a title, a description, a single
main heading, a canonical address; is the sitemap complete; do the pages that
should stay private actually tell search engines to skip them; how fast does the
page paint. They open NodeSEO, run one command, and get back a plain report file
listing every check that passed and every one that failed, with the file path
and the reason next to each. That report is the thing they walk away holding.
They can read it themselves, paste it to a developer as a work list, or attach
it to a client update — and re-run the same command next week to see whether the
list got shorter. The word for that report here is a **receipt**: a written
record of what was actually measured, so nobody has to take the tool's word for
it.

The second half of the job is proof for other people. It is one thing to know
your page is fine, another to show a client or a teammate that a real browser
loaded the real page and the real headline appeared. NodeSEO drives an actual
browser through that landing, keeps the screenshot, and records timing numbers
for how quickly the page became visible. The credentialed extras — pulling how
often your pages appeared in Google results, and asking a model to review a
recorded video of the journey — are optional additions on top of a first run
that needs no accounts or keys at all.

## The gate

This repo is judged by the twelve-condition PROMOTION gate, which lives in one
place and is not restated here:

**https://github.com/HomenShum/NodeKit/blob/main/templates/promotion/GATE.md**

Gate variant: `reduced` <!-- reduced = library/CLI judged on its demo
surface and quickstart; see the GATE's reduced-gate section -->

For NodeSEO the demo surface is: the `npm run validate` terminal run, the
Markdown receipts it writes under `docs/reports/`, and the bundled static site
at `examples/site/` that the quickstart audits and that the Playwright journey
loads in a real browser. There is no product web UI, and several rows below say
so rather than pretending otherwise.

Scoring vocabulary is PASS / FAIL / **UNVERIFIED**, and UNVERIFIED is never PASS.

## Canonical journeys

The work queue lives in [PRODUCT_JOURNEYS.md](PRODUCT_JOURNEYS.md). A journey
without browser evidence is unfinished, however green the tests are.

## Loop state

Every iteration is recorded in [PROMOTION_LOG.md](PROMOTION_LOG.md) — journey
exercised, defect fixed, evidence path, conditions newly passing. Loop state
lives in git, never in an agent's memory, so any agent can resume the loop cold.

## Current scorecard

Baseline measured 2026-08-13 on Windows 11, node v22.22.2, Playwright chromium,
fresh `--depth 50` clone of `main` at `8be3dea`, no API keys set. Corrected
2026-08-13 against the GATE's "Where evidence lives, and what counts as an
artifact" rule: a PASS needs **both** halves — the output committed under
`promotion/evidence/` at the path the row names, **and** its producer (script,
test, or npm target) committed and re-runnable from a fresh clone. A real
measurement whose probe was not retained is UNVERIFIED, not PASS. Rows 4 and 9
were downgraded on exactly that basis; see PROMOTION_LOG.md, "Correction —
2026-08-13".

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | UNVERIFIED | 4 of 5 journeys reached their done-when (J1 `npm run validate` exit 0; J2 audit fail path exit 1 with fail=13; J3 `npm run journey` exit 0, real chromium, `promotion/evidence/journey-direct-landing.png`; J4 `npm run perf` exit 0). J5 could not be driven at all — it needs Search Console and Gemini credentials this run did not have. The gate asks for *each* journey, so the row is UNVERIFIED, not PASS. |
| 2 | No critical or major usability defect open | FAIL | D1 in the log: three of the six documented commands (`search-console`, `judge-video`, `capture:cdp`) exit 1 by dumping a raw Node stack trace, including `ModuleJob.run` / ESM loader frames, on the expected not-yet-configured path. Reproduced three times; see PROMOTION_LOG.md defect ledger. |
| 3 | Mobile and desktop both intentional | UNVERIFIED | NodeSEO has no product UI. The only surface that renders is `examples/site/index.html`, which is markup-under-test for the auditor and carries zero stylesheets (measured `document.styleSheets.length === 0`). Judging that fixture's design would be judging the wrong artifact, so no ruling is made. |
| 4 | No horizontal overflow at supported widths | UNVERIFIED | Measured 0 horizontal overflow on the bundled demo site (the only rendered surface) at 375x812 and 1280x800 in headless chromium — `document.documentElement.scrollWidth === window.innerWidth` at both — **probe not retained**. The script that ran that comparison was a scratchpad file outside the repo; nothing committed here re-runs it, and `grep -rn "scrollWidth\|innerWidth" src tests scripts` returns nothing. The two captures ARE committed and are valid PNGs at exactly 375x812 and 1280x800 (`promotion/evidence/example-site-mobile-375.png`, `promotion/evidence/example-site-desktop-1280.png`), but a screenshot taken at a width records the width, not the absence of overflow. Output committed, producer not: half an artifact, so UNVERIFIED. |
| 5 | Loading/empty/success/error/agent-running designed | FAIL | Success states are deliberate — `npm run validate` prints `pass=23 warn=0 fail=0` plus the receipt paths it wrote, and `--dry-run` on `search-console` is a designed empty state (exit 0, writes a shaped report). The error state is not: it is Node's default uncaught-exception dump. Same defect as row 2. |
| 6 | Keyboard and basic accessibility pass | UNVERIFIED | No accessibility audit was run — no axe, no Lighthouse a11y pass. The only check performed was a single Tab press on the demo site, which focused the `Create a room` link with a visible default outline. One tab stop is not an accessibility pass. |
| 7 | Web Interface Guidelines: no major unresolved | UNVERIFIED | Review not run this wave. |
| 8 | Web-quality audit: no major unresolved | UNVERIFIED | The repo's own lab perf check ran (row 10), but no accessibility or Lighthouse/Core Web Vitals audit was run, and this condition bundles all three. |
| 9 | No unexplained console errors or failed requests | PASS | Fixed and re-proved in iteration 1. `tests/search-origin.spec.ts:33` now asserts both channels — `expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] })` — and drops a problem only when the URL of the thing that failed is on a Google search origin (`isExternalSearchOrigin`), never by matching words in the message. Observed in three real chromium runs of `npm run journey`: `examples/site` exits 0 with both arrays empty; a page throwing `Error("google analytics bootstrap failed…")` and a page with an aborted request each exit 1 naming the problem. Both halves of the artifact rule hold. Output: `promotion/evidence/journey-problem-gate.md`, with the before-state at `promotion/evidence/journey-problem-gate-before-fix.md` (same producer, spec at `80df4f2`, 4 of 5 checks FAIL). Producer: `npm run verify:journey-gate` → `scripts/verify-journey-problem-gate.mjs`, committed, serves the pages itself on 127.0.0.1:4313, needs no keys and no network. |
| 10 | Performance does not obstruct interaction | PASS | `npm run perf -- --base-url http://127.0.0.1:4321` exit 0: FCP 128ms, LCP 128ms, CLS 0.000, load event 27ms, 2 KB transferred, status `pass` against the tool's own 2500ms/0.1/3500ms budgets. Both halves of the artifact rule hold. Output: `promotion/evidence/performance-qa-local-demo-site.md`. Producer: `src/performance-check.ts` (npm target `perf`), committed and re-runnable from a fresh clone — the receipt is machine-emitted by its `renderMarkdown()` and matches that writer line for line (`:129` `# Performance QA Report`, `:131` `Generated:`, `:132` `` Base URL: `…` ``, `:134` the "This is a Playwright lab check" blockquote, `:136` the exact 9-column header). `npm run validate` completes in single-digit seconds. |
| 11 | Tests and build green | PASS | `npm install` exit 0 (20 packages, 0 vulnerabilities); `npm run validate` exit 0 (typecheck `tsc --noEmit` clean + audit `pass=23 warn=0 fail=0`), captured verbatim in `promotion/evidence/validate-run.txt`; `npm run journey` exit 0, `1 passed`, run twice. Both halves hold: the producers are the committed npm targets `validate` (`package.json`, = `tsc --noEmit` + `tsx src/audit-static.ts`) and `journey` (= `playwright test`, `tests/search-origin.spec.ts`), which anyone can re-run after `npm install`. Caveat, not a deduction: there is no unit-test suite — the entire automated test surface is one Playwright spec. |
| 12 | Verified in the rendered app, not inferred from code | PASS | Scope stated so the row is auditable: exactly one improvement exists in this repo (iteration 1, the journey problem gate), and it was verified by running the product — three chromium runs of `npm run journey` against three real pages — not by reading the diff. The defect was reproduced the same way before the fix, and both states are committed (`promotion/evidence/journey-problem-gate-before-fix.md`, `promotion/evidence/journey-problem-gate.md`) with one committed producer that regenerates either. This row is re-earned per wave: a later improvement verified only by reading code drops it back to UNVERIFIED. |

**Status: NOT PROMOTED** — 4/12 PASS (9, 10, 11, 12), 2 FAIL (2, 5), 6
UNVERIFIED (1, 3, 4, 6, 7, 8). Baseline was first recorded as 4/12, corrected
down to 2/12 on 2026-08-13 because rows 4 and 9 rested on probes that were not
retained; iteration 1 rebuilt row 9 with a committed producer and earned row 12.
Row 4 still has no committed overflow probe and stays UNVERIFIED. See
PROMOTION_LOG.md, "Correction — 2026-08-13" and "Iteration 1 — 2026-08-13".
