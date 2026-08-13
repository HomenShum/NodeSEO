# Stack

Everything this repository depends on, and why each one is here. Seven direct
packages; `npm install` reports 20 packages total including transitives.

## Runtime

**Node.js 22.** Pinned by `.github/workflows/ci.yml` (`node-version: 22`).
Three Node features are used directly rather than via a package, so the version
floor is real, not decorative:

| Feature | Where | What it replaced |
|---|---|---|
| `process.loadEnvFile` (20.12+) | `src/utils.ts:37` | a hand-rolled `.env` parser |
| built-in `fetch` (18+) | `src/search-console-report.ts:95` | an HTTP client package |
| `node:crypto` `createSign` | `src/search-console-report.ts:160` | a JWT/OAuth library |

**TypeScript 5.7, strict, `module: NodeNext`.** There is no build step and no
bundler. `tsc --noEmit` typechecks; `tsx` runs the `.ts` files directly. Nothing
is compiled, published, or shipped as a package — you clone this and run it.

## Direct dependencies

### `dependencies` (3)

| Package | Used by | Why |
|---|---|---|
| `ai` (Vercel AI SDK) | `src/judge-video-gemini.ts` | `generateObject` — one call, with a schema that constrains the model's output |
| `@ai-sdk/google` | `src/judge-video-gemini.ts` | the Gemini provider for that call |
| `zod` | `src/judge-video-gemini.ts` | the schema itself. **This is the only place Zod is used** — it validates the model's output, not user input |

### `devDependencies` (4)

| Package | Used by | Why |
|---|---|---|
| `@playwright/test` | `tests/`, `src/performance-check.ts`, `src/chrome-cdp-capture.ts`, `scripts/capture-validate-receipt.mjs` | drives real Chromium. Both the test runner and the browser API come from this one package |
| `tsx` | every `src/*.ts` npm script | runs TypeScript without a build step |
| `typescript` | `npm run typecheck` | the typechecker |
| `@types/node` | all | Node type definitions |

Note the fourth column of the `@playwright/test` row. Three files outside the
test directory import it for `chromium`, `Browser` and `Page`. Before Wave 3
they imported the bare `playwright` package, which is **not** in `package.json`
— it worked only because `@playwright/test` pulls it in transitively. A reader
looking up "where does `playwright` come from?" found nothing. Fixed by pointing
those imports at the declared package; see
[`docs/SIMPLIFICATION_REPORT.md`](../SIMPLIFICATION_REPORT.md).

## External binaries, not npm packages

**ffmpeg**, shelled out to by `src/frames-to-video.ts` and
`src/compress-video.ts` via `execFileSync`. It is not installed by `npm install`
and is not checked for at startup. Both commands accept `--dry-run`, which
prints the exact ffmpeg command line and exits without running it — that is how
you use those two commands without ffmpeg on your machine.

**A local Chrome with remote debugging enabled**, for `npm run capture:cdp`
only. It attaches to your *real* browser over the DevTools protocol
(`chromium.connectOverCDP`), so the recorded search-results page reflects a real
signed-in session. See [`INTEGRATIONS.md`](INTEGRATIONS.md).

## Deliberately absent

Worth knowing so you do not go looking:

- **No test framework** beyond Playwright. The two non-browser checks
  (`scripts/verify-cli-contract.ts`, `scripts/verify-tours.mjs`) use `node:assert`
  and an exit code.
- **No linter or formatter.** Style is whatever `tsc --strict` accepts.
- **No bundler, no build output, no `dist/`.**
- **No HTTP framework, no database, no ORM, no logger.** The only durable state
  is files under `docs/reports/` and `artifacts/`.
- **No dotenv package.** Node loads `.env` itself.
- **No documentation site.** Markdown and CodeTours; see
  [`STRUCTURE.md`](STRUCTURE.md).
