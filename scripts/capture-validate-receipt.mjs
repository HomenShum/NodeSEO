#!/usr/bin/env node
/**
 * Capture the zero-key demo honestly:
 *   1. run the REAL `npm run validate` (typecheck + static audit of the
 *      bundled examples/site, no API keys) and capture its stdout verbatim;
 *   2. copy the generated docs/reports/SEO_AUDIT.md receipt to
 *      docs/reports/examples/SEO_AUDIT.example.md (committed);
 *   3. render the command + verbatim output as a terminal-styled page and
 *      screenshot it to docs/media/validate-terminal.png.
 *
 * A static image, not an animated replay, on purpose: the run prints a dozen
 * lines near-instantly, so animating it would be theater. Nothing in the
 * image is typed by hand — the output block is the captured stdout.
 *
 * Run: node scripts/capture-validate-receipt.mjs
 */
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "docs/media/validate-terminal.png");
const RECEIPT_SRC = path.join(ROOT, "docs/reports/SEO_AUDIT.md");
const RECEIPT_DST = path.join(ROOT, "docs/reports/examples/SEO_AUDIT.example.md");

// 1. Real run, verbatim capture. Throws (and fails this script) if validate fails.
const out = execSync("npm run validate", { cwd: ROOT, encoding: "utf8" });

// Honesty gate: the audit must actually have passed and written its receipts.
if (!/pass=\d+ warn=\d+ fail=0/.test(out)) {
  console.error("validate output did not report fail=0; refusing to capture:\n" + out);
  process.exit(1);
}

// 2. Commit-able copy of the receipt the run just wrote (bundled example site,
// baseUrl https://example.com — contains no real domain data, so nothing to redact).
await fs.mkdir(path.dirname(RECEIPT_DST), { recursive: true });
await fs.copyFile(RECEIPT_SRC, RECEIPT_DST);

// 3. Terminal-styled rendering of the verbatim output.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin: 0; background: #0d1117; display: inline-block; }
  pre {
    margin: 0; padding: 22px 28px; font: 14px/1.55 "Cascadia Code", Consolas, monospace;
    color: #c9d1d9; white-space: pre; min-width: 640px;
  }
  .cmd { color: #7ee787; font-weight: 600; }
  .ok  { color: #58a6ff; }
</style>
<pre id="term"><span class="cmd">$ npm run validate</span>   <span style="color:#8b949e"># no API keys required</span>
${esc(out.trimEnd()).replace(/(pass=\d+ warn=\d+ fail=0)/, '<span class="ok">$1</span>')}</pre>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 });
await page.setContent(html);
const el = page.locator("#term");
await fs.mkdir(path.dirname(IMG), { recursive: true });
await el.screenshot({ path: IMG });
await browser.close();

console.log("verbatim validate output captured");
console.log("receipt: " + path.relative(ROOT, RECEIPT_DST));
console.log("image:   " + path.relative(ROOT, IMG));
