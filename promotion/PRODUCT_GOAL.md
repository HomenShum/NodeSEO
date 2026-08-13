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
fresh `--depth 50` clone of `main` at `8be3dea`, no API keys set. Every PASS
below names a command with its exit code or a committed file under
`promotion/evidence/`.

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | UNVERIFIED | 4 of 5 journeys reached their done-when (J1 `npm run validate` exit 0; J2 audit fail path exit 1 with fail=13; J3 `npm run journey` exit 0, real chromium, `promotion/evidence/journey-direct-landing.png`; J4 `npm run perf` exit 0). J5 could not be driven at all — it needs Search Console and Gemini credentials this run did not have. The gate asks for *each* journey, so the row is UNVERIFIED, not PASS. |
| 2 | No critical or major usability defect open | FAIL | D1 in the log: three of the six documented commands (`search-console`, `judge-video`, `capture:cdp`) exit 1 by dumping a raw Node stack trace, including `ModuleJob.run` / ESM loader frames, on the expected not-yet-configured path. Reproduced three times; see PROMOTION_LOG.md defect ledger. |
| 3 | Mobile and desktop both intentional | UNVERIFIED | NodeSEO has no product UI. The only surface that renders is `examples/site/index.html`, which is markup-under-test for the auditor and carries zero stylesheets (measured `document.styleSheets.length === 0`). Judging that fixture's design would be judging the wrong artifact, so no ruling is made. |
| 4 | No horizontal overflow at supported widths | PASS | Measured on the bundled demo site (the only rendered surface) at 375x812 and 1280x800 in headless chromium: `document.documentElement.scrollWidth === window.innerWidth` at both, no horizontal scroll. Captures: `promotion/evidence/example-site-mobile-375.png`, `promotion/evidence/example-site-desktop-1280.png`. |
| 5 | Loading/empty/success/error/agent-running designed | FAIL | Success states are deliberate — `npm run validate` prints `pass=23 warn=0 fail=0` plus the receipt paths it wrote, and `--dry-run` on `search-console` is a designed empty state (exit 0, writes a shaped report). The error state is not: it is Node's default uncaught-exception dump. Same defect as row 2. |
| 6 | Keyboard and basic accessibility pass | UNVERIFIED | No accessibility audit was run — no axe, no Lighthouse a11y pass. The only check performed was a single Tab press on the demo site, which focused the `Create a room` link with a visible default outline. One tab stop is not an accessibility pass. |
| 7 | Web Interface Guidelines: no major unresolved | UNVERIFIED | Review not run this wave. |
| 8 | Web-quality audit: no major unresolved | UNVERIFIED | The repo's own lab perf check ran (row 10), but no accessibility or Lighthouse/Core Web Vitals audit was run, and this condition bundles all three. |
| 9 | No unexplained console errors or failed requests | PASS | Headless chromium load of the demo site at both widths recorded 0 console errors and 0 failed requests. Independently, `tests/search-origin.spec.ts` asserts an empty page-error list and passed (exit 0). |
| 10 | Performance does not obstruct interaction | PASS | `npm run perf -- --base-url http://127.0.0.1:4321` exit 0: FCP 128ms, LCP 128ms, CLS 0.000, load event 27ms, 2 KB transferred, status `pass` against the tool's own 2500ms/0.1/3500ms budgets. Receipt copied to `promotion/evidence/performance-qa-local-demo-site.md`. `npm run validate` completes in single-digit seconds. |
| 11 | Tests and build green | PASS | `npm install` exit 0 (20 packages, 0 vulnerabilities); `npm run validate` exit 0 (typecheck `tsc --noEmit` clean + audit `pass=23 warn=0 fail=0`), captured verbatim in `promotion/evidence/validate-run.txt`; `npm run journey` exit 0, `1 passed`, run twice. Caveat, not a deduction: there is no unit-test suite — the entire automated test surface is one Playwright spec. |
| 12 | Verified in the rendered app, not inferred from code | UNVERIFIED | This is the baseline wave. No improvement was made, so there is nothing improved to verify. Wave 2 owns this row. |

**Status: NOT PROMOTED** — 4/12 PASS.
