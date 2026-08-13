# START HERE — the code in the order it runs

You have never seen this repository and nobody who built it is available. This
file walks one real user action from the command they type to the file they walk
away holding, in **execution order**, one step per stage.

## Who uses this and what they are trying to finish

Someone has shipped a website. They cannot tell whether search engines can
actually read it, and the only things available to them are a marketing
dashboard that sells a score and a browser tab where you squint at page source.
They want something duller and more useful: a list of concrete, checkable facts
about their own pages — does every public page have a title, a description, one
main heading, a canonical address; is the sitemap complete; do the pages that
should stay private tell search engines to skip them.

They run one command and get back a plain text file listing every check that
passed and every one that failed, with the file path and the reason next to
each. The word for that file here is a **receipt**: a written record of what was
actually measured, so nobody has to take the tool's word for it.

## Run it first, then read

```bash
npm install
npm run validate      # typecheck + audit the bundled demo site. No keys, no browser, no network.
```

You should see `pass=23 warn=0 fail=0` and two file paths. Those two files are
the product. Everything below explains how the second line produced them.

`npm run validate` needs nothing but Node 22. Only three commands drive a
browser (`journey`, `perf`, `capture:cdp`) and they need
`npx playwright install chromium` first; three need credentials
(`search-console`, `judge-video`, `capture:cdp`). See
[`docs/codebase/INTEGRATIONS.md`](codebase/INTEGRATIONS.md).

## What this is not

Two of the nine stages below do not exist here, and pretending otherwise would
waste your first day:

- **There is no HTTP route, no server, and no user interface.** This is a set of
  seven command-line programs plus one Playwright journey. "Entry point" means an
  npm script, and the closest thing to a route is which `src/*.ts` file that
  script runs.
- **There is no tool registration and no agent loop.** A language model is used
  in exactly one command (`judge-video`) and it is never handed a callable. See
  Step 5, which explains what takes the place of tools.

---

## Step 1 — The entry point is an npm script, not a route

**File:** `package.json`
**Symbol:** `scripts.validate`
**Called by:** a human typing `npm run validate`
**Calls next:** `scripts.typecheck`, then `scripts.audit` → `src/audit-static.ts`

**Why this exists**
This is the whole routing table. Seven commands, one file each, no dispatcher.
Reading `scripts` in `package.json` tells you every way into this codebase; there
is no second entry point hiding in a framework.

**Core code**
```json
"audit": "tsx src/audit-static.ts",
"validate": "npm run typecheck && npm run audit -- --config config/seo-workflow.config.example.json --site-root examples/site"
```

**Input** — command-line arguments after `--`.
**Output** — a child process running one TypeScript file.
**Failure behavior** — `&&` means a failed typecheck stops the run before the
audit starts, so a broken tree can never print a green report.
**Next** — `tsx` executes `src/audit-static.ts` in Step 2.

---

## Step 2 — The primary user action: one file, top to bottom

**File:** `src/audit-static.ts`
**Symbol:** the module body, lines 33-55
**Called by:** `tsx`, as the program entry
**Calls next:** `readConfig`, then `buildReport`

**Why this exists**
Every command in `src/` has this same shape and it is the single most useful
thing to know about the codebase: **the module body is the program.** There is no
`main()`, no exported handler, no lifecycle. Settings are resolved at the top,
one function builds the result, the result is written and printed, and the
process exits. Nothing is exported from these seven files — importing one would
run it.

**Core code**
```ts
const config = readConfig();
const baseUrl = (optionValue("--base-url") ?? process.env.SEO_BASE_URL ?? config.baseUrl ?? "https://example.com").replace(/\/$/, "");
const siteRoot = fromRoot(optionValue("--site-root") ?? config.siteRoot ?? ".");
```

That `??` chain is the precedence rule, written out in full on every line
instead of hidden in a helper: **flag, then environment variable, then config
file, then built-in default.**

**Input** — `process.argv`, `process.env`, and an optional JSON config file.
**Output** — a dozen module-level constants; nothing has been read from disk
except the config yet.
**Failure behavior** — a `--config` path that does not exist throws
`Config not found: <path>` before any work begins.
**Next** — `buildReport()` in Step 3.

---

## Step 3 — Validation and domain types

**File:** `src/audit-static.ts` (types), `src/utils.ts` (`readConfig`)
**Symbol:** `AuditStatus`, `AuditFinding`, `AuditReport`, `buildReport`
**Called by:** the module body
**Calls next:** `auditRoute`, `auditRootMarkers`, `auditSitemap`, `auditRobots`, `auditPrivateRouteGuard`

**Why this exists**
This is where the product's vocabulary lives, and it is deliberately tiny. A
**finding** is one checkable fact about the site: a status, the name of the
check, a human sentence, and the file it came from. A **report** is the list of
findings plus a count. That is the entire domain model — there is no `Page`
class, no `Site` aggregate, no rules engine.

**Core code**
```ts
type AuditStatus = "pass" | "warn" | "fail";
type AuditFinding = { status: AuditStatus; check: string; detail: string; path?: string };
```

Be clear about what is *not* validated: the config file is parsed as JSON and
cast, with every field optional. There is no schema and no runtime check. That is
a deliberate trade — every reader supplies its own fallback (Step 2), so a
missing or misspelled field degrades to a default rather than crashing. A typo in
your config is silently ignored; see
[`docs/codebase/CONCERNS.md`](codebase/CONCERNS.md).

**Input** — the resolved settings from Step 2.
**Output** — an `AuditReport` held in memory.
**Failure behavior** — a missing route file becomes a `fail` finding, not an
exception. The audit always completes and always produces a report.
**Next** — there is no agent in this flow; Step 4 explains where the only model
call lives.

---

## Step 4 — Agent orchestration: one call, one command, no loop

**File:** `src/judge-video-gemini.ts`
**Symbol:** the module body, line 43
**Called by:** `npm run judge-video` (a *different* command from Steps 1-3)
**Calls next:** `judgeVideo` → `generateObject` from the AI SDK

**Why this exists**
Once a browser recording of the landing journey exists, a person still has to
watch it and say whether the page looks credible. This command asks Gemini to do
that pass and writes the answer down as a receipt.

It is the only place in the repository where a model is asked anything. Grep for
`generateObject`, `generateText` or `google(` and this file is the only hit. The
audit, the performance check, the Search Console pull and the browser journey are
all deterministic code.

**Core code**
```ts
const result = dryRun ? dryResult() : await judgeVideo();
```

That is the entire orchestration. No planner, no retry, no multi-step loop, no
state machine — one branch and one call.

**Input** — a video file path, a scenario name, and `GOOGLE_GENERATIVE_AI_API_KEY`.
**Output** — a `Result` holding eight 0-10 scores, timestamped issues, and a summary.
**Failure behavior** — three guards run before anything is sent: no `--input`, a
missing file, or a missing key each throw immediately. The throw is currently an
unhandled exception, so Node prints a stack trace — defect **D1** in
`promotion/PROMOTION_LOG.md`, open on purpose.
**Next** — Step 5, what constrains the model instead of tools.

---

## Step 5 — Tool registration and invocation: there are none, and here is what replaces them

**File:** `src/judge-video-gemini.ts`
**Symbol:** `schema`
**Called by:** `generateObject`
**Calls next:** nothing — the model cannot call anything

**Why this exists**
The model is given no tools, no functions and no file access. What bounds it is a
Zod object passed as the structured-output schema: the AI SDK turns it into the
model's output constraint and rejects a response that does not fit. **A malformed
answer becomes an error rather than a bad receipt.**

**Core code**
```ts
const schema = z.object({
  first_impression_score: z.number().min(0).max(10),
  // ...seven more scores...
  critical_issues: z.array(z.object({ timestamp: z.string(), severity: z.enum(["low", "medium", "high", "critical"]), issue: z.string(), recommendation: z.string() })).default([]),
  summary: z.string(),
});
```

**Input** — the schema plus the prompt in `prompt()`.
**Output** — `response.object`, already parsed and typed.
**Failure behavior** — a response the schema rejects throws out of
`generateObject`; nothing partial is written.
**Next** — Step 6, where results become files.

---

## Step 6 — Persistence: two files, no database

**File:** `src/utils.ts`
**Symbol:** `writeJson`, `writeText`
**Called by:** all five commands that produce a report
**Calls next:** `node:fs`

**Why this exists**
Every command's durable output is the same pair: machine-readable JSON and
human-readable Markdown. There is no database, no cache, no migration, and no
state carried between runs.

**Core code**
```ts
export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
```

Both writers create their parent directory, so a fresh clone with no
`docs/reports/` works with no setup step.

**Input** — an absolute path and a value.
**Output** — files under `docs/reports/` (reports) or `artifacts/` (media). Both
are gitignored except the committed example under `docs/reports/examples/`.
`audit`, `perf` and `search-console` overwrite a fixed pair of paths each run;
`judge-video` writes a timestamped run id so judgements accumulate.
**Failure behavior** — a filesystem error propagates and the command dies. Since
the write is the last step, a partial report is not possible.
**Next** — Step 7, what the user sees on screen.

---

## Step 7 — Streaming and rendering: deliberately absent

**File:** `src/audit-static.ts`
**Symbol:** `renderConsole`
**Called by:** the module body, line 54
**Calls next:** `console.log`

**Why this exists**
There is no streaming, no progress bar and no spinner anywhere in this
repository, and that is a decision rather than an omission: a static audit of a
handful of files on disk finishes in well under a second, so a progress
indicator would be animation over nothing. The command prints one five-line
summary at the end and exits.

**Core code**
```ts
console.log(renderConsole(report));
if (report.findings.some((finding) => finding.status === "fail")) process.exitCode = 1;
```

The Markdown receipt is rendered by a sibling function, `renderMarkdown`. Both
build an array of lines and join it — the same pattern in all five reporting
commands, so learning one teaches you the rest.

**Input** — the finished `AuditReport`.
**Output** — five lines of stdout, and the two files from Step 6.
**Failure behavior** — n/a; rendering a report cannot fail.
**Next** — Step 8, the exit code on that second line.

---

## Step 8 — Failure and recovery

**File:** `src/audit-static.ts` line 55; `tests/search-origin.spec.ts` lines 33-95
**Symbol:** `process.exitCode`, `isExternalSearchOrigin`
**Called by:** the module body / the Playwright journey
**Calls next:** the shell, or Playwright's reporter

**Why this exists**
Two different failure surfaces, and it is worth knowing which is which.

**The audit's contract is the exit code.** Any `fail` finding makes the process
exit non-zero, which is what lets `npm run validate` be a CI gate with no extra
wiring. Nothing is retried, because nothing is flaky — the input is files on
disk.

**The browser journey's contract is that a problem is never discarded by
reading its message.** The journey watches three channels — an uncaught error, a
`console.error`, and a request that never completed — and asserts all three are
empty. The only permitted suppression drops a problem when the URL of *the thing
that failed* is on a Google origin, because the journey drives through Google's
own search results in one optional branch and does not own that page.

**Core code**
```ts
expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
```

That line is the second fix to this gate. The first version asserted only on
`errors` and matched message text against `/google|gstatic|consent|captcha/`, so
a page's own `throw new Error("google analytics bootstrap failed")` was thrown
away; a second text filter matching `/favicon|fonts\.googleapis\.com/` survived
that fix and threw away a page's own `console.error` about a favicon. Both are
gone. The full history is in `promotion/PROMOTION_LOG.md`.

**Input** — whatever the page does at runtime.
**Output** — exit 0, or exit 1 naming the specific problem.
**Failure behavior** — the known rough edge: the three credentialed commands
report a missing key by throwing, so Node prints a stack trace with module-loader
frames instead of a one-line "you have not configured this yet". Defect **D1**,
open.
**Next** — Step 9, the checks that keep all of this true.

---

## Step 9 — The tests that prove the flow

**File:** `scripts/verify-journey-problem-gate.mjs`, `scripts/verify-cli-contract.ts`, `tests/search-origin.spec.ts`
**Symbol:** `checks` / `checks`
**Called by:** `npm run verify:journey-gate`, `npm run verify:cli`, `npm run journey`
**Calls next:** the real npm targets, in child processes

**Why this exists**
There is no unit-test suite. There are three checks, and each one exists because
something specific went wrong.

| Command | What it proves | Needs |
|---|---|---|
| `npm run validate` | The tool typechecks and the audit end-to-end produces `pass=23 warn=0 fail=0` on the bundled site | nothing |
| `npm run verify:cli` | The flag, config, environment and path rules every command inherits, including that a shell variable beats `.env` | nothing |
| `npm run verify:journey-gate` | **That the browser journey's quality gate can actually fail** | chromium |

**Core code**
```js
const MUST_NAME_ERROR = "google analytics bootstrap failed";
const MUST_NAME_REQUEST = "/never-responds";
const MUST_NAME_CONSOLE_ERROR = "favicon pipeline exploded";
```

The third one is the important one. It serves four real pages itself on
`127.0.0.1` and runs the real `npm run journey` against each: the healthy demo
site must exit 0, and three deliberately broken pages must each exit 1 **naming
their own problem**. A check that cannot fail is what this repository shipped
twice; this is the producer that keeps it fixed.

**Input** — a clean clone. No keys, no network, no extra dependencies.
**Output** — pass/FAIL lines, a non-zero exit on any failure, and a regenerated
receipt at `promotion/evidence/journey-problem-gate.md`.
**Failure behavior** — on Windows a leftover `test-results/` directory from an
interrupted run can make the healthy run fail on screenshot write; `rm -rf
test-results` and re-run. Observed once during Wave 3; see
[`docs/codebase/CONCERNS.md`](codebase/CONCERNS.md).
**Next** — nothing. That is the whole flow.

---

## Where you would add one adjacent capability

Say you want to check that every public page has an Open Graph image.

1. Write `auditOgImage(findings)` in `src/audit-static.ts` next to
   `auditRootMarkers`, using `pushRequired` so the pass/fail rule stays in one
   place.
2. Call it from `buildReport`, in the list at lines 59-63.
3. Add a failing case to `examples/site/`, run `npm run validate`, and watch
   `fail` go to 1 and the exit code go to 1.
4. Fix the fixture, re-run, and regenerate the committed receipt with
   `npm run capture:receipt`.

You touched one file. That is the intended shape.

## Then read

- [`.tours/`](../.tours) — the same three flows as an interactive CodeTour,
  pointing at live source. `npm run verify:tours` proves every line still
  resolves.
- [`docs/codebase/`](codebase/) — stack, structure, architecture, conventions,
  integrations, testing, concerns.
- [`docs/SIMPLIFICATION_REPORT.md`](SIMPLIFICATION_REPORT.md) — what Wave 3
  deleted and the command that measures each claim.
