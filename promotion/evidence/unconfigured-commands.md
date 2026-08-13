# What an unconfigured command prints — defect D1, before and after

Wave 3b, 2026-08-13. Windows 11, node v22.22.2. Clean `--depth 20` clone of
`main` at `57e406d`, `npm install` only, no `.env`, no API keys, no Chrome
running on 9222.

The three commands that need credentials or a browser were run with none of
them, which is what a first-time reader does by accident. Before the fix the
message was already a good sentence and the crash dump around it was the defect:
seven lines of Node internals told the reader the tool is broken.

Producer: `npm run verify:cli` (`scripts/verify-cli-contract.ts`), committed,
keyless, no network — it re-runs all three commands in a sandbox directory and
asserts exit 1, one line of stderr, the expected sentence, and no
`node:internal` / `ModuleJob` / `at async` frame. It ran **21/25 on the pre-fix
tree and 25/25 after**, so the check is known to fail before the fix rather than
assumed to.

## Before — `git stash`ed `src/`, same clone

```
$ npm run search-console -- --site-url https://x/

C:\...\NodeSEO\src\search-console-report.ts:129
    throw new Error("Set GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS. Use --dry-run to test output shape.");
          ^

Error: Set GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS. Use --dry-run to test output shape.
    at accessToken (C:\...\NodeSEO\src\search-console-report.ts:129:11)
    at liveReport (C:\...\NodeSEO\src\search-console-report.ts:56:23)
    at <anonymous> (C:\...\NodeSEO\src\search-console-report.ts:50:45)
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.22.2
```

```
$ npm run judge-video -- --input artifacts/nope.mp4

C:\...\NodeSEO\src\judge-video-gemini.ts:16
if (!existsSync(inputPath)) throw new Error(`Video not found: ${input}`);
                                  ^

Error: Video not found: artifacts/nope.mp4
    at <anonymous> (C:\...\NodeSEO\src\judge-video-gemini.ts:16:35)
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.22.2
```

```
$ npm run capture:cdp -- --search "test phrase" --target-host example.com --base-url http://127.0.0.1:4614

node:internal/modules/run_main:123
    triggerUncaughtException(
    ^

browserType.connectOverCDP: connect ECONNREFUSED 127.0.0.1:9222
Call log:
  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222

    at <anonymous> (C:\...\NodeSEO\src\chrome-cdp-capture.ts:18:32) {
  log: [
    '  - <ws preparing> retrieving websocket url from http://127.0.0.1:9222'
  ],
  name: 'Error'
}

Node.js v22.22.2
```

`npm run judge-video -- --input <anything> --dry-run` could not be run at all
from a clean clone: the file-exists guard ran before the dry-run branch, so the
one model path needed a real video file to exercise even when no model was
called.

## After — same clone, same commands

```
$ npm run search-console -- --site-url https://x/
Set GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS. Use --dry-run to test output shape.
exit=1

$ npm run judge-video -- --input artifacts/nope.mp4
Video not found: artifacts/nope.mp4
exit=1

$ npm run capture:cdp -- --search "test phrase" --target-host example.com --base-url http://127.0.0.1:4614
No Chrome DevTools endpoint at http://127.0.0.1:9222. Start Chrome with --remote-debugging-port=9222, or pass --cdp-url.
exit=1

$ npm run judge-video -- --input artifacts/nope.mp4 --dry-run
wrote docs/reports/gemini-video-judges/20260813T205827Z-nope.json and docs/reports/gemini-video-judges/20260813T205827Z-nope.md
exit=0
```

The exit codes are unchanged. Every message is unchanged except `capture:cdp`,
whose Playwright connect failure was the one message that was not already a
usable sentence.

## What changed, and where

- `src/utils.ts` — one `process.on("uncaughtException")` handler. Every command
  imports this module, so the fix reaches all seven, including the guards inside
  `readConfig` and `numberOption` that no per-command wrapper would reach.
- `src/chrome-cdp-capture.ts` — one `.catch` turning Playwright's multi-line
  connect dump into a sentence naming the port and the flag.
- `src/judge-video-gemini.ts` — the file-exists guard now yields to `--dry-run`,
  which never opens the file.

`SEO_DEBUG=1` restores the full stack, so a real bug is still debuggable and does
not look like a missing key. That escape hatch has its own check, because a
mechanism nothing exercises is a mechanism nobody knows is broken.
