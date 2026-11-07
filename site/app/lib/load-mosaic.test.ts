// @vitest-environment node
// (reads real files, so it runs in plain Node rather than the fake browser)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadMosaic } from "./load-mosaic";

const tempDirs: string[] = [];

/** A throwaway public/ folder with a mosaic.json and the named web tiles. */
function fakePublic(mosaic: object, tileFiles: string[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bonnie-public-"));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, "mosaic.json"), JSON.stringify(mosaic));
  fs.mkdirSync(path.join(dir, "tiles", "sm"), { recursive: true });
  for (const file of tileFiles) fs.writeFileSync(path.join(dir, "tiles", "sm", file), "");
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("loadMosaic", () => {
  it("FT-020 reads the grid size and turns filenames into photo numbers", () => {
    const dir = fakePublic({ cols: 2, rows: 1, grid: ["tile_002.jpg", "tile_001.jpg"] }, ["tile_001.webp", "tile_002.webp"]);

    const mosaic = loadMosaic(dir);

    expect([mosaic.cols, mosaic.rows]).toEqual([2, 1]);
    expect(mosaic.grid).toEqual([1, 0]); // indexes into photos (tile_001 is photos[0])
  });

  it("FT-021 lists every photo in number order with its number", () => {
    const dir = fakePublic({ cols: 1, rows: 1, grid: ["tile_010.jpg"] }, ["tile_010.webp", "tile_002.webp", "tile_123.webp"]);

    expect(loadMosaic(dir).photos.map((p) => [p.id, p.number])).toEqual([
      ["tile_002", 2],
      ["tile_010", 10],
      ["tile_123", 123],
    ]);
  });

  it("FT-022 counts how many squares use each photo", () => {
    const grid = ["tile_001.jpg", "tile_002.jpg", "tile_001.jpg", "tile_001.jpg"];
    const dir = fakePublic({ cols: 2, rows: 2, grid }, ["tile_001.webp", "tile_002.webp"]);

    expect(loadMosaic(dir).photos.map((p) => p.uses)).toEqual([3, 1]);
  });

  it("FT-023 keeps photos the mosaic never used, with 0 uses (the gallery still shows them)", () => {
    const dir = fakePublic({ cols: 1, rows: 1, grid: ["tile_001.jpg"] }, ["tile_001.webp", "tile_002.webp"]);

    expect(loadMosaic(dir).photos[1]).toEqual({ id: "tile_002", number: 2, uses: 0 });
  });

  it("FT-024 ignores files in the tile folder that aren't WebP images", () => {
    const dir = fakePublic({ cols: 1, rows: 1, grid: ["tile_001.jpg"] }, ["tile_001.webp", "notes.txt", ".DS_Store"]);

    expect(loadMosaic(dir).photos.map((p) => p.id)).toEqual(["tile_001"]);
  });

  it("FT-025 stops the build with a helpful message if a photo has no web image", () => {
    const dir = fakePublic({ cols: 2, rows: 1, grid: ["tile_001.jpg", "tile_999.jpg"] }, ["tile_001.webp"]);

    expect(() => loadMosaic(dir)).toThrow("tile_999.jpg is in mosaic.json but has no web image. Run make_web_assets.py.");
  });
});
