#!/usr/bin/env python3
"""Generate PNG icons from SVG logo for GELADAL app."""

import os
from io import BytesIO
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SVG_PATH = os.path.join(ROOT_DIR, 'frontend', 'public', 'logo.svg')
PWA_IMAGES_DIR = os.path.join(ROOT_DIR, 'frontend', 'public', 'images')
MOBILE_ASSETS_DIR = os.path.join(ROOT_DIR, 'mobile', 'assets')

# Icon sizes for PWA
PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Background color from logo (yellow)
BG_COLOR = (250, 208, 44, 255)  # #fad02c with alpha


def svg_to_pil(svg_path, scale=1.0):
    """Convert SVG to PIL Image."""
    drawing = svg2rlg(svg_path)
    if drawing is None:
        raise ValueError(f"Could not parse SVG: {svg_path}")

    # Scale the drawing
    drawing.scale(scale, scale)
    drawing.width *= scale
    drawing.height *= scale

    # Render to PNG bytes
    png_data = BytesIO()
    renderPM.drawToFile(drawing, png_data, fmt='PNG')
    png_data.seek(0)

    return Image.open(png_data)


def create_square_icon(svg_path, output_path, size, bg_color=BG_COLOR):
    """Create a square icon with the logo centered on background color."""
    # Create background
    background = Image.new('RGBA', (size, size), bg_color)

    # Load the SVG at a reasonable scale
    # Original SVG is 1683x1190, we want to fit it in the icon with padding
    padding_ratio = 0.05  # 5% padding
    target_size = int(size * (1 - padding_ratio * 2))

    # Calculate scale factor
    drawing = svg2rlg(svg_path)
    if drawing is None:
        print(f'  ERROR: Could not parse SVG for {os.path.basename(output_path)}')
        return

    orig_width = drawing.width
    orig_height = drawing.height

    # Scale to fit in target size while maintaining aspect ratio
    scale_w = target_size / orig_width
    scale_h = target_size / orig_height
    scale = min(scale_w, scale_h)

    # Apply scale
    drawing.scale(scale, scale)
    drawing.width *= scale
    drawing.height *= scale

    # Render to PNG
    png_data = BytesIO()
    renderPM.drawToFile(drawing, png_data, fmt='PNG')
    png_data.seek(0)

    logo = Image.open(png_data)
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')

    # Center the logo on background
    x = (size - int(drawing.width)) // 2
    y = (size - int(drawing.height)) // 2

    background.paste(logo, (x, y), logo)
    background.save(output_path, 'PNG')
    print(f'  Created: {os.path.basename(output_path)} ({size}x{size})')


def main():
    print(f'Reading SVG from: {SVG_PATH}')

    if not os.path.exists(SVG_PATH):
        print(f'ERROR: SVG file not found at: {SVG_PATH}')
        return 1

    # Ensure output directories exist
    os.makedirs(PWA_IMAGES_DIR, exist_ok=True)
    os.makedirs(MOBILE_ASSETS_DIR, exist_ok=True)

    # Generate PWA icons
    print('\nGenerating PWA icons...')
    for size in PWA_SIZES:
        output_path = os.path.join(PWA_IMAGES_DIR, f'icon-{size}x{size}.png')
        create_square_icon(SVG_PATH, output_path, size)

    # Generate Apple touch icon (180x180)
    apple_touch_path = os.path.join(PWA_IMAGES_DIR, 'apple-touch-icon.png')
    create_square_icon(SVG_PATH, apple_touch_path, 180)

    # Generate favicon (32x32)
    favicon_path = os.path.join(ROOT_DIR, 'frontend', 'public', 'favicon.png')
    create_square_icon(SVG_PATH, favicon_path, 32)

    # Generate Mobile icons
    print('\nGenerating Mobile icons...')

    # App icon (1024x1024)
    icon_path = os.path.join(MOBILE_ASSETS_DIR, 'icon.png')
    create_square_icon(SVG_PATH, icon_path, 1024)

    # Adaptive icon (1024x1024)
    adaptive_path = os.path.join(MOBILE_ASSETS_DIR, 'adaptive-icon.png')
    create_square_icon(SVG_PATH, adaptive_path, 1024)

    # Splash icon (512x512 - used by Expo for splash screen)
    splash_path = os.path.join(MOBILE_ASSETS_DIR, 'splash-icon.png')
    create_square_icon(SVG_PATH, splash_path, 512)

    # Notification icon (96x96)
    notification_path = os.path.join(MOBILE_ASSETS_DIR, 'notification-icon.png')
    create_square_icon(SVG_PATH, notification_path, 96)

    # Favicon for web export (96x96)
    web_favicon_path = os.path.join(MOBILE_ASSETS_DIR, 'favicon.png')
    create_square_icon(SVG_PATH, web_favicon_path, 96)

    print('\nAll icons generated successfully!')
    return 0


if __name__ == '__main__':
    exit(main())
