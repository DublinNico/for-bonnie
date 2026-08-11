from PIL import Image

tile_paths = [
    "square_images/tile_001.jpg",
    "square_images/tile_002.jpg",
    "square_images/tile_003.jpg",
    "square_images/tile_004.jpg",
] 

tiles = [Image.open(path) for path in tile_paths]

tile_size = tiles[0].size[0]

canvas = Image.new("RGB", (tile_size * 2, tile_size * 2))

canvas.paste(tiles[0], (0, 0))
canvas.paste(tiles[1], (tile_size, 0))
canvas.paste(tiles[2], (0, tile_size))
canvas.paste(tiles[3], (tile_size, tile_size))

canvas.save("grid_test.jpg")
