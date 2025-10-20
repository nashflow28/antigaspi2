#!/usr/bin/env python3
"""
Capture screenshot from Android emulator and resize IMMEDIATELY to max 2000px
This prevents API 400 errors when sending screenshots to Claude
Usage: python capture-and-resize.py [output_filename]
"""

import os
import sys
import subprocess
import time
from PIL import Image
from pathlib import Path

MAX_SIZE = 2000  # Maximum width or height in pixels
QUALITY = 85  # JPEG quality (1-100)

def capture_screenshot(device_id=None):
    """Capture screenshot using ADB"""
    device_arg = ["-s", device_id] if device_id else []

    # Capture screenshot to device
    subprocess.run(["adb"] + device_arg + ["shell", "screencap", "-p", "/sdcard/temp_screenshot.png"], check=True)

    # Pull to local temp file
    temp_file = "temp_screenshot_raw.png"
    subprocess.run(["adb"] + device_arg + ["pull", "/sdcard/temp_screenshot.png", temp_file], check=True)

    # Clean up device
    subprocess.run(["adb"] + device_arg + ["shell", "rm", "/sdcard/temp_screenshot.png"], check=False)

    return temp_file

def resize_image(input_path, output_path, max_size=MAX_SIZE):
    """Resize image to max dimensions"""
    try:
        with Image.open(input_path) as img:
            original_width, original_height = img.size

            # Check if resize is needed
            if original_width <= max_size and original_height <= max_size:
                # Just copy without resize
                img.save(output_path, 'PNG', optimize=True)
                print(f"[OK] No resize needed: {original_width}x{original_height}")
                return output_path

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
            resized.save(output_path, 'PNG', optimize=True)

            file_size = os.path.getsize(output_path) / 1024  # KB
            print(f"[RESIZED] {original_width}x{original_height} -> {new_width}x{new_height} ({file_size:.1f}KB)")
            return output_path

    except Exception as e:
        print(f"[ERROR] Error resizing: {e}")
        return None

def main():
    """Main function"""
    # Get output filename from arguments or use timestamp
    if len(sys.argv) > 1:
        output_filename = sys.argv[1]
    else:
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        output_filename = f"screenshot-{timestamp}.png"

    # Ensure output directory exists
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent / 'test-results'
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / output_filename

    print("=" * 60)
    print("  Antigaspi Mobile - Screenshot Capture & Resize")
    print("=" * 60)
    print(f"Output: {output_path}")
    print()

    # Step 1: Capture screenshot from device
    print("[1/3] Capturing screenshot from emulator...")
    try:
        temp_file = capture_screenshot()
        print(f"[OK] Screenshot captured: {temp_file}")
    except Exception as e:
        print(f"[ERROR] Failed to capture screenshot: {e}")
        sys.exit(1)

    # Step 2: Resize immediately
    print(f"[2/3] Resizing to max {MAX_SIZE}px...")
    resized_path = resize_image(temp_file, str(output_path))

    if not resized_path:
        print("[ERROR] Failed to resize screenshot")
        sys.exit(1)

    # Step 3: Clean up temp file
    print("[3/3] Cleaning up...")
    try:
        os.remove(temp_file)
        print("[OK] Temp file removed")
    except Exception as e:
        print(f"[WARNING] Could not remove temp file: {e}")

    print()
    print("=" * 60)
    print(f"  SUCCESS: {output_filename}")
    print("=" * 60)
    print(f"  Path: {output_path}")
    print(f"  Status: Ready for Claude (max {MAX_SIZE}px)")
    print("=" * 60)

if __name__ == '__main__':
    main()
