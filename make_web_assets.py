"""Build the web-sized images the website needs, from the full-size originals.

Run from the project root after bonnie.py:
    python make_web_assets.py

Writes everything into site/public/:
    tiles/xs/   96px  WebP  - mosaic when zoomed out
    tiles/sm/   400px WebP  - mosaic when zoomed in, gallery grid
    tiles/lg/   1000px WebP - full-size photo view
    mosaic-preview.webp     - the finished mosaic, small (hero + mini-map)
    portrait.webp           - the target photo ("how it was made", step i)
    hero-portrait.webp      - the target photo cropped for the hero's oval, head centred
    grid.png                - target reduced to one pixel per cell (step ii)

Each job is a function so it can be tested (tests/test_make_web_assets.py).
"""

import json
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None  # mosaic_output.jpg is ~240 megapixels

TILE_FOLDER = Path("square_images")
PUBLIC = Path("site/public")

TILE_SIZES = {"xs": (96, 70), "sm": (400, 78), "lg": (1000, 80)}  # name: (pixels, quality)
PREVIEW_WIDTH = 900

# The hero shows the portrait in an oval the shape of its frame (900 x 1592, see globals.css)
HERO_ASPECT = 900 / 1592
HERO_HEAD_X = 0.61  # Bonnie's head is 61% of the way across the target photo
HERO_EXTEND_TOP = 0.045  # soft background added above her ears, as a share of the photo's height


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


def make_hero_portrait(target_path, out_path, head_x=HERO_HEAD_X, extend_top=HERO_EXTEND_TOP):
    """The target photo cropped for the hero's oval: her head centred, with room above her ears.

    The photo has almost no space above Bonnie's head, and an oval is narrowest at the top,
    so a thin strip of soft background (a blurred, mirrored copy of the photo's own top edge)
    is added above it first. The crop is then centred on her head, in the oval's shape.
    """
    photo = Image.open(target_path).convert("RGB")
    w, h = photo.size

    # 1. Add the soft strip above, blending its seam into the photo
    extra = max(1, round(h * extend_top))
    strip = ImageOps.flip(photo.crop((0, 0, w, extra))).filter(ImageFilter.GaussianBlur(w * 0.022))
    tall = Image.new("RGB", (w, h + extra))
    tall.paste(strip, (0, 0))
    tall.paste(photo, (0, extra))
    seam = max(1, round(h * 0.04))
    band = tall.crop((0, max(0, extra - seam), w, extra + seam))
    fade = ImageOps.invert(Image.linear_gradient("L").resize(band.size))  # blurred at the top, sharp below
    tall.paste(Image.composite(band.filter(ImageFilter.GaussianBlur(w * 0.013)), band, fade), (0, max(0, extra - seam)))

    # 2. The widest crop in the hero's shape that keeps her head in the middle
    crop_w = 2 * min(head_x, 1 - head_x) * w
    crop_h = crop_w / HERO_ASPECT
    if crop_h > tall.height:  # (only for unusually wide photos)
        crop_h = tall.height
        crop_w = crop_h * HERO_ASPECT
    left = head_x * w - crop_w / 2
    hero = tall.crop((round(left), 0, round(left + crop_w), round(crop_h)))

    hero.thumbnail((900, 1600), Image.LANCZOS)
    hero.save(out_path, "WEBP", quality=82)


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
    make_hero_portrait("target_photo/target_bonnie.jpg", PUBLIC / "hero-portrait.webp")
    with open(PUBLIC / "mosaic.json") as f:
        mosaic_data = json.load(f)
    make_color_grid("target_photo/target_bonnie.jpg", mosaic_data["cols"], mosaic_data["rows"], PUBLIC / "grid.png")
    print("saved portrait.webp, hero-portrait.webp and grid.png")


if __name__ == "__main__":
    main()
