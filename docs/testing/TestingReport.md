# Testing Report — Bonnie Photomosaic

| | |
|---|---|
| **Project** | Bonnie Photomosaic — https://for-bonnie.vercel.app |
| **Repository** | `DublinNico/for-bonnie` |
| **Report date** | 2026-11-08 |
| **Code tested** | commit `c5beffb` (branch `add-perf-ci`, PR #8) — Next.js 16.4.5 |
| **Test run** | 2026-11-08, Windows 11 (ARM64), Node.js v24.19.0, Python 3.12.10 — see [`results/environment.txt`](results/environment.txt) |

Every figure in this report comes from the raw output saved in [`results/`](results/). Nothing is estimated.

---

## 1 Introduction

### 1.1 What the site does

The site is a memorial for Bonnie, a beloved dog who lived for eleven years. Its centrepiece is a **photomosaic**: a portrait of Bonnie rebuilt from 7,475 small squares (65 × 115), each filled with one of 325 photos of her, chosen by colour. Visitors can zoom from the whole portrait down to the individual photos, find out which photo any square is, browse every photo in a gallery, open each one full size, and see every place a photo appears in the mosaic.

### 1.2 Stack

| Layer | Technology |
|---|---|
| Data pipeline ("backend") | Python 3.12 + Pillow 13: `bonnie.py` (mosaic matching), `make_web_assets.py` (web images), `make_favicon.py`, `rename_tiles.py` |
| Data | `site/public/mosaic.json` (grid layout) + 975 WebP images (325 photos × 3 sizes). No database. |
| Frontend | Next.js 16.4.5 (App Router), React 19, TypeScript, plain CSS; the mosaic explorer draws on a `<canvas>` |
| Rendering | Fully static: the page is pre-rendered at build time. No server code runs per visit, no API, no login, no forms, no cookies, no outside services |
| Hosting / CI | Vercel (production + PR previews); GitHub Actions CI (3 jobs); Dependabot; CodeRabbit (AI review) |

### 1.3 Main user workflows

1. **Arrive** — see the portrait between "Bon | nie", follow *Explore the mosaic* or the nav links.
2. **Explore the mosaic** — zoom (buttons, slider, keyboard, Ctrl + scroll, pinch), drag to pan, use the mini-map, tap a square to see which photo it is.
3. **Browse the gallery** — sort by order / most used / least used, open a photo.
4. **View a photo** — full size, next / previous (buttons or arrow keys), close (Esc), download, see where it appears.
5. **Show in mosaic** — highlight every square that uses a photo, then clear it.
6. **Read the dedication.**

### 1.4 Testing objectives

1. Show that every user workflow works end to end, on desktop and on a 375 px phone.
2. Prove the mosaic logic (colour matching, repeat penalty, cooldown) is correct, including at its boundaries.
3. Prove the data the site depends on is complete and consistent with the images it points to.
4. Show the site cannot be made to crash, leak private files or secrets, or run injected script — and that it has no login, admin or API surface to attack.
5. Show the site stays fast under load.
6. Measure coverage and record honestly what is not tested.

---

## 2 Test Plan

### 2.1 Scope

**In scope**

- The Python data pipeline: `bonnie.py`, `make_web_assets.py`, `make_favicon.py`, `rename_tiles.py`
- The data files: `mosaic.json` and the web images
- Every frontend component and library module in `site/app/`
- The production server's HTTP behaviour (every URL it serves, bad requests, headers, CORS)
- Security of the built site (injection, XSS, secrets, access to private files)
- Real-browser user journeys on desktop (1280 × 720) and phone (375 × 667)
- Performance under load (local production build)

**Out of scope**

| Item | Why |
|---|---|
| Login, accounts, roles, JWTs, rate limiting | The site has none — tests instead prove no such surface exists (ST-005 to ST-008) |
| Database, API endpoints, forms, email, file uploads | The site has none — IT-007 / ET-004 confirm there are no forms |
| Load-testing the live Vercel site | Would spend real bandwidth on a shared host; load tests run against a local production build |
| Vercel's own infrastructure (CDN, TLS) | Not our code; only spot-checked (live headers, 405 on PUT) |
| Real multi-touch pinch on a physical phone | Not automatable reliably; pinch maths is unit-tested (FT-011) — see §6.2 |
| Visual pixel-perfect comparison | Layout is checked by measurement (ET-013 to ET-019), not screenshots |

### 2.2 Test types

| Type | Tool | Location | IDs | Count |
|---|---|---|---|---|
| Unit — Python ("backend") | pytest + pytest-cov | `tests/` | UT-001 – UT-047 | 47 tests (50 runs) |
| Unit / component — frontend | Vitest + React Testing Library + happy-dom | `site/app/**/*.test.ts(x)` | FT-001 – FT-061 | 61 |
| Integration (HTTP) | Vitest + Supertest, Next.js in-process | `site/integration/` | IT-001 – IT-022 | 22 |
| Security | Vitest + Supertest (+ happy-dom) | `site/tests/security/` | ST-001 – ST-015 | 15 |
| End-to-end | Playwright (Chromium), desktop + 375 px | `site/e2e/` | ET-001 – ET-019 | 19 tests (38 runs) |
| Load | Artillery 2.0.34 | `site/performance/` | 4 scenarios | 4 |
| Manual — black-box | executed by hand-written scripts / browser | `test-cases/` | TC-BB-EP-001–004, TC-BB-BVA-001–005 | 9 |
| Manual — white-box | executed against the real functions | `test-cases/` | TC-WB-001 – 005 | 5 |

### 2.3 Test environment

| | Local (this report's run) | CI (GitHub Actions) |
|---|---|---|
| OS | Windows 11 Home, ARM64 | Ubuntu (latest) |
| Node.js | v24.19.0 | 24 |
| Python | 3.12.10 | 3.12 |
| Browser | Playwright Chromium (Chrome for Testing 158) | same, installed with `--with-deps` |
| Site under test | production build (`next build` + `next start`) on ports 3100 (e2e), 3300 (load), 3400 (manual); in-process for integration/security | same |

### 2.4 Test data

| Data | Used by |
|---|---|
| The **real** `mosaic.json` (65 × 115 = 7,475 cells, 324 of 325 photos used) and the 975 real web images | IT, ST, ET, load tests, TC-BB-EP-001/002/003, TC-BB-BVA-001/005, UT-045/046 |
| A **4 × 2 sample mosaic** of 4 photos (one unused) — `site/test/helpers.ts` | FT-033 – FT-058 |
| **Generated solid-colour images** (red, blue, …) in temporary folders | UT-001 – UT-033 |
| **Throwaway folders** of fake files | UT-042 – UT-047, FT-020 – FT-025, TC-WB-004/005, TC-BB-EP-004 |
| **Hostile inputs**: SQL/NoSQL/template/XSS/traversal payloads, forged JWTs, hostile photo names | ST-001 – ST-015 |
| **Fake secrets** in CI (`VERCEL_OIDC_TOKEN`, `FAKE_TEST_API_KEY`) | ST-009 |

The real photos (`square_images/`) are never modified by any test.

### 2.5 Entry criteria

- The code builds: `npm run build` succeeds ([`results/build.txt`](results/build.txt): "✓ Compiled successfully").
- ESLint reports 0 problems and `tsc --noEmit` passes.
- The data files exist: `mosaic.json` and the web images (generated by `bonnie.py` and `make_web_assets.py`).
- Test tools installed: `requirements-dev.txt` (Python) and `npm ci` (site); Playwright Chromium installed.

### 2.6 Exit criteria

| Criterion | Required | Achieved (2026-11-08) |
|---|---|---|
| Python unit tests | 50 / 50 runs pass | **50 passed** |
| Frontend unit tests | 61 / 61 pass | **61 passed** |
| Integration tests | 21 pass; 1 documented known issue (IT-015) | **21 passed, 1 expected fail** |
| Security tests | 15 / 15 pass | **15 passed** |
| End-to-end | 28 runs pass, 0 fail (10 skipped by design) | **28 passed, 10 skipped, 0 failed** |
| Load tests | 4 / 4 scenarios within p95 thresholds, 0 failed users | **4 / 4 passed, 0 failed users** |
| Manual test cases | 14 executed, results recorded | **14 executed** (1 partition not testable on real data — §3.1) |
| Python branch coverage of logic | 100% of every function | **100% of all 20 functions** |
| No open high/critical bugs | — | **0 open** (1 low-severity local-only issue accepted: BUG-006) |

### 2.7 Tools

| Tool | Version | Purpose |
|---|---|---|
| pytest / pytest-cov | 9.2.0 / 7.1.0 | Python tests, branch coverage |
| Vitest / @vitest/coverage-v8 | 5.1.0 | Unit, integration and security test runner, coverage |
| React Testing Library / user-event / jest-dom | 16.3.3 / 14.6.8 / 7.0.1 | Render components, simulate users, readable assertions |
| happy-dom | 21.0.4 | Fake browser for component tests |
| Supertest | 7.3.2 | HTTP requests to the in-process server |
| Playwright | 1.65.0 | Real-browser end-to-end tests |
| Artillery | 2.0.34 (pinned, via npx) | Load tests |
| pip-audit / npm audit | — | Dependency vulnerability scans (CI) |
| GitHub Actions, Dependabot, CodeRabbit | — | CI, dependency updates, AI code review |

---

## 3 Black-Box Test Cases

Designed from the requirements only, without looking at the code. Each case is a separate file in [`test-cases/`](test-cases/) and was **executed** on 2026-11-08; raw output: [`results/manual-test-cases.txt`](results/manual-test-cases.txt).

### 3.1 Equivalence partitioning

| ID | Component | Partitions | Result |
|---|---|---|---|
| [TC-BB-EP-001](test-cases/TC-BB-EP-001-server-url-requests.md) | Production server | valid page / data / image; photo that doesn't exist; size that doesn't exist; private file; path traversal; write method; unknown page | **Pass** — all 9 as expected (write method refused with 500 locally — known issue BUG-006) |
| [TC-BB-EP-002](test-cases/TC-BB-EP-002-photo-usage-wording.md) | Photo view | uses = 0; uses = 1; uses > 1 | **Pass** for 0 and >1. **Not executable** for uses = 1: no real photo is used exactly once (covered by FT-034 on sample data) |
| [TC-BB-EP-003](test-cases/TC-BB-EP-003-gallery-sort-orders.md) | Gallery | In order; Most used; Least used; tied usage counts | **Pass** — all 325 photos in the expected order for each; 34 tied usage values exercised |
| [TC-BB-EP-004](test-cases/TC-BB-EP-004-data-loader-inputs.md) | Data loader | valid; name without web image; non-WebP files; unused photo | **Pass** — all 4 |

### 3.2 Boundary value analysis

| ID | Component | Boundary (below / at / above) | Result |
|---|---|---|---|
| [TC-BB-BVA-001](test-cases/TC-BB-BVA-001-zoom-limits.md) | Mosaic zoom | minimum 100% and maximum 6250% (1280 × 720), via buttons and slider | **Pass** — limits hold; buttons disable exactly at each limit |
| [TC-BB-BVA-002](test-cases/TC-BB-BVA-002-cooldown-distance.md) | Mosaic matching | cooldown at 7 / 8 / 9 cells; diagonals 7.81 / 8.49 | **Pass** — penalty only when < 8 cells |
| [TC-BB-BVA-003](test-cases/TC-BB-BVA-003-image-size-thresholds.md) | Explorer image choice | 16 px and 100 px thresholds (±0.01) | **Pass** — switches only above each threshold |
| [TC-BB-BVA-004](test-cases/TC-BB-BVA-004-tap-at-mosaic-edges.md) | Tap → square | left / right / top / bottom edges (±0.01 px) | **Pass** — left/top edges inside, right/bottom edges outside |
| [TC-BB-BVA-005](test-cases/TC-BB-BVA-005-layout-breakpoints.md) | Responsive layout | 699/700/701, 899/900/901, 1199/1200/1201 px | **Pass** — 3→5 columns at 700, hero layout at 900, 5→7 at 1200, no overflow |

---

## 4 White-Box Test Cases

Designed from the code: every branch of each function listed and given its own input. Executed 2026-11-08 against the real functions.

### 4.1 Authentication middleware

**Not applicable — the site has no authentication.** There is no login, session, token or middleware file (`proxy.ts` / `middleware.ts` do not exist). ST-005 to ST-008 verify this from the outside. The white-box effort goes instead to the functions where the site's real logic lives.

### 4.2 Key functions — branch-by-branch cases

| ID | Function | Branches | Result | Automated coverage |
|---|---|---|---|---|
| [TC-WB-001](test-cases/TC-WB-001-tile-score.md) | `bonnie.tile_score` | never used; used nearby (< 8); used far (≥ 8) | **Pass** (3/3) | 100% statements, 4/4 branch paths |
| [TC-WB-002](test-cases/TC-WB-002-pick-tile.md) | `bonnie.pick_tile` | no tiles; first tile; better; tie; worse | **Pass** (5/5) | 100% statements, 4/4 branch paths |
| [TC-WB-003](test-cases/TC-WB-003-clamp-view.md) | `view.clampView` | fits (centre); too wide right/left/inside; scale below/above limits | **Pass** (6/6) | 100% statements, 2/2 + 2/2 branch paths |
| [TC-WB-004](test-cases/TC-WB-004-load-mosaic.md) | `loadMosaic` | .webp filter; index found / not found; number from name / position fallback | **Pass** (5/5) — includes the fallback branch | **4/5 branch paths (80%)** — the fallback is *not* covered by the automated suite |
| [TC-WB-005](test-cases/TC-WB-005-rename-tiles.md) | `rename_tiles` | file / folder; existing tile names; empty folder | **Pass** (4/4) | 100% statements, 4/4 branch paths |

### 4.3 Measured coverage of the logic

**Python — every function** ([`results/python-function-coverage.txt`](results/python-function-coverage.txt)):

| Function | Statements run | Branch paths taken |
|---|---|---|
| `bonnie.tile_score` | 9 / 9 | 4 / 4 |
| `bonnie.pick_tile` | 9 / 9 | 4 / 4 |
| `bonnie.build_grid` | 17 / 17 | 4 / 4 |
| `bonnie.render_mosaic` | 10 / 10 | 4 / 4 |
| `bonnie.export_layout` | 6 / 6 | 2 / 2 |
| `make_favicon.find_instrument_serif` | 9 / 9 | 4 / 4 |
| `make_web_assets.save_tile_sizes` | 5 / 5 | 2 / 2 |
| `make_web_assets.main` | 15 / 15 | 6 / 6 |
| `rename_tiles.rename_tiles` | 15 / 15 | 4 / 4 |
| …the other 11 functions (no branches) | all | — |

**All 20 Python functions: 100% statement and branch coverage.**

**TypeScript — key functions** ([`results/unit-coverage-by-file-and-function.txt`](results/unit-coverage-by-file-and-function.txt)):

| Function | Branch paths taken |
|---|---|
| `view.clampView` (+ its inner `fit`) | 2 / 2 + 2 / 2 |
| `view.cellAt` | 6 / 6 |
| `view.tileTier` | 4 / 4 |
| `view.sliderFromScale` | 2 / 2 |
| `Gallery` (sort + captions) | 2 / 2 per branching function |
| `loadMosaic` | **4 / 5** — missing: line 40, the "no digits in the name" fallback |

---

## 5 Automated Testing

### 5.1 Overview

| Suite | Command | Where |
|---|---|---|
| Python | `python -m pytest` (project root, venv active) | `tests/` |
| Unit / component | `npm test` · `npm run test:coverage` · `npm run test:watch` | `site/app/**/*.test.ts(x)` |
| Integration | `npm run test:integration` (builds first) | `site/integration/` |
| Security | `npm run test:security` (builds first) | `site/tests/security/` |
| End-to-end | `npm run test:e2e` (builds first) | `site/e2e/` |
| Load | `npm run test:perf` (builds first) | `site/performance/` |

All suites except load run on every pull request in CI (`.github/workflows/ci.yml`): **backend** job (Python + coverage + pip-audit, production npm audit, integration, security), **frontend** job (lint, types, unit + coverage, npm audit), **e2e** job (Playwright; results uploaded on failure or cancellation).

### 5.2 Test files

**Python — `tests/`**

| File | What it tests | IDs |
|---|---|---|
| `test_bonnie.py` | colour averaging and distance, repeat penalty, cooldown (incl. boundaries), tile choice and ties, grid building, rendering, layout export and its error, `main()` | UT-001 – UT-025 |
| `test_make_web_assets.py` | WebP output at 3 sizes (real file type, size, contents), RGB conversion, missing file, preview, portrait, colour grid, `main()` | UT-026 – UT-033 |
| `test_make_favicon.py` | font glyph check, picking the font subset with "B", no-font failure, icon sizes, transparency, colours, `main()` | UT-034 – UT-041 |
| `test_rename_tiles.py` | numbering, no photo lost, existing tile names (BUG-002), folders left alone | UT-042 – UT-044, UT-047 |
| `test_mosaic_data.py` | the real `mosaic.json` and its web images are in sync | UT-045, UT-046 |

**Frontend unit / component — `site/app/`**

| File | What it tests | IDs |
|---|---|---|
| `lib/types.test.ts` | photo labels, image URLs | FT-001 – FT-002 |
| `lib/view.test.ts` | zoom limits, clamping, zoom/pinch maths, tap→square, visible cells, image size choice, slider, mini-map | FT-003 – FT-019 |
| `lib/load-mosaic.test.ts` | reading the data, counting uses, unused photos, ignoring non-WebP, missing-image error | FT-020 – FT-025 |
| `components/Gallery.test.tsx` | sort orders, ties, pressed state, captions, opening with the current order, lazy loading | FT-026 – FT-032 |
| `components/Lightbox.test.tsx` | photo view content, usage wording, Show in mosaic, prev/next, keys, scroll lock, focus, download | FT-033 – FT-041 |
| `components/MosaicExplorer.test.tsx` | accessibility, zoom buttons/slider/keys, max zoom, tap card, drag vs tap, Ctrl + scroll, highlight banner | FT-042 – FT-053 |
| `components/MosaicExperience.test.tsx` | app state: layout order, gallery → viewer, next follows sort, Show in mosaic, mosaic → viewer | FT-054 – FT-058 |
| `components/StaticSections.test.tsx` | hero, how it was made, dedication | FT-059 – FT-061 |

**Integration — `site/integration/site.test.ts`**

| Group | What it tests | IDs |
|---|---|---|
| The page | page, counts match data, HEAD, every image, icons, cached assets, no forms | IT-001 – IT-007 |
| The data | `mosaic.json` byte-identical to the file; every photo at 3 sizes | IT-008 – IT-009 |
| Bad requests | non-existent photos/sizes/extensions; path traversal | IT-010 – IT-011 |
| Access control | private files never served; writes change nothing; POST refused; clean 405 (known issue) | IT-012 – IT-015 |
| 404 | real 404 page, no internals leaked | IT-016 – IT-017 |
| CORS and headers | no CORS grant, preflight refused, data revalidated, no X-Powered-By, security headers | IT-018 – IT-022 |

**Security — `site/tests/security/`**

| File | What it tests | IDs |
|---|---|---|
| `http.security.test.ts` | injection in query/path/body; no reflection; no login/admin/API; no cookies; forged JWTs; burst; secrets not in browser files; no source maps; no outside links; hidden files | ST-001 – ST-012 |
| `xss.security.test.tsx` | hostile photo names rendered harmlessly (gallery, photo view); loader refuses unknown names | ST-013 – ST-015 |

**End-to-end — `site/e2e/`** (each test runs on `desktop-chrome` and `mobile-375`)

| File | What it tests | IDs |
|---|---|---|
| `smoke.spec.ts` | page loads, title, no console errors | ET-001 |
| `journeys.spec.ts` | nav links, 404, no forms, zoom loads real photos, tap → photo, Ctrl + scroll\*, plain scroll\*, drag\*, gallery sort → keyboard → Esc, Show in mosaic, download | ET-002 – ET-012 |
| `phone.spec.ts` | (phone only) no overflow, stacked hero, full-screen explorer, touch-action, 3 columns, polaroids 3 + 2, full-width photo view | ET-013 – ET-019 |

\* desktop only (mouse). Every e2e test also runs a **network guard** (`e2e/fixtures.ts`) that fails it if the page contacts any server other than the one under test.

**Load — `site/performance/`**: `page-load.yml`, `gallery.yml`, `soak.yml`, `bad-traffic.yml`, run by `run.mjs`.

### 5.3 Key tests

**UT-009 — the cooldown boundary** (`tests/test_bonnie.py`)

```python
def test_UT_009_no_cooldown_at_exactly_the_cooldown_distance():
    # "closer than" COOLDOWN_DISTANCE: exactly that far away is allowed
    assert bonnie.tile_score(RED, RED, 1, (0, 0), 0, COOLDOWN_DISTANCE) == REPEAT_PENALTY
```

**UT-044 — the rename bug, now fixed** (`tests/test_rename_tiles.py`, see BUG-002)

```python
def test_UT_044_running_on_a_folder_that_already_has_tile_names_loses_nothing(tmp_path):
    # Used to crash on Windows / overwrite a photo elsewhere: a new name landed on tile_001.jpg
    make_files(tmp_path, ["a_new_photo.jpg", "tile_001.jpg", "tile_002.jpg", "zzz.jpg"])

    rename_tiles(tmp_path)

    assert sorted(p.name for p in tmp_path.iterdir()) == ["tile_001.jpg", "tile_002.jpg", "tile_003.jpg", "tile_004.jpg"]
    contents = sorted(p.read_text() for p in tmp_path.iterdir())
    assert contents == ["a_new_photo.jpg", "tile_001.jpg", "tile_002.jpg", "zzz.jpg"]  # every photo survives
```

**FT-012 — which square is under a tap** (`site/app/lib/view.test.ts`)

```ts
const view: View = { scale: 100, x: 10, y: 20 }; // cells are 100 px, mosaic starts at (10, 20)

it("FT-012 finds the square under a point as row * cols + col", () => {
  expect(cellAt(view, 15, 25, grid)).toBe(0); // top-left
  expect(cellAt(view, 150, 50, grid)).toBe(1); // row 0, col 1
  expect(cellAt(view, 395, 205, grid)).toBe(7); // bottom-right (row 1, col 3)
});
```

**FT-056 — app state: "next" follows the gallery's sort** (`site/app/components/MosaicExperience.test.tsx`)

```tsx
it("FT-056 'next' in the viewer follows the gallery's current sort order", async () => {
  const { user } = setup();
  await user.click(gallery().getByRole("button", { name: "Most used" })); // 3, 1, 2, 4
  await user.click(gallery().getByRole("img", { name: "Photo 003" }));
  expect(within(viewer()!).getByText("1 of 4")).toBeInTheDocument();

  await user.click(within(viewer()!).getByRole("button", { name: "Next photo" }));
  expect(viewer()).toHaveAccessibleName("Photo 001");
});
```

**IT-012 — private files are never served** (`site/integration/site.test.ts`)

```ts
it("IT-012 secrets, config and source code are not reachable", async () => {
  for (const url of ["/.env.local", "/.vercel/project.json", "/package.json", "/app/page.tsx", "/next.config.ts", "/tsconfig.json"]) {
    const res = await request(site).get(url);
    expect(res.status, url).toBe(404);
    expect(res.text, url).not.toMatch(/VERCEL_OIDC_TOKEN|projectId/);
  }
});
```

**ET-005 — a real visitor's journey into the mosaic** (`site/e2e/journeys.spec.ts`) — the test that exposed BUG-001

```ts
async function openMosaic(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore the mosaic/ }).click();
  // The link smooth-scrolls: wait until the section has arrived at the top of the screen
  await expect.poll(() => page.locator("#mosaic").evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
  await expect(zoomLabel(page)).toHaveText("100%");
}

test("ET-005 zooming in loads the real photos and shrinks the mini-map box", async ({ page }) => {
  await openMosaic(page);
  const tilesLoaded = page.waitForResponse((res) => /\/tiles\/(xs|sm)\/tile_\d+\.webp$/.test(res.url()) && res.ok());
  await zoomIn(page, 3);
  await tilesLoaded;
  expect(await zoomPercent(page)).toBeGreaterThan(300);
  // ...mini-map box narrower than 100%
});
```

**Load — page load scenario** (`site/performance/page-load.yml`, abridged)

```yaml
config:
  phases:
    - name: 100 visitors over 10s
      duration: 10
      arrivalCount: 100
  plugins:
    expect:
      reportFailuresAsErrors: true # a wrong status code counts as an error
    ensure:
      thresholds:
        - http.response_time.p95: 500
```

### 5.4 Execution results (real output, 2026-11-08, commit `c5beffb`)

| Suite | Raw output | Result |
|---|---|---|
| Python | [`python-tests.txt`](results/python-tests.txt) | `============================= 50 passed in 1.95s ==============================` |
| Unit | [`unit-tests.txt`](results/unit-tests.txt) | `Test Files  8 passed (8)` · `Tests  61 passed (61)` |
| Integration | [`integration-tests.txt`](results/integration-tests.txt) | `Tests  21 passed \| 1 expected fail (22)` |
| Security | [`security-tests.txt`](results/security-tests.txt) | `Tests  15 passed (15)` |
| End-to-end | [`e2e-tests.txt`](results/e2e-tests.txt) | `10 skipped` · `28 passed` |
| Load | [`load-tests.txt`](results/load-tests.txt), [`load-summary.txt`](results/load-summary.txt) | `Load tests: 4/4 passed` |

The 10 skipped end-to-end runs are by design: ET-013 – ET-019 (phone layout) on `desktop-chrome`, and ET-007 – ET-009 (mouse wheel / drag) on `mobile-375`.

**Load test results** ([`load-summary.txt`](results/load-summary.txt)):

| Scenario | Visitors | Requests | Median | p95 | p99 | Max | Threshold (p95) | Failed visitors |
|---|---|---|---|---|---|---|---|---|
| page-load (100 over 10 s) | 100 | 400 | 1 ms | 4 ms | 5 ms | 9 ms | < 500 ms ✓ | 0 |
| gallery (50 × 20 photos) | 50 | 1,000 | 1 ms | 2 ms | 3 ms | 4 ms | < 500 ms ✓ | 0 |
| soak (5/s for 60 s) | 300 | 3,600 | 1 ms | 3 ms | 4 ms | 8 ms | < 1000 ms ✓ | 0 |
| bad-traffic (refused requests) | 50 | 250 | 1 ms | 2 ms | 2 ms | 3 ms | < 2000 ms ✓ | 0 |

These times are measured on the same machine as the server, so they contain **no network latency**; they show the server copes with the load without errors or slowdown, not what a remote visitor will experience.

**CI** — the last CI run on GitHub (PR #8, run 42508293032, commit `d97dcac`) passed all three jobs; that run recorded 42 Python passed + 8 skipped (favicon tests, which need a site build — now built first in CI by `c5beffb`, not yet run on GitHub).

### 5.5 Coverage

**Backend — Python** ([`python-tests.txt`](results/python-tests.txt), pytest-cov with `--cov-branch`):

```
Name                 Stmts   Miss Branch BrPart  Cover   Missing
----------------------------------------------------------------
bonnie.py               85      1     20      1    98%   150
make_favicon.py         43      1      8      1    96%   87
make_web_assets.py      41      1     10      1    96%   83
rename_tiles.py         19      1      6      1    92%   42
----------------------------------------------------------------
TOTAL                  188      4     44      4    97%
```

The four missed lines are each file's `main()` call under `if __name__ == "__main__":`, which only runs when the script is launched by hand. Inside the functions, coverage is 100% (§4.3).

**Frontend** ([`unit-coverage-by-file-and-function.txt`](results/unit-coverage-by-file-and-function.txt), Vitest + V8):

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `components/Closing.tsx` | 100% | 100% | 100% | 100% |
| `components/Gallery.tsx` | 100% | 100% | 100% | 100% |
| `components/Hero.tsx` | 100% | 100% | 100% | 100% |
| `components/HowItWasMade.tsx` | 100% | 100% | 100% | 100% |
| `components/Lightbox.tsx` | 97.44% | 96.43% | 100% | 100% |
| `components/MosaicExperience.tsx` | 100% | 100% | 100% | 100% |
| `components/MosaicExplorer.tsx` | 63.18% | 53.78% | 68.09% | 65.94% |
| `lib/load-mosaic.ts` | 100% | 80.00% | 100% | 100% |
| `lib/types.ts` | 100% | 100% | 100% | 100% |
| `lib/view.ts` | 100% | 100% | 100% | 100% |
| `layout.tsx`, `page.tsx` | 0% | — | 0% | 0% |
| **All files** | **73.67%** | **67.24%** | **83.96%** | **75.63%** |

- `MosaicExplorer.tsx`: the uncovered third is the canvas drawing and two-finger pinch handling, which happy-dom cannot execute (no canvas, no multi-touch). The drawing is exercised in a real browser by ET-005 – ET-009; the pinch maths is unit-tested in `view.ts` (FT-011).
- `layout.tsx` / `page.tsx` only wire components together; they are exercised by every e2e and integration test.

---

## 6 Conclusions

### 6.1 Findings — bugs found by testing

Seven real problems were found while testing; six are fixed, each now covered by a test. Full reports in [`../bugs/`](../bugs/).

| Bug | Found by | Severity | Status |
|---|---|---|---|
| [BUG-001](../bugs/BUG-001-hero-title-blocks-explore-link.md) Hero title blocked the "Explore the mosaic" link on desktop (live site) | ET-005 – ET-009 | High | Fixed (`8355639`), live since PR #7 |
| [BUG-002](../bugs/BUG-002-rename-tiles-overwrites-photos.md) `rename_tiles.py` could overwrite a photo / crash | UT-044 | High (data loss) | Fixed (`20c7226`) |
| [BUG-003](../bugs/BUG-003-bonnie-main-ignored-settings.md) `bonnie.main()` ignored changed settings after refactor | UT-025 | Medium | Fixed (in `d784136`) |
| [BUG-004](../bugs/BUG-004-missing-security-headers.md) No security headers; `X-Powered-By` advertised the framework | IT-021, IT-022 | Medium | Fixed (`904a6d6`) |
| [BUG-005](../bugs/BUG-005-nextjs-critical-advisories.md) Next.js 16.3.1 had critical security advisories | `npm audit` during test setup | Critical (low real exposure) | Fixed (`7bb26d8`) |
| [BUG-006](../bugs/BUG-006-local-server-500-on-write-methods.md) Local `next start` answers 500 (not 405) to PUT/DELETE on files | IT-015 | Low | **Open — accepted** (live site answers 405) |
| [BUG-007](../bugs/BUG-007-ci-type-check-missing-generated-types.md) CI type check failed on a clean machine (`LayoutProps`) | CI (first run) | Medium (CI only) | Fixed (`5cfdb00`) |

### 6.2 Accepted gaps

| Gap | Why accepted / mitigation |
|---|---|
| BUG-006 — local 500 on write methods | Only under `next start`; live Vercel returns 405 and nothing can change. Documented as IT-015. |
| `MosaicExplorer.tsx` at 63% statements | Canvas drawing and pinch need a real browser; covered by ET-005 – ET-009 and FT-011 |
| Real multi-touch pinch on a physical phone | Not reliably automatable; needs a manual check on a real device |
| `loadMosaic` fallback branch (photo name without a number) | Executed manually (TC-WB-004, L5) but not in the automated suite |
| "Used exactly once" wording on real data | No real photo has exactly 1 use; covered by FT-034 on sample data |
| Load tests run locally only | Avoids load-testing a shared production host; numbers exclude network latency |
| 8 moderate npm advisories (`minimatch` in the lint toolchain) | Dev-only; the only offered fix downgrades Next.js. Below the CI audit gate (high). |
| Favicon tests skip where the downloaded font can't be read | CI now builds first so they can run; confirmation pending the next CI run |

### 6.3 Lessons learned

- **End-to-end tests catch what unit tests can't.** The worst bug (BUG-001, an unclickable link on the live site) was invisible to 61 component tests and to every manual check — it only appeared when a real browser clicked the link like a visitor.
- **Refactor for testability, but prove nothing changed.** Splitting the Python scripts into functions made them testable; fingerprinting every output before and after (byte-identical mosaic, layout and 975 images) proved the refactor safe.
- **Know the fake browser's limits.** happy-dom silently drops `ctrlKey` on wheel events; a 10-line probe proved it was the tool, not the code, and Playwright then tested the real behaviour (ET-007).
- **Tests have bugs too.** Several failures were the tests' fault — assuming file-system order, an exact `text/html` content type, measuring mid-smooth-scroll, and `-0 !== 0` on high-density screens. Each was diagnosed before being "fixed", never just loosened.
- **Default values bind early in Python.** BUG-003 came from `def f(folder=TILE_FOLDER)` capturing the setting at definition time.
- **"Expected failure" markers keep known issues visible** without turning the suite red (UT-044 before its fix, IT-015).

### 6.4 Next steps

1. Push the review fixes (`c5beffb`) to PR #8, confirm the favicon tests now run in CI, and merge.
2. Add an automated test for the `loadMosaic` fallback branch (bring it from 4/5 to 5/5).
3. Check pinch-zoom and swipe on a real phone.
4. Consider running the load tests in CI on a schedule (e.g. weekly), against a preview deployment.
5. Consider a full Content-Security-Policy (needs nonces for Next.js inline scripts).
6. Review Dependabot's first PRs when they arrive.

---

## Appendix — Requirements and traceability

### Functional requirements

| ID | Requirement | Verified by |
|---|---|---|
| FR-01 | The landing page shows the title "Bonnie" and the portrait | FT-059, ET-001, ET-014 |
| FR-02 | The mosaic can be zoomed with buttons, slider, keyboard, Ctrl + scroll and pinch, between fixed limits | FT-042 – FT-047, FT-051, FT-003 – FT-011, ET-005, ET-007, TC-BB-BVA-001 |
| FR-03 | The zoomed-in mosaic can be moved by dragging | FT-050, ET-009, TC-WB-003 |
| FR-04 | Tapping a square shows which photo it is and how often it's used, and opens it | FT-012 – FT-014, FT-048 – FT-050, ET-006, TC-BB-BVA-004 |
| FR-05 | Zoomed in, the real photos load, sharper the closer you zoom | FT-015, FT-016, ET-005, TC-BB-BVA-003 |
| FR-06 | A mini-map shows which part of the mosaic is on screen | FT-019, ET-005, ET-009 |
| FR-07 | "How it was made" shows portrait → colour grid → mosaic | FT-060, IT-004 |
| FR-08 | The gallery shows every photo and can be sorted by order, most used, least used | FT-026 – FT-032, ET-010, ET-017, TC-BB-EP-003 |
| FR-09 | The photo view shows the photo full size with next/previous, keyboard control, usage and download | FT-033 – FT-041, ET-010, ET-012, ET-019, TC-BB-EP-002 |
| FR-10 | "Show in mosaic" highlights every square using a photo and can be cleared | FT-052, FT-053, FT-057, ET-011 |
| FR-11 | The navigation links take you to each section | ET-002 |
| FR-12 | Unknown pages show a 404 page | IT-016, ET-003 |
| FR-13 | Each mosaic cell gets the closest-coloured photo, with a repeat penalty and an 8-cell cooldown | UT-001 – UT-019, TC-BB-BVA-002, TC-WB-001, TC-WB-002 |
| FR-14 | The layout is exported to `mosaic.json` and stays consistent with the web images | UT-022 – UT-025, UT-045, UT-046, FT-020 – FT-025, IT-008, IT-009, TC-BB-EP-004, TC-WB-004 |
| FR-15 | Every photo is available as WebP at 96, 400 and 1000 px | UT-026 – UT-033, IT-004, IT-009 |
| FR-16 | The site has a favicon set (16/32/48, 512, 180 px) | UT-034 – UT-041, IT-005 |
| FR-17 | Photos can be renamed to `tile_###` without losing any | UT-042 – UT-044, UT-047, TC-WB-005 |

### Non-functional requirements

| ID | Requirement | Verified by |
|---|---|---|
| NFR-01 | Performance: p95 < 500 ms for page load and gallery bursts, < 1000 ms sustained, < 2000 ms for refused traffic, with 0 errors | Load tests (§5.4) |
| NFR-02 | Responsive: works at 375 px with no sideways scrolling; layout adapts at 700 / 900 / 1200 px | ET-013 – ET-019, TC-BB-BVA-005 |
| NFR-03 | Security: no private file, secret or source map is reachable; injection and traversal attempts fail safely; no script injection | IT-010 – IT-014, IT-017, ST-001 – ST-004, ST-009 – ST-015, TC-BB-EP-001 |
| NFR-04 | Security headers on every response; no framework advertising | IT-021, IT-022 |
| NFR-05 | No login, admin, API, cookies or forms (no attack surface) | IT-007, ST-005 – ST-008, ET-004 |
| NFR-06 | Accessibility: keyboard operable, focus managed, images and controls labelled | FT-040, FT-042, FT-047, FT-038, ET-010 |
| NFR-07 | Privacy: the page contacts no outside services | e2e network guard (`e2e/fixtures.ts`, all ET), IT-018, IT-019, ST-011 |
| NFR-08 | Reliability: no console errors; server survives bursts and bad traffic | ET-001, ST-008, load bad-traffic scenario |
| NFR-09 | Maintainability: every PR is linted, type-checked, tested and audited; dependencies kept current | CI (3 jobs), Dependabot |
