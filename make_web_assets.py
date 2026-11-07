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
"""

import json
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # mosaic_output.jpg is ~240 megapixels

tile_folder = Path("square_images")
public = Path("site/public")

TILE_SIZES = {"xs": (96, 70), "sm": (400, 78), "lg": (1000, 80)}  # name: (pixels, quality)

# 1. Every tile photo, at three sizes
for name, (size, quality) in TILE_SIZES.items():
    (public / "tiles" / name).mkdir(parents=True, exist_ok=True)

tile_paths = sorted(tile_folder.glob("*.jpg"))
for i, tile_path in enumerate(tile_paths, start=1):
    original = Image.open(tile_path).convert("RGB")
    for name, (size, quality) in TILE_SIZES.items():
        out_path = public / "tiles" / name / (tile_path.stem + ".webp")
        original.resize((size, size), Image.LANCZOS).save(out_path, "WEBP", quality=quality)
    if i % 50 == 0 or i == len(tile_paths):
        print(f"tiles: {i}/{len(tile_paths)}")

# 2. Small preview of the finished mosaic
mosaic = Image.open("mosaic_output.jpg")
preview_width = 900
preview_height = round(preview_width * mosaic.height / mosaic.width)
mosaic.resize((preview_width, preview_height), Image.LANCZOS).save(
    public / "mosaic-preview.webp", "WEBP", quality=82
)
print("saved mosaic-preview.webp")

# 3. The target portrait, and the same photo reduced to one colour per cell
target = Image.open("target_photo/target_bonnie.jpg").convert("RGB")
portrait = target.copy()
portrait.thumbnail((900, 1600), Image.LANCZOS)
portrait.save(public / "portrait.webp", "WEBP", quality=82)

with open(public / "mosaic.json") as f:
    mosaic_data = json.load(f)
target.resize((mosaic_data["cols"], mosaic_data["rows"]), Image.LANCZOS).save(public / "grid.png")
print("saved portrait.webp and grid.png")
