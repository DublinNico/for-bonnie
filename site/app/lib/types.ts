/** One tile photo. `index` positions refer to MosaicData.photos. */
export type Photo = {
  /** File stem, e.g. "tile_042" — used to build image URLs */
  id: string;
  /** Human-facing number, e.g. 42 */
  number: number;
  /** How many cells of the mosaic use this photo */
  uses: number;
};

export type MosaicData = {
  cols: number;
  rows: number;
  /** One entry per cell, row-major; each value is an index into `photos` */
  grid: number[];
  /** Every tile photo, sorted by number (including any the mosaic didn't use) */
  photos: Photo[];
};

export type TileSize = "xs" | "sm" | "lg";

export const tileUrl = (photo: Photo, size: TileSize) => `/tiles/${size}/${photo.id}.webp`;

export const photoLabel = (photo: Photo) => `Photo ${String(photo.number).padStart(3, "0")}`;
