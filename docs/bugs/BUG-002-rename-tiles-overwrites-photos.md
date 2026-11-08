# BUG-002 — `rename_tiles.py` could overwrite a photo or crash

| Field | Value |
|---|---|
| **ID** | BUG-002 |
| **Status** | Fixed |
| **Severity** | High — silent data loss on macOS/Linux |
| **Found by** | UT-044 (written while unit testing, first as an expected failure) |
| **Found on** | 2026-11-07 |
| **Component** | `rename_tiles.py` |
| **Fixed in** | `20c7226` |

## Summary

Running `rename_tiles.py` on a folder that already contained a `tile_###` file could rename another photo onto that name: a crash part-way through on Windows, and a silently overwritten photo on macOS/Linux.

## Steps to reproduce

1. Make a folder containing `a_new_photo.jpg` and `tile_001.jpg`.
2. Run `rename_tiles(folder)`.

## Expected

Both photos are kept, renamed to `tile_001.jpg` and `tile_002.jpg`.

## Actual

`a_new_photo.jpg` is renamed first, to `tile_001.jpg` — a name that's already taken:

- Windows: `FileExistsError`, leaving the folder half-renamed.
- macOS/Linux: `rename` replaces the existing file — the original `tile_001.jpg` photo is lost.

## Cause

```python
for i, item in enumerate(folder.iterdir(), 1):
    item.rename(folder / f"tile_{i:03d}{item.suffix}")
```

It renamed files one at a time, in place, while iterating — so a new name could collide with a file not yet renamed. (Renaming while iterating a directory can also make some file systems visit a file twice.) Sub-folders were renamed too.

## Fix

`20c7226`: take a snapshot of the files first, move every file to a unique temporary name (`.renaming-<uuid>-<n>`), then to its final `tile_###` name — the old names are all free by then, so nothing can collide. Sub-folders are skipped.

## Test that now covers it

- **UT-044** — `a_new_photo.jpg`, `tile_001.jpg`, `tile_002.jpg`, `zzz.jpg` → all four survive. It was marked `xfail` before the fix and is a normal passing test after it.
- **UT-047** — sub-folders are left alone.
- **TC-WB-005** — manual white-box case R3.
