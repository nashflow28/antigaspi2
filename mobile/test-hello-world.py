#!/usr/bin/env python3
"""Quick test to see if Hello World displays"""

import uiautomator2 as u2
import time

print("[TEST] Checking if Hello World displays...")

# Connect
device = u2.connect('emulator-5554')
print(f"[OK] Connected to: {device.device_info['model']}")

# Take screenshot
device.screenshot('test-hello-world.png')
print("[SCREENSHOT] Saved: test-hello-world.png")

# Check screen content
screen = device.dump_hierarchy()

if 'Hello World' in screen:
    print("[SUCCESS] ✅ Hello World is visible!")
elif 'Antigaspi' in screen:
    print("[SUCCESS] ✅ Antigaspi text found!")
else:
    print("[FAIL] ❌ No expected text found")
    print(f"[INFO] Screen content preview: {screen[:500]}...")

print("\n[INFO] Check test-hello-world.png to see what's displayed")
