# Conventions

Patterns you will see repeated. Follow them; a change that breaks one will look
foreign to the next reader.

## 1. A command is a module body, not a function

No `main()`, no exports, no lifecycle. Settings first, work second, output third.

```ts
const config = readConfig();                    // 1. settings
const baseUrl = optionValue("--base-url") ?? …  //    (one line per setting)
const report = buildReport();                   // 2. work
writeJson(jsonOut, report);                     // 3. output
console.log(renderConsole(report));
if (…) process.exitCode = 1;
```

Consequence: **`src/*.ts` files other than `utils.ts` must never be imported.**
Importing one runs it. Nothing does this today.

## 2. Option precedence is written out, not abstracted

```ts
optionValue("--base-url") ?? process.env.SEO_BASE_URL ?? config.baseUrl ?? "https://example.com"
```

**Flag, then environment variable, then config file, then a literal default** —
in that order, on one line, for every setting. It looks repetitive on purpose:
one line tells you every way a value can arrive, and there is no precedence
helper to go and read.

Environment variable names are prefixed `SEO_`, except where a third party owns
the name (`GOOGLE_APPLICATION_CREDENTIALS`, `PLAYWRIGHT_BASE_URL`).

## 3. Flags are `--kebab-case`, read through `utils.ts`

Never touch `process.argv` directly. Use `optionValue` (single),
`optionValues` (repeatable), `hasFlag` (boolean), `numberOption` (bounded
number — it throws rather than clamping). Both `--name value` and `--name=value`
work everywhere because those four functions are the only parser.

## 4. Every command that talks to the outside world takes `--dry-run`

`search-console`, `judge-video`, `frames:video` and `compress-video` all accept
it, and it means the same thing in each: **produce the real output shape without
making the external call.** It is the keyless path a stranger uses to see what a
command does, and it is why `promotion/PRODUCT_GOAL.md` can call the empty state
"designed" rather than "missing".

If you add a command that needs a key, a network, or a binary, give it
`--dry-run`.

## 5. Every command writes two files: JSON and Markdown

`writeJson(jsonOut, report)` then `writeText(mdOut, renderMarkdown(report))`.
The JSON is for machines and diffs, the Markdown is what a person reads and
pastes into an update. Default paths live under `docs/reports/`, overridable
with `--json-out` / `--md-out`.

## 6. Markdown is built as an array of lines

```ts
const lines: string[] = [];
lines.push("# SEO Audit");
lines.push("");
…
return lines.join("\n");
```

Not template literals. It keeps blank lines explicit and diffs one-line-wide.
Table cells go through `escapeMd` (or `cell`, which is `escapeMd` plus an
undefined check) so a finding containing a `|` or a newline cannot break the
table.

## 7. Report paths in output are relative and forward-slashed

`slash(relative(ROOT, jsonOut))`. A receipt is read on a different machine from
the one that wrote it, so absolute Windows paths in a report are noise. `slash`
exists solely for this.

## 8. Findings, not exceptions, for anything about the site under test

A missing page, a missing title, a sitemap that does not list a route — these
are `fail` findings and the audit keeps going. Exceptions are reserved for
problems with **the tool's own invocation**: a config file that does not exist,
an out-of-range flag, a missing credential.

The two are distinguished by who is at fault, not by severity.

## 9. Naming

- Commands: `verb-noun.ts` (`audit-static`, `compress-video`, `judge-video-gemini`).
- npm scripts: the user's verb (`audit`, `perf`, `journey`), `namespace:thing`
  for the rest (`capture:cdp`, `verify:cli`).
- Checks that prove something live in `scripts/verify-*` with a matching
  `verify:*` script. Things that regenerate a committed artifact live in
  `scripts/capture-*` with a `capture:*` script.
- Domain words are the user's words: **finding**, **receipt**, **journey**,
  **route**, **private route**. Not `Result`, `Output`, `Item`.

## 10. Comments explain why, and cite the measurement

The comments that matter in this repository are the ones recording something
that was measured and turned out to be surprising — the async spawn in
`scripts/verify-journey-problem-gate.mjs:82-84`, the suppression rule in
`tests/search-origin.spec.ts:67-89`, the environment precedence in
`src/utils.ts:29-34`. Each names what was observed and what it forced.

If you delete one of those comments you delete the evidence. If you add a
non-obvious rule, add the measurement with it.

## 11. Evidence has a committed producer

A screenshot, a receipt, or a number in a document is half an artifact unless
the script that generated it is committed and re-runnable from a clean clone.
That rule is why `scripts/` exists, and
`promotion/PROMOTION_LOG.md` → "Correction — 2026-08-13" is the entry where two
scorecard rows were downgraded for breaking it.
