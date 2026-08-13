#!/usr/bin/env node
/**
 * Prove that every claim this repository's documentation makes ABOUT this
 * repository is still true: every walkthrough citation points at the code it
 * names, and the promotion scorecard is stated in exactly one place.
 *
 * Why the citation half is not just a line-number check. A guard that asks only
 * "is line 43 inside this file" proves the anchor is STABLE, never that it is
 * CORRECT. It passes while a step points at the wrong symbol, it cannot see a
 * twenty-line drift inside a two-hundred-line file, and it earns trust it has
 * not established — which is worse than no guard, because a new engineer
 * believes it. Five repositories shipped exactly that check in one wave; the
 * rule that replaced it lives in the HUMAN-READY gate:
 * https://raw.githubusercontent.com/HomenShum/NodeKit/main/templates/promotion/HUMAN_READY.md
 *
 * So every citation here carries the code it claims to point at, and this script
 * asserts the cited LINE matches it:
 *
 *   .tour step        { "file": …, "line": 33, "pattern": "^const config = readConfig" }
 *   START_HERE.md     `src/audit-static.ts:33` (`const config = readConfig();`)
 *
 * A citation with no expected text is a failure, not a pass — otherwise the
 * weak check comes back the first time someone adds a step in a hurry.
 *
 * Why the scorecard half is here. The same rot, in prose: the promotion score
 * was stated in three documents with two different values, and a reader could
 * only resolve it by reading all three in commit order. The score has one owner,
 * `promotion/PRODUCT_GOAL.md`, which derives it from its own table; every other
 * document links there. This asserts both halves of that.
 *
 * Run: npm run verify:citations
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOURS = path.join(ROOT, ".tours");
const WALKTHROUGH = "docs/START_HERE.md";
const SCORECARD = "promotion/PRODUCT_GOAL.md";
/** How the scorecard total is written, wherever it is written. */
const TOTAL = /\b(\d+)\s*\/\s*(\d+)\s+PASS\b/i;

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);
const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8").split(/\r?\n/);

let claims = 0;

/**
 * The one assertion this whole file exists to make: line `line` of `file` says
 * what the citation claims, and says it there and nowhere earlier.
 */
function assertAnchor(where, file, line, expected, matches) {
  claims++;
  if (!existsSync(path.join(ROOT, file))) return fail(where, `file does not exist: ${file}`);
  const lines = read(file);
  if (line < 1 || line > lines.length) return fail(where, `line ${line} is outside ${file} (${lines.length} lines)`);
  if (!matches(lines[line - 1])) return fail(where, `${file}:${line} does not match ${expected}\n      line reads: ${lines[line - 1].trim() || "(blank)"}`);
  const first = lines.findIndex(matches) + 1;
  if (first !== line) fail(where, `${expected} also matches ${file}:${first}, above the cited ${line} — the anchor is ambiguous`);
}

// 1. CodeTour steps.
if (!existsSync(TOURS)) fail(".tours", "directory is missing");
const tourFiles = existsSync(TOURS) ? readdirSync(TOURS).filter((name) => name.endsWith(".tour")).sort() : [];
if (!tourFiles.length) fail(".tours", "no .tour files");
for (const name of tourFiles) {
  const tour = JSON.parse(readFileSync(path.join(TOURS, name), "utf8"));
  if (!tour.title) fail(name, "missing title");
  if (!Array.isArray(tour.steps) || !tour.steps.length) {
    fail(name, "has no steps");
    continue;
  }
  tour.steps.forEach((step, index) => {
    const where = `${name} step ${index + 1}`;
    if (!step.description) fail(where, "missing description");
    if (!step.file) return fail(where, "missing file");
    if (typeof step.line !== "number") return fail(where, "missing line");
    if (!step.pattern) return fail(where, "missing pattern; a bare line number proves nothing about the code");
    const regex = new RegExp(step.pattern);
    assertAnchor(where, step.file, step.line, `pattern ${step.pattern}`, (text) => regex.test(text));
  });
}

// 2. Every markdown citation written as `path:line` (`expected substring`).
// The walkthrough is the document this matters most in, but the rule is the
// packet's, not one file's: `docs/codebase/STACK.md` cited a line in
// `src/utils.ts` that had moved fifteen lines, and nothing was red.
const CITATION = /`([\w./-]+\.(?:ts|tsx|mjs|js|json|md|html|yml))(?::(\d+))?`(?:\s*\(`([^`]+)`\))?/g;
// Tracked files only. The receipts the commands write are output, not
// documentation, and scanning them would make this count depend on whatever the
// reader happened to run last.
const markdown = execFileSync("git", ["ls-files", "*.md"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
if (!markdown.includes(WALKTHROUGH)) fail(WALKTHROUGH, "the ordered walkthrough is missing");

for (const doc of markdown) {
  read(doc).forEach((text, index) => {
    for (const [, file, line, expected] of text.matchAll(CITATION)) {
      if (!line) continue; // a bare filename is a pointer, not a line citation
      const where = `${doc} line ${index + 1}`;
      if (!expected) {
        claims++;
        fail(where, `\`${file}:${line}\` carries no expected text — write it as \`${file}:${line}\` (\`the code on that line\`), or drop the line number`);
        continue;
      }
      assertAnchor(where, file, Number(line), `\`${expected}\``, (candidate) => candidate.includes(expected));
    }
  });
}

// 3. The scorecard has one owner and derives its total from its own rows.
const scorecard = read(SCORECARD);
const passRows = scorecard.filter((text) => /^\|\s*\d+\s*\|.*\|\s*PASS\s*\|/.test(text)).length;
const totalRows = scorecard.filter((text) => /^\|\s*\d+\s*\|.*\|\s*(PASS|FAIL|UNVERIFIED)\s*\|/.test(text)).length;
const stated = scorecard.join("\n").match(TOTAL);
claims++;
if (!stated) fail(SCORECARD, "states no N/12 PASS total; the scorecard's owner has to state it");
else if (Number(stated[1]) !== passRows || Number(stated[2]) !== totalRows) {
  fail(SCORECARD, `says ${stated[0]} but its own table has ${passRows} PASS rows out of ${totalRows}`);
}

for (const file of markdown) {
  if (file === SCORECARD) continue;
  claims++;
  const lines = read(file);
  const index = lines.findIndex((text) => TOTAL.test(text));
  if (index >= 0) fail(`${file} line ${index + 1}`, `restates the scorecard ("${lines[index].match(TOTAL)[0]}"); link to ${SCORECARD} instead — a copied total is wrong the moment an iteration runs`);
}

for (const problem of failures) console.log(`FAIL  ${problem}`);
console.log(`${claims - failures.length}/${claims} documentation claims hold across ${tourFiles.length} tours, ${WALKTHROUGH}, and ${markdown.length} markdown files`);
process.exit(failures.length ? 1 : 0);
