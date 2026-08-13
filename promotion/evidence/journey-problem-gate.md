# Journey problem-gate proof

Generated: 2026-08-13T11:52:59.404Z
Producer: `node scripts/verify-journey-problem-gate.mjs` (node v22.22.2)
Under test: `npm run journey` -> `tests/search-origin.spec.ts`, chromium, base URL `http://127.0.0.1:4313`

> Three real runs of the real npm target against three real pages served
> locally. The point is runs 2 and 3: before 2026-08-13 the spec dropped any
> console error whose text matched /google/ and never asserted on failed
> requests at all, so both broken fixtures below also reported `1 passed`.

| Check | Result |
|---|---|
| healthy demo site exits 0 | pass |
| first-party-error fixture exits non-zero | pass |
| first-party-error run names the error (google analytics bootstrap failed) | pass |
| failed-request fixture exits non-zero | pass |
| failed-request run names the request (/never-responds) | pass |

Overall: **pass**

## Run 1 — `examples/site` (healthy), expected exit 0, got 0

```

> nodeseo@0.1.0 journey
> playwright test


Running 1 test using 1 worker

  ok 1 [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing (477ms)

  1 passed (1.9s)
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
        at C:\Users\hshum\AppData\Local\Temp\claude\D--VSCode-Projects-cheiron-ai-take-home\440ef9e9-83bb-4fe6-8676-4fdaaf332f3e\scratchpad\wave2\NodeSEO\tests\search-origin.spec.ts:33:49
```

## Run 3 — `tests/fixtures/failed-request` (aborted fetch: a failed request Chrome logs nothing about), expected exit 1, got 1

```
  1) [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing 

    Error: GET http://127.0.0.1:4313/never-responds: net::ERR_ABORTED

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

      Object {
        "errors": Array [],
    -   "failedRequests": Array [],
    +   "failedRequests": Array [
    +     "GET http://127.0.0.1:4313/never-responds: net::ERR_ABORTED",
    +   ],
      }

      31 |     // Both channels, or neither is a check: `failedRequests` was collected and
      32 |     // never asserted on, so a page whose requests all failed still passed.
    > 33 |     expect(problems, problemsSummary(problems)).toEqual({ errors: [], failedRequests: [] });
         |                                                 ^
      34 |   });
      35 | });
      36 |
        at C:\Users\hshum\AppData\Local\Temp\claude\D--VSCode-Projects-cheiron-ai-take-home\440ef9e9-83bb-4fe6-8676-4fdaaf332f3e\scratchpad\wave2\NodeSEO\tests\search-origin.spec.ts:33:49
```
