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
- Scorecard at baseline: see [PRODUCT_GOAL.md](PRODUCT_GOAL.md) — first recorded
  as **4/12 PASS** (4, 9, 10, 11), 2 FAIL (2, 5), 6 UNVERIFIED (1, 3, 6, 7, 8,
  12). **Corrected 2026-08-13 to 2/12 PASS** (10, 11), 2 FAIL (2, 5), 8
  UNVERIFIED (1, 3, 4, 6, 7, 8, 9, 12) — rows 4 and 9 rested on probes that were
  not retained. See "Correction — 2026-08-13" below.

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
| D1 | major | J5 (also J2/J3 setup) | From a clean clone with no `.env`: `npm run search-console -- --site-url https://x/` exits 1 by printing an uncaught `Error` plus ~7 lines of Node internals (`at ModuleJob.run (node:internal/modules/esm/module_job:343:25)`, `asyncRunEntryPointWithESMLoader`) and a `Node.js v22.22.2` footer. Identical shape for `npm run judge-video -- --input artifacts/nope.mp4 --scenario google-origin` and for `npm run capture:cdp -- --search "test phrase" --target-host example.com --base-url http://127.0.0.1:4321` with no Chrome on port 9222. The message text is good — `search-console` even names `--dry-run` as the way out — but it is buried in a crash dump, so a first-time reader reads "the tool is broken" instead of "I have not configured this yet". Three of six documented commands are affected. | open |
| D2 | minor | J1 | The README quickstart puts `npx playwright install chromium` in the install block, ahead of the advertised zero-key command — but `npm run validate` does not need chromium at all. Observed: `npm run validate` exited 0 with `pass=23 warn=0 fail=0` in this clone, and it is `tsc --noEmit` plus a static file scan; only `journey` and `perf` launch a browser. The ordering makes the ten-minute first run look like it starts with a ~150MB browser download that the headline command never uses. (Not observed: what `journey`/`perf` print when chromium is genuinely absent — chromium was installed before either ran.) | open |
| D3 | minor | J2 | `npm run audit --site-root <path outside the repo>` prints the resolved root as a relative path escaping the repo — observed literally as `siteRoot=../../badsite` in stdout and in the receipt header, instead of the absolute path the user passed. Cosmetic, but the receipt is the deliverable, and a receipt that names a path the reader cannot resolve weakens the one artifact the product exists to produce. Reproduce: `npm run audit -- --config config/seo-workflow.config.example.json --site-root /some/dir/outside/repo`. | open |
| D4 | minor | J3 | With no environment set, `npm run journey` runs against the `playwright.config.ts` default `baseURL` of `https://example.com` and reports success. Observed from this clone: bare `npm run journey`, no env, exit 0, `1 passed` in 4.3s — a green journey that says nothing about the user's own site, and nothing in the output names the URL that was actually visited. Reproduce: clean clone, `npm run journey`. | open |

## Correction — 2026-08-13

The baseline claimed **4/12 PASS**. It is **2/12 PASS**. No product code changed
and no measurement was re-run; what changed is which measurements count as
evidence, under the GATE section "Where evidence lives, and what counts as an
artifact": an artifact needs the output committed at the path the row names AND
its producer committed and re-runnable from a fresh clone. Measured but not
retained is UNVERIFIED.

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

_none yet — Wave 1 is baseline only._
