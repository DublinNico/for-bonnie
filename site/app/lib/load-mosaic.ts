import fs from "node:fs";
import path from "node:path";
import type { MosaicData, Photo } from "./types";

/**
 * Reads the mosaic layout written by bonnie.py and the tile list written by
 * make_web_assets.py. Runs on the server at build time only.
 */
export function loadMosaic(): MosaicData {
  const publicDir = path.join(process.cwd(), "public");

  const raw = JSON.parse(fs.readFileSync(path.join(publicDir, "mosaic.json"), "utf8")) as {
    cols: number;
    rows: number;
    grid: string[];
  };

  const ids = fs
    .readdirSync(path.join(publicDir, "tiles", "sm"))
    .filter((file) => file.endsWith(".webp"))
    .map((file) => file.replace(/\.webp$/, ""))
    .sort();

  const indexById = new Map(ids.map((id, i) => [id, i]));
  const uses: number[] = new Array(ids.length).fill(0);

  const grid = raw.grid.map((filename) => {
    const id = filename.replace(/\.[^.]+$/, "");
    const index = indexById.get(id);
    if (index === undefined) {
      throw new Error(`${filename} is in mosaic.json but has no web image. Run make_web_assets.py.`);
    }
    uses[index]++;
    return index;
  });

  const photos: Photo[] = ids.map((id, i) => ({
    id,
    number: Number(id.match(/\d+/)?.[0] ?? i + 1),
    uses: uses[i],
  }));

  return { cols: raw.cols, rows: raw.rows, grid, photos };
}
