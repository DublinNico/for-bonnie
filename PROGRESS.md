# Progress — Bonnie Photomosaic

## Environment
- venv at `venv/` with Pillow 12.3.0 installed and confirmed importable.

## Tile photos
- `images/` holds 351 tile photos, renamed to `tile_001.jpg` through
  `tile_351.jpg` via `rename_tiles.py` (validated first on `images_test/`,
  then run for real). Done.

## Target photo
- In place at `target_photo/target_bonnie.jpg`.

## Misc
- `bonnie.py` still has early throwaway test code (`Image.open` +
  `.rotate()` + `.show()`) — not part of the real pipeline, safe to
  overwrite/repurpose later.

## Teaching format
See `TEACHING.md` for the full curriculum/rules. Key recalibration during
this build: for libraries the student has never touched (e.g. `pathlib`),
give a complete small worked example up front rather than a list of
methods to assemble from scratch, and explain code in plain conversational
language rather than glossary-style definitions.
