#!/usr/bin/env node
/**
 * Prove that every step of every CodeTour in `.tours/` still points at the code
 * it claims to point at.
 *
 * A walkthrough that names a line number is a claim about the current commit,
 * and it is the kind of claim that rots silently: insert three lines near the
 * top of a file and every step below it now describes the wrong code, with
 * nothing going red. A tour with a stale line is worse than no tour, because a
 * new engineer trusts it.
 *
 * Each step therefore carries two things: `line`, the number a reader sees, and
 * `pattern`, a regular expression naming the code that line is supposed to be.
 * CodeTour itself resolves `pattern` when it opens the tour, so the tour keeps
 * working in the editor even as code moves; this script checks the two agree, so
 * the number in the JSON cannot quietly drift away from the code.
 *
 * Run: npm run verify:tours
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOURS = path.join(ROOT, ".tours");

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

if (!existsSync(TOURS)) {
  console.error("no .tours directory");
  process.exit(1);
}

const tourFiles = readdirSync(TOURS).filter((name) => name.endsWith(".tour")).sort();
if (!tourFiles.length) {
  console.error("no .tour files in .tours/");
  process.exit(1);
}

let stepCount = 0;
for (const name of tourFiles) {
  const tour = JSON.parse(readFileSync(path.join(TOURS, name), "utf8"));
  if (!tour.title) fail(name, "missing title");
  if (!Array.isArray(tour.steps) || !tour.steps.length) {
    fail(name, "has no steps");
    continue;
  }
  tour.steps.forEach((step, index) => {
    stepCount++;
    const where = `${name} step ${index + 1}`;
    if (!step.description) fail(where, "missing description");
    if (!step.file) {
      fail(where, "missing file");
      return;
    }
    const target = path.join(ROOT, step.file);
    if (!existsSync(target)) {
      fail(where, `file does not exist: ${step.file}`);
      return;
    }
    const lines = readFileSync(target, "utf8").split(/\r?\n/);
    if (typeof step.line !== "number") {
      fail(where, "missing line");
      return;
    }
    if (step.line < 1 || step.line > lines.length) {
      fail(where, `line ${step.line} is outside ${step.file} (${lines.length} lines)`);
      return;
    }
    if (!step.pattern) {
      fail(where, "missing pattern; a bare line number cannot be checked");
      return;
    }
    const regex = new RegExp(step.pattern);
    const matched = lines.findIndex((text) => regex.test(text)) + 1;
    if (matched === 0) fail(where, `pattern ${step.pattern} matches nothing in ${step.file}`);
    else if (matched !== step.line) fail(where, `pattern ${step.pattern} is on line ${matched}, tour says ${step.line}`);
  });
}

for (const problem of failures) console.log(`FAIL  ${problem}`);
console.log(`${stepCount - failures.length}/${stepCount} tour steps resolve across ${tourFiles.length} tours`);
process.exit(failures.length ? 1 : 0);
