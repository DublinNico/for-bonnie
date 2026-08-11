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
- [ ] Mosaic-assembly algorithm:
  - [ ] Divide the target photo into a grid of cells
  - [ ] Compute each cell's average colour
  - [ ] Compute each tile photo's average colour (once, cache it)
  - [ ] Match each cell to its nearest-colour tile
  - [ ] Paste matched tiles into one big canvas
- [ ] Wrap the mosaic builder in a Vercel Python serverless function
  (`api/` folder, `requirements.txt`)
- [ ] Frontend: render the mosaic, make each tile clickable to view/link
  back to its original source photo
- [ ] Deploy: connect GitHub repo to Vercel, confirm live
