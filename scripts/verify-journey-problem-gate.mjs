#!/usr/bin/env node
/**
 * Prove that the journey's console-error / failed-request gate can actually
 * fail, and that it stays green on a healthy page.
 *
 * Why this script exists: `tests/search-origin.spec.ts` used to collect
 * `failedRequests` and never assert on them, and it filtered console errors by
 * matching the message TEXT -- twice, with two predicates. The first,
 * /google|gstatic|consent|captcha|429/, dropped a first-party error that merely
 * mentioned Google. The second, /fonts\.googleapis\.com|fonts\.gstatic\.com|
 * favicon|ResizeObserver loop/, survived that fix three lines below it and
 * dropped a first-party console error that merely contained "favicon". Between
 * them that is a check that cannot fail, and nothing in the repo demonstrated
 * the difference. This does, in four real runs of the real npm target against
 * four real pages:
 *
 *   healthy         examples/site                        -> exit 0
 *   first-party-err tests/fixtures/first-party-error      -> exit 1, names the error
 *   failed-request  tests/fixtures/failed-request         -> exit 1, names the request
 *   console-error   tests/fixtures/first-party-console-error -> exit 1, names the error
 *
 * The broken fixtures are deliberately NOT combined into one page. A refused
 * subresource also prints "Failed to load resource" to the console, so a
 * combined fixture fails through the error channel and proves nothing about
 * the request channel -- measured on the pre-fix tree, which failed such a
 * fixture for the wrong reason. Each fixture therefore trips exactly one thing.
 *
 * All four pages are served by the throwaway static server below on
 * 127.0.0.1:4313 (override with JOURNEY_GATE_PORT when that port is taken), so
 * this runs from a fresh clone with no network, no keys and no extra
 * dependencies.
 *
 * Run: node scripts/verify-journey-problem-gate.mjs
 */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, promises as fs, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.JOURNEY_GATE_PORT ?? 4313);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EVIDENCE = path.join(ROOT, "promotion/evidence/journey-problem-gate.md");
const LANDING_SHOT = path.join(ROOT, "promotion/evidence/journey-direct-landing.png");

// The strings each broken run must surface. If the gate regresses to
// "collected but not asserted", or back to a text filter over first-party
// messages -- of either vocabulary -- the matching run goes green and this
// script fails.
const MUST_NAME_ERROR = "google analytics bootstrap failed";
const MUST_NAME_REQUEST = "/never-responds";
const MUST_NAME_CONSOLE_ERROR = "favicon pipeline exploded";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function startServer(root) {
  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, BASE_URL);
    // Held open forever on purpose: the failed-request fixture aborts it, which
    // is how it produces a failed request with no console message.
    if (pathname === "/never-responds") return;
    let file = path.join(root, decodeURIComponent(pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

// Async on purpose: spawnSync would block this process's event loop, and this
// process is also the static server the browser is loading from. Measured: with
// spawnSync every navigation to 127.0.0.1:4313 timed out.
function runJourney(env) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "journey"], {
      cwd: ROOT,
      shell: true,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: BASE_URL, PW_TEST_HTML_REPORT_OPEN: "never", ...env },
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("close", (status) => resolve({ status, output }));
  });
}

async function journeyAgainst(fixtureDir, env = {}) {
  const server = await startServer(path.join(ROOT, fixtureDir));
  try {
    return await runJourney({ SEO_PRIMARY_HEADING: "", SEO_PRIMARY_CTA_TEXT: "", ...env });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function findFile(dir, name) {
  if (!existsSync(dir)) return undefined;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const hit = findFile(full, name);
      if (hit) return hit;
    } else if (entry.name === name) return full;
  }
  return undefined;
}

function tail(text, lines = 26) {
  return text.trimEnd().split(/\r?\n/).slice(-lines).join("\n");
}

// The assertion diff, not the tail: Playwright prints ~25 lines of attachment
// and trace paths after it, which would push the actual problem strings — the
// whole point of this receipt — out of the excerpt.
function failure(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s+1\)/.test(line));
  if (start < 0) return tail(text);
  const rest = lines.slice(start);
  const end = rest.findIndex((line) => /attachment #|Error Context:/.test(line));
  return rest.slice(0, end < 0 ? 40 : end).join("\n").trimEnd();
}

// --- run 1: the healthy bundled demo site --------------------------------
const healthy = await journeyAgainst("examples/site", {
  SEO_PRIMARY_HEADING: "ExampleRoom",
  SEO_PRIMARY_CTA_TEXT: "Create a room",
});

// Keep the landing capture the healthy run just took, so the committed
// screenshot has a committed producer rather than a hand-run one.
const shot = findFile(path.join(ROOT, "test-results"), "direct-landing.png");
if (shot) await fs.copyFile(shot, LANDING_SHOT);

// --- run 2: first-party error whose text mentions Google -----------------
const firstPartyError = await journeyAgainst("tests/fixtures/first-party-error");

// --- run 3: failed request with no console message at all ----------------
const failedRequest = await journeyAgainst("tests/fixtures/failed-request");

// --- run 4: first-party console.error whose text contains "favicon" ------
const consoleError = await journeyAgainst("tests/fixtures/first-party-console-error");

const checks = [
  ["healthy demo site exits 0", healthy.status === 0],
  ["first-party-error fixture exits non-zero", firstPartyError.status !== 0],
  [`first-party-error run names the error (${MUST_NAME_ERROR})`, firstPartyError.output.includes(MUST_NAME_ERROR)],
  ["failed-request fixture exits non-zero", failedRequest.status !== 0],
  [`failed-request run names the request (${MUST_NAME_REQUEST})`, failedRequest.output.includes(MUST_NAME_REQUEST)],
  ["first-party-console-error fixture exits non-zero", consoleError.status !== 0],
  [`first-party-console-error run names the error (${MUST_NAME_CONSOLE_ERROR})`, consoleError.output.includes(MUST_NAME_CONSOLE_ERROR)],
];
const ok = checks.every(([, passed]) => passed);

const section = (title, run) => `## ${title}, expected exit ${run.expected}, got ${run.result.status}

\`\`\`
${run.expected === 0 ? tail(run.result.output) : failure(run.result.output)}
\`\`\`
`;

const md = `# Journey problem-gate proof

Generated: ${new Date().toISOString()}
Producer: \`node scripts/verify-journey-problem-gate.mjs\` (node ${process.version})
Under test: \`npm run journey\` -> \`tests/search-origin.spec.ts\`, chromium, base URL \`${BASE_URL}\`

> Four real runs of the real npm target against four real pages served
> locally. The point is runs 2, 3 and 4: the spec used to drop any console
> error whose text matched /google/ (fixed 2026-08-13, iteration 1), never
> assert on failed requests at all (same fix), and drop any console error whose
> text matched /favicon|fonts\\.googleapis\\.com|ResizeObserver loop/ (a second
> text filter three lines below the first, fixed in iteration 2). Each broken
> fixture below reported \`1 passed\` under the filter that covered it.

| Check | Result |
|---|---|
${checks.map(([name, passed]) => `| ${name} | ${passed ? "pass" : "FAIL"} |`).join("\n")}

Overall: **${ok ? "pass" : "FAIL"}**

${section("Run 1 — `examples/site` (healthy)", { result: healthy, expected: 0 })}
Landing capture kept at \`promotion/evidence/journey-direct-landing.png\`${shot ? "" : " (not refreshed this run: no attachment found)"}.

${section("Run 2 — `tests/fixtures/first-party-error` (inline `throw new Error` whose message contains \"google\")", { result: firstPartyError, expected: 1 })}
${section("Run 3 — `tests/fixtures/failed-request` (aborted fetch: a failed request Chrome logs nothing about)", { result: failedRequest, expected: 1 })}
${section("Run 4 — `tests/fixtures/first-party-console-error` (inline `console.error` whose message contains \"favicon\")", { result: consoleError, expected: 1 })}`;

await fs.mkdir(path.dirname(EVIDENCE), { recursive: true });
await fs.writeFile(EVIDENCE, md);

for (const [name, passed] of checks) console.log(`${passed ? "pass" : "FAIL"}  ${name}`);
console.log(`receipt: ${path.relative(ROOT, EVIDENCE)}`);
process.exit(ok ? 0 : 1);
