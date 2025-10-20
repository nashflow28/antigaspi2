#!/usr/bin/env python3
"""Launch Antigaspi app in Expo Go"""

import uiautomator2 as u2
import time

print("[LAUNCH] Opening Antigaspi app...")

device = u2.connect('emulator-5554')

# Get screen size
width, height = device.window_size()

# Click on Antigaspi in Recently opened (middle of screen)
antigaspi_y = int(height * 0.48)
device.click(width // 2, antigaspi_y)
print("[CLICK] Clicked on Antigaspi app position")

time.sleep(8)  # Wait for app to load

# Take screenshot
device.screenshot('app-after-launch.png')
print("[SCREENSHOT] Saved: app-after-launch.png")

# Check if Hello World is visible
screen = device.dump_hierarchy()

if 'Hello World' in screen:
    print("[SUCCESS] Hello World IS VISIBLE!")
elif 'Antigaspi' in screen:
    print("[PARTIAL] Antigaspi text found")
else:
    print("[INFO] Checking screen content...")
    # Print a snippet
    if len(screen) > 200:
        print(f"[SCREEN] {screen[:200]}...")
    else:
        print(f"[SCREEN] {screen}")

print("\n[DONE] Check app-after-launch.png")
