# Bonnie Photomosaic — Build Guide

Running notes on how the mosaic gets built, explained piece by piece. Only
updated when explicitly asked to add to it.

## Average colour via the `.resize((1,1))` trick

Resizing an image down to a single pixel forces Pillow's resampling filter
to blend every pixel's colour together — that one remaining pixel's RGB
value is effectively the average colour of the whole image.

```python
tiny = image.resize((1, 1))
avg_color = tiny.getpixel((0, 0))
```

- `image.resize((1, 1))` — shrinks the whole image down to a single pixel.
  The resampling filter blends all source pixels into that one output
  pixel, which is exactly an average.
- `.getpixel((0, 0))` — reads the colour value of that one pixel. For an
  RGB image this comes back as a tuple like `(134, 98, 71)`.

No manual pixel-summing loop needed — Pillow's resize does the averaging.

## Mosaic-assembly algorithm

1. **Cache every tile's average colour once, up front.** Loop over the 325
   tiles in `square_images/`, compute each one's average colour with the
   trick above, and store it as something like
   `{tile_path: (r, g, b)}`. This only needs to happen once total, not
   once per target cell.
2. **Divide the target photo into a grid.** Decide how many cells
   across/down you want (this sets the mosaic's resolution — more cells =
   finer detail but more tiles used). Each cell is a `.crop()` box on the
   target image.
3. **Compute each cell's average colour** — same `.resize((1,1))` trick,
   applied to the cropped cell instead of a whole tile.
4. **Match each cell to the closest tile by colour.** For a given cell's
   `(r, g, b)`, compare it against every cached tile colour and pick the
   tile with the smallest colour distance — typically Euclidean distance
   in RGB: `(r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2` (no need to
   square-root it since you're only comparing, not measuring).
5. **Paste the matched tile into a big output canvas** at that cell's
   position — same `Image.new` + `.paste` pattern as a small test grid,
   just looping over every cell instead of a few fixed positions.

## Reducing repeats: penalty + cooldown

Pure "closest colour wins" picks the same few photos over and over — every
patch of brown coat would be the same brown photo. So the score isn't just
colour distance any more; it's colour distance **plus penalties**:

```python
distance += tile_usage[tile_path] * REPEAT_PENALTY      # used a lot? cost more
if cell_distance < COOLDOWN_DISTANCE:                   # used nearby? cost a lot more
    distance += COOLDOWN_PENALTY
```

- **Usage penalty** (`REPEAT_PENALTY = 80`) — every time a photo is used,
  it gets a little more "expensive", so slightly-worse-matching photos start
  to win. Spreads use across all 325 photos (324 end up used).
- **Spatial cooldown** (`COOLDOWN_DISTANCE = 8`, `COOLDOWN_PENALTY = 5000`) —
  if a photo was last used fewer than 8 cells away, add a big penalty, so the
  same photo doesn't clump in one spot.

The lowest total score still wins; the penalties just change what "best"
means.

## Exporting the layout as JSON

The website needs to rebuild the mosaic itself (so it can zoom into real
photos), which means it needs to know **which photo goes in each cell**.
Inside the loop, `bonnie.py` records the winner's filename:

```python
grid.append(best_tile.name)   # Path("square_images/tile_042.jpg").name -> "tile_042.jpg"
```

…and at the end writes it out with Python's `json` module:

```python
mosaic_data = {"cols": cols, "rows": rows, "grid": grid}
with open("site/public/mosaic.json", "w") as f:
    json.dump(mosaic_data, f)
```

`grid` is **row-major**: row 0 left to right, then row 1, and so on. So the
cell at `(row, col)` is `grid[row * cols + col]`, and going the other way,
entry `i` is at `row = i // cols`, `col = i % cols`.

Same photos + same settings always give the same layout, so this runs once on
your PC — the website never has to compute anything, and it can be a fully
static site.

## Web-sized images (`make_web_assets.py`)

The originals are 185 MB — far too heavy for a browser. Each photo is saved
again as WebP (much smaller than JPEG at the same quality) at three sizes,
because each is needed at a different moment:

| Size | Folder | Used when |
|------|--------|-----------|
| 96 px | `tiles/xs/` | the mosaic is a little zoomed in |
| 400 px | `tiles/sm/` | zoomed in a lot, and the gallery |
| 1000 px | `tiles/lg/` | one photo opened full size |

Only what's needed gets downloaded: zoomed all the way out, the site shows
one small preview image of the whole mosaic instead of 7,475 photos.

## How the website draws the mosaic

The explorer is a single `<canvas>` — one drawing surface — rather than
7,475 separate `<img>` elements, which would be slow to move around.

**The view is three numbers:** `scale` (how many screen pixels one cell
takes up) and `x`, `y` (where the mosaic's top-left corner sits on screen).
Every cell's screen position follows from those:

```
screen x = x + col * scale
screen y = y + row * scale
```

Panning changes `x` / `y`; zooming changes `scale` while keeping the point
under your finger or cursor still.

**Only draw what's visible.** The range of on-screen columns is worked out
from the view, e.g. `firstCol = floor(-x / scale)`. Zoomed in, that might be
20 × 12 cells instead of all 7,475.

**Pick the right detail level:**
1. Always draw the small preview of the whole mosaic first — instant.
2. If cells are bigger than ~16 pixels, draw the real 96 px photos over it.
3. If cells are bigger than ~100 pixels, swap in the 400 px photos.

Photos load as they're needed and the canvas redraws as each one arrives.

**Tapping a cell** reverses the formula — `col = floor((tapX - x) / scale)`
— then looks up `grid[row * cols + col]` to find which photo it is.
