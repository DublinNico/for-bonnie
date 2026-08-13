# TODO — Bonnie Photomosaic Web App

- [x] venv + Pillow set up and confirmed
- [x] Write `rename_tiles.py`, validate on `images_test/` (13 photos)
- [x] Run `rename_tiles.py` for real against `images/` (351 photos)
- [x] Add the target photo (big image the mosaic recreates) — `target_photo/target_bonnie.jpg`
- [ ] Pillow fundamentals, applied directly to real tiles/target (not throwaway drills):
  - [ ] Open an image; inspect `.size`, `.mode`, `.format`
  - [ ] Resize + save; compare `LANCZOS` vs `NEAREST`
  - [ ] Centre-crop a photo to a square (tiles need to be square to grid cleanly)
  - [ ] `Image.new` + `.paste` — build a small grid from a few tiles
  - [ ] Average colour of an image via the `.resize((1,1))` trick
- [x] Mosaic-assembly algorithm:
  - [x] Divide the target photo into a grid of cells
  - [x] Compute each cell's average colour
  - [x] Compute each tile photo's average colour (once, cache it)
  - [x] Match each cell to its nearest-colour tile
  - [x] Paste matched tiles into one big canvas
- [x] Reduce tile repeats in the mosaic — usage-count penalty (`REPEAT_PENALTY`)
  plus a spatial cooldown (penalise reuse near a tile's prior positions)
  added to the colour-distance score in the matching loop
- [ ] Wrap the mosaic builder in a Vercel Python serverless function
  (`api/` folder, `requirements.txt`)
  - Decided: the function returns JSON grid metadata (which tile goes in
    each cell + grid dimensions), not a rendered image — avoids Vercel's
    response-size limits and lets the frontend assemble/zoom the mosaic
    itself
- [ ] Frontend (Next.js): render the mosaic as a grid built from the API's
  JSON metadata, with zoom in/out (dropped the click-to-source-photo idea)
  - Decided: tile photos served as static files from `public/` (committed
    to the repo), not external storage
- [ ] Deploy: connect GitHub repo to Vercel, confirm live
