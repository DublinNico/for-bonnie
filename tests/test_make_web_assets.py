"""Unit tests for make_web_assets.py — the web images the site serves.

The project's equivalent of "upload checks": every output is opened and checked
for its real file type, its size, and its contents.
"""

import json

import pytest
from PIL import Image

import make_web_assets as assets

RED, BLUE = (255, 0, 0), (0, 0, 255)


def make_tiles_dir(root):
    for name in assets.TILE_SIZES:
        (root / name).mkdir(parents=True)
    return root


def test_UT_026_each_tile_is_saved_as_a_real_webp_at_every_size(tmp_path):
    tiles_dir = make_tiles_dir(tmp_path / "tiles")
    source = tmp_path / "tile_007.jpg"
    Image.new("RGB", (1200, 1200), RED).save(source)

    assets.save_tile_sizes(source, tiles_dir)

    for name, (size, _quality) in assets.TILE_SIZES.items():
        out = Image.open(tiles_dir / name / "tile_007.webp")
        assert out.format == "WEBP"  # the real file type, not just the extension
        assert out.size == (size, size)


def test_UT_027_tile_contents_survive_resizing(tmp_path):
    tiles_dir = make_tiles_dir(tmp_path / "tiles")
    source = tmp_path / "tile_001.jpg"
    Image.new("RGB", (500, 500), BLUE).save(source)

    assets.save_tile_sizes(source, tiles_dir)

    r, g, b = Image.open(tiles_dir / "sm" / "tile_001.webp").convert("RGB").getpixel((200, 200))
    assert b > 200 and r < 40 and g < 40  # still blue (WebP is lossy, so allow a little drift)


def test_UT_028_tiles_with_transparency_or_palettes_are_converted_to_rgb(tmp_path):
    tiles_dir = make_tiles_dir(tmp_path / "tiles")
    source = tmp_path / "tile_002.png"
    Image.new("RGBA", (300, 300), (255, 0, 0, 128)).save(source)

    assets.save_tile_sizes(source, tiles_dir)

    assert Image.open(tiles_dir / "xs" / "tile_002.webp").mode == "RGB"


def test_UT_029_a_missing_tile_photo_fails_loudly(tmp_path):
    tiles_dir = make_tiles_dir(tmp_path / "tiles")
    with pytest.raises(FileNotFoundError):
        assets.save_tile_sizes(tmp_path / "does_not_exist.jpg", tiles_dir)


def test_UT_030_preview_is_900px_wide_and_keeps_the_mosaics_shape(tmp_path):
    mosaic = tmp_path / "mosaic.jpg"
    Image.new("RGB", (1800, 3200), RED).save(mosaic)

    assets.make_preview(mosaic, tmp_path / "preview.webp")

    out = Image.open(tmp_path / "preview.webp")
    assert out.format == "WEBP"
    assert out.size == (900, 1600)


def test_UT_031_portrait_fits_900x1600_and_small_photos_are_not_enlarged(tmp_path):
    big, small = tmp_path / "big.jpg", tmp_path / "small.jpg"
    Image.new("RGB", (2252, 4000), RED).save(big)
    Image.new("RGB", (300, 400), RED).save(small)

    assets.make_portrait(big, tmp_path / "big.webp")
    assets.make_portrait(small, tmp_path / "small.webp")

    assert Image.open(tmp_path / "big.webp").size == (900, 1599)  # shape kept, fits the box
    assert Image.open(tmp_path / "small.webp").size == (300, 400)  # never upscaled


def test_UT_032_colour_grid_has_one_pixel_per_mosaic_cell(tmp_path):
    target = Image.new("RGB", (200, 100), RED)
    target.paste(BLUE, (100, 0, 200, 100))  # left red, right blue
    target_path = tmp_path / "target.png"
    target.save(target_path)

    assets.make_color_grid(target_path, cols=4, rows=2, out_path=tmp_path / "grid.png")

    grid = Image.open(tmp_path / "grid.png")
    assert grid.format == "PNG"
    assert grid.size == (4, 2)
    assert grid.getpixel((0, 0)) == RED
    assert grid.getpixel((3, 1)) == BLUE


def test_UT_033_main_builds_every_asset_from_the_project_folders(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)  # main() uses paths relative to the project root
    (tmp_path / "square_images").mkdir()
    for i in (1, 2):
        Image.new("RGB", (50, 50), RED).save(tmp_path / "square_images" / f"tile_00{i}.jpg")
    Image.new("RGB", (90, 160), BLUE).save("mosaic_output.jpg")
    (tmp_path / "target_photo").mkdir()
    Image.new("RGB", (90, 160), RED).save("target_photo/target_bonnie.jpg")
    (tmp_path / "site" / "public").mkdir(parents=True)
    (tmp_path / "site" / "public" / "mosaic.json").write_text(json.dumps({"cols": 3, "rows": 5, "grid": []}))

    assets.main()

    public = tmp_path / "site" / "public"
    assert sorted(p.name for p in (public / "tiles" / "lg").iterdir()) == ["tile_001.webp", "tile_002.webp"]
    assert Image.open(public / "mosaic-preview.webp").width == 900
    assert Image.open(public / "portrait.webp").format == "WEBP"
    assert Image.open(public / "grid.png").size == (3, 5)  # read from mosaic.json
