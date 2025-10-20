#!/usr/bin/env python3
from PIL import Image
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]
max_height = 1800

img = Image.open(input_file)
print(f"Original size: {img.width}x{img.height}")

if img.height > max_height:
    ratio = max_height / img.height
    new_width = int(img.width * ratio)
    img_resized = img.resize((new_width, max_height), Image.Resampling.LANCZOS)
    img_resized.save(output_file)
    print(f"Resized to: {new_width}x{max_height}")
else:
    img.save(output_file)
    print("No resize needed")
