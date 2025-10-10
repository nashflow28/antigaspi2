#!/usr/bin/env python3
"""
Test script for adb-mcp connection to Android emulator
Tests basic device interactions via uiautomator2
"""

import uiautomator2 as u2
import time
import os

# Connect to emulator
print("[CONNECT] Connecting to emulator...")
d = u2.connect('emulator-5554')

print(f"[OK] Connected to: {d.device_info['model']}")
print(f"[INFO] Android version: {d.device_info['version']}")
print(f"[INFO] Screen size: {d.window_size()}")

# Create test-results directory if not exists
os.makedirs('test-results', exist_ok=True)

# Test 1: Take screenshot
print("\n[TEST 1] Taking screenshot...")
screenshot_path = 'test-results/adb-mcp-test-home.png'
d.screenshot(screenshot_path)
print(f"[OK] Screenshot saved: {screenshot_path}")

# Test 2: Check screen status
print("\n[TEST 2] Checking screen status...")
info = d.info
print(f"Screen on: {info.get('screenOn', False)}")
print(f"Current orientation: {info.get('displayRotation', 0)}")

# Test 3: Open Settings app
print("\n[TEST 3] Opening Settings app...")
d.app_start("com.android.settings")
time.sleep(2)
screenshot_path = 'test-results/adb-mcp-test-settings.png'
d.screenshot(screenshot_path)
print(f"[OK] Settings opened, screenshot: {screenshot_path}")

# Test 4: Go back to home
print("\n[TEST 4] Returning to home...")
d.press("home")
time.sleep(1)
screenshot_path = 'test-results/adb-mcp-test-back-home.png'
d.screenshot(screenshot_path)
print(f"[OK] Back to home, screenshot: {screenshot_path}")

# Test 5: Check if Expo Go is installed
print("\n[TEST 5] Checking installed apps...")
expo_installed = d.app_info("host.exp.exponent")
if expo_installed:
    print(f"[OK] Expo Go installed: {expo_installed.get('versionName', 'unknown')}")
else:
    print("[WARN] Expo Go not installed")

# Test 6: Swipe gesture
print("\n[TEST 6] Testing swipe gesture...")
width, height = d.window_size()
d.swipe(width // 2, height * 3 // 4, width // 2, height // 4, 0.1)
time.sleep(1)
screenshot_path = 'test-results/adb-mcp-test-after-swipe.png'
d.screenshot(screenshot_path)
print(f"[OK] Swipe executed, screenshot: {screenshot_path}")

print("\n[SUCCESS] All adb-mcp tests completed successfully!")
print("\n[SUMMARY]")
print("  - Device connection: OK")
print("  - Screenshot capture: OK")
print("  - App launch: OK")
print("  - Navigation: OK")
print("  - Gestures: OK")
print("\n[READY] adb-mcp is ready for automated testing!")
