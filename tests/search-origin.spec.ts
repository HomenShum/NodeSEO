import { expect, test, type Page, type TestInfo } from "@playwright/test";

test.describe("SEO journey", () => {
  test("records one search-origin scenario or safely falls back to direct landing", async ({ page }, testInfo) => {
    const targetPhrase = process.env.SEO_TARGET_PHRASE ?? "Example collaborative AI workflow";
    const targetHost = process.env.SEO_TARGET_HOST ?? new URL(testInfo.project.use.baseURL ?? "https://example.com").host;
    const directPath = process.env.SEO_DIRECT_PATH ?? "/";
    const heading = process.env.SEO_PRIMARY_HEADING ?? "";
    const cta = process.env.SEO_PRIMARY_CTA_TEXT ?? "";
    const allowGoogle = process.env.SEO_ALLOW_LIVE_GOOGLE === "1";
    const problems = collectPageProblems(page);
    let foundTarget = false;

    if (allowGoogle) {
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(targetPhrase)}`, { waitUntil: "domcontentloaded" });
      await attachScreenshot(page, testInfo, "google-origin-search");
      const result = page.locator(`a[href*="${targetHost}"]`).first();
      foundTarget = await result.isVisible({ timeout: 5_000 }).catch(() => false);
      if (foundTarget) await result.click();
      else await page.goto(directPath, { waitUntil: "domcontentloaded" });
    } else {
      testInfo.annotations.push({ type: "seo-qa", description: "Google-origin step skipped; set SEO_ALLOW_LIVE_GOOGLE=1 for a one-query manual QA scenario." });
      await page.goto(directPath, { waitUntil: "domcontentloaded" });
    }

    if (heading) await expect(page.getByRole("heading", { name: new RegExp(escapeRegex(heading), "i") })).toBeVisible();
    else await expect(page.locator("h1").first()).toBeVisible();
    if (cta) await expect(page.getByText(new RegExp(escapeRegex(cta), "i")).first()).toBeVisible();
    await attachScreenshot(page, testInfo, foundTarget ? "google-origin-target-result" : "direct-landing");

    // Both channels, or neither is a check: `failedRequests` was collected and
    // never asserted on, so a page whose requests all failed still passed.
    expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
  });
});

function collectPageProblems(page: Page): { errors: string[]; failedRequests: string[] } {
  const errors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => {
    if (!isExternalSearchOrigin(page.url())) errors.push(error.message);
  });
  page.on("console", (message) => {
    // location().url is the resource the message came from — the failing
    // subresource for browser-generated messages, the script for console.error.
    const origin = message.location().url || page.url();
    if (message.type() === "error" && !isExternalSearchOrigin(origin)) errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (isExternalSearchOrigin(url)) return;
    failedRequests.push(`${request.method()} ${url}: ${request.failure()?.errorText ?? "unknown"}`);
  });
  return { errors, failedRequests };
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

function problemsSummary(problems: { errors: string[]; failedRequests: string[] }): string {
  return [...problems.errors, ...problems.failedRequests].join("\n");
}

/**
 * The only reason a problem is dropped as someone else's: it came from Google's
 * own search stack, which this spec drives through in the SEO_ALLOW_LIVE_GOOGLE
 * branch and does not own. This is the ONLY suppression in this file — there is
 * no second predicate, and nothing is decided by reading a message.
 *
 * Decided by the ORIGIN of the thing that failed, never by the words in the
 * message. Two predecessors tested text and both discarded first-party errors:
 * `isExternalGoogleNoise` matched the message against
 * /google|gstatic|consent|captcha|status of 429/, dropping a page's own
 * `Error("google analytics bootstrap failed")` (tests/fixtures/first-party-error);
 * `isIgnoredProblem` matched it against
 * /fonts\.googleapis\.com|fonts\.gstatic\.com|favicon|ResizeObserver loop/,
 * dropping the page's own `console.error("favicon pipeline exploded …")`
 * (tests/fixtures/first-party-console-error). Both are gone. Nothing replaced
 * the font hosts: `fonts.gstatic.com` still matches below as an origin, and
 * `fonts.googleapis.com` failing on the user's own page is the user's problem,
 * which this gate exists to report. `ResizeObserver loop` arrives on
 * `pageerror`, which never consulted the text filter anyway.
 *
 * Origin-based, this filter is inert on the default keyless run, which never
 * loads a Google URL at all.
 */
function isExternalSearchOrigin(url: string): boolean {
  try {
    return /(^|\.)(google\.[a-z.]+|gstatic\.com|googleusercontent\.com|recaptcha\.net)$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
