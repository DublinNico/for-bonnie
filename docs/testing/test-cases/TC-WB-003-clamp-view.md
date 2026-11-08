# TC-WB-003 — `view.clampView`

| Field | Value |
|---|---|
| **Test ID** | TC-WB-003 |
| **Technique** | White-box — branch coverage |
| **Component** | `site/app/lib/view.ts` — keeps the mosaic explorer's view valid |
| **Objective** | Execute every branch: zoom clamped up and down, mosaic centred when it fits, held at each edge when it doesn't, left alone when inside the limits |
| **Executed** | 2026-11-08 — the real function (Node 24 running `view.ts`); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |

## Code under test

```ts
export function clampScale(scale: number, min: number): number {
  return Math.min(Math.max(scale, min), MAX_CELL_PX);              // M1 / M2
}

export function clampView(next: View, screen: Screen, grid: GridSize): View {
  const scale = clampScale(next.scale, minScaleFor(screen, grid));
  const fit = (pos: number, worldSize: number, screenSize: number) => {
    const extent = worldSize * scale;
    return extent <= screenSize                                        // decision D
      ? (screenSize - extent) / 2                                      // centre
      : Math.min(0, Math.max(screenSize - extent, pos));               // E1 / E2 / E3
  };
  return { scale, x: fit(next.x, grid.cols, screen.w), y: fit(next.y, grid.rows, screen.h) };
}
```

## Branches

| Branch | Path |
|---|---|
| C1 | D true — the mosaic fits: centre it |
| C2 | D false, E1 — dragged past the right (pos > 0): held at 0 |
| C3 | D false, E2 — dragged past the left limit: held at `screen − extent` |
| C4 | D false, E3 — inside the limits: unchanged |
| C5 | M1 — zoom below the minimum: raised to the minimum |
| C6 | M2 — zoom above the maximum: lowered to 360 |

## Test cases (one per branch)

Screen 800 × 600, grid 4 × 2 → minimum zoom 184 px per square; at 360 px the mosaic is 1440 px wide, so x may range −640 … 0.

| Branch | Input (scale, x) | Expected (scale, x) | Result |
|---|---|---|---|
| C1 | 184, 999 | 184, 32 (centred) | 184, 32 — **Pass** |
| C2 | 360, 50 | 360, 0 | 360, 0 — **Pass** |
| C3 | 360, −1000 | 360, −640 | 360, −640 — **Pass** |
| C4 | 360, −300 | 360, −300 | 360, −300 — **Pass** |
| C5 | 1, 0 | 184, 32 | 184, 32 — **Pass** |
| C6 | 9999, 0 | 360, 0 | 360, 0 — **Pass** |

## Coverage achieved

- Manual cases: **6 / 6 branches**.
- Automated suite (Vitest + V8, [`../results/unit-coverage-by-file-and-function.txt`](../results/unit-coverage-by-file-and-function.txt)): `clampView` **2 / 2** and its `fit` **2 / 2** branch paths; `view.ts` **100%** statements, branches, functions and lines — FT-005 – FT-008.
