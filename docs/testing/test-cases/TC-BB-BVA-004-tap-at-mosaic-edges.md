# TC-BB-BVA-004 — Tap position at the mosaic's edges

| Field | Value |
|---|---|
| **Test ID** | TC-BB-BVA-004 |
| **Technique** | Black-box — boundary value analysis |
| **Component** | Tap → square lookup (`view.ts`, `cellAt`) |
| **Objective** | A tap exactly on an edge of the mosaic is inside or outside consistently: the left/top edges belong to the mosaic, the right/bottom edges do not (no square past the last one) |
| **Executed** | 2026-11-08 — the real `cellAt()` (Node 24 running `view.ts`); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-012 – FT-014, FT-050 |

## Setup and boundaries

View: squares are 100 px, the mosaic starts at screen (10, 20); grid 4 columns × 2 rows. So the mosaic spans x = 10 … 410 and y = 20 … 220.

## Cases

| Case | Input (x, y) | Expected | Result |
|---|---|---|---|
| Left edge − 0.01 | (9.99, 50) | outside (`null`) | null — **Pass** |
| Left edge | (10, 50) | square 0 | 0 — **Pass** |
| Left edge + 0.01 | (10.01, 50) | square 0 | 0 — **Pass** |
| Right edge − 0.01 | (409.99, 50) | square 3 (last column) | 3 — **Pass** |
| Right edge | (410, 50) | outside | null — **Pass** |
| Right edge + 0.01 | (410.01, 50) | outside | null — **Pass** |
| Top edge − 0.01 | (50, 19.99) | outside | null — **Pass** |
| Top edge | (50, 20) | square 0 | 0 — **Pass** |
| Bottom edge − 0.01 | (50, 219.99) | square 4 (row 1, col 0) | 4 — **Pass** |
| Bottom edge | (50, 220) | outside | null — **Pass** |

**Overall: Pass (10/10)**
