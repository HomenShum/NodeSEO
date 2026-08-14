#!/usr/bin/env node
/**
 * Audit the only surface this repo renders -- the bundled `examples/site` --
 * with the three instruments the promotion gate names, and fail if any of them
 * comes back with a major finding.
 *
 * Why this script exists: rows 3, 4, 6, 7 and 8 of the scorecard were all
 * UNVERIFIED for the same reason. Row 4 had been *measured* (0 horizontal
 * overflow at 375 and 1280) by a scratchpad file that was never committed, so
 * the two PNGs under promotion/evidence/ were output with no producer -- half
 * an artifact, which the gate scores as UNVERIFIED. Rows 6, 7 and 8 had never
 * been measured at all. This script is the missing half for row 4 and the
 * whole measurement for the rest, and it re-emits those same two PNG paths so
 * they stop being hand-run.
 *
 * Three instruments, because they see different things and one cannot stand in
 * for another:
 *
 *   Playwright   layout facts a score cannot express: is the document wider
 *                than its viewport, is the mobile layout viewport actually the
 *                device width or the 980px fallback a page gets when it forgets
 *                <meta name="viewport">, does Tab reach every link and leave a
 *                visible ring. Chromium is already a devDependency here.
 *   Lighthouse   performance, accessibility, best-practices, SEO and Core Web
 *                Vitals, mobile AND desktop, because a desktop-only pass says
 *                nothing about the form factor most search traffic arrives on.
 *   axe-core     accessibility violations by rule and impact. Lighthouse's
 *                accessibility score is a weighted subset; it is not this.
 *
 * A Lighthouse score is NOT a Web Interface Guidelines review and this script
 * does not pretend to be one. What it does for row 7 is emit the DOM
 * measurements a reviewer's findings cite -- viewport metadata, link hit-box
 * geometry, focus-ring computed styles, outbound link counts per page -- into
 * the receipt, so the review in
 * promotion/evidence/web-interface-guidelines-review.md rests on numbers
 * anyone can regenerate rather than on impressions.
 *
 * The site is served by the throwaway static server below on 127.0.0.1:4914
 * (override with WEB_QUALITY_PORT), mapping routes exactly the way
 * src/audit-static.ts:154-156 resolves them, so this audits the same files the
 * static auditor grades. No keys, no deployment, no third-party site.
 *
 * Run: npm run verify:web-quality
 */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, promises as fs, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.WEB_QUALITY_PORT ?? 4914);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SITE = path.join(ROOT, "examples/site");
const EVIDENCE = path.join(ROOT, "promotion/evidence");
const RECEIPT = path.join(EVIDENCE, process.env.WEB_QUALITY_RECEIPT ?? "web-quality-audit.md");
const LIGHTHOUSE_DIR = path.join(EVIDENCE, "lighthouse");
const AXE_DIR = path.join(EVIDENCE, "axe");

// Pinned, because an audit whose tool version floats cannot be compared to the
// run it is supposed to supersede.
const LIGHTHOUSE = "lighthouse@13.4.1";
const AXE = "@axe-core/cli@4.13.0";

const ROUTES = [
  { route: "/", slug: "root" },
  { route: "/pricing/", slug: "pricing" },
  { route: "/faq/", slug: "faq" },
];

// 375x812 and 1280x800 are the two widths the baseline captured, kept so the
// numbers are comparable. `isMobile` is the load-bearing flag: without it
// Chromium sizes the window but never applies meta-viewport handling, so a page
// that forgot <meta name="viewport"> looks identical to one that did not.
const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 },
  { name: "desktop-1280", width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1 },
];

// Screenshots this run refreshes. The first two paths already existed as
// committed output with no committed producer; emitting them here is what
// closes that half of row 4.
const SHOTS = {
  "/|mobile-375": "example-site-mobile-375.png",
  "/|desktop-1280": "example-site-desktop-1280.png",
  "/pricing/|mobile-375": "example-site-pricing-mobile-375.png",
};

// Budgets. Stated here rather than buried in a comparison so a reader can see
// what "major" means before reading whether it held.
const BUDGET = { category: 0.9, lcpMs: 2500, cls: 0.1 };
const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function startServer() {
  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, BASE_URL);
    // Same resolution as src/audit-static.ts:154-156: "/" is rootHtml at the
    // site root, every other route lives under publicDir.
    let file = pathname === "/" ? path.join(SITE, "index.html") : path.join(SITE, "public", decodeURIComponent(pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(SITE) || !existsSync(file)) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, shell: true });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("close", (status) => resolve({ status, output }));
  });
}

// --- instrument 1: layout, keyboard and the DOM facts row 7 cites ----------

async function measure(browser) {
  const rows = [];
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: vp.deviceScaleFactor,
    });
    for (const { route, slug } of ROUTES) {
      const page = await context.newPage();
      await page.goto(BASE_URL + route, { waitUntil: "load" });
      const dom = await page.evaluate(() => {
        const doc = document.documentElement;
        const layoutWidth = doc.clientWidth;
        return {
          scrollWidth: doc.scrollWidth,
          innerWidth: window.innerWidth,
          layoutWidth,
          visualWidth: Math.round(window.visualViewport ? window.visualViewport.width : window.innerWidth),
          viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
          colorSchemeMeta: document.querySelector('meta[name="color-scheme"]')?.getAttribute("content") ?? null,
          themeColorMeta: document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null,
          iconLink: document.querySelector('link[rel~="icon"]')?.getAttribute("href") ?? null,
          lang: doc.getAttribute("lang"),
          title: document.title,
          h1: document.querySelectorAll("h1").length,
          main: document.querySelectorAll("main").length,
          styleSheets: document.styleSheets.length,
          // Element census. Every "not applicable" in the Web Interface
          // Guidelines review cites one of these counts, so a section skipped
          // because the surface has no such element is a measured skip rather
          // than one the reviewer forgot.
          inventory: {
            formControls: document.querySelectorAll("form, input, textarea, select, button").length,
            images: document.querySelectorAll("img, picture, svg, video, canvas").length,
            aria: [...document.querySelectorAll("*")].filter((el) => [...el.attributes].some((a) => a.name === "role" || a.name.startsWith("aria-"))).length,
            scripts: document.querySelectorAll("script:not([type='application/ld+json'])").length,
            // Fits on one screen => nothing to scroll, so scroll-position and
            // overscroll guidelines have no subject.
            scrolls: document.documentElement.scrollHeight > window.innerHeight,
          },
          links: [...document.querySelectorAll("a[href]")].map((a) => {
            const box = a.getBoundingClientRect();
            return { text: a.textContent.trim(), href: a.getAttribute("href"), w: Math.round(box.width), h: Math.round(box.height) };
          }),
          // Anything whose right edge is past the layout viewport is what a
          // horizontal scrollbar is made of. 1px of slack for subpixel rounding.
          overflowing: [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > layoutWidth + 1)
            .map((el) => `${el.tagName.toLowerCase()} (right=${Math.round(el.getBoundingClientRect().right)})`),
        };
      });

      // Tab through every link and record where focus landed and what it looks
      // like. One press more than there are links, to see whether focus escapes
      // the document rather than cycling inside it.
      const tabStops = [];
      for (let i = 0; i < dom.links.length + 1; i += 1) {
        await page.keyboard.press("Tab");
        tabStops.push(
          await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return { tag: "body", text: "", outline: "none" };
            const style = getComputedStyle(el);
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent ?? "").trim().slice(0, 40),
              outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
              focusVisible: el.matches(":focus-visible"),
            };
          }),
        );
      }

      const shot = SHOTS[`${route}|${vp.name}`];
      if (shot) await page.screenshot({ path: path.join(EVIDENCE, shot), fullPage: true });

      rows.push({ route, slug, viewport: vp, dom, tabStops, shot });
      await page.close();
    }
    await context.close();
  }
  return rows;
}

/**
 * What the one call-to-action on the site actually does when you follow it.
 *
 * `/?create=1` is the private-route case: an inline script flips
 * <meta name="robots"> to noindex,nofollow, which is the claim
 * src/audit-static.ts checks statically. This confirms it dynamically AND
 * records the other half — whether anything the user can see changed. A
 * measurement, not a verdict; the Web Interface Guidelines review reads it and
 * decides what it means for a fixture whose job is to be markup-under-test.
 */
async function followTheCta(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const read = async () => ({
    robots: await page.getAttribute('meta[name="robots"]', "content"),
    visibleText: (await page.locator("body").innerText()).replace(/\s+/g, " ").trim(),
    url: page.url(),
  });
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  const before = await read();
  await page.getByRole("link", { name: /create a room/i }).click();
  await page.waitForLoadState("load");
  const after = await read();
  await page.screenshot({ path: path.join(EVIDENCE, "example-site-create-state.png"), fullPage: true });
  await context.close();
  return { before, after, robotsChanged: before.robots !== after.robots, textChanged: before.visibleText !== after.visibleText };
}

// --- instrument 2: Lighthouse, both form factors --------------------------

async function lighthouse() {
  await fs.mkdir(LIGHTHOUSE_DIR, { recursive: true });
  const results = [];
  for (const { route, slug } of ROUTES) {
    for (const formFactor of ["mobile", "desktop"]) {
      const file = path.join(LIGHTHOUSE_DIR, `${slug}-${formFactor}.json`);
      const args = [
        "--yes",
        LIGHTHOUSE,
        BASE_URL + route,
        "--output=json",
        `--output-path=${file}`,
        '--chrome-flags="--headless"',
        "--quiet",
      ];
      if (formFactor === "desktop") args.push("--preset=desktop");
      const { status, output } = await run("npx", args);
      const report = existsSync(file) ? JSON.parse(await fs.readFile(file, "utf8")) : null;
      results.push({
        route,
        slug,
        formFactor,
        status,
        output,
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        categories: report ? Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, v.score])) : {},
        lcpMs: report?.audits["largest-contentful-paint"]?.numericValue ?? null,
        cls: report?.audits["cumulative-layout-shift"]?.numericValue ?? null,
        // Every audit that did not fully pass, whatever its weight. The gate
        // reads categories, but a reader should see the individual failures --
        // a zero-weight audit is still a fact about the page.
        failing: report
          ? Object.entries(report.audits)
              .filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative")
              .map(([id, a]) => `${id} (${a.score})`)
          : ["report not produced"],
      });
    }
  }
  return results;
}

// --- instrument 3: axe-core -----------------------------------------------

async function axe() {
  await fs.mkdir(AXE_DIR, { recursive: true });
  const results = [];
  for (const { route, slug } of ROUTES) {
    const file = path.join(AXE_DIR, `${slug}.json`);
    // Relative, and relative to ROOT specifically: axe-cli joins --save onto
    // its own cwd, so an absolute path becomes <cwd><abs> and the run reports
    // "Unable to save file! ENOENT" while still exiting 0 on the audit itself.
    // Measured, not guessed -- the first run of this script recorded three
    // routes with `violations=n/a` for exactly that reason.
    const saveArg = path.relative(ROOT, file).replace(/\\/g, "/");
    const { status, output } = await run("npx", ["--yes", AXE, BASE_URL + route, "--save", saveArg]);
    const report = existsSync(file) ? JSON.parse(await fs.readFile(file, "utf8")) : null;
    const violations = report?.flatMap((page) => page.violations ?? []) ?? [];
    results.push({
      route,
      slug,
      status,
      output,
      file: path.relative(ROOT, file).replace(/\\/g, "/"),
      total: report ? violations.length : null,
      blocking: violations.filter((v) => BLOCKING_IMPACTS.has(v.impact)),
      violations,
      passes: report?.reduce((n, page) => n + (page.passes?.length ?? 0), 0) ?? null,
    });
  }
  return results;
}

// --- run -------------------------------------------------------------------

const server = await startServer();
const browser = await chromium.launch();
let layout;
let cta;
let lh;
let ax;
try {
  layout = await measure(browser);
  cta = await followTheCta(browser);
  lh = await lighthouse();
  ax = await axe();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const checks = [];
const add = (name, passed, detail) => checks.push({ name, passed, detail });

for (const row of layout) {
  const { dom, route, viewport } = row;
  // Compared against the DEVICE width, never against the layout width the page
  // negotiated for itself. Measured first, and it matters: a page with no
  // <meta name="viewport"> is laid out at 980px inside a 375px phone, so
  // `scrollWidth <= layoutWidth` is true of the 980px canvas and the check
  // passes while the user is looking at a document 2.6x wider than the screen.
  // That version of this line went green on /pricing/ and /faq/ in the
  // before-fix receipt; it was a check that could not fail.
  add(
    `${route} @ ${viewport.name}: no horizontal overflow past the ${viewport.width}px device width`,
    dom.scrollWidth <= viewport.width + 1 && dom.overflowing.length === 0,
    `scrollWidth=${dom.scrollWidth} deviceWidth=${viewport.width} layoutWidth=${dom.layoutWidth} overflowing=[${dom.overflowing.join(", ")}]`,
  );
  if (viewport.isMobile) {
    add(
      `${route} @ ${viewport.name}: laid out at device width, not the 980px fallback`,
      dom.layoutWidth === viewport.width,
      `layoutWidth=${dom.layoutWidth} deviceWidth=${viewport.width} meta=${dom.viewportMeta ?? "MISSING"}`,
    );
  }
  const reached = row.tabStops.filter((s) => s.tag === "a").length;
  const ringed = row.tabStops.filter((s) => s.tag === "a" && s.outline !== "none" && !s.outline.startsWith("none"));
  add(
    `${route} @ ${viewport.name}: every link is a tab stop with a visible focus ring`,
    reached === dom.links.length && ringed.length === reached,
    `links=${dom.links.length} tabReached=${reached} withRing=${ringed.length} rings=[${[...new Set(ringed.map((s) => s.outline))].join(" | ")}]`,
  );
}

// Gated: the private-route guard must actually fire in a browser, because the
// static auditor only greps the file for the string. NOT gated: whether the
// page looks any different afterwards. That is a real observation and it is
// reported below, but a fixture whose CTA exists to demonstrate a meta-tag flip
// is not a product whose CTA is broken, and encoding that judgement as a
// threshold here would put the review's conclusion inside the instrument.
add(
  "/?create=1: private-route noindex guard fires in a real browser",
  cta.robotsChanged && /noindex/i.test(cta.after.robots ?? ""),
  `before=${cta.before.robots} after=${cta.after.robots} visibleTextChanged=${cta.textChanged}`,
);

for (const r of lh) {
  const label = `${r.route} @ ${r.formFactor}`;
  for (const [category, score] of Object.entries(r.categories)) {
    add(`${label}: lighthouse ${category} >= ${BUDGET.category}`, score !== null && score >= BUDGET.category, `score=${score}`);
  }
  add(`${label}: LCP <= ${BUDGET.lcpMs}ms`, r.lcpMs !== null && r.lcpMs <= BUDGET.lcpMs, `lcp=${r.lcpMs === null ? "n/a" : Math.round(r.lcpMs) + "ms"}`);
  add(`${label}: CLS <= ${BUDGET.cls}`, r.cls !== null && r.cls <= BUDGET.cls, `cls=${r.cls}`);
  add(`${label}: no failing lighthouse audit`, r.failing.length === 0, r.failing.join(", ") || "none");
}

for (const r of ax) {
  add(`${r.route}: axe reports no serious/critical violation`, r.total !== null && r.blocking.length === 0, `violations=${r.total} blocking=[${r.blocking.map((v) => `${v.id}/${v.impact}`).join(", ")}]`);
}

const ok = checks.every((c) => c.passed);

const domTable = layout
  .map(
    (r) =>
      `| ${r.route} | ${r.viewport.name} | ${r.dom.scrollWidth} | ${r.dom.layoutWidth} | ${r.dom.visualWidth} | ${r.dom.viewportMeta ?? "**missing**"} | ${r.dom.links.length} | ${r.dom.links.map((l) => `${l.w}x${l.h}`).join(", ") || "-"} | ${r.dom.styleSheets} | ${r.dom.iconLink ?? "**none**"} | ${r.dom.colorSchemeMeta ?? "**none**"} | ${r.dom.themeColorMeta ?? "**none**"} |`,
  )
  .join("\n");

const md = `# Web-quality audit — bundled demo site

Generated: ${new Date().toISOString()}
Producer: \`npm run verify:web-quality\` → \`scripts/verify-web-quality.mjs\` (node ${process.version})
Under test: \`examples/site\` served on \`${BASE_URL}\`, routes resolved the way \`src/audit-static.ts\` resolves them
Instruments: Playwright chromium (bundled devDependency), \`${LIGHTHOUSE}\`, \`${AXE}\`

> This is a measurement, not a review. Rows 7 and 8 of the scorecard are
> different questions and this file only answers 8: it is what the instruments
> reported. The Web Interface Guidelines review is a human pass and lives in
> \`web-interface-guidelines-review.md\`; it cites the DOM table below for its
> findings but a category score is not a substitute for it.

Overall: **${ok ? "pass" : "FAIL"}** — ${checks.filter((c) => c.passed).length}/${checks.length} checks

## Checks

| Check | Result | Measured |
|---|---|---|
${checks.map((c) => `| ${c.name} | ${c.passed ? "pass" : "**FAIL**"} | ${c.detail} |`).join("\n")}

## DOM measurements

Layout width is \`document.documentElement.clientWidth\` — the width the page
actually laid itself out at, which is NOT necessarily the device width. A page
with no \`<meta name="viewport">\` is laid out at 980px and scaled down to fit,
so on a 375px phone it reports layout width 980: it renders on a phone by
accident rather than on purpose, and every measurement taken against its own
980px canvas will look fine. Compare the layout column to the device width in
the viewport column, not to the scrollWidth next to it.

| Route | Viewport (device px) | scrollWidth | layout w | visual w | viewport meta | links | link hit boxes | stylesheets | icon | color-scheme | theme-color |
|---|---|---:|---:|---:|---|---:|---|---:|---|---|---|
${domTable}

## Element census

Why the review marks whole guideline sections "not applicable". A section
skipped because the page has no such element should be a measured skip, not a
gap the reviewer did not notice.

| Route | Viewport | form controls | images/media | ARIA attrs | scripts | scrolls? |
|---|---|---:|---:|---:|---:|---|
${layout.map((r) => `| ${r.route} | ${r.viewport.name} | ${r.dom.inventory.formControls} | ${r.dom.inventory.images} | ${r.dom.inventory.aria} | ${r.dom.inventory.scripts} | ${r.dom.inventory.scrolls ? "yes" : "no"} |`).join("\n")}

## Following the call-to-action

\`/\` → click "Create a room" → \`${cta.after.url}\`. Capture:
\`promotion/evidence/example-site-create-state.png\`.

| | Before | After |
|---|---|---|
| \`meta[name=robots]\` | \`${cta.before.robots}\` | \`${cta.after.robots}\` |
| visible text | ${cta.before.visibleText.length} chars | ${cta.after.visibleText.length} chars${cta.textChanged ? "" : ", **byte-identical**"} |

The robots flip is the behaviour \`src/audit-static.ts\` checks statically,
confirmed here dynamically. The visible-text row is the other half and it is
reported, not scored: what it means for a page whose CTA exists to demonstrate
a meta-tag flip is a judgement, and judgements live in the review.

## Keyboard

${layout
  .filter((r) => r.viewport.name === "desktop-1280")
  .map(
    (r) =>
      `**${r.route}** — ${r.dom.links.length} link(s).\n\n${r.tabStops
        .map((s, i) => `${i + 1}. \`${s.tag}\` ${s.text ? `“${s.text}”` : "(focus left the document)"} — outline \`${s.outline}\`${s.focusVisible ? ", :focus-visible" : ""}`)
        .join("\n")}`,
  )
  .join("\n\n")}

## Lighthouse

| Route | Form factor | Perf | A11y | Best practices | SEO | LCP | CLS | Report |
|---|---|---:|---:|---:|---:|---:|---:|---|
${lh
  .map(
    (r) =>
      `| ${r.route} | ${r.formFactor} | ${r.categories.performance ?? "-"} | ${r.categories.accessibility ?? "-"} | ${r.categories["best-practices"] ?? "-"} | ${r.categories.seo ?? "-"} | ${r.lcpMs === null ? "-" : Math.round(r.lcpMs) + "ms"} | ${r.cls ?? "-"} | [\`${r.file}\`](${path.relative(path.dirname(RECEIPT), path.join(ROOT, r.file)).replace(/\\/g, "/")}) |`,
  )
  .join("\n")}

Failing audits, by run — every audit that did not score 1, including
zero-weight ones the category score hides:

${lh.map((r) => `- \`${r.route}\` ${r.formFactor}: ${r.failing.length ? r.failing.join(", ") : "none"}`).join("\n")}

## axe-core

| Route | Violations | Serious/critical | Passing rules | Report |
|---|---:|---|---:|---|
${ax
  .map(
    (r) =>
      `| ${r.route} | ${r.total ?? "n/a"} | ${r.blocking.length ? r.blocking.map((v) => `${v.id} (${v.impact})`).join(", ") : "none"} | ${r.passes ?? "n/a"} | [\`${r.file}\`](${path.relative(path.dirname(RECEIPT), path.join(ROOT, r.file)).replace(/\\/g, "/")}) |`,
  )
  .join("\n")}

${ax.some((r) => r.total) ? `### Violation detail\n\n${ax.flatMap((r) => r.violations.map((v) => `- \`${r.route}\` **${v.id}** (${v.impact}) — ${v.help}; ${v.nodes.length} node(s): ${v.nodes.map((n) => `\`${n.target.join(" ")}\``).join(", ")}`)).join("\n")}` : "No violations on any route, so there is no detail section — axe finds 20-50% of accessibility issues, which is why the keyboard walk above is recorded separately rather than folded into this number."}

## Captures

${layout
  .filter((r) => r.shot)
  .map((r) => `- \`${r.route}\` @ ${r.viewport.name} → \`promotion/evidence/${r.shot}\``)
  .join("\n")}
`;

await fs.mkdir(EVIDENCE, { recursive: true });
await fs.writeFile(RECEIPT, md);

for (const c of checks) console.log(`${c.passed ? "pass" : "FAIL"}  ${c.name} — ${c.detail}`);
console.log(`receipt: ${path.relative(ROOT, RECEIPT).replace(/\\/g, "/")}`);
process.exit(ok ? 0 : 1);
