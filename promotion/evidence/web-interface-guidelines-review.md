# Web Interface Guidelines review — bundled demo site

Reviewed: 2026-08-14 · Reviewer: promotion-loop agent (iteration 4)
Checklist source: **https://vercel.com/design/guidelines**, fetched 2026-08-14 and
reachable — every section below is named as that page names it.
Surface reviewed: `examples/site`, served on `http://127.0.0.1:4914`, in headless
chromium, at 375x812 (mobile emulation) and 1280x800, plus the `/?create=1`
state reached by clicking the site's only call-to-action.

## What this file is, and what it is not

This is a **review**: a person walking a checklist against a rendered page and
writing down what they saw. It is not a Lighthouse score and a Lighthouse score
cannot stand in for it. The two measure different things and the difference is
easy to demonstrate on this very surface: before this iteration, `/pricing/`
scored **accessibility 1.0, best-practices 0.96, SEO 1.0, performance 1.0** on
mobile while being laid out 980 CSS pixels wide inside a 375-pixel phone. Every
category was at or near full marks and the page was still wrong under
*Layout → Responsive coverage*. The score did not know, because it was not the
question.

What is machine-produced here is the **evidence**, not the verdicts. Every
number quoted below comes from `promotion/evidence/web-quality-audit.md` (and
its before-fix twin), both emitted by `npm run verify:web-quality` →
`scripts/verify-web-quality.mjs`, so any finding can be regenerated rather than
taken on trust.

## Findings

Severity is judged against what this surface claims to be. The gate variant is
`reduced`: `examples/site` is the demo surface of a CLI, a fixture whose job is
to be markup the auditor grades. That lowers the stakes of some findings and
lowers none of the facts.

### F1 — MAJOR, resolved — Layout → Responsive coverage

**`/pricing/` and `/faq/` had no `<meta name="viewport">`.** A page without it
is laid out at 980 CSS pixels and scaled down, so on a 375px phone the user gets
a shrunken desktop document rather than a page built for the device.

| | Before | After |
|---|---|---|
| `<meta name="viewport">` on `/pricing/`, `/faq/` | **missing** | `width=device-width, initial-scale=1` |
| `document.documentElement.clientWidth` @ 375px device | **980** | **375** |
| `document.documentElement.scrollWidth` @ 375px device | **981** | **375** |
| Lighthouse `viewport-insight`, mobile | **0.5** | 1 |

Evidence: `web-quality-audit-before-fix.md` (rows `/pricing/ @ mobile-375`,
`/faq/ @ mobile-375`, both FAIL) vs `web-quality-audit.md` (same rows, pass).
Capture after the fix: `example-site-pricing-mobile-375.png`.
Fixed in `examples/site/public/{pricing,faq}/index.html`.

This is also the finding that broke the first version of the check written to
catch it. That version asserted `scrollWidth <= clientWidth`, which is true of
the 980px canvas the page negotiated for itself, so it passed on both broken
pages. The committed check compares against the **device** width instead; see
the comment at `scripts/verify-web-quality.mjs` where the check is built.

### F2 — MAJOR, resolved — Content → No dead ends

**`/pricing/` and `/faq/` contained zero links.** Measured:
`document.querySelectorAll("a[href]").length === 0` on both, at both widths, in
the before-fix DOM table. Both routes are listed in `sitemap.xml`, so they are
entry points from search — and a visitor arriving on one had no path to the rest
of the site and no keyboard-focusable element at all.

Fixed with one in-content link back to `/` on each. After: 1 link per route,
reached by the first `Tab` press, focus ring `outline: auto 1px` and
`:focus-visible` true (see the Keyboard section of `web-quality-audit.md`).
This also makes *Interactions → Keyboard works everywhere* non-vacuous on those
two routes, where previously there was nothing to tab to.

### F3 — MINOR, resolved — Content → All states designed

**Chrome's automatic `/favicon.ico` request 404'd on every route**, logging
`Failed to load resource: the server responded with a status of 404` to the
console and failing Lighthouse `errors-in-console` (best-practices 0.96 → 1.00
after the fix). Worth recording precisely because the repo's own journey gate
does **not** see it: `tests/search-origin.spec.ts` drives a chromium that never
requests a favicon, so it reports zero console errors on the same page where
Lighthouse's chromium reports one. Two browsers, two answers, and the stricter
one was not the one the repo was asking. Fixed with `<link rel="icon" href="data:," />`
on all three pages.

### F4 — MINOR, open — Interactions → Design forgiving interactions

**Link hit boxes are 17 CSS pixels tall** (`91x17` on `/`, `189x17` on
`/pricing/` and `/faq/`), below the 24px minimum in WCAG 2.2 SC 2.5.8. It is
**not a violation** here and the reason is worth stating rather than assuming:
the spacing exception applies, because each page has exactly one target and no
other target lies within a 24px circle centred on it. It is still a small thing
to hit on a phone. Unresolved on purpose — the fix is CSS, and this fixture
carries zero stylesheets (`document.styleSheets.length === 0`, measured on all
six route/viewport combinations) so that the static auditor grades markup rather
than a theme. Logged as **D5**.

### F5 — MINOR, open — Design → Set the appropriate `color-scheme`

**No `<meta name="color-scheme">`, no `<meta name="theme-color">`, and no CSS
`color-scheme` property** on any route (`colorScheme: none` in the DOM table).
The pages are light-only: a reader in a dark environment gets a full-white page
and browser UI that does not match it. Same reason as F4 for leaving it —
declaring a colour scheme is a styling decision this fixture deliberately does
not make. Logged as **D6**.

### F6 — MINOR, open — Content → No dead ends (second-order)

**The site's only call-to-action produces no visible change.** Clicking
"Create a room" navigates `/` → `/?create=1`, and the rendered body text is
**byte-identical** before and after; the only difference in the whole document
is `<meta name="robots">` flipping `index,follow` → `noindex,nofollow`.
Measured in the "Following the call-to-action" section of
`web-quality-audit.md`. The captures make the point better than the text
comparison does: `example-site-create-state.png` and
`example-site-desktop-1280.png` are the **same image**, SHA-256
`529b2311…c17e0c` for both, so the page after the click is pixel-for-pixel the
page before it.

For a product this would be major — a primary CTA that appears to do nothing.
Here the link exists precisely to demonstrate the private-route noindex guard
that `src/audit-static.ts` checks statically, which this review confirms fires in
a real browser. Recorded as minor for that reason, and recorded rather than
waived, because "the fixture means to do that" is a judgement a later reader
should be able to disagree with. Logged as **D7**.

## The checklist, section by section

Verdicts: **pass** (observed to hold), **finding** (see above), **n/a** (the
surface has no such element — stated rather than silently skipped, because a
checklist with invisible omissions is not a checklist).

### Interactions

| Guideline | Verdict | Observed |
|---|---|---|
| Keyboard works everywhere | pass | Every link on every route is reached by `Tab`; one press past the last link moves focus out of the document. 1 link × 3 routes after F2. |
| Clear focus | pass | `outline: auto 1px` with `:focus-visible` true on each link, both widths. |
| Match visual & hit targets | pass | Inline `<a>`: the hit box is the text box. Sizes in F4. |
| Respect zoom | pass | `width=device-width, initial-scale=1` with no `maximum-scale` and no `user-scalable=no`. axe `meta-viewport` and `meta-viewport-large` both pass on all three routes. |
| Links are links | pass | The two navigations are `<a href>`, not click handlers. |
| URL as state / Deep-link everything | pass | `?create=1` is state in the URL and is honoured on direct load, not only on click. |
| Design forgiving interactions | finding | F4. |
| Loading buttons, optimistic updates, confirm destructive actions, tooltips, drag, scroll restoration, double-tap zoom, tap highlight, overscroll, async announcements, shortcuts | n/a | Element census: **0 form controls** (`form, input, textarea, select, button`) on every route, so there is no button to put in a loading state and no destructive action to confirm; **`scrolls? no`** on all six route/viewport combinations, so scroll restoration and overscroll have no subject. No async work, no tooltip, no drag, no custom shortcut. |

### Animations

| Guideline | Verdict | Observed |
|---|---|---|
| Honor `prefers-reduced-motion` | pass, vacuously | `document.styleSheets.length === 0` on all six route/viewport combinations and the one inline script sets an attribute; there is no transition, animation or scroll effect to honour or to suppress. Stated as vacuous on purpose — it is a property of an empty set, not a compliance decision. |
| Everything else in this section | n/a | Same reason. |

### Layout

| Guideline | Verdict | Observed |
|---|---|---|
| Responsive coverage | finding, resolved | F1. Now 375 and 1280 both lay out at the device width. |
| No excessive scrollbars | pass | `scrollWidth === deviceWidth` on all six combinations; no element's right edge passes the layout viewport. |
| Let the browser size things | pass | No width is set anywhere: there is no CSS. Text reflows at both widths (captures). |
| Optical alignment, deliberate alignment, contrast in lockups, safe areas | n/a | No lockups, no icons beside text, nothing fixed or full-bleed, so no notch/safe-area interaction. |

### Content

| Guideline | Verdict | Observed |
|---|---|---|
| Accurate page titles | pass | Three distinct, descriptive `<title>`s; axe `document-title` passes on all routes. |
| Headings & skip link | pass | Exactly one `<h1>` per route, one top-level `<main>`; axe `page-has-heading-one`, `heading-order`, `landmark-one-main`, `landmark-main-is-top-level` and `bypass` all pass. No repeated nav block exists, so a skip link would have nothing to skip. |
| Semantics before ARIA | pass | Element census: **0 `role`/`aria-*` attributes** on every route; `main`, `h1`, `p`, `a` carry the whole structure and axe's landmark and heading rules pass on it. |
| Accessible content / links are named | pass | axe `link-name` passes; both link texts read on their own out of context. |
| No dead ends | finding | F2 (resolved), F6 (open). |
| All states designed | finding | F3 (resolved). The CLI's own states are scorecard row 5 and are not this surface. |
| Locale-aware formats, prefer language over location | pass | `<html lang="en">` on all three; axe `html-has-lang` and `html-lang-valid` pass. No dates, numbers or currency appear. |
| Typographic quotes, ellipsis character, widows/orphans, non-breaking spaces, tabular numbers, icons have labels, don't ship the schema, resilient to UGC, shield from translation, anchored headings, stable skeletons, inline help, redundant status cues | n/a | The copy is three short sentences with no quotes, no ellipsis, no numerals, no units and no glued terms; there are no icons, no status, no skeletons, no user-generated content and no anchor-linked subheadings. |

### Forms

| Guideline | Verdict | Observed |
|---|---|---|
| Entire section | n/a | Element census: `document.querySelectorAll("form, input, textarea, select, button").length === **0**` on all three routes at both widths — no form control exists to label, type, autocomplete, spellcheck, validate or submit. |

### Performance

| Guideline | Verdict | Observed |
|---|---|---|
| Measure reliably | pass | Six Lighthouse runs, mobile and desktop, committed as JSON under `promotion/evidence/lighthouse/`. |
| No image-caused CLS | pass | CLS 0.000 on all six runs; element census reports **0 images/media** (`img, picture, svg, video, canvas`) on every route, so there is no unsized image that could cause it. |
| Network latency budgets | pass | LCP 626–647ms mobile, 169–175ms desktop, against a 2500ms budget. One request per page after F3 removed the favicon 404. |
| Preload/preconnect/fonts, large lists, re-renders, main-thread work | n/a | No third-party origin, no webfont, no list, no framework. Element census: **1 inline script on `/`**, 0 on the other two routes. |

### Design

| Guideline | Verdict | Observed |
|---|---|---|
| Minimum contrast | pass | axe `color-contrast` passes with measured ratios **21:1** for body text (`#000000` on `#ffffff`) and **9.39:1** for the link (`#0000ee` on `#ffffff`), both above the 4.5:1 AA threshold. |
| Set the appropriate `color-scheme` | finding | F5. |
| Browser UI matches your background | finding | F5 (no `theme-color`). |
| Interactions increase contrast | pass | The UA focus ring and visited/active colours are the browser's own defaults, which meet this by construction. |
| Layered shadows, crisp borders, nested radii, hue consistency, accessible charts, anti-aliasing, gradient banding | n/a | No shadow, border, radius, chart, transform or gradient exists — there is no CSS. |

### Copywriting

Vercel-specific house style; this is not a Vercel product and the section is not
scored. Recorded as read, not applied.

## Verdict

**No major unresolved finding.** Two majors were found (F1, F2), both fixed and
both re-measured by the committed producer on the fixed tree. Three minors
remain open by decision, not by omission — F4, F5 and F6, logged as D5, D6 and
D7 in `promotion/PROMOTION_LOG.md`, each because the fix would mean putting a
theme or a behaviour into a fixture whose purpose is to be unstyled markup the
static auditor grades.

Regenerate the evidence under every claim above with:

```bash
npm run verify:web-quality        # 67/67 on the fixed tree
git stash push -- examples/site && WEB_QUALITY_RECEIPT=web-quality-audit-before-fix.md \
  npm run verify:web-quality; git stash pop   # 57/67 on the pre-fix tree
```
