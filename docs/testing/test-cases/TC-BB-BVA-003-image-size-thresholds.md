# TC-BB-BVA-003 — Image size thresholds

| Field | Value |
|---|---|
| **Test ID** | TC-BB-BVA-003 |
| **Technique** | Black-box — boundary value analysis |
| **Component** | Mosaic explorer image choice (`view.ts`, `tileTier`) |
| **Objective** | Zoomed out, only the small preview is drawn; past 16 device px per square the 96 px photos are drawn; past 100 px the 400 px photos |
| **Executed** | 2026-11-08 — the real `tileTier()` (Node 24 running `view.ts`); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-016, ET-005 |

## Boundaries

`TILES_FROM_PX = 16`, `SM_FROM_PX = 100` (device pixels per square). Both are "greater than" limits.

## Cases

| Case | Input (px per square) | Expected | Result |
|---|---|---|---|
| Below 16 | 15.99 | preview only (`null`) | preview only (null) — **Pass** |
| At 16 | 16 | preview only (`null`) | preview only (null) — **Pass** |
| Above 16 | 16.01 | `xs` (96 px photos) | xs — **Pass** |
| Below 100 | 99.99 | `xs` | xs — **Pass** |
| At 100 | 100 | `xs` | xs — **Pass** |
| Above 100 | 100.01 | `sm` (400 px photos) | sm — **Pass** |

**Overall: Pass (6/6)**
