# TC-BB-EP-004 — Mosaic data loader inputs

| Field | Value |
|---|---|
| **Test ID** | TC-BB-EP-004 |
| **Technique** | Black-box — equivalence partitioning |
| **Component** | Data loader (`site/app/lib/load-mosaic.ts`, runs at build time) |
| **Objective** | The loader accepts consistent data, rejects data that points at missing images, and is unaffected by stray files |
| **Executed** | 2026-11-08 — the real `loadMosaic()` run on throwaway `public/` folders (Node 24); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-020 – FT-025, ST-015 |

## Partitions

| # | Partition | Valid / invalid | Expected |
|---|---|---|---|
| E1 | Every name in `mosaic.json` has a web image | valid | loads; grid of photo indexes; usage counted |
| E2 | A name with no web image | invalid | build stops with a clear message |
| E3 | Extra non-WebP files in the tile folder | valid | ignored |
| E4 | A photo the mosaic never uses | valid | still listed, with 0 uses |

## Cases

| Case | Input | Expected | Result |
|---|---|---|---|
| E1 | grid `tile_001.jpg, tile_002.jpg`; files `tile_001.webp, tile_002.webp` | loads, both used once | `grid [0,1]`, photos 1 and 2 with `uses: 1` — **Pass** |
| E2 | grid `tile_001.jpg, tile_404.jpg`; files `tile_001.webp` | error | `ERROR: tile_404.jpg is in mosaic.json but has no web image. Run make_web_assets.py.` — **Pass** |
| E3 | grid `tile_001.jpg`; files `tile_001.webp, notes.txt, thumbs.db` | non-WebP ignored | `grid [0]`, only `tile_001` listed — **Pass** |
| E4 | grid `tile_001.jpg`; files `tile_001.webp, tile_002.webp` | `tile_002` kept with 0 uses | photos `tile_001` (1 use), `tile_002` (`uses: 0`) — **Pass** |

**Overall: Pass (4/4)**
