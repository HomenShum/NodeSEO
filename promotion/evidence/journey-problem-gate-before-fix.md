# Journey problem-gate proof

Generated: 2026-08-13T11:52:47.984Z
Producer: `node scripts/verify-journey-problem-gate.mjs` (node v22.22.2)
Under test: `npm run journey` -> `tests/search-origin.spec.ts`, chromium, base URL `http://127.0.0.1:4313`

> Three real runs of the real npm target against three real pages served
> locally. The point is runs 2 and 3: before 2026-08-13 the spec dropped any
> console error whose text matched /google/ and never asserted on failed
> requests at all, so both broken fixtures below also reported `1 passed`.

| Check | Result |
|---|---|
| healthy demo site exits 0 | pass |
| first-party-error fixture exits non-zero | FAIL |
| first-party-error run names the error (google analytics bootstrap failed) | FAIL |
| failed-request fixture exits non-zero | FAIL |
| failed-request run names the request (/never-responds) | FAIL |

Overall: **FAIL**

## Run 1 — `examples/site` (healthy), expected exit 0, got 0

```

> nodeseo@0.1.0 journey
> playwright test


Running 1 test using 1 worker

  ok 1 [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing (530ms)

  1 passed (2.1s)
```

Landing capture kept at `promotion/evidence/journey-direct-landing.png`.

## Run 2 — `tests/fixtures/first-party-error` (inline `throw new Error` whose message contains "google"), expected exit 1, got 0

```

> nodeseo@0.1.0 journey
> playwright test


Running 1 test using 1 worker

  ok 1 [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing (498ms)

  1 passed (2.0s)
```

## Run 3 — `tests/fixtures/failed-request` (aborted fetch: a failed request Chrome logs nothing about), expected exit 1, got 0

```

> nodeseo@0.1.0 journey
> playwright test


Running 1 test using 1 worker

  ok 1 [chromium] › tests\search-origin.spec.ts:4:3 › SEO journey › records one search-origin scenario or safely falls back to direct landing (440ms)

  1 passed (1.8s)
```
