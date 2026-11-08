# TODO — Bonnie Photomosaic Web App

## Photos and setup
- [x] venv + Pillow set up and confirmed (rebuilt 2026-11-07 on Python 3.12 + Pillow 13 after the old base Python was removed)
- [x] Write `rename_tiles.py`, validate on `images_test/` (13 photos)
- [x] Run `rename_tiles.py` for real against `images/` (351 photos; 325 square crops in `square_images/` are used as tiles)
- [x] Add the target photo (big image the mosaic recreates) — `target_photo/target_bonnie.jpg`

## Tutorial
 - [ ] Create a comprehensive tutorial for the website build. 

## Pillow fundamentals (learning exercises — see TEACHING.md)
- [ ] Pillow fundamentals, applied directly to real tiles/target (not throwaway drills):
  - [ ] Open an image; inspect `.size`, `.mode`, `.format`
  - [ ] Resize + save; compare `LANCZOS` vs `NEAREST`
  - [ ] Centre-crop a photo to a square (tiles need to be square to grid cleanly)
  - [ ] `Image.new` + `.paste` — build a small grid from a few tiles
  - [ ] Average colour of an image via the `.resize((1,1))` trick

## Mosaic
- [x] Mosaic-assembly algorithm:
  - [x] Divide the target photo into a grid of cells
  - [x] Compute each cell's average colour
  - [x] Compute each tile photo's average colour (once, cache it)
  - [x] Match each cell to its nearest-colour tile
  - [x] Paste matched tiles into one big canvas
- [x] Reduce tile repeats in the mosaic — usage-count penalty (`REPEAT_PENALTY`)
  plus a spatial cooldown (penalise reuse near a tile's prior positions)
  added to the colour-distance score in the matching loop
- [x] Tune settings: 65 columns (65 × 115 grid), 180px output tiles, `REPEAT_PENALTY = 80` (PR #1)

## Website
- [x] ~~Wrap the mosaic builder in a Vercel Python serverless function~~ —
  **replaced**: the mosaic is deterministic, so `bonnie.py` now exports the
  layout once to `site/public/mosaic.json` (cols, rows, tile per cell) and the
  site is fully static. Same JSON-metadata idea, no server needed (PR #2)
- [x] `make_web_assets.py`: web-sized WebP tiles (96 / 400 / 1000 px), preview,
  portrait and colour-grid images in `site/public/` — 185 MB → 37 MB (PR #3)
- [x] Design mockups, desktop + mobile (`docs/mockups/`)
- [x] Frontend (Next.js 16) — PR #3:
  - [x] Hero with the portrait between "Bon | nie"
  - [x] Canvas mosaic explorer: pan, pinch / Ctrl+scroll / buttons to zoom,
    mini-map, tap a square to identify the photo
  - [x] "How it was made" section
  - [x] Gallery of all photos with sorting
  - [x] Photo view with "Show in mosaic" (highlights every placement)
  - [x] Dedication with polaroids
  - [x] Mobile layout
- [x] Favicon (`make_favicon.py`) — PR #5

## Testing and security
- [x] Test setup: Vitest + Testing Library + happy-dom, Playwright, pytest, Supertest
- [x] Unit tests: 47 Python (UT-001..047), 61 frontend (FT-001..061)
- [x] Integration tests over HTTP (IT-001..022) and security tests (ST-001..015)
- [x] End-to-end journeys on desktop + 375px phone (ET-001..019)
- [x] Fixed bugs the tests found: hero title blocked the "Explore the mosaic" link on desktop;
  `rename_tiles.py` could overwrite photos
- [x] Security headers, no `X-Powered-By`; Next.js 16.3.1 -> 16.4.5 (critical advisories)

## Checks and deployment
- [x] CI: GitHub Actions runs every test suite (Python + website) on every PR
- [x] CodeRabbit config (skip images, review stacked PRs) — in PR #3
- [x] Vercel project `nicoletti-dev/for-bonnie` connected to GitHub (root `site`, Node 24)
- [ ] Merge the stacked PRs in order (#1 → #2 → #3 → #4 → #5 → docs) so `main` holds the site
- [ ] Decide: keep https://for-bonnie.vercel.app public, add a password, or hide it until merged
- [ ] Test touch gestures on a real phone (pinch zoom, swipe, page scroll past the mosaic)
- [ ] Check CodeRabbit's review once the PRs target `main`
