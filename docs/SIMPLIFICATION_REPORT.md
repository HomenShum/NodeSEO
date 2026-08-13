# Simplification report — Wave 3 (human-readiness)

Baseline commit: `ac78174`. Environment: Windows 11, Node v22.22.2, npm,
Playwright chromium. Fresh `git clone --depth 20` of `main`; no working tree
reused.

Every row names the command that produces it. A row with no command is not a
measurement.

> **Wave 3b note, 2026-08-13.** Two of the numbers below are Wave 3's and are
> left exactly as they were measured. Since then: `npm run verify:cli` grew five
> checks for defect D1 and runs 25/25, and `npm run verify:tours` became
> `npm run verify:citations`, which checks markdown citations and the promotion
> scorecard as well as tour steps. The "How to reproduce this report" block at
> the end uses the current names; the tables do not, because a measurement
> re-labelled after the fact stops being a measurement.

## The table

| Measure | Before | After | Change | Evidence command |
|---|---:|---:|---:|---|
| Production files (`src/`) | 8 | 8 | 0 | `ls src/*.ts \| wc -l` |
| Production source lines (`src/`, all lines) | 1088 | 1078 | −10 | `wc -l src/*.ts \| tail -1` |
| Production source lines (`src/`, excluding blanks and comments) | 981 | 950 | **−31** | `grep -hvE '^\s*($\|//\|/\*\|\*)' src/*.ts \| wc -l` |
| Public exports from the shared module | 18 | 14 | **−4** | `grep -c "^export " src/utils.ts` |
| Local helper functions in `src/audit-static.ts` | 16 | 13 | **−3** | `grep -c "^function " src/audit-static.ts` |
| Declared config knobs (`WorkflowConfig` fields, nested counted) | 12 | 8 | **−4** | count fields in the `WorkflowConfig` type, `src/utils.ts` |
| Direct dependencies | 7 | 7 | 0 | `node -e "const p=require('./package.json');console.log(Object.keys(p.dependencies).length+Object.keys(p.devDependencies).length)"` |
| **Undeclared packages imported** | **1** (`playwright`, 3 files) | **0** | **−1** | `npx knip` → "Unlisted dependencies" |
| Unused files | 1 | 0 | −1 | `npx knip` |
| Unused exports | 3 | 0 | −3 | `npx knip` |
| Unused exported types | 1 | 0 | −1 | `npx knip` |
| Duplicate blocks (default sensitivity) | 0 | 0 | 0 | `npx jscpd src scripts tests --min-lines 5 --min-tokens 50` |
| Duplicate percentage (default sensitivity) | 0% | 0% | 0 | same command |
| Duplicate blocks (high sensitivity, TypeScript) | 38 | 37 | −1 | `npx jscpd src scripts tests --min-lines 2 --min-tokens 15` |
| Duplicate percentage (high sensitivity, all) | 7.89% | 7.12% | −0.77pp | same command |
| Circular dependencies | 0 | 0 | 0 | **`npx dependency-cruiser` does not work on this stack — see below.** Measured instead by enumerating the entire first-party import graph: `grep -rn 'from "\.' src/*.ts scripts/*.ts scripts/*.mjs tests/*.ts playwright.config.ts` |
| First-party import edges | 7 | 7 | 0 | same grep — every edge is `src/<command>.ts → ./utils.js`, and `src/utils.ts` imports only `node:` builtins |
| Canonical workflow test (`npm run validate`) | exit 0, `pass=23 warn=0 fail=0` | exit 0, `pass=23 warn=0 fail=0` | unchanged | `npm run validate` |
| Browser workflow gate (`verify:journey-gate`) | exit 0, 7/7 checks | exit 0, 7/7 checks | unchanged | `JOURNEY_GATE_PORT=4514 npm run verify:journey-gate` |
| Shared-module contract check | **did not exist** | exit 0, 20/20 checks | **+1 check, 0→20 assertions** | `npm run verify:cli` |
| Walkthrough validation | **did not exist** | exit 0, 34/34 steps | **+1 check** | `npm run verify:tours`, renamed in Wave 3b — see the note above |
| Checks running in CI | 1 | 3 | +2 | `.github/workflows/ci.yml` |
| Production bundle size | not applicable — no build step, no bundler, no `dist/`; `tsx` runs the TypeScript directly and nothing is published | | | — |
| Additions/deletions, everything | | | 29 files, +1744 / −84 | `git diff --shortstat` |
| Additions/deletions, code only | | | 14 files, +316 / −72 | `git diff --shortstat -- src scripts tests config package.json tsconfig.json .github` |
| Additions/deletions, `src/` only | | | 7 files, +54 / −64 | `git diff --shortstat -- src` |

## The one tool that would not run on this stack

**`dependency-cruiser` cannot see this repository's TypeScript, and its "no
circular dependencies" result is vacuous.** Recorded here rather than quoted as
a pass, because it printed a green tick.

The repo uses `module: NodeNext`, which requires `.js` extensions on TypeScript
import specifiers — `src/audit-static.ts` imports `"./utils.js"`, meaning
`src/utils.ts`. dependency-cruiser v16 does not perform that mapping: it looks
for a literal `src/utils.js`, does not find one, and marks the edge unresolvable.

What that costs, measured:

```
$ npx dependency-cruiser@16 --config <no-circular rule> --ts-config tsconfig.json \
    --output-type json src scripts tests playwright.config.ts
modules cruised: playwright.config.ts, scripts/*.mjs, and node builtins only
```

Not one file under `src/` and not one `.ts` file under `tests/` or `scripts/`
appears in the module list. It then reports "no dependency violations found",
which is true and meaningless.

**Proof that the check is vacuous rather than merely narrow** — two files with a
deliberate cycle, written twice:

| Fixture | Result |
|---|---|
| `a.ts` ↔ `b.ts` importing each other as `"./b.js"` / `"./a.js"` | `✔ no dependency violations found (4 modules, 2 dependencies cruised)` — **cycle missed** |
| `c.js` ↔ `d.js`, same cycle in plain JavaScript | `error no-circular: c.js → d.js → c.js`, exit 1 — cycle caught |

The rule works; the resolver does not reach this repo's files. Passing
`--ts-config`, `tsPreCompilationDeps`, and `enhancedResolveOptions` did not
change it (the last is rejected: *"data/options/enhancedResolveOptions must NOT
have additional properties"*).

So the cycle question is answered directly instead, and for a graph this small
that is a stronger answer than the tool would have given: the entire first-party
import graph is seven edges, every one of them `src/<command>.ts →
src/utils.js`, and `src/utils.ts` imports nothing but `node:fs` and `node:path`.
A cycle is not possible. One `grep` reproduces the whole graph.

`knip` and `jscpd` both ran correctly on this stack; only this row needed a
substitute.

### Reading the additions/deletions rows honestly

**+1744 insertions is almost entirely documentation** — this packet, three
CodeTours, and two check scripts. Inside `src/`, the shipped product code, the
change is +54 / −64.

And inside that: **31 lines of code were removed and 21 lines of comment were
added.** Total `src/` line count therefore moved only −10, which is the point
the gate makes — line count is the wrong target. What actually shrank is the
number of things a reader has to hold in their head: four fewer public
functions, three fewer local helpers, four fewer config knobs, and one fewer
package to go looking for. What grew is the number of questions the code answers
in place.

## What was deleted

| Deleted | Where it was | Why it could go |
|---|---|---|
| `loadEnvFile` — a 14-line hand-rolled `.env` parser | `src/utils.ts` | Node 22 has `process.loadEnvFile`. **Measured equivalent before deleting**: both parsers were run over this repo's own `.env.example` and diffed key by key — 9 keys, 0 differences — and the precedence rule (a variable already in the environment wins) was confirmed identical with a shell-set variable. |
| `joinOrAbsolute` — a hand-rolled `/^[A-Za-z]:[\\/]/ \|\| startsWith("/")` absolute-path test | `src/utils.ts` | `path.resolve(ROOT, p)` is exactly this behaviour, in stdlib, correct on UNC paths too |
| `resolveFromRoot` | `src/utils.ts` | Dead — knip found zero callers. It was also `resolve(ROOT, p)`: the repo had two spellings of the same idea, one of them unused |
| `joinOrRoot` | `src/audit-static.ts` | A verbatim third copy of `joinOrAbsolute`, in a different file. jscpd flagged it against `src/utils.ts` |
| `escapeRegex` | `src/audit-static.ts` | Guarded nothing. Both call sites pass string literals (`"description"`, `"canonical"`); no user input reaches those patterns. jscpd flagged it against the identical copy in `tests/search-origin.spec.ts`, which **is** needed — that one escapes user-supplied heading text — so the duplicate was resolved by deleting the unnecessary copy rather than by extracting a shared helper |
| `countBy` — a generic counter used once | `src/audit-static.ts` | Its one call site immediately patched the result (`summary[status] ??= 0`) and cast it. Replaced by three lines that produce the right type with no cast and no fixup. Output is byte-identical on the demo site |
| `args`, `WorkflowConfig`, `loadEnvFile` exports | `src/utils.ts` | Used only inside the module. Un-exported, not deleted — the code stays, the public surface shrinks |
| The `journey` config block: `directPath`, `primaryHeading`, `primaryCtaText` | `src/utils.ts` type and `config/seo-workflow.config.example.json` | **A knob nothing read.** `grep -rn "directPath\|primaryHeading\|primaryCtaText" src tests scripts` shows the Playwright journey reading `SEO_DIRECT_PATH` / `SEO_PRIMARY_HEADING` / `SEO_PRIMARY_CTA_TEXT` from the *environment* and never touching the config file. The example config invited a user to set three values that had no effect |

## Custom code replaced by an existing capability

Applying the reuse ladder — *needed at all? → already in this repo? → standard
library? → platform? → installed dependency? → one mature new dependency?* —
stopping at the first rung that held.

| Custom code | Replaced by | Rung |
|---|---|---|
| 14-line `.env` parser | `process.loadEnvFile` (Node ≥ 20.12) | standard library |
| Windows/POSIX absolute-path predicate | `path.resolve` | standard library |
| `resolveFromRoot` **and** `joinOrRoot` **and** `joinOrAbsolute` | one `fromRoot` | already in this repo |
| `import { chromium } from "playwright"` in 3 files — an **undeclared** package | `import { chromium } from "@playwright/test"` — already in `devDependencies`, re-exports the same API | already-installed dependency |
| `countBy` generic + `??=` fixup + cast | a typed literal and a `for` loop | needed at all? no |

The `playwright` one is the most valuable and the least visible. Three files
imported a package that does not appear in `package.json`; it resolved only
because `@playwright/test` pulls it in transitively. A reader looking it up found
nothing, `npm ls playwright` showed it as somebody else's dependency, and a
future `@playwright/test` that stopped hoisting it would have broken two
commands with no diff to blame. Fixed by changing the specifier — no dependency
added, no dependency removed, one fewer invisible edge.

## What was added, and why each earns its place

| Added | Lines | Why not skipped |
|---|---:|---|
| `scripts/verify-cli-contract.ts` (`npm run verify:cli`) | 167 | `src/utils.ts` is imported by all seven commands and had **no test of any kind**. It was written and run green **before** the rewrite of that module, so the rewrite had something to be checked against rather than being declared safe by reading it. 20 assertions, no framework, `node:assert` |
| `scripts/verify-tours.mjs` (`npm run verify:tours`) | 84 | A walkthrough that names line numbers is a claim about the current commit, and it rots silently. Each tour step carries a `pattern` as well as a `line`; this asserts the two agree, so inserting lines in a file goes red instead of quietly mis-describing the code |
| `.tours/*.tour` × 3 | — | Required by the gate. 34 steps, all validated |
| `docs/START_HERE.md`, `docs/codebase/*.md` | — | Required by the gate |
| `capture:receipt` npm script | 1 | `scripts/capture-validate-receipt.mjs` was committed, produced the README image and the committed receipt, and **no npm script ran it** — knip reported it as an unused file. Now discoverable and knip-clean |
| Two CI steps | 4 | A check nothing runs is the failure mode this repository has already shipped twice. `verify:cli` and `verify:tours` are keyless and take about a second |

## Findings left unresolved, with the reason

Full detail in [`docs/codebase/CONCERNS.md`](codebase/CONCERNS.md).

| Finding | Why not resolved in this wave |
|---|---|
| **D1–D4, the open product defects** (raw stack traces on unconfigured commands; README ordering; `siteRoot` printed as an escaping relative path; a bare `journey` run silently hitting `example.com`) | Product behaviour, not structure. The gate's rule 3 forbids mixing feature work with structural refactoring, and closing a ledger defect requires the promotion loop's evidence protocol. D2 is *partly* addressed by documentation (the README install block now annotates the chromium line, and `START_HERE.md`/`INTEGRATIONS.md` state which commands need a browser); the ledger entry is deliberately left open |
| **The config file is parsed and cast, never validated.** A misspelled key is silently ignored and the audit reports a confident pass against defaults | The fix is a Zod schema on the config. Zod is currently imported by exactly one file for exactly one purpose — constraining the model's output. Adding a second, unrelated use is a product decision about how strict the tool should be with its user, not a refactor |
| **`frames-to-video` and `compress-video` share ~6 lines** of "build ffmpeg args, print them on `--dry-run`, otherwise run", and handle a missing ffmpeg differently | Below the default jscpd threshold (0 clones at `--min-tokens 50`). Unifying them would change one command's error text — a behaviour change with no measured defect behind it. Recorded as an intentionally-documented duplicate |
| **`--no-write` in `src/audit-static.ts` is a flag nothing pulls** | Removing a command-line flag is an observable behaviour change, and rule 1 for this wave was to preserve behaviour unless a defect was proven. Flagged as a free deletion for whoever next touches that file |
| **`verify:journey-gate` does not run in CI** | It needs a ~150MB chromium download per run. Adding it is four lines; changing CI's cost profile is a maintainer's decision |
| **Nothing links a judged video to the capture it came from** | A real gap, but designing provenance for the capture chain is feature work |
| **The remaining 37 high-sensitivity jscpd "clones"** | Inspected: import statement blocks, `lines.push("")` runs in the Markdown renderers, and the three HTML fixtures sharing boilerplate. All are zero at the default threshold. Extracting a shared Markdown renderer would need a discriminator per report type — the abstraction plus the special cases; see `docs/codebase/ARCHITECTURE.md` |

## Adversarial pass on this wave's own work

Four things this report claims were re-checked by running them, not by reading
the diff. Each is listed with what would have caught a lie.

### The characterization check was green before the refactor, and its only edit was a rename

`scripts/verify-cli-contract.ts` was written against the **unmodified**
`src/utils.ts` and ran 20/20 before a line of that module changed. When
`joinOrAbsolute` was collapsed into `fromRoot`, the only edit to the check was
the symbol name in two assertions —

```diff
-  assert.equal(utils.joinOrAbsolute("artifacts/x.mp4"), join(sandbox, "artifacts", "x.mp4"));
+  assert.equal(utils.fromRoot("artifacts/x.mp4"), join(sandbox, "artifacts", "x.mp4"));
```

— with the expected values untouched. No assertion was loosened and no expected
value was edited to match new behaviour.

### The new gates were proved able to fail

A check that cannot fail is the exact defect this repository has already shipped
twice, so both new ones were knocked out deliberately on a fresh clone:

| Knockout | Result |
|---|---|
| Swap the `.env` load order to `[".env.local", ".env"]` in `src/utils.ts` | `npm run verify:cli` → **18/20, exit 1**, naming `.env wins over .env.local` and `.env is loaded on import` |
| Insert three filler lines near the top of `src/utils.ts` | `npm run verify:tours` → **32/34, exit 1**, naming `export function readConfig is on line 77, tour says 74` |

Both returned to green when the file was restored.

### "Behaviour preserved" was diffed, not asserted

The `countBy` → typed-literal change in `src/audit-static.ts` alters when the
`summary` object's keys are inserted, which is observable in the JSON receipt.
Checked by running the audit at `ac78174` and at this commit against the same
site and diffing:

```bash
git checkout ac78174 -- src/audit-static.ts src/utils.ts
npm run audit -- --config config/seo-workflow.config.example.json --site-root examples/site --json-out /tmp/before.json
git checkout HEAD -- src/audit-static.ts src/utils.ts
npm run audit -- --config config/seo-workflow.config.example.json --site-root examples/site --json-out /tmp/after.json
diff <(grep -v generatedAt /tmp/before.json) <(grep -v generatedAt /tmp/after.json)
```

Empty diff. The receipts are identical apart from the timestamp, and `summary`
serialises `pass, warn, fail` in both.

### The whole packet was re-run from a clone of the pushed commit

Not from the working tree it was built in:

```
git clone --depth 1 https://github.com/HomenShum/NodeSEO.git && npm install
npm run validate            exit 0, pass=23 warn=0 fail=0
npm run verify:cli          20/20
npm run verify:tours        34/34
npm run verify:journey-gate 7/7   (after npx playwright install chromium)
npx knip                    no output
```

### And one claim in this report was refuted before it was published

The circular-dependency row originally read "0, measured with
`npx dependency-cruiser --validate`". It printed a green tick. Testing the tool
against a deliberate cycle showed it never saw `src/` at all — see "The one tool
that would not run on this stack". The row was rewritten rather than kept.

## How to reproduce this report

```bash
git clone --depth 20 https://github.com/HomenShum/NodeSEO.git && cd NodeSEO
npm install
npx playwright install chromium          # only for the last one

npm run validate                         # exit 0, pass=23 warn=0 fail=0
npm run verify:cli                       # 25/25  (20 in Wave 3, + 5 D1 checks)
npm run verify:citations                 # 89 claims  (was verify:tours, 34/34)
npm run verify:journey-gate              # 7/7  (JOURNEY_GATE_PORT=<n> if 4313 is taken)

npx knip                                 # no output = clean
npx jscpd src scripts tests --min-lines 5 --min-tokens 50   # 0 clones, 0%
grep -rn 'from "\.' src/*.ts scripts/*.ts scripts/*.mjs tests/*.ts playwright.config.ts
git diff --shortstat ac78174
```

The `grep` replaces `npx dependency-cruiser --validate`, which does not resolve
this repo's NodeNext imports; see "The one tool that would not run on this
stack" above before quoting a circular-dependency number from it.

On Windows, if `verify:journey-gate` fails on its healthy run with a stack
ending in `attachScreenshot`, clear leftover Playwright output (`rm -rf
test-results`) and re-run; see `docs/codebase/TESTING.md`.
