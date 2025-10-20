/**
 * Mobile-MCP helpers for Antigaspi Android native app
 * Provides high-level functions to interact with the native Android app
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const ANTIGASPI_PACKAGE = 'com.antigaspi.mobile';
export const SCREENSHOTS_DIR = path.join(__dirname, '../../test-results');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Launch the Antigaspi app
 */
export async function launchApp(): Promise<boolean> {
  try {
    console.log(`🚀 Launching ${ANTIGASPI_PACKAGE}...`);
    execSync(`adb shell monkey -p ${ANTIGASPI_PACKAGE} -c android.intent.category.LAUNCHER 1`, {
      encoding: 'utf-8',
      timeout: 10000
    });

    // Wait for app to load
    await wait(3000);
    console.log('✅ App launched');
    return true;
  } catch (error) {
    console.error('❌ Failed to launch app:', error);
    return false;
  }
}

/**
 * Close the Antigaspi app
 */
export async function closeApp(): Promise<void> {
  try {
    console.log('🛑 Closing app...');
    execSync(`adb shell am force-stop ${ANTIGASPI_PACKAGE}`, {
      encoding: 'utf-8',
      timeout: 5000
    });
    await wait(1000);
    console.log('✅ App closed');
  } catch (error) {
    console.error('❌ Failed to close app:', error);
  }
}

/**
 * Take a screenshot and save it
 */
export async function takeScreenshot(name: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${timestamp}-${name}.png`;
    const tempPath = `/sdcard/${filename}`;
    const localPath = path.join(SCREENSHOTS_DIR, filename);

    console.log(`📸 Taking screenshot: ${name}...`);

    // Take screenshot on device
    execSync(`adb shell screencap -p ${tempPath}`, {
      encoding: 'utf-8',
      timeout: 10000
    });

    // Pull to local
    execSync(`adb pull ${tempPath} "${localPath}"`, {
      encoding: 'utf-8',
      timeout: 10000
    });

    // Clean up device
    execSync(`adb shell rm ${tempPath}`, {
      encoding: 'utf-8',
      timeout: 5000
    });

    console.log(`✅ Screenshot saved: ${localPath}`);
    return localPath;
  } catch (error) {
    console.error(`❌ Failed to take screenshot: ${error}`);
    return '';
  }
}

/**
 * Dump current UI hierarchy XML from device
 */
export function dumpUiXml(): string {
  try {
    const remote = '/sdcard/uidump.xml';
    execSync(`adb shell uiautomator dump ${remote}`, { encoding: 'utf-8', timeout: 10000 });
    const xml = execSync(`adb shell cat ${remote}`, { encoding: 'utf-8', timeout: 10000 });
    return xml.toString();
  } catch (e) {
    return '';
  }
}

function extractBoundsCenter(bounds: string): { x: number; y: number } | null {
  const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  const x1 = parseInt(m[1], 10), y1 = parseInt(m[2], 10), x2 = parseInt(m[3], 10), y2 = parseInt(m[4], 10);
  return { x: Math.floor((x1 + x2) / 2), y: Math.floor((y1 + y2) / 2) };
}

/**
 * Find element center by testID (matches resource-id or content-desc)
 */
export function findCenterByTestId(testId: string): { x: number; y: number } | null {
  const xml = dumpUiXml();
  if (!xml) return null;
  // Try resource-id full/partial match or content-desc exact/partial
  const lines = xml.split(/\r?\n/);
  for (const line of lines) {
    if ((line.includes('resource-id=') && line.includes(testId)) ||
        (line.includes('content-desc=') && line.includes(testId))) {
      const boundsMatch = line.match(/bounds=\"([^\"]+)\"/);
      if (boundsMatch) {
        const center = extractBoundsCenter(boundsMatch[1]);
        if (center) return center;
      }
    }
  }
  return null;
}

/**
 * Tap element by testID using UIAutomator dump
 */
export async function tapByTestId(testId: string, opts: { retries?: number; intervalMs?: number } = {}): Promise<boolean> {
  const retries = opts.retries ?? 5;
  const interval = opts.intervalMs ?? 500;
  for (let i = 0; i < retries; i++) {
    const pt = findCenterByTestId(testId);
    if (pt) {
      await tap(pt.x, pt.y);
      return true;
    }
    await wait(interval);
  }
  return false;
}

/**
 * Wait for element by testID to appear
 */
export async function waitForElementByTestId(testId: string, timeoutMs: number = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = !!findCenterByTestId(testId);
    if (found) return true;
    await wait(250);
  }
  return false;
}

/**
 * Tap on screen coordinates
 */
export async function tap(x: number, y: number): Promise<void> {
  try {
    execSync(`adb shell input tap ${x} ${y}`, {
      encoding: 'utf-8',
      timeout: 5000
    });
    await wait(500);
  } catch (error) {
    console.error(`❌ Failed to tap at (${x}, ${y}):`, error);
  }
}

/**
 * Type text (requires input focus)
 */
export async function typeText(text: string): Promise<void> {
  try {
    // Escape special characters for shell
    const escaped = text.replace(/\s/g, '%s').replace(/"/g, '\\"');
    execSync(`adb shell input text "${escaped}"`, {
      encoding: 'utf-8',
      timeout: 10000
    });
    await wait(500);
  } catch (error) {
    console.error(`❌ Failed to type text: ${error}`);
  }
}

/**
 * Swipe gesture
 */
export async function swipe(startX: number, startY: number, endX: number, endY: number, duration: number = 300): Promise<void> {
  try {
    execSync(`adb shell input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`, {
      encoding: 'utf-8',
      timeout: 10000
    });
    await wait(500);
  } catch (error) {
    console.error(`❌ Failed to swipe:`, error);
  }
}

/**
 * Press back button
 */
export async function pressBack(): Promise<void> {
  try {
    execSync(`adb shell input keyevent 4`, {
      encoding: 'utf-8',
      timeout: 5000
    });
    await wait(500);
  } catch (error) {
    console.error(`❌ Failed to press back:`, error);
  }
}

/**
 * Press home button
 */
export async function pressHome(): Promise<void> {
  try {
    execSync(`adb shell input keyevent 3`, {
      encoding: 'utf-8',
      timeout: 5000
    });
    await wait(500);
  } catch (error) {
    console.error(`❌ Failed to press home:`, error);
  }
}

/**
 * Get current activity (screen name)
 */
export function getCurrentActivity(): string {
  try {
    const output = execSync('adb shell dumpsys window windows | grep -E "mCurrentFocus"', {
      encoding: 'utf-8',
      timeout: 5000
    });
    return output.trim();
  } catch (error) {
    return '';
  }
}

/**
 * Login as consumer
 */
export async function loginAsConsumer(): Promise<boolean> {
  try {
    console.log('🔐 Login as Consumer...');

    await launchApp();
    await takeScreenshot('01-launch');

    // Wait for login screen
    await wait(2000);

    // Fill email (tap on email input field - coordinates may vary)
    await tap(540, 800); // Email input center (adjust based on your layout)
    await wait(500);
    await typeText('consumer@antigaspi.com');
    await takeScreenshot('02-email-filled');

    // Fill password
    await tap(540, 950); // Password input center
    await wait(500);
    await typeText('consumer123');
    await takeScreenshot('03-password-filled');

    // Tap login button
    await tap(540, 1200); // Login button center
    await wait(3000); // Wait for navigation

    await takeScreenshot('04-after-login');
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error);
    await takeScreenshot('error-login');
    return false;
  }
}

/**
 * Login as merchant
 */
export async function loginAsMerchant(): Promise<boolean> {
  try {
    console.log('🔐 Login as Merchant...');

    await launchApp();
    await takeScreenshot('01-launch');

    await wait(2000);

    await tap(540, 800);
    await wait(500);
    await typeText('merchant@antigaspi.com');

    await tap(540, 950);
    await wait(500);
    await typeText('merchant123');

    await tap(540, 1200);
    await wait(3000);

    await takeScreenshot('04-merchant-logged-in');
    console.log('✅ Merchant login successful');
    return true;
  } catch (error) {
    console.error('❌ Merchant login failed:', error);
    return false;
  }
}

/**
 * Navigate to product details (from home screen)
 */
export async function navigateToProduct(productIndex: number = 0): Promise<boolean> {
  try {
    console.log(`📱 Navigating to product ${productIndex}...`);

    // Calculate Y position based on product index
    // Assuming products start at Y=400 and each card is ~250px tall
    const productY = 400 + (productIndex * 250);

    await tap(540, productY);
    await wait(2000);

    await takeScreenshot(`05-product-${productIndex}-detail`);
    console.log('✅ Navigated to product');
    return true;
  } catch (error) {
    console.error('❌ Navigation failed:', error);
    return false;
  }
}

/**
 * Make a reservation
 */
export async function makeReservation(): Promise<boolean> {
  try {
    console.log('🛒 Making reservation...');

    // Tap "Réserver" button (adjust coordinates based on your layout)
    await tap(540, 1400);
    await wait(1000);
    await takeScreenshot('06-reservation-modal');

    // Tap "Confirmer" button
    await tap(540, 1200);
    await wait(2000);
    await takeScreenshot('07-reservation-success');

    console.log('✅ Reservation made');
    return true;
  } catch (error) {
    console.error('❌ Reservation failed:', error);
    return false;
  }
}

/**
 * Scroll down
 */
export async function scrollDown(distance: number = 500): Promise<void> {
  await swipe(540, 1200, 540, 1200 - distance, 300);
}

/**
 * Scroll up
 */
export async function scrollUp(distance: number = 500): Promise<void> {
  await swipe(540, 800, 540, 800 + distance, 300);
}

/**
 * Wait utility
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clear app data (logout)
 */
export async function clearAppData(): Promise<void> {
  try {
    console.log('🗑️ Clearing app data...');
    execSync(`adb shell pm clear ${ANTIGASPI_PACKAGE}`, {
      encoding: 'utf-8',
      timeout: 10000
    });
    await wait(1000);
    console.log('✅ App data cleared');
  } catch (error) {
    console.error('❌ Failed to clear app data:', error);
  }
}
