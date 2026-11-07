import { describe, expect, it } from "vitest";
import {
  MAX_CELL_PX,
  cellAt,
  clampScale,
  clampView,
  minScaleFor,
  minimapRect,
  pinchView,
  scaleFromSlider,
  sliderFromScale,
  tileTier,
  visibleCells,
  zoomAround,
  zoomPercent,
  type View,
} from "./view";

// An 800 x 600 screen showing a 4 x 2 mosaic. Fully zoomed out: min(800/4, 600/2) x 0.92 = 184 px per cell.
const screen = { w: 800, h: 600 };
const grid = { cols: 4, rows: 2 };
const MIN = 184;

/** Where a screen point lands in the mosaic, in cells — used to check "this spot stays put". */
const worldPoint = (view: View, sx: number, sy: number) => ({ x: (sx - view.x) / view.scale, y: (sy - view.y) / view.scale });

describe("zoom limits", () => {
  it("FT-003 fully zoomed out, the whole mosaic fits with a small margin", () => {
    expect(minScaleFor(screen, grid)).toBeCloseTo(MIN);
  });

  it("FT-004 a tall mosaic is limited by the screen height", () => {
    // The real mosaic (65 x 115) on a 1600 x 900 screen: 900 / 115 x 0.92
    expect(minScaleFor({ w: 1600, h: 900 }, { cols: 65, rows: 115 })).toBeCloseTo((900 / 115) * 0.92);
  });

  it("FT-005 zoom is kept between fully zoomed out and the maximum", () => {
    expect(clampScale(10, MIN)).toBe(MIN);
    expect(clampScale(5000, MIN)).toBe(MAX_CELL_PX);
    expect(clampScale(250, MIN)).toBe(250);
  });
});

describe("clampView", () => {
  it("FT-006 centres the mosaic when it fits on screen", () => {
    const view = clampView({ scale: MIN, x: 999, y: -999 }, screen, grid);
    expect(view.x).toBeCloseTo((800 - 4 * MIN) / 2); // 32
    expect(view.y).toBeCloseTo((600 - 2 * MIN) / 2); // 116
  });

  it("FT-007 stops the mosaic being dragged past its edges when zoomed in", () => {
    // At 360 px per cell the mosaic is 1440 px wide: x can go from 800 - 1440 = -640 up to 0
    expect(clampView({ scale: 360, x: 50, y: 0 }, screen, grid).x).toBe(0);
    expect(clampView({ scale: 360, x: -1000, y: 0 }, screen, grid).x).toBe(-640);
    expect(clampView({ scale: 360, x: -300, y: 0 }, screen, grid).x).toBe(-300);
  });

  it("FT-008 enforces the zoom limits", () => {
    expect(clampView({ scale: 1, x: 0, y: 0 }, screen, grid).scale).toBeCloseTo(MIN);
    expect(clampView({ scale: 9999, x: 0, y: 0 }, screen, grid).scale).toBe(MAX_CELL_PX);
  });
});

describe("zooming and pinching", () => {
  it("FT-009 zooming keeps the spot under the cursor still", () => {
    const before: View = { scale: 200, x: -50, y: -20 };
    const after = zoomAround(before, 1.5, 300, 250, MIN);
    expect(after.scale).toBe(300);
    expect(worldPoint(after, 300, 250).x).toBeCloseTo(worldPoint(before, 300, 250).x);
    expect(worldPoint(after, 300, 250).y).toBeCloseTo(worldPoint(before, 300, 250).y);
  });

  it("FT-010 zooming stops at the limits", () => {
    expect(zoomAround({ scale: 300, x: 0, y: 0 }, 10, 0, 0, MIN).scale).toBe(MAX_CELL_PX);
    expect(zoomAround({ scale: 200, x: 0, y: 0 }, 0.01, 0, 0, MIN).scale).toBe(MIN);
  });

  it("FT-011 spreading two fingers zooms in, and the spot between them follows the fingers", () => {
    const start: View = { scale: 200, x: 0, y: 0 };
    const startMid = { x: 400, y: 300 };
    const mid = { x: 420, y: 310 }; // fingers also moved a little
    const after = pinchView(start, startMid, 100, mid, 150, MIN); // fingers 1.5x further apart

    expect(after.scale).toBe(300);
    const spot = worldPoint(start, startMid.x, startMid.y);
    expect(worldPoint(after, mid.x, mid.y).x).toBeCloseTo(spot.x);
    expect(worldPoint(after, mid.x, mid.y).y).toBeCloseTo(spot.y);
  });
});

describe("cellAt — which square is under a tap", () => {
  const view: View = { scale: 100, x: 10, y: 20 }; // cells are 100 px, mosaic starts at (10, 20)

  it("FT-012 finds the square under a point as row * cols + col", () => {
    expect(cellAt(view, 15, 25, grid)).toBe(0); // top-left
    expect(cellAt(view, 150, 50, grid)).toBe(1); // row 0, col 1
    expect(cellAt(view, 395, 205, grid)).toBe(7); // bottom-right (row 1, col 3)
  });

  it("FT-013 returns null for points outside the mosaic", () => {
    expect(cellAt(view, 5, 50, grid)).toBeNull(); // left of it
    expect(cellAt(view, 150, 10, grid)).toBeNull(); // above it
    expect(cellAt(view, 450, 50, grid)).toBeNull(); // right of it
    expect(cellAt(view, 150, 230, grid)).toBeNull(); // below it
  });

  it("FT-014 the far edge belongs outside the mosaic", () => {
    expect(cellAt(view, 410, 50, grid)).toBeNull(); // x = 10 + 4 x 100 exactly
  });
});

describe("drawing decisions", () => {
  it("FT-015 only the squares on screen are drawn", () => {
    expect(visibleCells({ scale: MIN, x: 32, y: 116 }, screen, grid)).toEqual({ c0: 0, c1: 3, r0: 0, r1: 1 });
    // Zoomed in to 360 px and scrolled 400 px right: x 400-1200 of the mosaic -> columns 1-3;
    // y 0-600 -> rows 0-1 (of 4)
    expect(visibleCells({ scale: 360, x: -400, y: 0 }, screen, { cols: 4, rows: 4 })).toEqual({ c0: 1, c1: 3, r0: 0, r1: 1 });
  });

  it("FT-016 picks the image size from how big a square is on screen", () => {
    expect(tileTier(10)).toBeNull(); // tiny squares: the preview image is enough
    expect(tileTier(16)).toBeNull();
    expect(tileTier(17)).toBe("xs"); // 96 px photos
    expect(tileTier(100)).toBe("xs");
    expect(tileTier(101)).toBe("sm"); // 400 px photos
  });
});

describe("zoom controls", () => {
  it("FT-017 the zoom label is 100% when fully zoomed out", () => {
    expect(zoomPercent(MIN, MIN)).toBe(100);
    expect(zoomPercent(MIN * 2.5, MIN)).toBe(250);
  });

  it("FT-018 the zoom slider runs from 0 (zoomed out) to 1 (max) and converts back exactly", () => {
    expect(sliderFromScale(MIN, MIN)).toBe(0);
    expect(sliderFromScale(MAX_CELL_PX, MIN)).toBeCloseTo(1);
    for (const value of [0, 0.25, 0.5, 0.9]) {
      expect(sliderFromScale(scaleFromSlider(value, MIN), MIN)).toBeCloseTo(value);
    }
    expect(sliderFromScale(0, 0)).toBe(0); // before the explorer knows its size: no NaN
  });

  it("FT-019 the mini-map box shows which part of the mosaic is on screen", () => {
    expect(minimapRect({ scale: MIN, x: 32, y: 116 }, screen, grid)).toEqual({ left: 0, top: 0, width: 100, height: 100 });
    // 400 px per cell, scrolled 1 cell right: 800 / 400 = 2 of 4 columns, 600 / 400 = 1.5 of 2 rows
    expect(minimapRect({ scale: 400, x: -400, y: 0 }, screen, grid)).toEqual({ left: 25, top: 0, width: 50, height: 75 });
  });
});
