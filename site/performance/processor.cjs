// Helpers for the Artillery scenarios: pick random photos for each simulated visitor.
// Photos are numbered tile_001 ... tile_NNN with no gaps (rename_tiles.py guarantees it);
// run.mjs passes the real count in PERF_TILE_COUNT.

function randomPhotos(how_many) {
  const count = Number(process.env.PERF_TILE_COUNT || 325);
  return Array.from({ length: how_many }, () => `tile_${String(1 + Math.floor(Math.random() * count)).padStart(3, "0")}`);
}

module.exports = {
  /** 20 photos, like scrolling the gallery */
  pickGalleryPhotos(context, events, done) {
    context.vars.photos = randomPhotos(20);
    return done();
  },
  /** 10 photos, like zooming into the mosaic */
  pickMosaicPhotos(context, events, done) {
    context.vars.photos = randomPhotos(10);
    return done();
  },
};
