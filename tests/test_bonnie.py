"""Unit tests for bonnie.py — the mosaic matching logic ("the backend").

Every test builds its own tiny images, so expected answers are easy to see and
the real photos are never touched.
"""

import json

import pytest
from PIL import Image

import bonnie
from bonnie import COOLDOWN_DISTANCE, COOLDOWN_PENALTY, REPEAT_PENALTY

RED, GREEN, BLUE, YELLOW = (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)


def solid(color, size=(10, 10)):
    return Image.new("RGB", size, color)


def save_tiles(folder, colors, ext="png"):
    """Write one solid-colour tile per colour; returns {path: colour} in that order."""
    tiles = {}
    for i, color in enumerate(colors, 1):
        path = folder / f"tile_{i:03d}.{ext}"
        solid(color).save(path)
        tiles[path] = color
    return tiles


# --- average_color ---------------------------------------------------------------


def test_UT_001_average_color_of_a_solid_image_is_that_colour():
    assert bonnie.average_color(solid((12, 34, 56))) == (12, 34, 56)


def test_UT_002_average_color_blends_all_pixels():
    image = Image.new("RGB", (10, 10), (0, 0, 0))
    image.paste((255, 255, 255), (5, 0, 10, 10))  # right half white
    r, g, b = bonnie.average_color(image)
    assert all(abs(c - 128) <= 2 for c in (r, g, b))


# --- color_distance --------------------------------------------------------------


def test_UT_003_color_distance_is_zero_for_identical_colours():
    assert bonnie.color_distance(RED, RED) == 0


def test_UT_004_color_distance_is_the_squared_rgb_distance():
    assert bonnie.color_distance((0, 0, 0), (3, 4, 0)) == 25
    assert bonnie.color_distance((10, 20, 30), (11, 22, 33)) == 1 + 4 + 9


def test_UT_005_color_distance_is_symmetric():
    assert bonnie.color_distance(RED, (40, 50, 60)) == bonnie.color_distance((40, 50, 60), RED)


# --- tile_score: colour + repeat penalty + cooldown --------------------------------


def test_UT_006_score_of_an_unused_tile_is_just_the_colour_distance():
    assert bonnie.tile_score((0, 0, 0), (3, 4, 0), 0, None, 0, 0) == 25


def test_UT_007_score_adds_the_repeat_penalty_for_every_earlier_use():
    assert bonnie.tile_score(RED, RED, 3, None, 0, 0) == 3 * REPEAT_PENALTY


def test_UT_008_score_adds_the_cooldown_penalty_when_last_used_nearby():
    assert bonnie.tile_score(RED, RED, 1, (0, 0), 0, 1) == REPEAT_PENALTY + COOLDOWN_PENALTY


def test_UT_009_no_cooldown_at_exactly_the_cooldown_distance():
    # "closer than" COOLDOWN_DISTANCE: exactly that far away is allowed
    assert bonnie.tile_score(RED, RED, 1, (0, 0), 0, COOLDOWN_DISTANCE) == REPEAT_PENALTY


def test_UT_010_cooldown_uses_straight_line_distance_including_diagonals():
    # (5, 6) away is ~7.8 cells -> too close; (6, 6) away is ~8.5 cells -> fine
    assert bonnie.tile_score(RED, RED, 0, (0, 0), 5, 6) == COOLDOWN_PENALTY
    assert bonnie.tile_score(RED, RED, 0, (0, 0), 6, 6) == 0


# --- pick_tile ---------------------------------------------------------------------


def test_UT_011_pick_tile_chooses_the_closest_colour():
    tiles = {"red": RED, "green": GREEN, "blue": BLUE}
    assert bonnie.pick_tile((250, 10, 10), tiles, {}, {}, 0, 0) == "red"


def test_UT_012_pick_tile_breaks_ties_in_favour_of_the_earlier_tile():
    tiles = {"first": RED, "second": RED}
    assert bonnie.pick_tile(RED, tiles, {}, {}, 0, 0) == "first"


def test_UT_013_repeat_penalty_lets_a_close_second_win():
    tiles = {"exact": RED, "close": (250, 0, 0)}  # 'close' is 25 away; 'exact' used once costs 80
    assert bonnie.pick_tile(RED, tiles, {"exact": 1}, {}, 0, 0) == "close"


def test_UT_014_repeat_penalty_does_not_beat_a_much_better_colour():
    tiles = {"exact": RED, "wrong": BLUE}
    assert bonnie.pick_tile(RED, tiles, {"exact": 5}, {}, 0, 0) == "exact"


def test_UT_015_cooldown_steers_away_from_a_tile_just_used_next_door():
    tiles = {"exact": RED, "close": (240, 0, 0)}  # 225 away, far less than the cooldown penalty
    assert bonnie.pick_tile(RED, tiles, {}, {"exact": (0, 0)}, 0, 1) == "close"


def test_UT_016_tiles_missing_from_the_usage_counts_count_as_unused():
    tiles = {"a": RED, "b": BLUE}
    assert bonnie.pick_tile(BLUE, tiles, {}, {}, 0, 0) == "b"


# --- grid_size / build_grid -----------------------------------------------------------


def test_UT_017_grid_size_keeps_the_photos_shape():
    assert bonnie.grid_size((100, 200), 10) == (10, 20)
    assert bonnie.grid_size((2252, 4000)) == (65, 115)  # the real target photo


def test_UT_018_build_grid_matches_each_cell_in_row_major_order():
    target = Image.new("RGB", (40, 40))
    target.paste(RED, (0, 0, 20, 20))
    target.paste(GREEN, (20, 0, 40, 20))
    target.paste(BLUE, (0, 20, 20, 40))
    target.paste(YELLOW, (20, 20, 40, 40))
    tiles = {"red": RED, "green": GREEN, "blue": BLUE, "yellow": YELLOW}

    assert bonnie.build_grid(target, tiles, cols=2) == ["red", "green", "blue", "yellow"]


def test_UT_019_build_grid_avoids_repeating_a_tile_side_by_side():
    target = solid(RED, (30, 10))  # 3 x 1 cells, all red
    tiles = {"exact": RED, "close": (245, 0, 0)}
    # Cell 2: both tiles are in cooldown, so the better colour wins again
    assert bonnie.build_grid(target, tiles, cols=3) == ["exact", "close", "exact"]


# --- render_mosaic ---------------------------------------------------------------------


def test_UT_020_render_mosaic_places_each_tile_in_its_cell(tmp_path):
    tiles = list(save_tiles(tmp_path, [RED, GREEN, BLUE, YELLOW]))
    mosaic = bonnie.render_mosaic(tiles, cols=2, tile_size=8)

    assert mosaic.size == (16, 16)
    assert mosaic.getpixel((4, 4)) == RED  # top-left
    assert mosaic.getpixel((12, 4)) == GREEN  # top-right
    assert mosaic.getpixel((4, 12)) == BLUE  # bottom-left
    assert mosaic.getpixel((12, 12)) == YELLOW  # bottom-right


def test_UT_021_render_mosaic_opens_each_tile_only_once(tmp_path, monkeypatch):
    red, blue = save_tiles(tmp_path, [RED, BLUE])
    opened = []
    real_open = Image.open
    monkeypatch.setattr(bonnie.Image, "open", lambda path: opened.append(path) or real_open(path))

    bonnie.render_mosaic([red, blue, red, red, blue, red], cols=3, tile_size=4)

    assert sorted(opened) == sorted([red, blue])


# --- export_layout -----------------------------------------------------------------------


def test_UT_022_export_layout_writes_size_and_filenames_only(tmp_path):
    out = tmp_path / "mosaic.json"
    bonnie.export_layout([tmp_path / "tile_001.jpg", tmp_path / "tile_002.jpg"], cols=2, rows=1, path=out)

    assert json.loads(out.read_text()) == {"cols": 2, "rows": 1, "grid": ["tile_001.jpg", "tile_002.jpg"]}


def test_UT_023_export_layout_refuses_a_grid_of_the_wrong_size(tmp_path):
    out = tmp_path / "mosaic.json"
    with pytest.raises(ValueError, match="expected 4 cells, got 3"):
        bonnie.export_layout(["a", "b", "c"], cols=2, rows=2, path=out)
    assert not out.exists()  # nothing half-written


# --- load_tile_colors / main ------------------------------------------------------------


def test_UT_024_load_tile_colors_reads_only_jpg_files(tmp_path):
    save_tiles(tmp_path, [RED, BLUE], ext="jpg")
    solid(GREEN).save(tmp_path / "not_a_tile.png")
    (tmp_path / "notes.txt").write_text("hello")

    colors = bonnie.load_tile_colors(tmp_path)

    assert sorted(path.name for path in colors) == ["tile_001.jpg", "tile_002.jpg"]
    red = colors[tmp_path / "tile_001.jpg"]
    assert all(abs(a - b) <= 3 for a, b in zip(red, RED))  # JPEG may shift colours slightly


def test_UT_025_main_builds_the_mosaic_and_a_matching_layout(tmp_path, monkeypatch):
    # Real settings (65 columns, 180px tiles) with a short, wide target -> just 1 row
    tiles_dir = tmp_path / "square_images"
    tiles_dir.mkdir()
    save_tiles(tiles_dir, [RED, BLUE], ext="jpg")
    target_path = tmp_path / "target.png"
    solid(RED, (650, 10)).save(target_path)

    monkeypatch.setattr(bonnie, "TILE_FOLDER", tiles_dir)
    monkeypatch.setattr(bonnie, "TARGET_PATH", target_path)
    monkeypatch.setattr(bonnie, "OUTPUT_PATH", tmp_path / "out.jpg")
    monkeypatch.setattr(bonnie, "JSON_PATH", tmp_path / "mosaic.json")

    bonnie.main()

    layout = json.loads((tmp_path / "mosaic.json").read_text())
    assert (layout["cols"], layout["rows"]) == (65, 1)
    assert len(layout["grid"]) == 65
    assert set(layout["grid"]) <= {"tile_001.jpg", "tile_002.jpg"}
    assert Image.open(tmp_path / "out.jpg").size == (65 * 180, 180)
