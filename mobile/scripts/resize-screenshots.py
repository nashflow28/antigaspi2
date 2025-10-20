#!/usr/bin/env python3
"""
Resize screenshots to maximum 2000px width or height
Maintains aspect ratio and optimizes file size
Usage: python resize-screenshots.py [directory]
"""

import os
import sys
from PIL import Image
from pathlib import Path

MAX_SIZE = 2000  # Maximum width or height in pixels
QUALITY = 85  # JPEG quality (1-100)

def resize_image(image_path: str, max_size: int = MAX_SIZE) -> bool:
    """
    Resize image if it exceeds max_size
    Returns True if resized, False otherwise
    """
    try:
        with Image.open(image_path) as img:
            original_width, original_height = img.size

            # Check if resize is needed
            if original_width <= max_size and original_height <= max_size:
                print(f"[OK] {os.path.basename(image_path)}: Already within limits ({original_width}x{original_height})")
                return False

            # Calculate new dimensions maintaining aspect ratio
            if original_width > original_height:
                new_width = max_size
                new_height = int(original_height * (max_size / original_width))
            else:
                new_height = max_size
                new_width = int(original_width * (max_size / original_height))

            # Resize image
            resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save with optimization
            if image_path.lower().endswith('.png'):
                resized.save(image_path, 'PNG', optimize=True)
            elif image_path.lower().endswith(('.jpg', '.jpeg')):
                resized.save(image_path, 'JPEG', quality=QUALITY, optimize=True)
            else:
                # Default to PNG
                resized.save(image_path, 'PNG', optimize=True)

            original_size = os.path.getsize(image_path) / 1024  # KB
            print(f"[RESIZED] {os.path.basename(image_path)}: Resized from {original_width}x{original_height} to {new_width}x{new_height} ({original_size:.1f}KB)")
            return True

    except Exception as e:
        print(f"[ERROR] Error resizing {image_path}: {e}")
        return False

def resize_directory(directory: str, max_size: int = MAX_SIZE) -> dict:
    """
    Resize all images in directory
    Returns statistics
    """
    if not os.path.exists(directory):
        print(f"[ERROR] Directory not found: {directory}")
        return {'total': 0, 'resized': 0, 'skipped': 0, 'errors': 0}

    stats = {'total': 0, 'resized': 0, 'skipped': 0, 'errors': 0}
    image_extensions = ('.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG')

    print(f"\n>> Scanning directory: {directory}")
    print(f"   Max size: {max_size}px\n")

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(image_extensions):
                stats['total'] += 1
                image_path = os.path.join(root, file)

                try:
                    if resize_image(image_path, max_size):
                        stats['resized'] += 1
                    else:
                        stats['skipped'] += 1
                except Exception as e:
                    stats['errors'] += 1
                    print(f"[ERROR] Error processing {file}: {e}")

    return stats

def main():
    """Main function"""
    # Get directory from arguments or use default
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        # Default to test-results directory
        script_dir = Path(__file__).parent
        directory = str(script_dir.parent / 'test-results')

    # Get max size from arguments
    max_size = MAX_SIZE
    if len(sys.argv) > 2:
        try:
            max_size = int(sys.argv[2])
        except ValueError:
            print(f"Warning: Invalid max_size '{sys.argv[2]}', using default {MAX_SIZE}")

    print("=" * 60)
    print("  Antigaspi Mobile - Screenshot Resizer")
    print("=" * 60)

    stats = resize_directory(directory, max_size)

    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"  Total images:   {stats['total']}")
    print(f"  Resized:        {stats['resized']}")
    print(f"  Skipped:        {stats['skipped']}")
    print(f"  Errors:         {stats['errors']}")
    print("=" * 60)

    if stats['errors'] > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
