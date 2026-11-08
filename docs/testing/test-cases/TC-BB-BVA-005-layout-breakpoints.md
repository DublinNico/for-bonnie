# TC-BB-BVA-005 — Responsive layout breakpoints

| Field | Value |
|---|---|
| **Test ID** | TC-BB-BVA-005 |
| **Technique** | Black-box — boundary value analysis |
| **Component** | Page layout (`globals.css` media queries) |
| **Objective** | The layout changes exactly at its breakpoints — gallery 3 → 5 columns at 700 px, hero split layout at 900 px, gallery 5 → 7 columns at 1200 px — and never scrolls sideways |
| **Executed** | 2026-11-08, real site (production build, `localhost:3400`) in Playwright Chromium, window height 900 — raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | ET-013, ET-014, ET-017 |

## Boundaries

| Breakpoint | Below | At / above |
|---|---|---|
| 700 px | gallery 3 columns | gallery 5 columns |
| 900 px | hero stacked (title above photo) | hero split ("Bon" \| photo \| "nie") |
| 1200 px | gallery 5 columns | gallery 7 columns |

## Cases

| Case | Input (width) | Expected | Result |
|---|---|---|---|
| Just below 700 | 699 px | 3 columns, stacked hero, no overflow | 3 columns, stacked, overflow 0 px — **Pass** |
| At 700 | 700 px | 5 columns | 5 columns, stacked, 0 px — **Pass** |
| Just above 700 | 701 px | 5 columns | 5 columns, stacked, 0 px — **Pass** |
| Just below 900 | 899 px | stacked hero | 5 columns, stacked, 0 px — **Pass** |
| At 900 | 900 px | split hero | 5 columns, split, 0 px — **Pass** |
| Just above 900 | 901 px | split hero | 5 columns, split, 0 px — **Pass** |
| Just below 1200 | 1199 px | 5 columns | 5 columns, split, 0 px — **Pass** |
| At 1200 | 1200 px | 7 columns | 7 columns, split, 0 px — **Pass** |
| Just above 1200 | 1201 px | 7 columns | 7 columns, split, 0 px — **Pass** |

**Overall: Pass (9/9)**
