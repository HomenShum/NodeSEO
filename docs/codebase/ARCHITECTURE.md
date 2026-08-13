# Architecture

## The shape, in one sentence

Seven independent command-line programs share one 119-line module and write
their results to files; nothing calls anything else.

That is the whole architecture, and the unusual thing about it is what is
missing. There is no server, no router, no dependency graph deeper than two
levels, no shared runtime state, and no communication between commands except
the files one leaves on disk for the next.

```
npm run <command>
      │
      ▼
  src/<command>.ts                      ← module body IS the program
      │  imports
      ▼
  src/utils.ts                          ← flags, config, .env, paths, file writing
      │
      ├─→ files on disk        (audit-static)
      ├─→ headless Chromium    (performance-check)
      ├─→ your real Chrome     (chrome-cdp-capture)
      ├─→ Google APIs          (search-console-report, judge-video-gemini)
      └─→ ffmpeg               (frames-to-video, compress-video)
      │
      ▼
  docs/reports/*.json + *.md            ← the receipt
  artifacts/*                            ← media
```

The whole first-party import graph is **seven edges**, and every one of them
points the same way:

```bash
$ grep -rn 'from "\.' src/*.ts scripts/*.ts scripts/*.mjs tests/*.ts playwright.config.ts
src/audit-static.ts:3:          … from "./utils.js";
src/chrome-cdp-capture.ts:4:    … from "./utils.js";
src/compress-video.ts:4:        … from "./utils.js";
src/frames-to-video.ts:4:       … from "./utils.js";
src/judge-video-gemini.ts:6:    … from "./utils.js";
src/performance-check.ts:3:     … from "./utils.js";
src/search-console-report.ts:4: … from "./utils.js";
```

`src/utils.ts` imports nothing but `node:fs` and `node:path`, so a cycle is not
possible. That grep is the evidence command — **do not use
`npx dependency-cruiser` here**; it cannot resolve NodeNext `.js`-suffixed
TypeScript imports, never sees `src/` at all, and reports a green "no
violations" that is vacuous. Demonstrated in
[`docs/SIMPLIFICATION_REPORT.md`](../SIMPLIFICATION_REPORT.md).

## The invariant worth protecting

**A receipt says only what was measured.** Every number in a report comes from
something that was actually observed — a file read from disk, a timing recorded
by a real browser, a row returned by the Search Console API. Nothing is
estimated, interpolated, or produced by a model.

The one model call in the repository (`judge-video`) is deliberately fenced off
from this: it writes to its own file under
`docs/reports/gemini-video-judges/`, its output is never merged into another
report, and it never sets a pass/fail. `promotion/PRODUCT_GOAL.md` calls it
visual QA, not search-ranking proof. If you are tempted to let the model's score
gate anything, that is the line you would be crossing.

The same rule shows up as a product boundary in the README: **do not scrape
Google rankings or simulate clicks.** Ranking data comes from Search Console,
which is the site owner's own measured data, or it does not come at all.

## Why there is no abstraction between the commands

The seven commands repeat a recognisable shape — resolve options, do the work,
render Markdown, write two files, print a line. A natural instinct is to extract
a `Command` base or a `Report` renderer. It has not been done, and the reason is
worth stating so it is a decision rather than an oversight:

- **The shapes rhyme but do not match.** `audit` produces findings with statuses;
  `perf` produces metrics with budgets; `search-console` produces rows with
  opportunities. A shared renderer would need a discriminator per report type,
  which is the abstraction plus the special cases.
- **Each command is read on its own.** A person debugging `perf` opens one
  153-line file and sees everything it does. A base class would move a third of
  that answer somewhere else.
- **`npx jscpd --min-lines 5 --min-tokens 50` finds zero duplicate blocks.** The
  similarity is a shared *shape*, not shared *code*. What is genuinely shared is
  already in `utils.ts`.

If a command ever needs a real second implementation of something, that is the
moment to extract — not before.

## What "agent" means here, and does not

There is one model call, in `src/judge-video-gemini.ts`, and it has:

- **no tools** — the model is handed no callable of any kind;
- **no loop** — one branch (`dryRun ? dryResult() : await judgeVideo()`), one
  request, done;
- **no memory or state** — each run is independent;
- **no autonomy over side effects** — the code writes the file, not the model.

What constrains the model is a Zod schema passed as the structured-output
contract. A response that does not fit the schema is an error, not a receipt.
That is the whole safety design, and for a one-shot scoring call it is
sufficient.

## Data flow between commands

Commands are chained by a human through the filesystem, not by code:

```
capture:cdp   → artifacts/chrome-cdp-search/*.jpg  (frames)
frames:video  → artifacts/chrome-cdp-search.review.mp4
judge-video   → docs/reports/gemini-video-judges/<run-id>.{json,md}
```

Nothing enforces this order and nothing validates that the MP4 you pass to
`judge-video` came from the capture you think it did. That is a real gap; see
[`CONCERNS.md`](CONCERNS.md).

## Trust boundaries

| Boundary | Where | What is enforced |
|---|---|---|
| Command line → settings | `src/utils.ts`, `optionValue` / `numberOption` / `readConfig` | `numberOption` refuses out-of-range values; everything else falls back to a default. **No schema validation on the config file.** |
| Settings → filesystem | `src/utils.ts`, `fromRoot` | Resolves to an absolute path. **No containment check** — `--site-root` may point anywhere the user can read |
| Local → Google APIs | `src/search-console-report.ts`, `src/judge-video-gemini.ts` | A credential must be present before any request; `--dry-run` on both is the keyless path |
| Model → receipt | `src/judge-video-gemini.ts`, `schema` | Zod rejects a malformed response before it becomes a file |
| Page → journey verdict | `tests/search-origin.spec.ts`, `isExternalSearchOrigin` | A problem is discarded only by the origin of the thing that failed, never by the words in its message |

The last row is the one that has broken twice. Read the comment above
`isExternalSearchOrigin` before touching it.
