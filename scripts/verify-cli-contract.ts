#!/usr/bin/env tsx
/**
 * Characterization check for `src/utils.ts` — the flag, config, environment and
 * path rules every one of the seven commands inherits.
 *
 * Why this exists: `src/utils.ts` is imported by all seven commands and had no
 * test of any kind. The whole automated surface was one Playwright spec, which
 * never reaches these rules. This file was written BEFORE the Wave 3 edits to
 * that module (env parser swapped to `process.loadEnvFile`, two path helpers
 * collapsed into `fromRoot`) so the edits had something to be checked against,
 * rather than being declared safe by reading them.
 *
 * It asserts the CURRENT contract, not a nicer one. If a line here looks odd —
 * `.env` beating `.env.local`, for instance — that is the shipped behaviour and
 * this file is where it is written down.
 *
 * No test framework: `node:assert` plus an exit code, matching
 * `scripts/verify-journey-problem-gate.mjs`.
 *
 * Run: npm run verify:cli
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const checks: Array<[string, () => void]> = [];
const check = (name: string, fn: () => void) => checks.push([name, fn]);

// `src/utils.ts` snapshots `process.cwd()` and `process.argv` at import time, so
// both have to be staged before the module is pulled in — hence one dynamic
// import at the bottom of the setup rather than a static one at the top.
const sandbox = mkdtempSync(join(tmpdir(), "nodeseo-cli-"));
writeFileSync(join(sandbox, ".env"), [
  "# a comment line, skipped",
  "",
  "SEO_BASE_URL=https://dotenv.example",
  'SEO_TARGET_PHRASE="quoted phrase with spaces"',
  "SEO_FROM_SHELL_WINS=file-value",
].join("\n"));
writeFileSync(join(sandbox, ".env.local"), "SEO_BASE_URL=https://dotenv-local.example\n");
writeFileSync(join(sandbox, "site.config.json"), JSON.stringify({ baseUrl: "https://config.example", publicRoutes: ["/", "/pricing/"] }));

process.env.SEO_FROM_SHELL_WINS = "shell-value";
const originalCwd = process.cwd();
process.chdir(sandbox);
process.argv = [
  process.argv[0],
  "verify-cli-contract",
  "--config", "site.config.json",
  "--base-url=https://inline.example",
  "--route", "/",
  "--route=/pricing/",
  "--no-write",
  "--row-limit", "500",
  "--md-out", "--json-out",
];

const utils = await import(pathToFileURL(join(originalCwd, "src", "utils.ts")).href);

check("--name=value is read inline", () => {
  assert.equal(utils.optionValue("--base-url"), "https://inline.example");
});

check("--name value is read from the next argument", () => {
  assert.equal(utils.optionValue("--config"), "site.config.json");
});

check("an absent option is undefined, not an empty string", () => {
  assert.equal(utils.optionValue("--site-root"), undefined);
});

check("an option followed by another flag has no value", () => {
  // `--md-out --json-out`: the next token is a flag, so --md-out is valueless.
  assert.equal(utils.optionValue("--md-out"), undefined);
});

check("optionValues collects both spellings of a repeated option", () => {
  assert.deepEqual(utils.optionValues("--route"), ["/", "/pricing/"]);
});

check("hasFlag sees a bare flag and not an absent one", () => {
  assert.equal(utils.hasFlag("--no-write"), true);
  assert.equal(utils.hasFlag("--dry-run"), false);
});

check("numberOption returns the fallback when the option is absent", () => {
  assert.equal(utils.numberOption("--frame-ms", 250, 100, 2000), 250);
});

check("numberOption parses a supplied value", () => {
  assert.equal(utils.numberOption("--row-limit", 250, 1, 25000), 500);
});

check("numberOption rejects a value outside its range", () => {
  assert.throws(() => utils.numberOption("--row-limit", 250, 1, 100), /--row-limit must be between 1 and 100/);
});

check("readConfig loads and parses the file named by --config", () => {
  const config = utils.readConfig();
  assert.equal(config.baseUrl, "https://config.example");
  assert.deepEqual(config.publicRoutes, ["/", "/pricing/"]);
});

check(".env is loaded on import", () => {
  assert.equal(process.env.SEO_BASE_URL, "https://dotenv.example");
});

check("surrounding quotes are stripped from a .env value", () => {
  assert.equal(process.env.SEO_TARGET_PHRASE, "quoted phrase with spaces");
});

check("a variable already in the environment beats the .env file", () => {
  assert.equal(process.env.SEO_FROM_SHELL_WINS, "shell-value");
});

check(".env wins over .env.local, because .env is loaded first", () => {
  // Not the convention most dotenv tools use. It is what this repo does, and
  // both commands and CI depend on it, so it is pinned here rather than fixed
  // silently during a refactor.
  assert.equal(process.env.SEO_BASE_URL, "https://dotenv.example");
});

check("a relative path resolves against the repo root", () => {
  assert.equal(utils.fromRoot("artifacts/x.mp4"), join(sandbox, "artifacts", "x.mp4"));
});

check("an absolute path is returned unchanged", () => {
  const absolute = join(sandbox, "already", "absolute.mp4");
  assert.equal(utils.fromRoot(absolute), absolute);
});

check("slash normalises Windows separators for receipts", () => {
  assert.equal(utils.slash("docs\\reports\\SEO_AUDIT.md"), "docs/reports/SEO_AUDIT.md");
});

check("escapeMd keeps a table cell on one row", () => {
  assert.equal(utils.escapeMd("a | b\nc"), "a \\| b c");
});

check("quote leaves a shell-safe token bare and JSON-quotes the rest", () => {
  assert.equal(utils.quote("-crf"), "-crf");
  assert.equal(utils.quote("fps=6,scale='min(960,iw)':-2"), '"fps=6,scale=\'min(960,iw)\':-2"');
});

check("urlFor joins a base and a route without doubling the slash", () => {
  assert.equal(utils.urlFor("https://example.com/", "/pricing/"), "https://example.com/pricing/");
  assert.equal(utils.urlFor("https://example.com", "pricing/"), "https://example.com/pricing/");
  assert.equal(utils.urlFor("https://example.com", "https://other.example/x"), "https://other.example/x");
});

// Defect D1: what an unconfigured command prints. The guard messages were always
// good sentences; what made them read as "the tool is broken" was Node's default
// handler wrapping them in a stack trace with ESM loader frames. The handler
// that fixes it lives in `src/utils.ts`, which every command imports, so it
// belongs in this file — it is part of the contract they all inherit.
//
// Each command runs in the sandbox rather than the repo, so a developer who does
// have credentials in a real `.env` still gets the unconfigured path measured.
const unconfigured = (script: string, args: string[], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [resolve(originalCwd, "node_modules", "tsx", "dist", "cli.mjs"), resolve(originalCwd, "src", script), ...args], {
    cwd: sandbox,
    encoding: "utf8",
    env: { ...process.env, GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: "", GOOGLE_APPLICATION_CREDENTIALS: "", GOOGLE_GENERATIVE_AI_API_KEY: "", SEO_DEBUG: "", ...env },
  });

const readsAsConfiguration = (name: string, script: string, args: string[], sentence: RegExp) => {
  check(`${name} names what to configure, in one line, not a stack`, () => {
    const run = unconfigured(script, args);
    assert.equal(run.status, 1, `expected exit 1, got ${run.status}`);
    assert.match(run.stderr, sentence);
    assert.equal(run.stderr.trim().split("\n").length, 1, `expected one line, got: ${JSON.stringify(run.stderr)}`);
    assert.doesNotMatch(run.stderr, /node:internal|ModuleJob|at async/, "a Node stack frame reached the user");
  });
};

readsAsConfiguration("search-console", "search-console-report.ts", ["--site-url", "https://x/"], /Set GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS\. Use --dry-run/);
readsAsConfiguration("judge-video", "judge-video-gemini.ts", ["--input", "artifacts/nope.mp4"], /^Video not found: artifacts\/nope\.mp4/);
readsAsConfiguration("capture:cdp", "chrome-cdp-capture.ts", ["--cdp-url", "http://127.0.0.1:9", "--base-url", "http://127.0.0.1:4614"], /^No Chrome DevTools endpoint at http:\/\/127\.0\.0\.1:9\. Start Chrome with/);

check("judge-video --dry-run needs neither a key nor a real video", () => {
  const run = unconfigured("judge-video-gemini.ts", ["--input", "artifacts/nope.mp4", "--dry-run", "--out-dir", join(sandbox, "judge")]);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /wrote .*\.json and .*\.md/);
});

check("SEO_DEBUG restores the stack the friendly message replaced", () => {
  // Without this, a real bug would be indistinguishable from a missing key.
  const run = unconfigured("judge-video-gemini.ts", ["--input", "artifacts/nope.mp4"], { SEO_DEBUG: "1" });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Video not found: artifacts\/nope\.mp4/);
  assert.match(run.stderr, /judge-video-gemini\.ts/);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`pass  ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL  ${name}\n      ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
  }
}

process.chdir(originalCwd);
rmSync(sandbox, { recursive: true, force: true });
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
