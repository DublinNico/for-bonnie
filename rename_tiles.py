"""One-off: rename every photo in square_images/ to tile_001.jpg, tile_002.jpg, ...

    python rename_tiles.py

Already done for this project. Running it again could renumber the photos and
break the mosaic layout, so only run it on a fresh folder of photos.
"""

from pathlib import Path


def rename_tiles(folder):
    """Rename every file in `folder` to tile_001, tile_002, ... keeping its extension.

    Returns the new paths, in the order the files were renamed.
    """
    folder = Path(folder)
    renamed = []
    for i, item in enumerate(folder.iterdir(), 1):
        new_name = f"tile_{i:03d}{item.suffix}"
        new_path = folder / new_name
        item.rename(new_path)
        renamed.append(new_path)
    return renamed


# Only rename when run as a script, never when a test imports this file
if __name__ == "__main__":
    rename_tiles("square_images")
