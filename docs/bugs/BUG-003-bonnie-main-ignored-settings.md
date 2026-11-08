# BUG-003 — `bonnie.main()` ignored changed settings

| Field | Value |
|---|---|
| **ID** | BUG-003 |
| **Status** | Fixed (before it was ever committed) |
| **Severity** | Medium — a setting could silently have no effect |
| **Found by** | UT-025 |
| **Found on** | 2026-11-07 |
| **Component** | `bonnie.py` (introduced while splitting it into functions for testing) |
| **Fixed in** | `d784136` |

## Summary

After `bonnie.py` was split into functions, `main()` ignored changes to the folder setting `TILE_FOLDER` and always read the default folder.

## Steps to reproduce

1. Point `bonnie.TILE_FOLDER` at a folder of two test tiles.
2. Call `bonnie.main()`.

## Expected

The mosaic is built from the two test tiles.

## Actual

It read the **real** 325 photos. UT-025 failed with:

```
AssertionError: assert {'tile_008.jp...180.jpg', ...} <= {'tile_001.jp...tile_002.jpg'}
  Extra items in the left set:
  'tile_204.jpg'
```

## Cause

Python fixes a function's default values when the function is **defined**:

```python
def load_tile_colors(folder=TILE_FOLDER): ...

def main():
    tile_colors = load_tile_colors()   # uses the folder captured at definition time
```

## Fix

`main()` passes every setting explicitly — `load_tile_colors(TILE_FOLDER)`, `grid_size(..., COLS)`, `render_mosaic(..., TILE_OUTPUT_SIZE)` — with a comment explaining why. The real mosaic was re-generated and confirmed byte-identical afterwards.

## Test that now covers it

**UT-025** — runs `main()` on a temporary folder and checks the layout uses only those tiles.
