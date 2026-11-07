/**
 * The mosaic explorer's maths, as small pure functions (numbers in, numbers out)
 * so they can be unit-tested without a browser or a <canvas>.
 *
 * Units: one "world" unit is one mosaic cell. A View maps world to screen:
 *   screen x = view.x + col * view.scale
 *   screen y = view.y + row * view.scale
 * so `scale` is how many CSS pixels one cell takes up.
 */
import type { TileSize } from "./types";

export type View = { scale: number; x: number; y: number };
export type GridSize = { cols: number; rows: number };
export type Screen = { w: number; h: number };
export type Point = { x: number; y: number };

export const MAX_CELL_PX = 360; // most zoomed-in: one cell is this many CSS pixels
export const TILES_FROM_PX = 16; // below this (device px per cell) the preview image is enough
export const SM_FROM_PX = 100; // above this, swap the 96px tiles for the 400px ones

/** Most zoomed-out scale: the whole mosaic fits on screen, with a small margin. */
export function minScaleFor(screen: Screen, grid: GridSize): number {
  return Math.min(screen.w / grid.cols, screen.h / grid.rows) * 0.92;
}

/** Keep a scale between fully zoomed out (`min`) and MAX_CELL_PX. */
export function clampScale(scale: number, min: number): number {
  return Math.min(Math.max(scale, min), MAX_CELL_PX);
}

/**
 * Make a view valid: clamp the zoom, then centre the mosaic along any axis where
 * it fits on screen, or stop it being dragged past its edges where it doesn't.
 */
export function clampView(next: View, screen: Screen, grid: GridSize): View {
  const scale = clampScale(next.scale, minScaleFor(screen, grid));
  const fit = (pos: number, worldSize: number, screenSize: number) => {
    const extent = worldSize * scale;
    return extent <= screenSize ? (screenSize - extent) / 2 : Math.min(0, Math.max(screenSize - extent, pos));
  };
  return { scale, x: fit(next.x, grid.cols, screen.w), y: fit(next.y, grid.rows, screen.h) };
}

/** Zoom by `factor`, keeping the point under (sx, sy) — the cursor or screen centre — still. */
export function zoomAround(view: View, factor: number, sx: number, sy: number, minScale: number): View {
  const scale = clampScale(view.scale * factor, minScale);
  const k = scale / view.scale;
  return { scale, x: sx - (sx - view.x) * k, y: sy - (sy - view.y) * k };
}

/**
 * Two-finger pinch: scale by how far the fingers have spread, and keep the spot that
 * was between them at the start under their current midpoint (so pinching also pans).
 */
export function pinchView(
  start: View,
  startMid: Point,
  startDist: number,
  mid: Point,
  dist: number,
  minScale: number,
): View {
  const scale = clampScale(start.scale * (dist / startDist), minScale);
  const worldX = (startMid.x - start.x) / start.scale;
  const worldY = (startMid.y - start.y) / start.scale;
  return { scale, x: mid.x - worldX * scale, y: mid.y - worldY * scale };
}

/** Index (row * cols + col) of the cell under a screen point, or null if it's off the mosaic. */
export function cellAt(view: View, sx: number, sy: number, grid: GridSize): number | null {
  const c = Math.floor((sx - view.x) / view.scale);
  const r = Math.floor((sy - view.y) / view.scale);
  return c >= 0 && c < grid.cols && r >= 0 && r < grid.rows ? r * grid.cols + c : null;
}

/** First/last column and row with any part on screen — only these get drawn. */
export function visibleCells(view: View, screen: Screen, grid: GridSize) {
  return {
    c0: Math.max(0, Math.floor(-view.x / view.scale)),
    c1: Math.min(grid.cols - 1, Math.floor((screen.w - view.x) / view.scale)),
    r0: Math.max(0, Math.floor(-view.y / view.scale)),
    r1: Math.min(grid.rows - 1, Math.floor((screen.h - view.y) / view.scale)),
  };
}

/** Which tile images to draw for cells this many device pixels wide (null = preview only). */
export function tileTier(cellDevicePx: number): TileSize | null {
  if (cellDevicePx <= TILES_FROM_PX) return null;
  return cellDevicePx > SM_FROM_PX ? "sm" : "xs";
}

/** Zoom level for the label: 100% = fully zoomed out. */
export function zoomPercent(scale: number, minScale: number): number {
  return Math.round((scale / minScale) * 100);
}

/** Zoom slider position (0 to 1). Logarithmic, so each bit of slider feels like the same zoom step. */
export function sliderFromScale(scale: number, minScale: number): number {
  const value = Math.log(scale / minScale) / Math.log(MAX_CELL_PX / minScale);
  return Number.isFinite(value) ? value : 0;
}

/** The scale for a slider position — the inverse of sliderFromScale. */
export function scaleFromSlider(value: number, minScale: number): number {
  return minScale * Math.pow(MAX_CELL_PX / minScale, value);
}

/** The visible area as percentages of the whole mosaic, for the mini-map's rectangle. */
export function minimapRect(view: View, screen: Screen, grid: GridSize) {
  return {
    left: (Math.max(0, -view.x / view.scale) / grid.cols) * 100,
    top: (Math.max(0, -view.y / view.scale) / grid.rows) * 100,
    width: (Math.min(screen.w / view.scale, grid.cols) / grid.cols) * 100,
    height: (Math.min(screen.h / view.scale, grid.rows) / grid.rows) * 100,
  };
}
