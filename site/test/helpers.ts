// Shared test data and fake-browser stand-ins for the component tests.
import { vi } from "vitest";
import type { MosaicData, Photo } from "../app/lib/types";

/** Four photos; photo 4 isn't used in the mosaic (like a real photo that never matched). */
export const photos: Photo[] = [
  { id: "tile_001", number: 1, uses: 3 },
  { id: "tile_002", number: 2, uses: 1 },
  { id: "tile_003", number: 3, uses: 4 },
  { id: "tile_004", number: 4, uses: 0 },
];

/**
 * A 4 x 2 mosaic. Each number is an index into `photos`:
 *   row 0:  1 3 1 3
 *   row 1:  2 3 1 3
 * so photo 1 is used 3x, photo 2 once, photo 3 4x, photo 4 never.
 */
export const data: MosaicData = { cols: 4, rows: 2, grid: [0, 2, 0, 2, 1, 2, 0, 2], photos };

/**
 * happy-dom is a fake browser without layout or canvas drawing. Stand in for the
 * pieces the explorer needs: a ResizeObserver that reports the given size,
 * pointer capture, scrolling, and a canvas that simply doesn't draw.
 */
export function stubBrowserLayout(width = 800, height = 600) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      observe() {
        this.callback([{ contentRect: { width, height } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"];
}
