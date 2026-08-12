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
- [ ] Reduce tile repeats in the mosaic — add a usage-count penalty to the
  colour-distance score in the matching loop, so an already-used tile
  needs to be a noticeably better match to get picked again (spreads
  repeats out without losing resolution or hard-capping tile use)
- [ ] Wrap the mosaic builder in a Vercel Python serverless function
  (`api/` folder, `requirements.txt`)
- [ ] Frontend: render the mosaic, make each tile clickable to view/link
  back to its original source photo
- [ ] Deploy: connect GitHub repo to Vercel, confirm live
