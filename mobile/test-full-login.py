#!/usr/bin/env python3
"""Test full login flow with API call"""

import uiautomator2 as u2
import time

print("[TEST] Testing full Consumer login flow...")

device = u2.connect('emulator-5554')
print(f"[OK] Connected to: {device.device_info['model']}")

# Get screen size
width, height = device.window_size()

# Click Consumer button to fill credentials
consumer_y = int(height * 0.76)
device.click(width // 2, consumer_y)
print("[CLICK] Clicked Consumer button")
time.sleep(2)

# Take screenshot after credentials filled
device.screenshot('credentials-filled.png')
print("[SCREENSHOT] Saved: credentials-filled.png")

# Click "Se connecter" button
login_btn_y = int(height * 0.55)  # Login button position
device.click(width // 2, login_btn_y)
print("[CLICK] Clicked Se connecter button")

time.sleep(8)  # Wait for API call and navigation

# Take screenshot after login attempt
device.screenshot('after-login-attempt.png')
print("[SCREENSHOT] Saved: after-login-attempt.png")

# Check result
screen = device.dump_hierarchy()

if 'Accueil' in screen or 'Home' in screen or 'Produits' in screen or 'Dashboard' in screen:
    print("[SUCCESS] Login successful! Navigated to home/dashboard")
elif 'Login' in screen or 'Connectez-vous' in screen:
    print("[FAIL] Still on login screen - API call may have failed")
    if 'error' in screen.lower() or 'erreur' in screen.lower():
        print("[ERROR] Error message detected on screen")
else:
    print("[INFO] Unknown screen state")
    print(f"[SCREEN] Preview: {screen[:500]}")

print("\n[DONE] Check screenshots and backend logs")
