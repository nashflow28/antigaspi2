#!/usr/bin/env node
/**
 * Antigaspi Mobile - Automated App Tester
 *
 * Orchestrates complete automated testing workflow:
 * 1. Check/start emulator
 * 2. Launch app
 * 3. Execute test scenarios
 * 4. Capture screenshots
 * 5. Resize screenshots
 * 6. Generate report
 *
 * Usage: tsx scripts/app-tester.ts [--scenario=consumer|merchant|all]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as android from '../e2e-tests/helpers/mobile-android';

// Test scenarios
type Scenario = 'consumer' | 'merchant' | 'all';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  screenshots: string[];
}

interface TestReport {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  device: string;
  scenario: Scenario;
  results: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
}

const report: TestReport = {
  startTime: new Date(),
  device: '',
  scenario: 'all',
  results: [],
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Check if emulator is running
 */
function isEmulatorRunning(): boolean {
  try {
    const output = execSync('adb devices', { encoding: 'utf-8' });
    return output.includes('emulator-') && output.includes('\tdevice');
  } catch {
    return false;
  }
}

/**
 * Get device info
 */
function getDeviceInfo(): string {
  try {
    const model = execSync('adb shell getprop ro.product.model', {
      encoding: 'utf-8'
    }).trim();
    const android = execSync('adb shell getprop ro.build.version.release', {
      encoding: 'utf-8'
    }).trim();
    return `${model} (Android ${android})`;
  } catch {
    return 'Unknown device';
  }
}

/**
 * Run a test and capture result
 */
async function runTest(
  name: string,
  testFn: () => Promise<boolean>
): Promise<TestResult> {
  const startTime = Date.now();
  const screenshots: string[] = [];

  console.log(`\n🧪 Running test: ${name}`);
  console.log('─'.repeat(60));

  try {
    const success = await testFn();
    const duration = Date.now() - startTime;

    // Capture test screenshots from recent files
    const recentScreenshots = fs
      .readdirSync(android.SCREENSHOTS_DIR)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(android.SCREENSHOTS_DIR, f))
      .filter(f => fs.statSync(f).mtimeMs > startTime - 1000)
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    screenshots.push(...recentScreenshots);

    const result: TestResult = {
      name,
      status: success ? 'pass' : 'fail',
      duration,
      screenshots
    };

    if (success) {
      console.log(`✅ PASS (${(duration / 1000).toFixed(1)}s)`);
      report.passed++;
    } else {
      console.log(`❌ FAIL (${(duration / 1000).toFixed(1)}s)`);
      report.failed++;
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ERROR (${(duration / 1000).toFixed(1)}s)`);
    console.error(error);
    report.failed++;

    return {
      name,
      status: 'fail',
      duration,
      error: String(error),
      screenshots
    };
  }
}

/**
 * Consumer test scenario
 */
async function testConsumerScenario(): Promise<void> {
  console.log('\n📱 CONSUMER SCENARIO');
  console.log('='.repeat(60));

  // Test 1: Login
  report.results.push(
    await runTest('Consumer Login', async () => {
      return await android.loginAsConsumer();
    })
  );

  await android.wait(2000);

  // Test 2: Browse products
  report.results.push(
    await runTest('Browse Products', async () => {
      await android.scrollDown(300);
      await android.takeScreenshot('browse-products');
      await android.scrollDown(300);
      await android.takeScreenshot('browse-products-scrolled');
      return true;
    })
  );

  // Test 3: View product details
  report.results.push(
    await runTest('View Product Details', async () => {
      await android.scrollUp(600); // Back to top
      await android.wait(500);
      return await android.navigateToProduct(0);
    })
  );

  // Test 4: Make reservation
  report.results.push(
    await runTest('Make Reservation', async () => {
      return await android.makeReservation();
    })
  );

  // Cleanup
  await android.closeApp();
  await android.clearAppData();
}

/**
 * Merchant test scenario
 */
async function testMerchantScenario(): Promise<void> {
  console.log('\n🏪 MERCHANT SCENARIO');
  console.log('='.repeat(60));

  // Test 1: Login
  report.results.push(
    await runTest('Merchant Login', async () => {
      return await android.loginAsMerchant();
    })
  );

  await android.wait(2000);

  // Test 2: View dashboard
  report.results.push(
    await runTest('View Dashboard', async () => {
      await android.takeScreenshot('merchant-dashboard');
      await android.scrollDown(300);
      await android.takeScreenshot('merchant-dashboard-stats');
      return true;
    })
  );

  // Test 3: View products
  report.results.push(
    await runTest('View Products List', async () => {
      // Navigate to products (tap products tab - adjust coordinates)
      await android.tap(400, 1800);
      await android.wait(2000);
      await android.takeScreenshot('merchant-products');
      return true;
    })
  );

  // Cleanup
  await android.closeApp();
  await android.clearAppData();
}

/**
 * Resize all screenshots
 */
async function resizeScreenshots(): Promise<void> {
  console.log('\n📏 Resizing screenshots...');
  try {
    execSync(`python scripts/resize-screenshots.py "${android.SCREENSHOTS_DIR}"`, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Screenshots resized');
  } catch (error) {
    console.error('⚠️ Failed to resize screenshots:', error);
  }
}

/**
 * Generate test report
 */
async function generateReport(): Promise<void> {
  console.log('\n📝 Generating report...');
  try {
    execSync('tsx scripts/generate-report.ts', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Report generated');
  } catch (error) {
    console.error('⚠️ Failed to generate report:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  📱 Antigaspi Mobile - Automated App Tester');
  console.log('='.repeat(60));

  // Parse arguments
  const args = process.argv.slice(2);
  const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
  let scenario: Scenario = 'all';

  if (scenarioArg) {
    const value = scenarioArg.split('=')[1] as Scenario;
    if (['consumer', 'merchant', 'all'].includes(value)) {
      scenario = value;
    }
  }

  report.scenario = scenario;

  // Step 1: Check emulator
  console.log('\n1️⃣ Checking emulator...');
  if (!isEmulatorRunning()) {
    console.log('⚠️ No emulator running');
    console.log('Please run: npm run emulator:start');
    process.exit(1);
  }

  report.device = getDeviceInfo();
  console.log(`✅ Device ready: ${report.device}`);

  // Step 2: Run tests
  try {
    if (scenario === 'consumer' || scenario === 'all') {
      await testConsumerScenario();
    }

    if (scenario === 'merchant' || scenario === 'all') {
      await testMerchantScenario();
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  }

  // Step 3: Resize screenshots
  await resizeScreenshots();

  // Step 4: Generate report
  report.endTime = new Date();
  report.duration = report.endTime.getTime() - report.startTime.getTime();
  report.totalTests = report.results.length;

  // Save report data
  const reportPath = path.join(__dirname, '../test-results/report-data.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  await generateReport();

  // Step 5: Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Device:      ${report.device}`);
  console.log(`  Scenario:    ${report.scenario}`);
  console.log(`  Duration:    ${(report.duration! / 1000).toFixed(1)}s`);
  console.log(`  Total tests: ${report.totalTests}`);
  console.log(`  ✅ Passed:   ${report.passed}`);
  console.log(`  ❌ Failed:   ${report.failed}`);
  console.log(`  ⏭️  Skipped:  ${report.skipped}`);
  console.log('='.repeat(60));

  // Exit code
  process.exit(report.failed > 0 ? 1 : 0);
}

// Run
main();
