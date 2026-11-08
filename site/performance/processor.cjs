// Helpers for the Artillery scenarios: pick random photos for each simulated visitor.
// run.mjs reads the target server's own /mosaic.json and passes its photo names in
// PERF_PHOTOS, so only photos that server really has are requested.

/** `howMany` random photo names (e.g. "tile_042") from the target's photo list. */
function randomPhotos(howMany) {
  const names = (process.env.PERF_PHOTOS || "").split(",").filter(Boolean);
  if (names.length === 0) throw new Error("PERF_PHOTOS is empty: run the load tests through performance/run.mjs");
  return Array.from({ length: howMany }, () => names[Math.floor(Math.random() * names.length)]);
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
