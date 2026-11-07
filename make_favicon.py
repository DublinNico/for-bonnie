"""Draw the website's favicon set: a cream serif "B" on ink-brown, with one
amber "mosaic tile" in the corner.

Run from the project root, after `npm run build` (or `npm run dev`) in site/,
because it uses the copy of Instrument Serif that Next.js downloads:
    python make_favicon.py

Writes into site/app/ (Next.js picks these up by file name):
    favicon.ico     16 / 32 / 48 px - browser tabs and bookmarks
    icon.png        512 px          - modern browsers, Android, search results
    apple-icon.png  180 px          - iPhone home screen (iOS rounds the corners)
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Same colours as the site (see :root in site/app/globals.css)
UMBER = (43, 31, 23)  # --umber
CREAM = (242, 236, 227)  # --paper
AMBER = (194, 122, 52)  # --amber

APP = Path("site/app")
SUPERSAMPLE = 8  # draw 8x bigger, then shrink: smooth edges even at 16px


def has_glyph(font, char):
    """True if the font really contains `char`. A missing character is drawn as the
    same empty box ("tofu") as any other missing one, e.g. an unassigned code point."""
    return font.getmask(char).getbbox() != font.getmask("\U0010fffd").getbbox()


def find_instrument_serif():
    """Find the Instrument Serif (Regular) font file that Next.js downloaded.
    Google splits fonts into subsets (basic Latin, extended Latin...), so we also
    check the file actually contains a "B"."""
    for path in Path("site/.next/static/media").glob("*.woff2"):
        try:
            font = ImageFont.truetype(str(path), 40)
        except OSError:
            continue
        if font.getname() == ("Instrument Serif", "Regular") and has_glyph(font, "B"):
            return path
    raise SystemExit("Instrument Serif not found. Run `npm run build` in site/ first.")


def draw_icon(size, font_path, rounded=True):
    w = size * SUPERSAMPLE
    img = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background: rounded square (or full square for iOS, which rounds it itself)
    draw.rounded_rectangle([0, 0, w - 1, w - 1], radius=round(w * 0.22) if rounded else 0, fill=UMBER)

    # The "B", centred on its actual ink (not the font's line box), nudged left
    # to leave room for the amber tile
    font = ImageFont.truetype(str(font_path), round(w * 0.97))  # big: it's only 16px in a tab
    left, top, right, bottom = draw.textbbox((0, 0), "B", font=font)
    x = (w - (right - left)) / 2 - left - w * 0.05
    y = (w - (bottom - top)) / 2 - top
    draw.text((x, y), "B", font=font, fill=CREAM)

    # One amber "mosaic tile", bottom-right
    tile, margin = round(w * 0.14), round(w * 0.13)
    draw.rectangle([w - margin - tile, w - margin - tile, w - margin, w - margin], fill=AMBER)

    return img.resize((size, size), Image.LANCZOS)


def main():
    font_path = find_instrument_serif()
    print(f"font: {font_path.name}")

    draw_icon(512, font_path).save(APP / "icon.png")
    draw_icon(180, font_path, rounded=False).convert("RGB").save(APP / "apple-icon.png")

    # .ico holds several sizes in one file; draw each size separately so small ones stay crisp
    ico_sizes = [16, 32, 48]
    frames = [draw_icon(s, font_path) for s in ico_sizes]
    frames[-1].save(APP / "favicon.ico", sizes=[(s, s) for s in ico_sizes], append_images=frames[:-1])

    for name in ("favicon.ico", "icon.png", "apple-icon.png"):
        print(f"saved site/app/{name} ({(APP / name).stat().st_size:,} bytes)")


# Only draw the icons when run as a script, not when a test imports this file
if __name__ == "__main__":
    main()
