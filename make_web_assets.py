"""Build the web-sized images the website needs, from the full-size originals.

Run from the project root after bonnie.py:
    python make_web_assets.py

Writes everything into site/public/:
    tiles/xs/   96px  WebP  - mosaic when zoomed out
    tiles/sm/   400px WebP  - mosaic when zoomed in, gallery grid
    tiles/lg/   1000px WebP - full-size photo view
    mosaic-preview.webp     - the finished mosaic, small (hero + mini-map)
    portrait.webp           - the target photo ("how it was made", step i)
    grid.png                - target reduced to one pixel per cell (step ii)

Each job is a function so it can be tested (tests/test_make_web_assets.py).
"""

import json
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # mosaic_output.jpg is ~240 megapixels

TILE_FOLDER = Path("square_images")
PUBLIC = Path("site/public")

TILE_SIZES = {"xs": (96, 70), "sm": (400, 78), "lg": (1000, 80)}  # name: (pixels, quality)
PREVIEW_WIDTH = 900


def save_tile_sizes(tile_path, tiles_dir, sizes=TILE_SIZES):
    """Save one tile photo as a square WebP at every size, e.g. tiles/xs/tile_001.webp."""
    original = Image.open(tile_path).convert("RGB")
    for name, (size, quality) in sizes.items():
        out_path = Path(tiles_dir) / name / (Path(tile_path).stem + ".webp")
        original.resize((size, size), Image.LANCZOS).save(out_path, "WEBP", quality=quality)


def make_preview(mosaic_path, out_path, width=PREVIEW_WIDTH):
    """A small copy of the finished mosaic, keeping its shape."""
    mosaic = Image.open(mosaic_path)
    height = round(width * mosaic.height / mosaic.width)
    mosaic.resize((width, height), Image.LANCZOS).save(out_path, "WEBP", quality=82)


def make_portrait(target_path, out_path):
    """The target photo, shrunk to fit within 900 x 1600."""
    portrait = Image.open(target_path).convert("RGB")
    portrait.thumbnail((900, 1600), Image.LANCZOS)
    portrait.save(out_path, "WEBP", quality=82)


def make_color_grid(target_path, cols, rows, out_path):
    """The target photo reduced to one pixel per mosaic cell (the site scales it up, pixelated)."""
    target = Image.open(target_path).convert("RGB")
    target.resize((cols, rows), Image.LANCZOS).save(out_path)


def main():
    # 1. Every tile photo, at three sizes
    for name in TILE_SIZES:
        (PUBLIC / "tiles" / name).mkdir(parents=True, exist_ok=True)

    tile_paths = sorted(TILE_FOLDER.glob("*.jpg"))
    for i, tile_path in enumerate(tile_paths, start=1):
        save_tile_sizes(tile_path, PUBLIC / "tiles")
        if i % 50 == 0 or i == len(tile_paths):
            print(f"tiles: {i}/{len(tile_paths)}")

    # 2. Small preview of the finished mosaic
    make_preview("mosaic_output.jpg", PUBLIC / "mosaic-preview.webp")
    print("saved mosaic-preview.webp")

    # 3. The target portrait, and the same photo reduced to one colour per cell
    make_portrait("target_photo/target_bonnie.jpg", PUBLIC / "portrait.webp")
    with open(PUBLIC / "mosaic.json") as f:
        mosaic_data = json.load(f)
    make_color_grid("target_photo/target_bonnie.jpg", mosaic_data["cols"], mosaic_data["rows"], PUBLIC / "grid.png")
    print("saved portrait.webp and grid.png")


if __name__ == "__main__":
    main()
