#!/usr/bin/env python3
"""Test login functionality"""

import uiautomator2 as u2
import time

print("[TEST] Testing Consumer login...")

device = u2.connect('emulator-5554')
print(f"[OK] Connected to: {device.device_info['model']}")

# Get screen size
width, height = device.window_size()
print(f"[INFO] Screen size: {width}x{height}")

# Take initial screenshot
device.screenshot('before-login.png')
print("[SCREENSHOT] Saved: before-login.png")

# Scroll down to see Consumer button better
device.swipe(width//2, height-200, width//2, height//2, 0.1)
time.sleep(1)

# Click on Consumer button using coordinates (orange button in middle-lower area)
consumer_y = int(height * 0.76)  # Consumer button position
device.click(width // 2, consumer_y)
print(f"[CLICK] Clicked at Consumer position ({width//2}, {consumer_y})")

time.sleep(6)  # Wait for login to complete

# Take screenshot after login
device.screenshot('after-consumer-login.png')
print("[SCREENSHOT] Saved: after-consumer-login.png")

# Check if we're on home screen
screen = device.dump_hierarchy()

if 'Accueil' in screen or 'Home' in screen or 'Produits' in screen:
    print("[SUCCESS] Login successful! Home screen visible")
elif 'Login' in screen or 'Connectez-vous' in screen:
    print("[FAIL] Still on login screen")
else:
    print("[INFO] Checking screen content...")
    if len(screen) > 500:
        print(f"[SCREEN] Preview: {screen[:500]}")
    else:
        print(f"[SCREEN] {screen}")

print("\n[DONE] Check screenshots for results")
