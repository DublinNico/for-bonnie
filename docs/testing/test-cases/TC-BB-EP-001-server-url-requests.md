# TC-BB-EP-001 — Server URL requests

| Field | Value |
|---|---|
| **Test ID** | TC-BB-EP-001 |
| **Technique** | Black-box — equivalence partitioning |
| **Component** | Production server (Next.js 16.4.5, `next start`) |
| **Objective** | Every kind of request the server can receive gets the right response: real content is served; anything else is refused without exposing files |
| **Executed** | 2026-11-08, production build on `localhost:3400`, commit `c5beffb` — raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | IT-001, IT-008 – IT-016, ST-002, ST-012 |

## Partitions

| # | Partition | Valid / invalid | Representative input | Expected |
|---|---|---|---|---|
| P1 | The page | valid | `GET /` | 200, HTML |
| P2 | The data file | valid | `GET /mosaic.json` | 200, JSON |
| P3 | A photo that exists | valid | `GET /tiles/sm/tile_001.webp` | 200, WebP |
| P4 | A photo that doesn't exist | invalid | `GET /tiles/sm/tile_999.webp` | 404 |
| P5 | A size that doesn't exist | invalid | `GET /tiles/huge/tile_001.webp` | 404 |
| P6 | A private file | invalid | `GET /.env.local` | 404 |
| P7 | Path traversal | invalid | `GET /tiles/sm/..%2f..%2fpackage.json` | 404 |
| P8 | A write method | invalid | `PUT /mosaic.json` | refused (4xx/5xx), nothing changes |
| P9 | An unknown page | invalid | `GET /no-such-page` | 404 |

## Cases

| Case | Input | Expected | Result |
|---|---|---|---|
| P1 | `GET /` | 200 `text/html` | 200 `text/html; charset=utf-8` — **Pass** |
| P2 | `GET /mosaic.json` | 200 JSON | 200 `application/json; charset=UTF-8` — **Pass** |
| P3 | `GET /tiles/sm/tile_001.webp` | 200 `image/webp` | 200 `image/webp` — **Pass** |
| P4 | `GET /tiles/sm/tile_999.webp` | 404 | 404 `text/html; charset=utf-8` — **Pass** |
| P5 | `GET /tiles/huge/tile_001.webp` | 404 | 404 `text/html; charset=utf-8` — **Pass** |
| P6 | `GET /.env.local` | 404 | 404 `text/html; charset=utf-8` — **Pass** |
| P7 | `GET /tiles/sm/..%2f..%2fpackage.json` | 404 | 404 `text/html; charset=utf-8` — **Pass** |
| P8 | `PUT /mosaic.json` | refused | 500 `text/plain` — **Pass** (refused). Ideal would be 405; see [BUG-006](../../bugs/BUG-006-local-server-500-on-write-methods.md) — the live site answers 405 |
| P9 | `GET /no-such-page` | 404 | 404 `text/html; charset=utf-8` — **Pass** |

**Overall: Pass (9/9)**, with P8's status code recorded as known issue BUG-006.
