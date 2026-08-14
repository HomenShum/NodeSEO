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
| 2 | No critical or major usability defect open | PASS | D1, the only major defect in the ledger, is closed in iteration 3. The three commands that need credentials or a browser (`search-console`, `judge-video`, `capture:cdp`) now exit 1 printing one sentence naming what to configure, with no `ModuleJob` / ESM loader frame. D2–D4 remain open and are all minor. Both halves of the artifact rule hold. Output: `promotion/evidence/unconfigured-commands.md`, before and after in the same clone. Producer: `npm run verify:cli` → `scripts/verify-cli-contract.ts`, committed, keyless, no network; it re-runs all three commands and asserts exit 1, one line of stderr, the expected sentence, and no Node frame — 21/25 on the pre-fix tree, 25/25 after. |
| 3 | Mobile and desktop both intentional | PASS | The criterion, stated so the row is auditable: each route **declares** how it is to be laid out on a phone, is measured at both widths, and neither form factor is the accidental byproduct of the other. Before iteration 4 that was false on 2 of 3 routes — `/pricing/` and `/faq/` had no `<meta name="viewport">`, so on a 375px device they were laid out at **980px** and scaled down (`clientWidth=980`, `scrollWidth=981`, Lighthouse `viewport-insight` 0.5). Now all three declare `width=device-width, initial-scale=1`, all three measure `clientWidth=375` at 375 and `1280` at 1280, and Lighthouse ran **twice per route** — mobile preset and desktop preset, 6 runs — scoring 1.00 in every category on both. Not claimed: any judgement of visual design. The fixture carries zero stylesheets on purpose (`styleSheets: 0`, measured on all six route/viewport combinations) so the static auditor grades markup rather than a theme. Both halves hold. Output: `promotion/evidence/web-quality-audit.md` and `-before-fix.md`, captures `example-site-{mobile-375,desktop-1280,pricing-mobile-375}.png`. Producer: `npm run verify:web-quality` → `scripts/verify-web-quality.mjs`. |
| 4 | No horizontal overflow at supported widths | PASS | The producer the baseline lacked now exists. 0 horizontal overflow on all 3 routes at 375x812 and 1280x800 — 6 combinations, `scrollWidth === deviceWidth` at each, and zero elements whose right edge passes the layout viewport. The check compares against the **device** width, not the layout width the page negotiated: the first version of it asserted `scrollWidth <= clientWidth` and passed on `/pricing/` and `/faq/` while both were laid out 980px wide inside a 375px phone — true of the 980px canvas, and a check that could not fail. Recorded in the before-fix receipt, which shows those two rows FAIL. Both halves hold. Output: `promotion/evidence/web-quality-audit.md` (15 layout checks) plus the two captures the baseline had committed without a producer, `example-site-mobile-375.png` and `example-site-desktop-1280.png`, now re-emitted by that producer — and the desktop one came back **byte-identical to the file the baseline committed**, which is independent corroboration that the unretained scratchpad probe had been measuring the same thing. Producer: `npm run verify:web-quality` → `scripts/verify-web-quality.mjs`, keyless, serves `examples/site` itself on 127.0.0.1:4914 (`WEB_QUALITY_PORT` overrides). |
| 5 | Loading/empty/success/error/agent-running designed | PASS | All four states this CLI has are now deliberate. Success: `npm run validate` prints `pass=23 warn=0 fail=0` plus the two receipt paths it wrote. Empty: `--dry-run` on `search-console` and on `judge-video` exits 0 and writes a shaped report, and `judge-video --dry-run` no longer demands a real video file, so the model path is exercisable from a clean clone with no key. Error: one sentence naming what to configure, exit 1, `SEO_DEBUG=1` for the stack. There is no loading state and no agent-running state to design — the audit finishes in under a second and there is no agent loop; see `docs/START_HERE.md` Step 7. Same evidence and producer as row 2. |
| 6 | Keyboard and basic accessibility pass | PASS | Both instruments, on all 3 routes. **axe-core 4.13.0: 0 violations**, 17 rules passing per route with nothing incomplete — including `color-contrast` (measured 21:1 for body text, 9.39:1 for links), `link-name`, `bypass`, `heading-order`, `page-has-heading-one`, `landmark-one-main`, `html-has-lang`, `meta-viewport` (no zoom suppression). **Lighthouse accessibility 1.00 on all 6 runs.** Keyboard is walked, not assumed: every link on every route is reached by `Tab`, focused with `outline: auto 1px` and `:focus-visible` true, and one press past the last link moves focus out of the document — recorded stop by stop in the receipt. The baseline's "one tab press on one page" is now 3 routes × 2 widths. Caveat, not a deduction: axe catches 20–50% of accessibility issues, which is why the keyboard walk is recorded separately rather than folded into the violation count. Both halves hold. Output: `promotion/evidence/web-quality-audit.md` + `promotion/evidence/axe/{root,pricing,faq}.json`. Producer: `npm run verify:web-quality`. |
| 7 | Web Interface Guidelines: no major unresolved | PASS | Review performed 2026-08-14 against **https://vercel.com/design/guidelines** (reachable; every section named as that page names it), on the rendered pages at 375 and 1280 plus the `/?create=1` state. Two majors found, both fixed and re-measured: **F1** `/pricing/` and `/faq/` had no `<meta name="viewport">` (*Layout → Responsive coverage*); **F2** both pages contained **zero links** despite being sitemap entry points, stranding anyone who landed there (*Content → No dead ends*). Three minors left open by decision and logged as D5–D7: 17px link hit boxes (WCAG 2.2 SC 2.5.8 satisfied via the spacing exception — one target per page — but small), no `color-scheme`/`theme-color`, and a CTA whose only effect is a `robots` meta flip with byte-identical visible text. **This is not a Lighthouse score and was not derived from one** — the same `/pricing/` that scored a11y 1.00 / perf 1.00 / SEO 1.00 on mobile was, in that same run, laid out 980px wide inside a 375px phone. Every finding cites a DOM measurement or a capture. Both halves hold. Output: `promotion/evidence/web-interface-guidelines-review.md`. Producer for the measurements it cites: `npm run verify:web-quality` (the review's own regeneration commands are printed at the end of it). |
| 8 | Web-quality audit: no major unresolved | PASS | All three legs this condition bundles, run and committed. **Lighthouse 13.4.1 × 6 runs** (3 routes × mobile and desktop presets): performance, accessibility, best-practices, SEO and agentic-browsing all **1.00**, and **zero failing audits of any weight** — including the zero-weight ones a category score hides. **Core Web Vitals**: LCP 626–647ms mobile / 169–175ms desktop against a 2500ms budget, **CLS 0.000** everywhere, one network request per page. **axe-core 4.13.0 × 3**: 0 violations. The pre-fix run is committed beside it and failed 10 of the same 67 checks — `errors-in-console` on all six Lighthouse runs (Chrome's automatic `/favicon.ico` 404, which the row-9 journey producer's browser never requests, and `viewport-insight` 0.5 alongside it on the two mobile runs), plus four layout checks. Both halves hold. Output: `promotion/evidence/web-quality-audit.md` (67/67), `-before-fix.md` (57/67), raw JSON under `promotion/evidence/lighthouse/` (6) and `promotion/evidence/axe/` (3). Producer: `npm run verify:web-quality` → `scripts/verify-web-quality.mjs`, which serves the site itself and pins both tool versions. |
| 9 | No unexplained console errors or failed requests | PASS | Fixed in iteration 1, and this row's own wording corrected in iteration 2 after it turned out to be false. `tests/search-origin.spec.ts:33` (`toEqual({ errors: [], failedRequests: [] })`) asserts both channels — `expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] })` — and drops a problem only when the URL of the thing that failed is on a Google origin (`isExternalSearchOrigin`), never by matching words in the message. That last clause was written in iteration 1 while a **second** text filter still ran three lines above it: `isIgnoredProblem`, `/fonts\.googleapis\.com\|fonts\.gstatic\.com\|favicon\|ResizeObserver loop/i`, tested `message.text()`, so a page served from 127.0.0.1 whose own inline script called `console.error("favicon pipeline exploded while rendering the page")` reported `1 passed`, exit 0 — measured, not reasoned about. Iteration 2 deleted that predicate and both its call sites, leaving one origin-based suppression in the file, and added the fixture that keeps it deleted. Observed in four real chromium runs of `npm run journey`: `examples/site` exits 0 with both arrays empty; three broken pages — a thrown error mentioning Google, an aborted request, a console error mentioning favicon — each exit 1 naming their problem. Both halves of the artifact rule hold. Output: `promotion/evidence/journey-problem-gate.md` (7 of 7 checks pass), with both before-states committed: `journey-problem-gate-before-fix.md` (spec at `80df4f2`, 4 of 5 FAIL) and `journey-problem-gate-before-fix-2.md` (spec at `42a51a7`, the 2 new checks FAIL, the other 5 pass). Producer: `npm run verify:journey-gate` → `scripts/verify-journey-problem-gate.mjs`, committed, serves all four pages itself on 127.0.0.1:4313 (`JOURNEY_GATE_PORT` overrides the port), needs no keys and no network. **Blind spot found in iteration 4, recorded rather than quietly fixed:** this producer's chromium never requests `/favicon.ico`, so it reported 0 console errors on the same page where Lighthouse's chromium reported a 404 for it. One browser configuration, one answer; the row's claim was true of the browser it ran in and not of every browser. The demo site now declares `<link rel="icon" href="data:,">` and **both** producers report zero — `verify:journey-gate` 7/7 and `verify:web-quality` `errors-in-console` 1.00 on all 6 runs — so the row is now carried by two independent browsers instead of one. |
| 10 | Performance does not obstruct interaction | PASS | `npm run perf -- --base-url http://127.0.0.1:4321` exit 0: FCP 128ms, LCP 128ms, CLS 0.000, load event 27ms, 2 KB transferred, status `pass` against the tool's own 2500ms/0.1/3500ms budgets. Both halves of the artifact rule hold. Output: `promotion/evidence/performance-qa-local-demo-site.md`. Producer: `src/performance-check.ts` (npm target `perf`), committed and re-runnable from a fresh clone — the receipt is machine-emitted by its `renderMarkdown()` and matches that writer line for line (`:129` `# Performance QA Report`, `:131` `Generated:`, `:132` `` Base URL: `…` ``, `:134` the "This is a Playwright lab check" blockquote, `:136` the exact 9-column header). `npm run validate` completes in single-digit seconds. |
| 11 | Tests and build green | PASS | `npm install` exit 0 (20 packages, 0 vulnerabilities); `npm run validate` exit 0 (typecheck `tsc --noEmit` clean + audit `pass=23 warn=0 fail=0`), captured verbatim in `promotion/evidence/validate-run.txt`; `npm run journey` exit 0, `1 passed`, run twice. Both halves hold: the producers are the committed npm targets `validate` (`package.json`, = `tsc --noEmit` + `tsx src/audit-static.ts`) and `journey` (= `playwright test`, `tests/search-origin.spec.ts`), which anyone can re-run after `npm install`. Iteration 4 adds a fifth green target, `verify:web-quality` (67/67), and the four guards were all re-run on the fixed tree: `verify:cli` 25/25, `verify:citations` 89/89, `verify:journey-gate` 7/7, `validate` `pass=23 warn=0 fail=0`. `verify:citations` went red first: the new npm script displaced the `"validate":` line in `package.json` by one, and the two citations pointing at its old line number went stale — the guard catching a real break, and both were repointed. Caveat, not a deduction: there is no unit-test suite — the entire automated test surface is one Playwright spec plus four verification scripts. |
| 12 | Verified in the rendered app, not inferred from code | PASS | Scope stated so the row is auditable: **six** improvements exist in this repo. Iteration 4 added three — F1 the missing viewport meta, F2 the two link-less pages, F3 the favicon 404 — and each was measured in a real browser **before** the edit and again after, by the same committed script, with the pre-fix receipt kept (`web-quality-audit-before-fix.md`, 11 FAIL) beside the post-fix one (67/67). Iteration 4 also produced the same lesson the row exists for, in its own tooling: the first version of the overflow check was *reasoned* to be correct and passed on both broken pages, because `scrollWidth <= clientWidth` is true of the 980px canvas a viewport-less page lays itself out on. Running it against the pre-fix tree is what exposed that; reading it would not have. The earlier three — iteration 1 (the journey problem gate), iteration 2 (its surviving sibling, the second text filter) and iteration 3 (D1, the crash dump on the unconfigured path) — were likewise verified by running the product, not by reading the diff: four chromium runs of `npm run journey` against four real pages for the first two, and for the third, the three unconfigured commands run before and after in the same clone, then re-run from a fresh clone of the pushed commit. Each defect was reproduced the same way before its fix, and all three states are committed (`journey-problem-gate-before-fix.md`, `journey-problem-gate-before-fix-2.md`, `journey-problem-gate.md`) with one committed producer that regenerates any of them. Iteration 2 is also the counter-example that earns the row: the claim it corrected had been *read* as true and was false when run. This row is re-earned per wave: a later improvement verified only by reading code drops it back to UNVERIFIED. |

**Status: NOT PROMOTED** — **11/12 PASS** (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
0 FAIL, 1 UNVERIFIED (1).

This total is derived from the table above and is stated here and nowhere else.
Every other document links to this file rather than repeating a number that is
wrong the moment an iteration runs; `npm run verify:citations` fails if a copy
reappears, and fails if this sentence stops matching the rows.

How it moved. The baseline recorded rows 4 and 9 as PASS on probes that were not
retained, and both were corrected to UNVERIFIED the same day. Iteration 1 rebuilt
row 9 with a committed producer and earned row 12. Iteration 2 moved no condition
— row 9 was already PASS — but it was resting on a false sentence, so the
evidence under it changed and the score did not. Iteration 3 closed D1, the only
major defect, which is what rows 2 and 5 were failing on. Iteration 4 built the
one thing every remaining row was missing — an instrument pointed at the
rendered surface — and moved five rows at once (3, 4, 6, 7, 8), including
rebuilding the overflow probe row 4 had been waiting for since the baseline.

Row 1 is the only one left and it is **not** an evidence problem: J5 needs a
Google Search Console token and a Gemini key, which no run in this programme has
had or should create. It moves when someone with credentials drives that journey,
not when someone writes a better script. See PROMOTION_LOG.md,
"Correction — 2026-08-13" and iterations 1 to 4.
