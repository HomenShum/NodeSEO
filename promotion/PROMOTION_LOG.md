# Promotion log — NodeSEO

Loop state lives here, in git, so any agent can resume cold. One entry per
iteration. Append; never rewrite history, because the list of things that turned
out to be wrong is more useful to the next reader than the current values alone.

Iteration cap: **10** (default). On reaching the cap without a gate pass, stop
and leave the remaining defect ledger below — a documented stop is a valid
outcome; a silent one is not.

## Entry shape

```
### Iteration N — YYYY-MM-DD
- Journey exercised: J<k> <name>
- Observed: <the defect, with its reproduction — inputs, width, state>
- Fixed: <the change, using existing components; file paths>
- Re-proved: <evidence path showing the defect gone in the rendered app>
- Tests: <command and result>
- Conditions newly PASS: <numbers, or "none">
```

---

## Baseline — 2026-08-13

**Scope note: this repo was marked DEFERRED in the rollout plan, pending an
owner decision about whether NodeSEO belongs in the promotion programme at all.
It was baselined anyway, so that the decision is made against measurements
rather than impressions. Nothing was fixed; Wave 1 is a starting line.**

- Environment: Windows 11, node v22.22.2, npm, Playwright chromium. Fresh
  `git clone --depth 50` of `main` at `8be3dea`; no working tree reused.
  No `.env` file, no API keys, no cloud deployment, no secrets created.
- App started: **yes, and there is no server to start.** NodeSEO is a CLI
  toolkit, not an application. The start command a stranger meets first is
  `npm install && npm run validate`, which exited 0 and printed
  `pass=23 warn=0 fail=0`. To exercise the two browser-driving commands, the
  bundled `examples/site/` was served on `127.0.0.1:4321` by a throwaway static
  server kept outside the repo — no file was added to the repo to make this run.
- Journeys drivable: **4 of 5.** J1, J3 and J4 reached their done-when in full;
  J2 reached it against a synthetic broken site rather than a real third-party
  build; J5 was not drivable at all for want of Google Search Console and Gemini
  credentials, which this baseline deliberately did not obtain.
- Scorecard at baseline: [PRODUCT_GOAL.md](PRODUCT_GOAL.md) owns it, and this
  log names rows rather than repeating a total, which goes stale the moment an
  iteration runs. At baseline rows 10 and 11 were PASS, rows 2 and 5 FAIL, and
  everything else UNVERIFIED. Rows 4 and 9 were first recorded as PASS and
  corrected the same day — they rested on probes that were not retained. See
  "Correction — 2026-08-13" below.

### Commands run, with real exit codes

| Command | Exit | Note |
|---|---:|---|
| `npm install` | 0 | 20 packages, 0 vulnerabilities, ~17s |
| `npx playwright install chromium` | 0 | required by `journey` and `perf` |
| `npm run validate` | 0 | `tsc --noEmit` clean, audit `pass=23 warn=0 fail=0`; run twice, identical |
| `npm run audit -- --site-root <broken synthetic site>` | 1 | `pass=2 warn=0 fail=13` — fail path and non-zero exit both real |
| `npm run journey` (default, no env) | 0 | `1 passed`; falls back to `https://example.com` |
| `npm run journey` (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4321`) | 0 | `1 passed`, heading + CTA asserted, screenshot captured |
| `npm run perf -- --base-url http://127.0.0.1:4321` | 0 | `/` scored `pass`: FCP 128ms, LCP 128ms, CLS 0.000, load 27ms |
| `npm run search-console -- --site-url ... --dry-run` | 0 | designed empty state; writes a shaped report |
| `npm run search-console -- --site-url ...` (no token) | 1 | **D1** — raw Node stack trace |
| `npm run judge-video -- --input artifacts/nope.mp4` | 1 | **D1** — raw Node stack trace |
| `npm run capture:cdp -- --search "test phrase" ...` | 1 | **D1** — raw Node stack trace |

### Observed in a real browser (not inferred from code)

- Demo site at 1280x800 and 375x812, headless chromium:
  `document.documentElement.scrollWidth === window.innerWidth` at both widths;
  0 console errors; 0 failed requests; `document.styleSheets.length === 0`.
  Captures: `promotion/evidence/example-site-desktop-1280.png`,
  `promotion/evidence/example-site-mobile-375.png`.
  **Probe not retained** (corrected 2026-08-13): the `capture.mjs` that ran
  these comparisons was a scratchpad file outside the repo and was never
  committed, so the PNGs are committed output with no committed producer. The
  observation stands as something that was seen; it is not reproducible from a
  clone, which is why conditions 4 and 9 are UNVERIFIED rather than PASS.
- First `Tab` press focuses the `Create a room` link with a visible default
  outline (`outline-style: auto`). One tab stop, not an accessibility pass.
- The private-route guard actually fires: loading `/?create=1` in a live browser
  flips `<meta name="robots">` from `index,follow` to `noindex,nofollow`. This
  is the claim `src/audit-static.ts` checks statically, confirmed dynamically.

### What was NOT done, deliberately

- No cloud deployment, no publish, no production touch, no secret created or
  rotated.
- No live Google query (`SEO_ALLOW_LIVE_GOOGLE` left unset), no Search Console
  call, no Gemini call.
- **No product change.** Every defect below is left open on purpose; a baseline
  that quietly fixes things is a baseline nobody can compare against.

## Defect ledger

Open defects, most-impactful first. A defect is only listed once it has a
reproduction; a hunch is not a defect.

| # | Severity | Journey | Reproduction | Status |
|---|----------|---------|--------------|--------|
| D1 | major | J5 (also J2/J3 setup) | From a clean clone with no `.env`: `npm run search-console -- --site-url https://x/` exits 1 by printing an uncaught `Error` plus ~7 lines of Node internals (`at ModuleJob.run (node:internal/modules/esm/module_job:343:25)`, `asyncRunEntryPointWithESMLoader`) and a `Node.js v22.22.2` footer. Identical shape for `npm run judge-video -- --input artifacts/nope.mp4 --scenario google-origin` and for `npm run capture:cdp -- --search "test phrase" --target-host example.com --base-url http://127.0.0.1:4321` with no Chrome on port 9222. The message text is good — `search-console` even names `--dry-run` as the way out — but it is buried in a crash dump, so a first-time reader reads "the tool is broken" instead of "I have not configured this yet". Three of six documented commands are affected. | **fixed in iteration 3** |
| D2 | minor | J1 | The README quickstart puts `npx playwright install chromium` in the install block, ahead of the advertised zero-key command — but `npm run validate` does not need chromium at all. Observed: `npm run validate` exited 0 with `pass=23 warn=0 fail=0` in this clone, and it is `tsc --noEmit` plus a static file scan; only `journey` and `perf` launch a browser. The ordering makes the ten-minute first run look like it starts with a ~150MB browser download that the headline command never uses. (Not observed: what `journey`/`perf` print when chromium is genuinely absent — chromium was installed before either ran.) | open |
| D3 | minor | J2 | `npm run audit --site-root <path outside the repo>` prints the resolved root as a relative path escaping the repo — observed literally as `siteRoot=../../badsite` in stdout and in the receipt header, instead of the absolute path the user passed. Cosmetic, but the receipt is the deliverable, and a receipt that names a path the reader cannot resolve weakens the one artifact the product exists to produce. Reproduce: `npm run audit -- --config config/seo-workflow.config.example.json --site-root /some/dir/outside/repo`. | open |
| D4 | minor | J3 | With no environment set, `npm run journey` runs against the `playwright.config.ts` default `baseURL` of `https://example.com` and reports success. Observed from this clone: bare `npm run journey`, no env, exit 0, `1 passed` in 4.3s — a green journey that says nothing about the user's own site, and nothing in the output names the URL that was actually visited. Reproduce: clean clone, `npm run journey`. | open |
| D5 | minor | J3 | Link hit boxes on the demo site are **17 CSS pixels tall** — `91x17` on `/`, `189x17` on `/pricing/` and `/faq/`, measured at both 375 and 1280 in `promotion/evidence/web-quality-audit.md`. Below the 24px minimum in WCAG 2.2 SC 2.5.8, though **not a violation**: each page has exactly one target and nothing else lies within a 24px circle centred on it, so the spacing exception applies. Small to hit on a phone regardless. Left open on purpose — the fix is CSS, and the fixture carries zero stylesheets (`styleSheets: 0` on all six route/viewport combinations) so the static auditor grades markup and not a theme. Reproduce: `npm run verify:web-quality`, DOM measurements table, "link hit boxes" column. | open |
| D6 | minor | J3 | The demo site declares **no `color-scheme` and no `theme-color`** on any route (`colorScheme: none`, `themeColor: none` in the same table). The pages are light-only: a reader in a dark environment gets a full-white page and browser chrome that does not match it. Same reason for leaving it as D5 — declaring a colour scheme is a styling decision this fixture deliberately does not make. Web Interface Guidelines, *Design → Set the appropriate `color-scheme`* and *Browser UI matches your background*; finding F5 in `promotion/evidence/web-interface-guidelines-review.md`. | open |
| D7 | minor | J3 | **The site's only call-to-action produces no visible change.** Clicking "Create a room" navigates `/` → `/?create=1` and the rendered body text is byte-identical before and after; the sole difference in the document is `<meta name="robots">` flipping `index,follow` → `noindex,nofollow`. Measured in the "Following the call-to-action" section of `promotion/evidence/web-quality-audit.md`; capture at `promotion/evidence/example-site-create-state.png`. On a product this would be major. Here the link exists to demonstrate the private-route noindex guard that `src/audit-static.ts` checks statically — which this now confirms fires in a real browser — so it is recorded as minor, and recorded rather than waived, because "the fixture means to do that" is a judgement a later reader should be free to disagree with. | open |

## Correction — 2026-08-13

The baseline recorded **rows 4 and 9 as PASS**. Both are **UNVERIFIED**. No
product code changed and no measurement was re-run; what changed is which
measurements count as evidence, under the GATE section "Where evidence lives, and
what counts as an artifact": an artifact needs the output committed at the path
the row names AND its producer committed and re-runnable from a fresh clone.
Measured but not retained is UNVERIFIED. The resulting total is in
[PRODUCT_GOAL.md](PRODUCT_GOAL.md) and only there.

| Row | Was | Now | Why |
|---|---|---|---|
| 4 — no horizontal overflow | PASS | UNVERIFIED | Measured 0 overflow at 375x812 and 1280x800 (`scrollWidth === innerWidth`), probe not retained. The two PNGs are committed and are valid images at exactly those sizes, but the script that compared the widths was a scratchpad file; `grep -rn "scrollWidth\|innerWidth" src tests scripts` finds nothing. Output committed, producer not — half an artifact. |
| 9 — no console errors or failed requests | PASS | UNVERIFIED | Rested on two partial legs. Leg A (0 console errors AND 0 failed requests in headless chromium) came from the same unretained scratchpad capture. Leg B, `tests/search-origin.spec.ts`, is committed but does not cover the condition: it collects `failedRequests` and **never asserts on them** — the single `expect` is `expect(problems.errors.filter((error) => !isExternalGoogleNoise(error)), problemsSummary(problems)).toEqual([])`, with `failedRequests` used only to build the failure string — so the failed-request half has no committed check, and the error half is asserted only after `isExternalGoogleNoise` drops anything matching google/gstatic/consent/captcha/429. |

Kept, and re-cited precisely rather than restated:

- **Row 10 (performance)** stays PASS and is the shape the gate wants: the
  receipt `promotion/evidence/performance-qa-local-demo-site.md` is emitted by
  `renderMarkdown()` in the committed `src/performance-check.ts` (npm target
  `perf`) and matches that writer line for line — `:129` `# Performance QA
  Report`, `:131` `Generated:`, `:132` `Base URL:`, `:134` the Playwright-lab
  blockquote, `:136` the exact 9-column header. Machine-emitted output, committed
  producer, re-runnable by anyone who clones.
- **Row 11 (tests and build)** stays PASS: `promotion/evidence/validate-run.txt`
  is the verbatim stdout of the committed npm targets `validate` and `journey`.

What the next wave has to rebuild, stated so it is not re-derived: a committed
producer for the overflow check (row 4), and an assertion on `failedRequests`
in `tests/search-origin.spec.ts` plus a narrower error filter (row 9). Both are
Wave 2 work; neither was done here, because writing a fresh throwaway probe to
rescue a PASS is the exact failure this correction exists to record.

## Iterations

### Iteration 1 — 2026-08-13

- **Journey exercised:** J3 — "Prove in a real browser that the landing page
  actually works" (`npm run journey` → `tests/search-origin.spec.ts`).
- **Observed:** the journey's only quality gate could not fail. With **zero
  changes to tracked files** (`git diff --stat` empty), `npm run journey` was
  pointed at two deliberately broken pages served on `127.0.0.1:4313` and
  reported `1 passed`, exit 0, for both:
  - `tests/fixtures/first-party-error/index.html` — an inline
    `throw new Error("google analytics bootstrap failed on this page")`. The
    page is served from 127.0.0.1 and the script is inline; nothing about it is
    external. It was dropped because `isExternalGoogleNoise` tested the message
    **text** against `/google|gstatic|consent|captcha|status of 429/`.
  - `tests/fixtures/failed-request/index.html` — a `fetch()` aborted mid-flight,
    which Chrome logs nothing about. It was dropped because `failedRequests` was
    collected (`page.on("requestfailed", …)`) and **never asserted on**; the
    single `expect` covered `errors` only, and `failedRequests` was used solely
    to build the failure message, which is what made the gap look covered.
  The two fixtures are separate on purpose. A combined page fails for the wrong
  reason: a refused subresource also prints `Failed to load resource:
  net::ERR_CONNECTION_REFUSED` to the console, and that message survives both
  filters — measured on the pre-fix tree, where a combined fixture went red
  through the error channel while proving nothing about the request channel.
  Before-state receipt: `promotion/evidence/journey-problem-gate-before-fix.md`
  (4 of 5 checks FAIL), produced by the same committed script below against the
  spec as of `80df4f2`. Regenerate it with
  `git checkout 80df4f2 -- tests/search-origin.spec.ts && npm run
  verify:journey-gate`, then restore the file.
- **Fixed:** `tests/search-origin.spec.ts`, at the root rather than at the two
  symptoms — one predicate is shared by all three collectors, so fixing it once
  fixes every channel:
  - `:33` asserts the whole object: `expect(problems, problemsSummary(problems))
    .toEqual({ errors: [], failedRequests: [] })`. Both channels, or neither is
    a check.
  - `isExternalGoogleNoise` → `isExternalSearchOrigin`, which parses the URL of
    **the thing that failed** and matches its hostname, instead of grepping the
    message text. A problem is now discarded only when it came from Google's own
    search stack — the one origin this spec drives through and does not own.
    Applied at collection time in all three handlers (`pageerror` uses
    `page.url()`, `console` uses `message.location().url`, `requestfailed` uses
    `request.url()`), so the failure message reports exactly what is asserted.
    On the default keyless run the filter is inert: no Google URL is ever
    loaded. No other file references it — `grep -rn "Noise\|isIgnored"
    src tests scripts` matched only this spec, so there were no sibling callers
    to fix.
  - No new dependency, no new abstraction, no redesign. `isIgnoredProblem`
    (fonts / favicon / ResizeObserver) is untouched: it is a narrow allowlist,
    not a text filter over first-party errors.
- **Re-proved:** `promotion/evidence/journey-problem-gate.md` — all 5 checks
  pass, three real chromium runs of the real npm target. Run 2 now fails naming
  `"google analytics bootstrap failed on this page"`; run 3 now fails naming
  `GET http://127.0.0.1:4313/never-responds: net::ERR_ABORTED`; the healthy
  demo site still exits 0 with `errors: []` and `failedRequests: []` asserted.
  Producer: `npm run verify:journey-gate` →
  `scripts/verify-journey-problem-gate.mjs`, committed, no keys, no network, no
  extra dependencies — it serves `examples/site` and both fixtures itself on
  `127.0.0.1:4313`. It also refreshes
  `promotion/evidence/journey-direct-landing.png` from the healthy run, so that
  screenshot now has a committed producer instead of a hand-run one.
- **Tests:** `npm run typecheck` exit 0. `npm run validate` exit 0,
  `pass=23 warn=0 fail=0`. `npm run journey` bare (no env, real network, the
  `https://example.com` default) exit 0, `1 passed` — the stricter assertion
  does not make a real external site go red. `npm run verify:journey-gate`
  exit 0 (5/5); exit 1 (1/5) on the pre-fix spec, confirmed by checking that
  file out and re-running, so the regression check is known to fail before the
  fix rather than assumed to.
- **Conditions newly PASS:** 9, 12. Row 4 (horizontal overflow) is deliberately
  left UNVERIFIED — it needs its own producer and is a different defect.

**Not fixed this iteration, still open:** D1 (raw Node stack traces on the
unconfigured path), D2, D3, D4 — see the ledger above.

### Iteration 2 — 2026-08-13

- **Journey exercised:** J3 — same journey as iteration 1
  (`npm run journey` → `tests/search-origin.spec.ts`).
- **Observed:** iteration 1 fixed one text filter and left its sibling running
  three lines below. The entry above asserts that `isIgnoredProblem`
  "is a narrow allowlist, not a text filter over first-party errors". That was
  read, not run, and it is false: `:47` called
  `isIgnoredProblem(message.text())` — the MESSAGE TEXT, not a URL — against
  `/fonts\.googleapis\.com|fonts\.gstatic\.com|favicon|ResizeObserver loop/i`.
  Reproduced on the post-iteration-1 tree with the same kind of probe that
  caught the first one: a page served from `127.0.0.1` with an inline script,
  nothing external, whose only statement is
  `console.error("favicon pipeline exploded while rendering the page")`.
  `npm run journey` reported `1 passed`, exit 0. A first-party error, silently
  discarded for one WORD in its message. Same suppression class as the
  `/google/` filter, narrower vocabulary, so lower severity — "favicon" is a
  rarer word in a first-party error than "google" is in an SEO tool — and the
  `pageerror` channel never routed through it. Still the same defect.
  Before-state receipt: `promotion/evidence/journey-problem-gate-before-fix-2.md`
  (5 of 7 checks pass, the 2 new ones FAIL), produced by the committed script
  below against the spec as of `42a51a7`. Regenerate it with
  `git stash push -- tests/search-origin.spec.ts && npm run verify:journey-gate`,
  then `git stash pop` — which is how the failing-before state was confirmed
  rather than assumed.
- **Fixed:** `tests/search-origin.spec.ts`, at the same seam iteration 1 chose
  and by deletion rather than a third branch:
  - `isIgnoredProblem` and both its call sites are gone. `isExternalSearchOrigin`
    is now the only suppression in the file, and it reads the URL of the thing
    that failed, never the words in a message.
  - Nothing replaced the four patterns, and each was checked rather than
    assumed. `fonts.gstatic.com` already matches `isExternalSearchOrigin` as an
    origin (the `(^|\.)gstatic\.com$` arm). `fonts.googleapis.com` failing on the
    user's own page is the user's problem, which this gate exists to report, so
    it is deliberately no longer suppressed. `ResizeObserver loop` arrives on
    `pageerror`, which never consulted the text filter, so nothing changed for
    it. `favicon` was the defect itself. Measured before deleting: on the
    healthy demo site headless chromium emits **no** console message and issues
    exactly one request (`GET /`) — it never asks for `/favicon.ico` — so the
    favicon pattern was suppressing nothing the demo surface produces, and its
    removal does not turn the healthy run red. Confirmed by run 1 below.
  - No new dependency, no new abstraction, no redesign. Net effect on the spec
    is one predicate and two conditions removed.
- **Re-proved:** `promotion/evidence/journey-problem-gate.md` — now **7 of 7**
  checks pass across four real chromium runs of the real npm target. Run 4 is
  new: `tests/fixtures/first-party-console-error` exits 1 naming
  `"favicon pipeline exploded while rendering the page"`. Runs 1–3 are
  unchanged and still pass, so iteration 1's fix is intact. Producer:
  `npm run verify:journey-gate` → `scripts/verify-journey-problem-gate.mjs`,
  extended with the fourth fixture and its two checks, plus a
  `JOURNEY_GATE_PORT` override for when 4313 is taken (this run used 4403).
- **Tests:** `npm run typecheck` exit 0. `npm run validate` exit 0,
  `pass=23 warn=0 fail=0`. `npm run journey` bare (no env, real network, the
  `https://example.com` default) exit 0, `1 passed` — dropping the filter does
  not make a real external site go red. `npm run verify:journey-gate` exit 0
  (7/7) on the fixed tree; exit 1 (5/7) on the pre-fix tree, confirmed by
  stashing **only** `tests/search-origin.spec.ts` — the new fixture and the new
  checks stayed in place — re-running, and restoring. The regression check is
  therefore known to fail before the fix rather than assumed to.
- **Conditions newly PASS:** none. Row 9 was already PASS and stays PASS; what
  changed is that its stated reason is now true. Its wording in
  [PRODUCT_GOAL.md](PRODUCT_GOAL.md) — "never by matching words in the
  message" — was false when written, and is what this iteration made true.
  Row 12's scope sentence was widened to cover both improvements. Claiming a
  new condition for correcting one's own false claim would be the same failure
  in a different place.

**Not fixed this iteration, still open:** D1, D2, D3, D4 — untouched, see the
ledger above.

### Iteration 3 — 2026-08-13

- **Journey exercised:** J5 — "Pull Search Console numbers and judge the recorded
  journey" (`npm run search-console`, `npm run judge-video`, `npm run
  capture:cdp`), the journey that has never been drivable from a clean clone.
- **Observed:** D1, reproduced on a fresh `--depth 20` clone of `main` at
  `57e406d` with `npm install` and nothing else. All three commands exit 1 —
  correct — but each buries a good sentence in a crash dump:
  `npm run search-console -- --site-url https://x/` prints the message plus six
  stack frames ending in `ModuleJob.run (node:internal/modules/esm/module_job)`
  and a `Node.js v22.22.2` footer; `npm run judge-video -- --input
  artifacts/nope.mp4` the same shape; `npm run capture:cdp` worse, because
  Playwright's own connect failure is a multi-line object dump with a websocket
  call log and no instruction in it. Verbatim before-state:
  `promotion/evidence/unconfigured-commands.md`.
  Second, smaller finding on the same journey: `judge-video --dry-run` could not
  run at all without a real video file. The file-exists guard ran before the
  dry-run branch, and the dry path never opens the file — so the one model
  command in the repository was unexercisable from a clean clone.
- **Fixed:** at the root rather than at the three symptoms. The cause is not
  three missing try/catches; it is that all seven commands are ESM module bodies
  with no `main()`, so anything they throw reaches Node's default handler.
  - `src/utils.ts` — one `process.on("uncaughtException")` that prints
    `error.message` and exits 1. Every command imports this module, so it covers
    all seven, including the guards inside `readConfig` and `numberOption` that a
    per-command wrapper would not reach. Measured first, not assumed: a probe
    confirmed Node routes both a synchronous top-level throw and a rejected
    top-level `await` through `uncaughtException`.
  - `SEO_DEBUG=1` restores the full stack, so a real bug does not disguise itself
    as a missing key. It has its own check, because a mechanism nothing exercises
    is a mechanism nobody knows is broken.
  - `src/chrome-cdp-capture.ts` — one `.catch` on `connectOverCDP`, the only
    guard whose message was not already a usable sentence. It now names the port
    and the flag.
  - `src/judge-video-gemini.ts` — the file-exists guard yields to `--dry-run`.
  - No message text changed except `capture:cdp`'s, no exit code changed, no
    dependency added.
- **Re-proved:** `promotion/evidence/unconfigured-commands.md` — the same three
  commands, same clone, before and after. Each now prints exactly one line and
  exits 1, with no `node:internal` frame; `judge-video --dry-run --input
  artifacts/nope.mp4` exits 0 and writes its pair of receipts with no key and no
  file. Producer: `npm run verify:cli` → `scripts/verify-cli-contract.ts`, which
  re-runs all three in a sandbox directory and asserts exit 1, one line of
  stderr, the expected sentence, and no Node frame. **21/25 on the pre-fix tree,
  25/25 after** — confirmed by stashing only `src/`, re-running, and restoring,
  so the check is known to fail before the fix rather than assumed to.
- **Also fixed, and it is a documentation defect with a guard behind it:** the
  promotion score was stated in three documents with two different values, and a
  cold reader could only resolve it by reading all three in commit order. The
  score now has one owner, [PRODUCT_GOAL.md](PRODUCT_GOAL.md), which derives it
  from its own table; `docs/codebase/CONCERNS.md` and this log name rows instead.
  `npm run verify:citations` fails if a copy reappears anywhere in tracked
  markdown, and fails if the owner's stated total stops matching its own rows.
- **And the guard that should have caught the rest:** `npm run verify:tours`
  checked tour steps only. `docs/START_HERE.md` cited eight line numbers in prose
  ("the module body, lines 33-55") that nothing checked, and three other
  documents cited `path:line` with no expected text — one of them,
  `docs/codebase/STACK.md`, pointing fifteen lines away from the code it named
  after this iteration's own edit. The check is now
  `npm run verify:citations`: every citation, in a tour step or in any tracked
  markdown file, carries the code it claims to point at, and the guard asserts
  the cited line matches it and is the first line that does. A citation with a
  line number and no expected text is a failure, not a pass.
- **Tests:** `npm run typecheck` exit 0. `npm run validate` exit 0,
  `pass=23 warn=0 fail=0`. `npm run verify:cli` 25/25. `npm run verify:citations`
  89/89 across 3 tours and 23 tracked markdown files.
  `JOURNEY_GATE_PORT=4614 npm run verify:journey-gate` 7/7, four real chromium
  runs — unchanged by this iteration, which is the point: the browser gate still
  fails on the three broken fixtures.
  Knockouts, run and restored: pointing tour step 4 at a line holding a different
  symbol, moving a START_HERE citation four lines, and deleting one citation's
  expected text all made `verify:citations` exit 1 naming the step and printing
  what the cited line actually reads.
- **Conditions newly PASS:** 2 and 5. Both were failing on D1 and nothing else.

**Not fixed this iteration, still open:** D2, D3, D4 — all minor, see the ledger
above. Row 4 still has no committed overflow probe.

### Iteration 4 — 2026-08-14

- **Journey exercised:** J3 — "Prove in a real browser that the landing page
  actually works", extended past the landing page to every route the demo
  surface serves (`/`, `/pricing/`, `/faq/`) at two widths, plus the
  `/?create=1` state.
- **Observed:** five rows (3, 4, 6, 7, 8) had been UNVERIFIED since the baseline
  for one reason — **nothing in the repo pointed an instrument at the rendered
  surface.** Row 4 had been measured once by a scratchpad file that was never
  committed. Rows 6, 7 and 8 had never been measured at all. Pointing three
  instruments at it found two major defects that every existing check was blind
  to:
  - **F1, major.** `examples/site/public/pricing/index.html` and
    `.../faq/index.html` had **no `<meta name="viewport">`**. On a 375px device
    they were laid out at **980px** and scaled down —
    `document.documentElement.clientWidth === 980`, `scrollWidth === 981` — and
    Lighthouse scored `viewport-insight` **0.5** on both. Neither the static
    auditor (which does not check viewport metadata) nor the journey spec
    (which drives one route at one width) could see it.
  - **F2, major.** Both pages contained **zero links**
    (`document.querySelectorAll("a[href]").length === 0`, both widths). Both are
    listed in `sitemap.xml`, so they are search entry points, and a visitor who
    landed on one had no route back and nothing focusable to Tab to.
  - **F3, minor.** Chrome's automatic `/favicon.ico` request 404'd on every
    route, failing Lighthouse `errors-in-console` and holding best-practices at
    0.96. Worth its own line because **the repo's own row-9 producer does not
    see it**: `verify:journey-gate`'s chromium never requests a favicon, so it
    reported 0 console errors on the same page where Lighthouse's chromium
    reported one. One browser, one answer.
  Before-state receipt: `promotion/evidence/web-quality-audit-before-fix.md`,
  **57 of 67 checks pass — 10 FAIL**: four layout checks (`/pricing/` and
  `/faq/`, both mobile checks each) and the six Lighthouse "no failing audit"
  runs. Produced by the committed script below against the pristine fixture. Regenerate it with
  `git stash push -- examples/site && WEB_QUALITY_RECEIPT=web-quality-audit-before-fix.md npm run verify:web-quality`,
  then `git stash pop` — which is how the failing-before state was confirmed
  rather than assumed.
- **Fixed:** three files under `examples/site/`, one line each, no CSS added and
  no stylesheet introduced — the fixture stays unstyled on purpose so the static
  auditor grades markup rather than a theme.
  - `<meta name="viewport" content="width=device-width, initial-scale=1" />` on
    `/pricing/` and `/faq/`, matching what `/` already declared.
  - One in-content `<a href="/">` on each of those two pages.
  - `<link rel="icon" href="data:," />` on all three.
- **And a defect in the check written to catch the first one.** The overflow
  assertion started as `scrollWidth <= document.documentElement.clientWidth`.
  That is **true of the 980px canvas a viewport-less page lays itself out on**,
  so it went green on both broken pages — a check that could not fail, the same
  class of defect as iterations 1 and 2, found the same way: by running it
  against the broken tree instead of reading it. The committed version compares
  against the **device** width. Its first run is the one that reported
  `/pricing/ @ mobile-375 … scrollWidth=981 deviceWidth=375`.
- **Re-proved:** `promotion/evidence/web-quality-audit.md` — **67 of 67** checks
  pass on the fixed tree. Lighthouse 13.4.1 across 6 runs (3 routes × mobile and
  desktop presets): every category **1.00**, **zero failing audits of any
  weight**, LCP 626–647ms mobile / 169–175ms desktop, CLS 0.000, one network
  request per page. axe-core 4.13.0 across 3 runs: **0 violations**, 17 rules
  passing per route, nothing incomplete. Raw JSON committed under
  `promotion/evidence/lighthouse/` (6 files) and `promotion/evidence/axe/`
  (3 files). Producer: `npm run verify:web-quality` →
  `scripts/verify-web-quality.mjs`, committed, no keys, no deployment, no
  third-party site — it serves `examples/site` itself on `127.0.0.1:4914`
  (`WEB_QUALITY_PORT` overrides) and pins both tool versions, because an audit
  whose tool floats cannot be compared to the run it supersedes. It also
  re-emits `example-site-mobile-375.png` and `example-site-desktop-1280.png`,
  which the baseline had committed as output with no producer.
- **Row 7 is a review, and it is filed as one:**
  `promotion/evidence/web-interface-guidelines-review.md` walks the Vercel Web
  Interface Guidelines (fetched 2026-08-14 from https://vercel.com/design/guidelines,
  reachable) section by section against the rendered pages. Every "not
  applicable" cites an element census from the receipt — 0 form controls, 0
  images, 0 ARIA attributes, no scrolling at either width — so a skipped section
  is a measured skip rather than one the reviewer did not notice. **A Lighthouse
  score was not laundered into it**, and this surface is the counter-example
  that shows why it could not be: `/pricing/` scored accessibility 1.00,
  performance 1.00 and SEO 1.00 on mobile in the very run where it was laid out
  980px wide inside a 375px phone. Three minors are left open and logged as
  D5–D7 rather than argued away.
- **Tests:** `npm run validate` exit 0, `pass=23 warn=0 fail=0` (the fixture
  edits change no audit finding). `npm run verify:cli` 25/25.
  `npm run verify:journey-gate` 7/7, four real chromium runs — unchanged by this
  iteration, which is the point: the browser gate still fails on the three broken
  fixtures after the fixture the healthy run uses was edited.
  `npm run verify:citations` **failed first**, 87/89: adding the new npm script
  pushed the `"validate":` line in `package.json` down by one, and the two
  citations aimed at its old line number — one tour step, one `docs/START_HERE.md`
  symbol reference — went stale. Both repointed, then 89/89. The guard catching
  a real break is the only evidence that it works.
- **Conditions newly PASS:** 3, 4, 6, 7, 8.

**Not fixed this iteration, still open:** D2, D3, D4 (minor, from earlier waves)
and D5, D6, D7 (minor, new this wave). Row 1 stays UNVERIFIED and no script will
move it: J5 needs a Search Console token and a Gemini key, which this programme
does not create.
