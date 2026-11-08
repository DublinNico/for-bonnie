# Testing checklist — Bonnie Photomosaic

Ticked items are done and their results recorded (last full run: 2026-11-08, commit `c5beffb`).
Details: [`testing/TestingReport.md`](testing/TestingReport.md) · raw results: [`testing/results/`](testing/results/).

## Setup
- [x] Python: pytest + pytest-cov (`requirements-dev.txt`)
- [x] Frontend: Vitest + React Testing Library + happy-dom
- [x] Integration / security: Vitest + Supertest against the production build (in-process)
- [x] End-to-end: Playwright — Desktop Chrome + 375 px phone, network guard instead of mocks
- [x] Load: Artillery 2.0.34 (`npm run test:perf`)

## Python — data pipeline (UT, 50 passed)
- [x] Colour averaging and distance — UT-001 – UT-005
- [x] Repeat penalty and cooldown, incl. boundaries — UT-006 – UT-010
- [x] Choosing the best photo, ties — UT-011 – UT-016
- [x] Grid size, grid building, rendering — UT-017 – UT-021
- [x] Layout export and its error — UT-022 – UT-023
- [x] Loading tile colours, `main()` — UT-024 – UT-025
- [x] Web images: file type, size, contents, missing file, `main()` — UT-026 – UT-033
- [x] Favicon: font check, no-font failure, drawing, `main()` — UT-034 – UT-041
- [x] Renaming photos safely — UT-042 – UT-044, UT-047
- [x] Real data and images in sync — UT-045 – UT-046
- [x] 100% statement and branch coverage of every Python function

## Frontend — unit and component (FT, 61 passed)
- [x] Helpers — FT-001 – FT-002
- [x] Explorer maths: zoom, clamping, pinch, tap → square, visible cells, image size, slider, mini-map — FT-003 – FT-019
- [x] Data loader — FT-020 – FT-025
- [x] Gallery — FT-026 – FT-032
- [x] Photo view (Lightbox) — FT-033 – FT-041
- [x] Mosaic explorer component — FT-042 – FT-053
- [x] App state (MosaicExperience) — FT-054 – FT-058
- [x] Static sections — FT-059 – FT-061
- [ ] `loadMosaic` fallback branch (photo name without a number) — automated test still to add (currently 4/5 branches; executed manually in TC-WB-004)

## Integration — HTTP (IT, 21 passed + 1 known issue)
- [x] Page, counts, images, icons, assets, no forms — IT-001 – IT-007
- [x] Data file and every photo at 3 sizes — IT-008 – IT-009
- [x] Bad requests and path traversal — IT-010 – IT-011
- [x] Private files, writes, POST — IT-012 – IT-014
- [x] Known issue documented: local 500 on write methods — IT-015 ([BUG-006](bugs/BUG-006-local-server-500-on-write-methods.md))
- [x] 404 page, no leaks — IT-016 – IT-017
- [x] CORS, caching, no X-Powered-By, security headers — IT-018 – IT-022

## Security (ST, 15 passed)
- [x] SQL / NoSQL / template injection; no reflected XSS — ST-001 – ST-004
- [x] No login / admin / API; no cookies; forged JWTs; burst — ST-005 – ST-008
- [x] Secrets never in browser files (incl. CI fake secrets); no source maps; no outside links; hidden files — ST-009 – ST-012
- [x] Hostile photo names rendered harmlessly / refused — ST-013 – ST-015
- [x] Dependency audits in CI (npm audit, pip-audit)

## End-to-end (ET, 28 runs passed, 10 skipped by design)
- [x] Page loads without errors — ET-001
- [x] Browsing: nav, 404, no forms — ET-002 – ET-004
- [x] Mosaic: zoom loads real photos, tap → photo, Ctrl + scroll, plain scroll, drag — ET-005 – ET-009
- [x] Gallery → photo view → keyboard → Esc; Show in mosaic; download — ET-010 – ET-012
- [x] Phone (375 px): no overflow, hero, explorer, touch-action, gallery columns, polaroids, photo view — ET-013 – ET-019
- [ ] Pinch-zoom and swipe on a **real** phone (manual)

## Load (4/4 passed)
- [x] Page load, 100 visitors / 10 s — p95 4 ms (< 500)
- [x] Gallery burst, 50 × 20 photos — p95 2 ms (< 500)
- [x] Soak, 5/s for 60 s — p95 3 ms (< 1000)
- [x] Bad traffic, 50 visitors — p95 2 ms (< 2000)
- [ ] Run against a preview deployment / on a schedule in CI

## Manual test cases (14 executed)
- [x] Equivalence partitioning — TC-BB-EP-001 – TC-BB-EP-004 (EP-002's "used once" partition not executable on real data; covered by FT-034)
- [x] Boundary values — TC-BB-BVA-001 – TC-BB-BVA-005
- [x] White-box — TC-WB-001 – TC-WB-005

## Bugs
- [x] BUG-001 hero title blocked the link — fixed, ET-005 – ET-009
- [x] BUG-002 rename could lose a photo — fixed, UT-044, UT-047
- [x] BUG-003 `main()` ignored settings — fixed, UT-025
- [x] BUG-004 missing security headers — fixed, IT-021, IT-022
- [x] BUG-005 Next.js critical advisories — fixed, CI audits
- [ ] BUG-006 local 500 on write methods — **accepted** (live site returns 405), IT-015
- [x] BUG-007 CI type check on a clean machine — fixed, CI frontend job

## CI
- [x] Backend, frontend and e2e jobs on every PR, with coverage reports and audits
- [x] Fake test-only secrets; least-privilege token
- [x] Dependabot (npm, GitHub Actions, pip)
- [ ] Confirm the favicon tests run (not skip) in CI after `c5beffb` is pushed
