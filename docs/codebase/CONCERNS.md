# Concerns

Everything a cold reader would otherwise discover the hard way. Nothing here is
hidden elsewhere in the packet; this is the list.

Product defects with reproductions live in
[`promotion/PROMOTION_LOG.md`](../../promotion/PROMOTION_LOG.md) and are not
restated in full. Wave 3 was structural and deliberately closed none of them.

## Open product defects (from the ledger, unchanged)

| # | Severity | One line | Where |
|---|---|---|---|
| ~~D1~~ | ~~major~~ | **Closed in iteration 3.** The three commands that need credentials or a browser now exit 1 printing one sentence naming what to configure. Kept in the table because the ledger is append-only; the reproduction and the fix are in `promotion/PROMOTION_LOG.md` | `src/utils.ts` |
| D2 | minor | The README install block puts `npx playwright install chromium` ahead of the zero-key headline command, which does not need it | `README.md` |
| D3 | minor | `--site-root` outside the repo prints a relative path escaping the repo (`siteRoot=../../badsite`) in the receipt header | `src/audit-static.ts:69` (`siteRoot: slash(relative(ROOT, siteRoot))`) |
| D4 | minor | With no environment set, `npm run journey` runs against the `https://example.com` default and reports success without naming the URL it visited | `playwright.config.ts:11` (`baseURL: process.env.PLAYWRIGHT_BASE_URL`) |

D2 is partially addressed by documentation: `docs/START_HERE.md` and
[`INTEGRATIONS.md`](INTEGRATIONS.md) both state plainly which commands need a
browser, and the README install block now annotates the chromium line. The
ledger entry is left **open** because closing it is the promotion loop's call
and needs its evidence protocol, not a documentation edit.

## Structural concerns found in Wave 3 and left unresolved

### The config file is parsed, never validated

`readConfig` does `JSON.parse(...) as WorkflowConfig`. Every field is optional
and every reader supplies a fallback, so a misspelled key (`publicRoute` instead
of `publicRoutes`) is silently ignored and the audit runs against defaults —
reporting a confident pass on a site it never looked at properly.

**Not fixed** because the fix is a Zod schema on the config, and Zod is currently
imported by exactly one file for exactly one purpose (constraining the model's
output). Adding a second, unrelated use of it is a product decision about how
strict the tool should be with its user, not a refactor. Recorded so the next
person makes it deliberately.

### `--site-root` is not contained

`fromRoot` resolves whatever the user typed and the audit reads from there, with
no check that the result is inside the repository or the project. That is
correct for a tool you point at your own build output, and it is worth knowing
before this is ever wrapped in anything that takes a path from someone else.

### Nothing links a video to the capture it came from

`capture:cdp` → `frames:video` → `judge-video` is chained by a human typing
paths. Nothing records that the MP4 you judged came from the capture you think
it did, and the judge receipt names only the input filename. A wrong-file
judgement would look exactly like a right one.

### `frames-to-video` and `compress-video` handle a missing ffmpeg differently

`compress-video` catches the failure and says "Install ffmpeg or pass
`--dry-run`". `frames-to-video` does not, so the same missing binary surfaces as
a raw `ENOENT` from `execFileSync`. The two also share about six lines of
"build args, print them on `--dry-run`, otherwise run ffmpeg".

**Not unified**, on purpose. `jscpd --min-lines 5 --min-tokens 50` reports zero
duplicate blocks in this repository, so the overlap is below the threshold at
which extraction pays; and unifying them would change one command's error text,
which is a behaviour change without a measured defect behind it. Recorded as an
intentionally-documented duplicate rather than silently left.

### `--no-write` is a flag nothing pulls

`src/audit-static.ts:45` (`const writeDocs = !hasFlag("--no-write")`) supports `--no-write`, which suppresses both receipt
files. No npm script, document, or CI job uses it. It survived Wave 3 because
removing a command-line flag is an observable behaviour change and the rule for
this wave was to preserve behaviour unless a defect was proven. If you are
touching that file anyway and can confirm nobody scripts it, it is a free
deletion.

### The strongest check does not run in CI

`.github/workflows/ci.yml` runs `validate`, `verify:cli` and `verify:citations` —
all keyless and fast. It does **not** run `verify:journey-gate`, which is the
check that proves the browser journey can fail, because that needs a chromium
download on every CI run. `verify:web-quality` is excluded for the same reason
plus one more: it shells out to `npx lighthouse` and `npx @axe-core/cli`, so it
needs the npm registry mid-run as well as a browser, and it takes about six
minutes.

The consequence is real: a regression that re-breaks the journey gate would be
caught only by a person running it locally. Adding
`npx playwright install --with-deps chromium` and the gate to the workflow is a
four-line change; it was left out of Wave 3 because changing CI's cost profile
is a maintainer's decision.

### `dependency-cruiser` gives a green tick that means nothing here

If you reach for `npx dependency-cruiser` to check for import cycles, **do not
believe the result.** This repo uses `module: NodeNext`, so TypeScript imports
carry a `.js` extension (`src/audit-static.ts` imports `"./utils.js"`, meaning
`src/utils.ts`). dependency-cruiser v16 looks for a literal `src/utils.js`, fails
to resolve it, and skips every file under `src/` — then prints "no dependency
violations found".

Measured, not assumed: two `.ts` files importing each other in a deliberate cycle
are reported clean; the identical cycle written as `.js` is caught and exits 1.
`--ts-config`, `tsPreCompilationDeps` and `enhancedResolveOptions` did not change
it.

The graph is seven edges, so `grep -rn 'from "\.' src/*.ts` answers the question
outright. See [`ARCHITECTURE.md`](ARCHITECTURE.md).

### One flake, on Windows

A `test-results/` directory left by an interrupted Playwright run can make run 1
of `verify:journey-gate` fail while writing its screenshot (stack ends in
`attachScreenshot`). Observed once during Wave 3. `rm -rf test-results` and
re-run; the gate then passed 7/7. The same spec passed when run directly against
the same server at the time, so this is leftover state, not a code defect. The
gate script does not clear its own output directory before running.

## Things that look wrong and are not

- **`.env` beats `.env.local`.** Most dotenv tooling does the opposite. Here
  `.env` is loaded first and a variable already set is never overwritten, so
  `.env` wins. Pinned by `npm run verify:cli` so it is not "fixed" by accident.
- **Option precedence is spelled out on every line** instead of factored into a
  helper. Deliberate; see [`CONVENTIONS.md`](CONVENTIONS.md) §2.
- **The demo site has no stylesheets.** `examples/site/` is markup under test for
  the auditor, not a design artifact. `promotion/PRODUCT_GOAL.md` row 3 declines
  to judge it for exactly this reason.
- **`src/*.ts` files export nothing.** They are programs; importing one runs it.
- **The Gemini judge writes to its own directory and gates nothing.** That is the
  invariant, not an oversight; see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Where the promotion scorecard stands

One place: [`promotion/PRODUCT_GOAL.md`](../../promotion/PRODUCT_GOAL.md), which
owns the twelve-row table and the only total derived from it. The number is
deliberately not repeated here, because a copied total is wrong the moment an
iteration runs — it was stated in three documents with two different values until
`npm run verify:citations` started failing on the copies.

Wave 3 changed no scorecard row: it removed structure, added two checks and this
packet, and left every product defect open. If you are picking up the product
loop, that file and `PROMOTION_LOG.md` are your queue — not this one.
