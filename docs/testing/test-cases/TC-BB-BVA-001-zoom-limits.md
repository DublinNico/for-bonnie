# TC-BB-BVA-001 — Mosaic zoom limits

| Field | Value |
|---|---|
| **Test ID** | TC-BB-BVA-001 |
| **Technique** | Black-box — boundary value analysis |
| **Component** | Mosaic explorer zoom controls (buttons, slider) |
| **Objective** | Zoom stays between fully zoomed out (100%) and the maximum, and the controls behave correctly at, just inside and just beyond each limit |
| **Executed** | 2026-11-08, real site (production build, `localhost:3400`) in Playwright Chromium, window 1280 × 720 — raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-005, FT-010, FT-043 – FT-046, TC-WB-003 |

## Boundaries

| Limit | Value at 1280 × 720 | How it's defined |
|---|---|---|
| Minimum | 100% | the whole mosaic fits on screen (with a margin) |
| Maximum | 6250% | one mosaic square = 360 CSS px (`MAX_CELL_PX`) |

## Cases

| Case | Input | Expected | Result |
|---|---|---|---|
| At minimum | page opened at the mosaic | 100%, zoom-out disabled, zoom-in enabled | 100%, zoom-out disabled, zoom-in enabled — **Pass** |
| Below minimum | force-click zoom-out at 100% | stays 100% | 100% — **Pass** |
| Just below maximum | zoom-in pressed repeatedly | zoom-in stays enabled until the limit | 160% → 256% → 410% → 655% → 1049% → 1678% → 2684% → 4295% → 6250% (9 presses); enabled until 6250% — **Pass** |
| At maximum | after the 9th press | 6250%, zoom-in disabled, zoom-out enabled | zoom-in disabled, zoom-out enabled — **Pass** |
| Above maximum | force-click zoom-in at 6250% | stays 6250% | 6250% — **Pass** |
| Slider at minimum | slider = 0 | 100% | 100% — **Pass** |
| Slider at maximum | slider = 1 | 6250% | 6250% — **Pass** |

**Overall: Pass (7/7)**
