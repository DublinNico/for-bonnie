"""Build the photomosaic of Bonnie and export its layout for the website.

    python bonnie.py

1. Work out the average colour of every tile photo in square_images/.
2. Split target_photo/target_bonnie.jpg into a grid and match each cell to the
   closest-coloured tile, with penalties so photos don't repeat or clump.
3. Save the full mosaic (mosaic_output.jpg) and its layout
   (site/public/mosaic.json) for the website.

Each step is a small function so it can be tested on its own (tests/test_bonnie.py).
"""

import json
from pathlib import Path

from PIL import Image

TILE_FOLDER = Path("square_images")
TARGET_PATH = Path("target_photo/target_bonnie.jpg")
OUTPUT_PATH = Path("mosaic_output.jpg")
JSON_PATH = Path("site/public/mosaic.json")

COLS = 65  # cells across; the number of rows follows from the photo's shape
TILE_OUTPUT_SIZE = 180  # pixels per tile in mosaic_output.jpg
REPEAT_PENALTY = 80  # added to a tile's score for every time it's already been used
COOLDOWN_DISTANCE = 8  # reusing a tile fewer than this many cells away...
COOLDOWN_PENALTY = 5000  # ...adds this much to its score


def average_color(image):
    """Average colour of an image: shrinking it to one pixel blends every pixel together."""
    return image.resize((1, 1), Image.LANCZOS).getpixel((0, 0))


def color_distance(color1, color2):
    """Squared distance between two RGB colours. No square root needed: it's only used to compare."""
    r1, g1, b1 = color1
    r2, g2, b2 = color2
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2


def tile_score(cell_color, tile_color, times_used, last_position, row, col):
    """How well a tile suits a cell — lower is better.

    Colour distance, plus REPEAT_PENALTY for each earlier use, plus COOLDOWN_PENALTY
    if the tile was last used within COOLDOWN_DISTANCE cells of (row, col).
    `last_position` is (row, col) of the tile's last use, or None if never used.
    """
    score = color_distance(cell_color, tile_color)
    score += times_used * REPEAT_PENALTY
    if last_position is not None:
        last_row, last_col = last_position
        cells_away = ((row - last_row) ** 2 + (col - last_col) ** 2) ** 0.5
        if cells_away < COOLDOWN_DISTANCE:
            score += COOLDOWN_PENALTY
    return score


def pick_tile(cell_color, tile_colors, usage, last_positions, row, col):
    """The tile with the lowest score for this cell. On a tie, the earlier tile wins."""
    best_tile = None
    best_score = None
    for tile, tile_color in tile_colors.items():
        score = tile_score(cell_color, tile_color, usage.get(tile, 0), last_positions.get(tile), row, col)
        if best_score is None or score < best_score:
            best_score = score
            best_tile = tile
    return best_tile


def grid_size(image_size, cols=COLS):
    """(cols, rows) for a photo of `image_size` (width, height), keeping its shape."""
    width, height = image_size
    aspect_ratio = height / width
    return cols, round(cols * aspect_ratio)


def build_grid(target_image, tile_colors, cols=COLS):
    """Match every cell of the target photo to a tile.

    Returns the chosen tiles in row-major order (row 0 left to right, then row 1, ...).
    """
    cols, rows = grid_size(target_image.size, cols)
    cell_width = target_image.width // cols
    cell_height = target_image.height // rows

    usage = {tile: 0 for tile in tile_colors}
    last_positions = {}
    grid = []
    for row in range(rows):
        for col in range(cols):
            left = col * cell_width
            top = row * cell_height
            cell = target_image.crop((left, top, left + cell_width, top + cell_height))
            best_tile = pick_tile(average_color(cell), tile_colors, usage, last_positions, row, col)
            usage[best_tile] += 1
            last_positions[best_tile] = (row, col)
            grid.append(best_tile)
    return grid


def render_mosaic(grid, cols, tile_size=TILE_OUTPUT_SIZE):
    """Paste every chosen tile into one big image. Each tile is resized once, then reused."""
    rows = len(grid) // cols
    mosaic = Image.new("RGB", (tile_size * cols, tile_size * rows))
    resized = {}
    for i, tile in enumerate(grid):
        if tile not in resized:
            resized[tile] = Image.open(tile).resize((tile_size, tile_size), Image.LANCZOS)
        row, col = divmod(i, cols)
        mosaic.paste(resized[tile], (col * tile_size, row * tile_size))
    return mosaic


def export_layout(grid, cols, rows, path):
    """Write the layout the website reads: grid size + the tile filename for every cell."""
    if len(grid) != cols * rows:
        raise ValueError(f"expected {cols * rows} cells, got {len(grid)}")
    data = {
        "cols": cols,
        "rows": rows,
        "grid": [Path(tile).name for tile in grid],
    }
    with open(path, "w") as f:
        json.dump(data, f)


def load_tile_colors(folder=TILE_FOLDER):
    """{tile path: average colour} for every .jpg in the folder."""
    return {path: average_color(Image.open(path)) for path in folder.glob("*.jpg")}


def main():
    # Settings are passed explicitly: a default like `folder=TILE_FOLDER` is fixed when the
    # function is defined, so it wouldn't see a changed setting (e.g. in a test)
    tile_colors = load_tile_colors(TILE_FOLDER)
    target_image = Image.open(TARGET_PATH)
    cols, rows = grid_size(target_image.size, COLS)

    grid = build_grid(target_image, tile_colors, cols)
    render_mosaic(grid, cols, TILE_OUTPUT_SIZE).save(OUTPUT_PATH)
    export_layout(grid, cols, rows, JSON_PATH)

    print(f"Saved {JSON_PATH} ({cols} x {rows} = {len(grid)} cells)")


# Only build the mosaic when run as a script, not when a test imports this file
if __name__ == "__main__":
    main()
