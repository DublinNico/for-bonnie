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

1. **Cache every tile's average colour once, up front.** Loop over the 351
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
