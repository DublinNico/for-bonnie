import json
from pathlib import Path
from PIL import Image

tile_folder = Path("square_images")
tile_colors = {}

for tile_path in tile_folder.glob("*.jpg"):
    tile_image = Image.open(tile_path)
    tiny = tile_image.resize((1, 1), Image.LANCZOS)
    avg_color = tiny.getpixel((0, 0))
    tile_colors[tile_path] = avg_color

tile_usage = {tile_path: 0 for tile_path in tile_colors}
resized_tile_cache = {}
tile_last_position = {}

target_image = Image.open("target_photo/target_bonnie.jpg")


target_width, target_height = target_image.size
aspect_ratio = target_height / target_width

cols = 65
rows = round(cols * aspect_ratio)

cell_width = target_width // cols
cell_height = target_height // rows


tile_output_size = 180

mosaic = Image.new("RGB", (tile_output_size * cols, tile_output_size * rows))

# Filename of the winning tile for every cell, in row-major order
# (row 0 left-to-right, then row 1, ...). Exported for the website.
grid = []

for row in range(rows):
    for col in range(cols):
        left = col * cell_width
        top = row * cell_height
        right = left + cell_width
        bottom = top + cell_height

        cell = target_image.crop((left, top, right, bottom))
        tiny = cell.resize((1, 1), Image.LANCZOS)
        cell_color = tiny.getpixel((0, 0))

        best_tile = None
        best_distance = None

        REPEAT_PENALTY = 80
        COOLDOWN_DISTANCE = 8
        COOLDOWN_PENALTY = 5000

        for tile_path, tile_color in tile_colors.items():
            r1, g1, b1 = cell_color
            r2, g2, b2 = tile_color
            distance = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
            distance += tile_usage[tile_path] * REPEAT_PENALTY

            if tile_path in tile_last_position:
                last_row, last_col = tile_last_position[tile_path]
                cell_distance = ((row - last_row) ** 2 + (col - last_col) ** 2) ** 0.5
                if cell_distance < COOLDOWN_DISTANCE:
                    distance += COOLDOWN_PENALTY

            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_tile = tile_path

        tile_usage[best_tile] += 1
        tile_last_position[best_tile] = (row, col)
        grid.append(best_tile.name)

        if best_tile not in resized_tile_cache:
            resized_tile_cache[best_tile] = Image.open(best_tile).resize((tile_output_size, tile_output_size), Image.LANCZOS)

        matched_tile = resized_tile_cache[best_tile]
        mosaic.paste(matched_tile, (col * tile_output_size, row * tile_output_size))

mosaic.save("mosaic_output.jpg")

# Export the grid layout so the website can rebuild the mosaic itself
assert len(grid) == cols * rows, f"expected {cols * rows} cells, got {len(grid)}"

mosaic_data = {
    "cols": cols,
    "rows": rows,
    "grid": grid,
}

json_path = Path("site/public/mosaic.json")
with open(json_path, "w") as f:
    json.dump(mosaic_data, f)

print(f"Saved {json_path} ({cols} x {rows} = {len(grid)} cells)")
