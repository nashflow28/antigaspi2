#!/usr/bin/env node
/**
 * Wait for Android device/emulator to be ready
 * Usage: tsx scripts/wait-for-device.ts [timeout_seconds]
 */

import { execSync } from 'child_process';

const DEFAULT_TIMEOUT = 120; // 2 minutes
const POLL_INTERVAL = 2000; // 2 seconds

function isDeviceReady(): boolean {
  try {
    const output = execSync('adb devices', { encoding: 'utf-8' });
    const lines = output.split('\n').slice(1); // Skip header

    const readyDevices = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && trimmed.includes('\tdevice'); // Tab + "device" status
    });

    return readyDevices.length > 0;
  } catch (error) {
    return false;
  }
}

function isBootComplete(): boolean {
  try {
    const output = execSync('adb shell getprop sys.boot_completed', {
      encoding: 'utf-8',
      timeout: 5000
    });
    return output.trim() === '1';
  } catch (error) {
    return false;
  }
}

async function waitForDevice(timeoutSeconds: number): Promise<boolean> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  console.log(`⏳ Waiting for Android device (timeout: ${timeoutSeconds}s)...`);

  while (Date.now() - startTime < timeoutMs) {
    // Check if device is connected
    if (isDeviceReady()) {
      console.log('✅ Device connected');

      // Wait for boot to complete
      console.log('⏳ Waiting for boot to complete...');
      const bootStartTime = Date.now();

      while (Date.now() - bootStartTime < 30000) { // 30s max for boot
        if (isBootComplete()) {
          console.log('✅ Device ready!');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('⚠️ Boot timeout, but device is connected');
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  console.error('❌ Timeout: No device found');
  return false;
}

// Main
const timeoutArg = process.argv[2];
const timeout = timeoutArg ? parseInt(timeoutArg, 10) : DEFAULT_TIMEOUT;

waitForDevice(timeout).then(success => {
  process.exit(success ? 0 : 1);
});
