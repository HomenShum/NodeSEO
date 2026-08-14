# Testing

## What exists

Five commands. Three of them need no keys and no network.

| Command | Time | Needs | What it proves |
|---|---|---|---|
| `npm run validate` | ~5s | nothing | `tsc --noEmit` is clean, and the static audit end-to-end produces `pass=23 warn=0 fail=0` against the bundled demo site |
| `npm run verify:cli` | ~6s | nothing | The flag, config, `.env` and path rules in `src/utils.ts` that all seven commands inherit, and what an unconfigured command prints — 25 assertions |
| `npm run verify:citations` | <1s | nothing | Every citation in the docs and the tours points at the code it names, and the promotion scorecard is stated in one place — 89 claims |
| `npm run verify:journey-gate` | ~30s | chromium | **That the browser journey's quality gate can actually fail** — 7 checks across 4 real Chromium runs |
| `npm run verify:web-quality` | ~6min | chromium + npm registry | That the demo site holds up as a rendered page: no horizontal overflow and no 980px viewport fallback at 375 or 1280, every link a tab stop with a focus ring, and clean Lighthouse and axe-core runs — 67 checks across 3 routes, 2 viewports, 6 Lighthouse runs and 3 axe runs |

Plus `npm run journey`, which is the thing `verify:journey-gate` runs; you rarely
invoke it directly except against your own site.

Run all five before opening a pull request. CI runs the first three
(`.github/workflows/ci.yml`); the last two are excluded because they need a
~150MB browser download, and `verify:web-quality` additionally downloads
`lighthouse` and `@axe-core/cli` through `npx` — see [`CONCERNS.md`](CONCERNS.md).

## There is no unit-test suite, and that is a deliberate trade

The seven commands are I/O from top to bottom: read files, drive a browser, call
an API, write files. Unit-testing them would mean either testing the two dozen
pure helpers in isolation (which is what `verify:cli` does) or building a mock
filesystem and a mock browser, which tests the mocks.

What replaced a suite is **end-to-end runs against real fixtures**:
`npm run validate` audits a real static site, and `verify:journey-gate` drives a
real Chromium against four real pages it serves itself.

## `verify:journey-gate` — read this one before changing the journey

`scripts/verify-journey-problem-gate.mjs`.

The browser journey (`tests/search-origin.spec.ts`) asserts that a page produces
no console errors and no failed requests. **That assertion was broken twice, and
both times it reported success.**

- Once because it collected failed requests and never asserted on them, and
  filtered console errors by matching the message *text* against
  `/google|gstatic|consent|captcha/` — so a page's own
  `throw new Error("google analytics bootstrap failed")` was discarded.
- Then again because a *second* text filter, matching
  `/favicon|fonts\.googleapis\.com|ResizeObserver loop/`, survived the first fix
  three lines below it and discarded a page's own
  `console.error("favicon pipeline exploded…")`.

Neither had a failing test, because a check that cannot fail passes.

This script is the answer. It starts a throwaway static server on
`127.0.0.1:4313` (`JOURNEY_GATE_PORT` to change it) and runs the real
`npm run journey` four times:

| Run | Page | Must |
|---|---|---|
| 1 | `examples/site` | exit 0 |
| 2 | `tests/fixtures/first-party-error` | exit 1 **naming** `google analytics bootstrap failed` |
| 3 | `tests/fixtures/failed-request` | exit 1 **naming** `/never-responds` |
| 4 | `tests/fixtures/first-party-console-error` | exit 1 **naming** `favicon pipeline exploded` |

"Naming" is the point. An exit code alone would pass if the run failed for an
unrelated reason.

It writes `promotion/evidence/journey-problem-gate.md` on every run, and also
refreshes `promotion/evidence/journey-direct-landing.png` from run 1, so the
committed screenshot has a committed producer.

Two before-states are committed next to it —
`journey-problem-gate-before-fix.md` and `-before-fix-2.md` — each produced by
this same script against the broken spec. That is how each fix was shown to fail
before it was claimed to pass.

## `verify:cli` — the characterization check

`scripts/verify-cli-contract.ts`.

`src/utils.ts` is imported by all seven commands and had no test of any kind. It
was rewritten in Wave 3 (the hand-rolled `.env` parser replaced with Node's own
`process.loadEnvFile`, two path helpers collapsed into `fromRoot`), and this
file was written **before** those edits so they had something to be checked
against.

It pins the *current* contract, not a nicer one. The rule most worth knowing:

```ts
check(".env wins over .env.local, because .env is loaded first", …);
check("a variable already in the environment beats the .env file", …);
```

The second is a safety property — `SEO_BASE_URL=… npm run audit` is never
silently overridden by a file you forgot you had. The first is unusual (most
dotenv tools do the opposite) and is pinned so nobody "fixes" it by accident.

Mechanics worth knowing before you extend it: `src/utils.ts` snapshots
`process.cwd()` and `process.argv` at import time, so the check stages a
temporary directory and a fake `argv` and *then* imports the module dynamically.
One import, one set of arguments, all assertions read from it.

## `verify:citations` — keeping the walkthrough honest

`scripts/verify-citations.mjs`. Each CodeTour step carries both a `line` (what a
reader sees) and a `pattern` (a regex naming the code that line should be). The
script asserts the file exists, the line is in range, and the pattern matches on
exactly that line. Insert three lines at the top of a file and this goes red
instead of the tour quietly describing the wrong code.

## How to add a test

- **A new rule inside `src/utils.ts`** → add a `check(…)` to
  `scripts/verify-cli-contract.ts`. No framework, `node:assert`, one line.
- **A new SEO check in `audit-static.ts`** → add a failing case to
  `examples/site/`, confirm `npm run validate` goes red and exits 1, fix the
  fixture, and regenerate the committed receipt with `npm run capture:receipt`.
- **A new way the browser journey should fail** → add a fixture directory under
  `tests/fixtures/`, then a run and its checks in
  `scripts/verify-journey-problem-gate.mjs`. Keep one failure mode per fixture:
  a page that breaks two ways proves only that it broke.

Whatever you add, **watch it fail before you trust it.** Both of this
repository's real defects were checks that passed while the thing they checked
was broken.

## Known flake

On Windows, a `test-results/` directory left behind by an interrupted Playwright
run can make run 1 of `verify:journey-gate` fail while writing its screenshot,
with a stack ending in `attachScreenshot`. Observed once during Wave 3;
`rm -rf test-results` and re-run. The same spec passed when run directly against
the same server, and the gate passed 7/7 immediately after clearing the
directory.
