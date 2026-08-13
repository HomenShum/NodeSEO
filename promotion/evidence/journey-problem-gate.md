# Journey problem-gate proof

Generated: 2026-08-13T21:10:08.518Z
Producer: `node scripts/verify-journey-problem-gate.mjs` (node v22.22.2)
Under test: `npm run journey` -> `tests/search-origin.spec.ts`, chromium, base URL `http://127.0.0.1:4614`

> Four real runs of the real npm target against four real pages served
> locally. The point is runs 2, 3 and 4: the spec used to drop any console
> error whose text matched /google/ (fixed 2026-08-13, iteration 1), never
> assert on failed requests at all (same fix), and drop any console error whose
> text matched /favicon|fonts\.googleapis\.com|ResizeObserver loop/ (a second
> text filter three lines below the first, fixed in iteration 2). Each broken
> fixture below reported `1 passed` under the filter that covered it.

| Check | Result |
|---|---|
| healthy demo site exits 0 | pass |
| first-party-error fixture exits non-zero | pass |
| first-party-error run names the error (google analytics bootstrap failed) | pass |
| failed-request fixture exits non-zero | pass |
| failed-request run names the request (/never-responds) | pass |
| first-party-console-error fixture exits non-zero | pass |
| first-party-console-error run names the error (favicon pipeline exploded) | pass |

Overall: **pass**

## Run 1 — `examples/site` (healthy), expected exit 0, got 0

```

Running 1 test using 1 worker

  ok 1 [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing (1.0s)

  1 passed (2.4s)
```

Landing capture kept at `promotion/evidence/journey-direct-landing.png`.

## Run 2 — `tests/fixtures/first-party-error` (inline `throw new Error` whose message contains "google"), expected exit 1, got 1

```
  1) [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing 

    Error: google analytics bootstrap failed on this page

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

      Object {
    -   "errors": Array [],
    +   "errors": Array [
    +     "google analytics bootstrap failed on this page",
    +   ],
        "failedRequests": Array [],
      }

      31 |     // Both channels, or neither is a check: `failedRequests` was collected and
      32 |     // never asserted on, so a page whose requests all failed still passed.
    > 33 |     expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
         |                                                 ^
      34 |   });
      35 | });
      36 |
        at C:\Users\hshum\AppData\Local\Temp\claude\D--VSCode-Projects-cheiron-ai-take-home\440ef9e9-83bb-4fe6-8676-4fdaaf332f3e\scratchpad\wave3b\NodeSEO\tests\search-origin.spec.ts:33:49
```

## Run 3 — `tests/fixtures/failed-request` (aborted fetch: a failed request Chrome logs nothing about), expected exit 1, got 1

```
  1) [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing 

    Error: GET http://127.0.0.1:4614/never-responds: net::ERR_ABORTED

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

      Object {
        "errors": Array [],
    -   "failedRequests": Array [],
    +   "failedRequests": Array [
    +     "GET http://127.0.0.1:4614/never-responds: net::ERR_ABORTED",
    +   ],
      }

      31 |     // Both channels, or neither is a check: `failedRequests` was collected and
      32 |     // never asserted on, so a page whose requests all failed still passed.
    > 33 |     expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
         |                                                 ^
      34 |   });
      35 | });
      36 |
        at C:\Users\hshum\AppData\Local\Temp\claude\D--VSCode-Projects-cheiron-ai-take-home\440ef9e9-83bb-4fe6-8676-4fdaaf332f3e\scratchpad\wave3b\NodeSEO\tests\search-origin.spec.ts:33:49
```

## Run 4 — `tests/fixtures/first-party-console-error` (inline `console.error` whose message contains "favicon"), expected exit 1, got 1

```
  1) [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing 

    Error: favicon pipeline exploded while rendering the page

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

      Object {
    -   "errors": Array [],
    +   "errors": Array [
    +     "favicon pipeline exploded while rendering the page",
    +   ],
        "failedRequests": Array [],
      }

      31 |     // Both channels, or neither is a check: `failedRequests` was collected and
      32 |     // never asserted on, so a page whose requests all failed still passed.
    > 33 |     expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
         |                                                 ^
      34 |   });
      35 | });
      36 |
        at C:\Users\hshum\AppData\Local\Temp\claude\D--VSCode-Projects-cheiron-ai-take-home\440ef9e9-83bb-4fe6-8676-4fdaaf332f3e\scratchpad\wave3b\NodeSEO\tests\search-origin.spec.ts:33:49
```
