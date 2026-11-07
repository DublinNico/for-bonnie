"""Unit tests for make_favicon.py — the font check and the icon drawing."""

import shutil
from pathlib import Path

import pytest
from PIL import Image, ImageFont

import make_favicon as favicon

ROOT = Path(__file__).resolve().parent.parent
NEXT_FONTS = ROOT / "site" / ".next" / "static" / "media"


def instrument_serif_files():
    """The Instrument Serif Regular files Next.js downloaded (one per character subset)."""
    found = []
    for path in sorted(NEXT_FONTS.glob("*.woff2")):
        try:
            if ImageFont.truetype(str(path), 10).getname() == ("Instrument Serif", "Regular"):
                found.append(path)
        except OSError:
            continue
    return found


needs_site_build = pytest.mark.skipif(
    not instrument_serif_files(), reason="needs the fonts from a site build: run `npm run build` in site/"
)


@pytest.fixture
def font_path():
    return next(p for p in instrument_serif_files() if favicon.has_glyph(ImageFont.truetype(str(p), 40), "B"))


# --- has_glyph --------------------------------------------------------------------------


def test_UT_034_has_glyph_is_true_for_a_letter_the_font_contains():
    assert favicon.has_glyph(ImageFont.load_default(size=40), "B")


def test_UT_035_has_glyph_is_false_for_a_character_the_font_lacks():
    assert not favicon.has_glyph(ImageFont.load_default(size=40), "中")


# --- find_instrument_serif --------------------------------------------------------------


@needs_site_build
def test_UT_036_finds_the_font_subset_that_really_contains_B(tmp_path, monkeypatch):
    media = tmp_path / "site" / ".next" / "static" / "media"
    media.mkdir(parents=True)
    for path in instrument_serif_files():  # both subsets: one has "B", one doesn't
        shutil.copy(path, media / path.name)
    (media / "broken.woff2").write_bytes(b"not a font")  # unreadable files are skipped
    monkeypatch.chdir(tmp_path)

    chosen = favicon.find_instrument_serif()

    assert favicon.has_glyph(ImageFont.truetype(str(chosen), 40), "B")


def test_UT_037_stops_with_a_clear_message_when_no_usable_font_exists(tmp_path, monkeypatch):
    (tmp_path / "site" / ".next" / "static" / "media").mkdir(parents=True)
    monkeypatch.chdir(tmp_path)

    with pytest.raises(SystemExit, match="Run `npm run build`"):
        favicon.find_instrument_serif()


# --- draw_icon -------------------------------------------------------------------------


@needs_site_build
@pytest.mark.parametrize("size", [16, 48, 180, 512])
def test_UT_038_icons_are_drawn_at_the_requested_size(font_path, size):
    icon = favicon.draw_icon(size, font_path)
    assert icon.size == (size, size)
    assert icon.mode == "RGBA"


@needs_site_build
def test_UT_039_rounded_icons_have_transparent_corners_square_ones_do_not(font_path):
    rounded = favicon.draw_icon(128, font_path)
    square = favicon.draw_icon(128, font_path, rounded=False)

    assert rounded.getpixel((0, 0))[3] == 0  # see-through corner
    assert square.getpixel((0, 0))[3] == 255  # solid corner (iOS rounds it itself)


@needs_site_build
def test_UT_040_icon_uses_the_site_colours(font_path):
    icon = favicon.draw_icon(256, font_path).convert("RGB")
    colours = {colour for _count, colour in icon.getcolors(256 * 256)}

    assert icon.getpixel((128, 6)) == favicon.UMBER  # background (top edge)
    assert icon.getpixel((256 - 46, 256 - 46)) == favicon.AMBER  # the mosaic tile, bottom-right
    assert favicon.CREAM in colours  # the "B"


# --- main ------------------------------------------------------------------------------


@needs_site_build
def test_UT_041_main_writes_all_three_icon_files(tmp_path, monkeypatch):
    media = tmp_path / "site" / ".next" / "static" / "media"
    media.mkdir(parents=True)
    for path in instrument_serif_files():
        shutil.copy(path, media / path.name)
    app = tmp_path / "site" / "app"
    app.mkdir()
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(favicon, "APP", Path("site/app"))

    favicon.main()

    ico = Image.open(app / "favicon.ico")
    assert ico.format == "ICO"
    assert sorted(ico.info["sizes"]) == [(16, 16), (32, 32), (48, 48)]
    assert Image.open(app / "icon.png").size == (512, 512)
    apple = Image.open(app / "apple-icon.png")
    assert apple.size == (180, 180)
    assert apple.mode == "RGB"  # no transparency for iOS
