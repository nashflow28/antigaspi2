#!/usr/bin/env node
/**
 * Check if an Android device/emulator is connected and ready
 * Usage: tsx scripts/check-device.ts
 */

import { execSync } from 'child_process';

interface DeviceInfo {
  serial: string;
  state: string;
  isEmulator: boolean;
}

function getConnectedDevices(): DeviceInfo[] {
  try {
    const output = execSync('adb devices', { encoding: 'utf-8' });
    const lines = output.split('\n').slice(1); // Skip header

    return lines
      .filter(line => line.trim() && !line.includes('List of devices'))
      .map(line => {
        const [serial, state] = line.trim().split(/\s+/);
        return {
          serial,
          state,
          isEmulator: serial.startsWith('emulator-')
        };
      })
      .filter(device => device.state === 'device'); // Only ready devices
  } catch (error) {
    console.error('❌ Error checking devices:', error);
    return [];
  }
}

function checkDeviceReady(): boolean {
  const devices = getConnectedDevices();

  if (devices.length === 0) {
    console.log('⚠️ No Android devices connected');
    return false;
  }

  const emulator = devices.find(d => d.isEmulator);
  const physicalDevice = devices.find(d => !d.isEmulator);

  if (emulator) {
    console.log(`✅ Emulator ready: ${emulator.serial}`);
    return true;
  }

  if (physicalDevice) {
    console.log(`✅ Physical device ready: ${physicalDevice.serial}`);
    return true;
  }

  return false;
}

// Run check
const ready = checkDeviceReady();
process.exit(ready ? 0 : 1);
