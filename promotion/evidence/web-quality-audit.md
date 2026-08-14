# Web-quality audit — bundled demo site

Generated: 2026-08-14T02:34:03.804Z
Producer: `npm run verify:web-quality` → `scripts/verify-web-quality.mjs` (node v22.22.2)
Under test: `examples/site` served on `http://127.0.0.1:4914`, routes resolved the way `src/audit-static.ts` resolves them
Instruments: Playwright chromium (bundled devDependency), `lighthouse@13.4.1`, `@axe-core/cli@4.13.0`

> This is a measurement, not a review. Rows 7 and 8 of the scorecard are
> different questions and this file only answers 8: it is what the instruments
> reported. The Web Interface Guidelines review is a human pass and lives in
> `web-interface-guidelines-review.md`; it cites the DOM table below for its
> findings but a category score is not a substitute for it.

Overall: **pass** — 67/67 checks

## Checks

| Check | Result | Measured |
|---|---|---|
| / @ mobile-375: no horizontal overflow past the 375px device width | pass | scrollWidth=375 deviceWidth=375 layoutWidth=375 overflowing=[] |
| / @ mobile-375: laid out at device width, not the 980px fallback | pass | layoutWidth=375 deviceWidth=375 meta=width=device-width, initial-scale=1 |
| / @ mobile-375: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(229, 151, 0)] |
| /pricing/ @ mobile-375: no horizontal overflow past the 375px device width | pass | scrollWidth=375 deviceWidth=375 layoutWidth=375 overflowing=[] |
| /pricing/ @ mobile-375: laid out at device width, not the 980px fallback | pass | layoutWidth=375 deviceWidth=375 meta=width=device-width, initial-scale=1 |
| /pricing/ @ mobile-375: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(229, 151, 0)] |
| /faq/ @ mobile-375: no horizontal overflow past the 375px device width | pass | scrollWidth=375 deviceWidth=375 layoutWidth=375 overflowing=[] |
| /faq/ @ mobile-375: laid out at device width, not the 980px fallback | pass | layoutWidth=375 deviceWidth=375 meta=width=device-width, initial-scale=1 |
| /faq/ @ mobile-375: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(229, 151, 0)] |
| / @ desktop-1280: no horizontal overflow past the 1280px device width | pass | scrollWidth=1280 deviceWidth=1280 layoutWidth=1280 overflowing=[] |
| / @ desktop-1280: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(16, 16, 16)] |
| /pricing/ @ desktop-1280: no horizontal overflow past the 1280px device width | pass | scrollWidth=1280 deviceWidth=1280 layoutWidth=1280 overflowing=[] |
| /pricing/ @ desktop-1280: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(16, 16, 16)] |
| /faq/ @ desktop-1280: no horizontal overflow past the 1280px device width | pass | scrollWidth=1280 deviceWidth=1280 layoutWidth=1280 overflowing=[] |
| /faq/ @ desktop-1280: every link is a tab stop with a visible focus ring | pass | links=1 tabReached=1 withRing=1 rings=[auto 1px rgb(16, 16, 16)] |
| /?create=1: private-route noindex guard fires in a real browser | pass | before=index,follow after=noindex,nofollow visibleTextChanged=false |
| / @ mobile: lighthouse performance >= 0.9 | pass | score=1 |
| / @ mobile: lighthouse accessibility >= 0.9 | pass | score=1 |
| / @ mobile: lighthouse best-practices >= 0.9 | pass | score=1 |
| / @ mobile: lighthouse seo >= 0.9 | pass | score=1 |
| / @ mobile: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| / @ mobile: LCP <= 2500ms | pass | lcp=625ms |
| / @ mobile: CLS <= 0.1 | pass | cls=0 |
| / @ mobile: no failing lighthouse audit | pass | none |
| / @ desktop: lighthouse performance >= 0.9 | pass | score=1 |
| / @ desktop: lighthouse accessibility >= 0.9 | pass | score=1 |
| / @ desktop: lighthouse best-practices >= 0.9 | pass | score=1 |
| / @ desktop: lighthouse seo >= 0.9 | pass | score=1 |
| / @ desktop: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| / @ desktop: LCP <= 2500ms | pass | lcp=169ms |
| / @ desktop: CLS <= 0.1 | pass | cls=0 |
| / @ desktop: no failing lighthouse audit | pass | none |
| /pricing/ @ mobile: lighthouse performance >= 0.9 | pass | score=1 |
| /pricing/ @ mobile: lighthouse accessibility >= 0.9 | pass | score=1 |
| /pricing/ @ mobile: lighthouse best-practices >= 0.9 | pass | score=1 |
| /pricing/ @ mobile: lighthouse seo >= 0.9 | pass | score=1 |
| /pricing/ @ mobile: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| /pricing/ @ mobile: LCP <= 2500ms | pass | lcp=631ms |
| /pricing/ @ mobile: CLS <= 0.1 | pass | cls=0 |
| /pricing/ @ mobile: no failing lighthouse audit | pass | none |
| /pricing/ @ desktop: lighthouse performance >= 0.9 | pass | score=1 |
| /pricing/ @ desktop: lighthouse accessibility >= 0.9 | pass | score=1 |
| /pricing/ @ desktop: lighthouse best-practices >= 0.9 | pass | score=1 |
| /pricing/ @ desktop: lighthouse seo >= 0.9 | pass | score=1 |
| /pricing/ @ desktop: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| /pricing/ @ desktop: LCP <= 2500ms | pass | lcp=167ms |
| /pricing/ @ desktop: CLS <= 0.1 | pass | cls=0 |
| /pricing/ @ desktop: no failing lighthouse audit | pass | none |
| /faq/ @ mobile: lighthouse performance >= 0.9 | pass | score=1 |
| /faq/ @ mobile: lighthouse accessibility >= 0.9 | pass | score=1 |
| /faq/ @ mobile: lighthouse best-practices >= 0.9 | pass | score=1 |
| /faq/ @ mobile: lighthouse seo >= 0.9 | pass | score=1 |
| /faq/ @ mobile: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| /faq/ @ mobile: LCP <= 2500ms | pass | lcp=624ms |
| /faq/ @ mobile: CLS <= 0.1 | pass | cls=0 |
| /faq/ @ mobile: no failing lighthouse audit | pass | none |
| /faq/ @ desktop: lighthouse performance >= 0.9 | pass | score=1 |
| /faq/ @ desktop: lighthouse accessibility >= 0.9 | pass | score=1 |
| /faq/ @ desktop: lighthouse best-practices >= 0.9 | pass | score=1 |
| /faq/ @ desktop: lighthouse seo >= 0.9 | pass | score=1 |
| /faq/ @ desktop: lighthouse agentic-browsing >= 0.9 | pass | score=1 |
| /faq/ @ desktop: LCP <= 2500ms | pass | lcp=169ms |
| /faq/ @ desktop: CLS <= 0.1 | pass | cls=0 |
| /faq/ @ desktop: no failing lighthouse audit | pass | none |
| /: axe reports no serious/critical violation | pass | violations=0 blocking=[] |
| /pricing/: axe reports no serious/critical violation | pass | violations=0 blocking=[] |
| /faq/: axe reports no serious/critical violation | pass | violations=0 blocking=[] |

## DOM measurements

Layout width is `document.documentElement.clientWidth` — the width the page
actually laid itself out at, which is NOT necessarily the device width. A page
with no `<meta name="viewport">` is laid out at 980px and scaled down to fit,
so on a 375px phone it reports layout width 980: it renders on a phone by
accident rather than on purpose, and every measurement taken against its own
980px canvas will look fine. Compare the layout column to the device width in
the viewport column, not to the scrollWidth next to it.

| Route | Viewport (device px) | scrollWidth | layout w | visual w | viewport meta | links | link hit boxes | stylesheets | icon | color-scheme | theme-color |
|---|---|---:|---:|---:|---|---:|---|---:|---|---|---|
| / | mobile-375 | 375 | 375 | 375 | width=device-width, initial-scale=1 | 1 | 91x17 | 0 | data:, | **none** | **none** |
| /pricing/ | mobile-375 | 375 | 375 | 375 | width=device-width, initial-scale=1 | 1 | 189x17 | 0 | data:, | **none** | **none** |
| /faq/ | mobile-375 | 375 | 375 | 375 | width=device-width, initial-scale=1 | 1 | 189x17 | 0 | data:, | **none** | **none** |
| / | desktop-1280 | 1280 | 1280 | 1280 | width=device-width, initial-scale=1 | 1 | 91x17 | 0 | data:, | **none** | **none** |
| /pricing/ | desktop-1280 | 1280 | 1280 | 1280 | width=device-width, initial-scale=1 | 1 | 189x17 | 0 | data:, | **none** | **none** |
| /faq/ | desktop-1280 | 1280 | 1280 | 1280 | width=device-width, initial-scale=1 | 1 | 189x17 | 0 | data:, | **none** | **none** |

## Element census

Why the review marks whole guideline sections "not applicable". A section
skipped because the page has no such element should be a measured skip, not a
gap the reviewer did not notice.

| Route | Viewport | form controls | images/media | ARIA attrs | scripts | scrolls? |
|---|---|---:|---:|---:|---:|---|
| / | mobile-375 | 0 | 0 | 0 | 1 | no |
| /pricing/ | mobile-375 | 0 | 0 | 0 | 0 | no |
| /faq/ | mobile-375 | 0 | 0 | 0 | 0 | no |
| / | desktop-1280 | 0 | 0 | 0 | 1 | no |
| /pricing/ | desktop-1280 | 0 | 0 | 0 | 0 | no |
| /faq/ | desktop-1280 | 0 | 0 | 0 | 0 | no |

## Following the call-to-action

`/` → click "Create a room" → `http://127.0.0.1:4914/?create=1`. Capture:
`promotion/evidence/example-site-create-state.png`.

| | Before | After |
|---|---|---|
| `meta[name=robots]` | `index,follow` | `noindex,nofollow` |
| visible text | 72 chars | 72 chars, **byte-identical** |

The robots flip is the behaviour `src/audit-static.ts` checks statically,
confirmed here dynamically. The visible-text row is the other half and it is
reported, not scored: what it means for a page whose CTA exists to demonstrate
a meta-tag flip is a judgement, and judgements live in the review.

## Keyboard

**/** — 1 link(s).

1. `a` “Create a room” — outline `auto 1px rgb(16, 16, 16)`, :focus-visible
2. `body` (focus left the document) — outline `none`

**/pricing/** — 1 link(s).

1. `a` “Back to ExampleRoom home” — outline `auto 1px rgb(16, 16, 16)`, :focus-visible
2. `body` (focus left the document) — outline `none`

**/faq/** — 1 link(s).

1. `a` “Back to ExampleRoom home” — outline `auto 1px rgb(16, 16, 16)`, :focus-visible
2. `body` (focus left the document) — outline `none`

## Lighthouse

| Route | Form factor | Perf | A11y | Best practices | SEO | LCP | CLS | Report |
|---|---|---:|---:|---:|---:|---:|---:|---|
| / | mobile | 1 | 1 | 1 | 1 | 625ms | 0 | [`promotion/evidence/lighthouse/root-mobile.json`](lighthouse/root-mobile.json) |
| / | desktop | 1 | 1 | 1 | 1 | 169ms | 0 | [`promotion/evidence/lighthouse/root-desktop.json`](lighthouse/root-desktop.json) |
| /pricing/ | mobile | 1 | 1 | 1 | 1 | 631ms | 0 | [`promotion/evidence/lighthouse/pricing-mobile.json`](lighthouse/pricing-mobile.json) |
| /pricing/ | desktop | 1 | 1 | 1 | 1 | 167ms | 0 | [`promotion/evidence/lighthouse/pricing-desktop.json`](lighthouse/pricing-desktop.json) |
| /faq/ | mobile | 1 | 1 | 1 | 1 | 624ms | 0 | [`promotion/evidence/lighthouse/faq-mobile.json`](lighthouse/faq-mobile.json) |
| /faq/ | desktop | 1 | 1 | 1 | 1 | 169ms | 0 | [`promotion/evidence/lighthouse/faq-desktop.json`](lighthouse/faq-desktop.json) |

Failing audits, by run — every audit that did not score 1, including
zero-weight ones the category score hides:

- `/` mobile: none
- `/` desktop: none
- `/pricing/` mobile: none
- `/pricing/` desktop: none
- `/faq/` mobile: none
- `/faq/` desktop: none

## axe-core

| Route | Violations | Serious/critical | Passing rules | Report |
|---|---:|---|---:|---|
| / | 0 | none | 17 | [`promotion/evidence/axe/root.json`](axe/root.json) |
| /pricing/ | 0 | none | 17 | [`promotion/evidence/axe/pricing.json`](axe/pricing.json) |
| /faq/ | 0 | none | 17 | [`promotion/evidence/axe/faq.json`](axe/faq.json) |

No violations on any route, so there is no detail section — axe finds 20-50% of accessibility issues, which is why the keyboard walk above is recorded separately rather than folded into this number.

## Captures

- `/` @ mobile-375 → `promotion/evidence/example-site-mobile-375.png`
- `/pricing/` @ mobile-375 → `promotion/evidence/example-site-pricing-mobile-375.png`
- `/` @ desktop-1280 → `promotion/evidence/example-site-desktop-1280.png`
