from pathlib import Path
from PIL import Image

tile_folder = Path("square_images")
tile_colors = {}

for tile_path in tile_folder.glob("*.jpg"):
    tile_image = Image.open(tile_path)
    tiny = tile_image.resize((1, 1))
    avg_color = tiny.getpixel((0, 0))
    tile_colors[tile_path] = avg_color

target_image = Image.open("target_photo/target_bonnie.jpg")



target_width, target_height = target_image.size
aspect_ratio = target_height / target_width

cols = 60
rows = round(cols * aspect_ratio)

cell_width = target_width // cols
cell_height = target_height // rows


tile_output_size = 100

mosaic = Image.new("RGB", (tile_output_size * cols, tile_output_size * rows))

for row in range(rows):
    for col in range(cols):
        left = col * cell_width
        top = row * cell_height
        right = left + cell_width
        bottom = top + cell_height

        cell = target_image.crop((left, top, right, bottom))
        tiny = cell.resize((1, 1))
        cell_color = tiny.getpixel((0, 0))

        best_tile = None
        best_distance = None

        for tile_path, tile_color in tile_colors.items():
            r1, g1, b1 = cell_color
            r2, g2, b2 = tile_color
            distance = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2

            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_tile = tile_path

        matched_tile = Image.open(best_tile).resize((tile_output_size, tile_output_size))
        mosaic.paste(matched_tile, (col * tile_output_size, row * tile_output_size))

mosaic.save("mosaic_output.jpg")