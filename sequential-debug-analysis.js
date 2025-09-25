import { test, expect } from '@playwright/test';

test.describe('🔍 SEQUENTIAL DEBUG ANALYSIS - Antigaspi App', () => {
  let consoleErrors = [];
  let networkErrors = [];
  let jsonParseErrors = [];
  let routerWarnings = [];

  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('JSON.parse')) {
          jsonParseErrors.push(text);
        }
      }
      if (msg.type() === 'warning' && text.includes('router-view')) {
        routerWarnings.push(text);
      }
    });

    // Capture failed network requests
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', exception => {
      consoleErrors.push(`Uncaught exception: ${exception.message}`);
    });
  });

  test('🏥 1. HEALTH CHECK - Basic connectivity', async ({ page }) => {
    console.log('\n🔧 === PHASE 1: HEALTH CHECK ===');

    // Test backend API health
    console.log('Testing backend API health...');
    const apiResponse = await page.goto('http://localhost:8000/api/health');
    expect(apiResponse.status()).toBe(200);

    const apiData = await apiResponse.json();
    console.log('✅ Backend API Health:', apiData);

    // Test frontend loading
    console.log('Testing frontend loading...');
    const response = await page.goto('http://localhost:3000');
    expect(response.status()).toBe(200);

    // Wait for app initialization
    await page.waitForSelector('#app', { timeout: 10000 });
    console.log('✅ Frontend loaded successfully');
  });

  test('📡 2. API ENDPOINTS - Critical endpoints test', async ({ page }) => {
    console.log('\n🔧 === PHASE 2: API ENDPOINTS ===');

    await page.goto('http://localhost:3000');

    // Test critical API endpoints directly
    const endpoints = [
      '/api/products',
      '/api/products/categories/list',
      '/api/merchants',
      '/api/surprise-baskets',
      '/api/categories'
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      try {
        const response = await page.goto(`http://localhost:8000${endpoint}`);
        console.log(`  Status: ${response.status()}`);

        if (response.ok()) {
          const data = await response.json();
          console.log(`  ✅ ${endpoint} - OK`);
        } else {
          console.log(`  ❌ ${endpoint} - FAILED: ${response.status()}`);
        }
      } catch (error) {
        console.log(`  💥 ${endpoint} - ERROR: ${error.message}`);
      }
    }
  });

  test('🗺️ 3. ROUTE NAVIGATION - Test all main routes', async ({ page }) => {
    console.log('\n🔧 === PHASE 3: ROUTE NAVIGATION ===');

    await page.goto('http://localhost:3000');

    const routes = [
      { path: '/', name: 'Home' },
      { path: '/discover', name: 'Discover' },
      { path: '/products', name: 'Products' },
      { path: '/reviews', name: 'Reviews' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' }
    ];

    for (const route of routes) {
      console.log(`Testing route: ${route.name} (${route.path})`);

      try {
        await page.goto(`http://localhost:3000${route.path}`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // Check if page loaded properly
        const hasError = await page.locator('text=404').isVisible().catch(() => false);
        if (hasError) {
          console.log(`  ❌ ${route.name} - 404 Error`);
        } else {
          console.log(`  ✅ ${route.name} - Loaded successfully`);
        }
      } catch (error) {
        console.log(`  💥 ${route.name} - ERROR: ${error.message}`);
      }
    }
  });

  test('🔍 4. STORE INITIALIZATION - Check Pinia stores', async ({ page }) => {
    console.log('\n🔧 === PHASE 4: STORE INITIALIZATION ===');

    await page.goto('http://localhost:3000');

    // Wait for app to fully initialize
    await page.waitForTimeout(3000);

    // Check if stores initialized
    const storeInitMessage = await page.evaluate(() => {
      return window.console ? 'Console available' : 'Console not available';
    });

    console.log('Store initialization status:', storeInitMessage);

    // Check for specific store errors
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors found:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  });

  test('🧪 5. JSON PARSE ERRORS - Detailed analysis', async ({ page }) => {
    console.log('\n🔧 === PHASE 5: JSON PARSE ERRORS ===');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    if (jsonParseErrors.length > 0) {
      console.log('🚨 JSON.parse errors found:');
      jsonParseErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JSON.parse errors detected');
    }

    // Test API calls that might cause JSON errors
    console.log('Testing potential JSON error sources...');

    try {
      await page.evaluate(async () => {
        const response = await fetch('/api/products');
        const text = await response.text();
        console.log('API response sample:', text.substring(0, 100));
        return JSON.parse(text);
      });
    } catch (error) {
      console.log('💥 JSON parsing error in evaluation:', error.message);
    }
  });

  test('🎭 6. ROUTER WARNINGS - Vue Router issues', async ({ page }) => {
    console.log('\n🔧 === PHASE 6: ROUTER WARNINGS ===');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    if (routerWarnings.length > 0) {
      console.log('🚨 Vue Router warnings found:');
      routerWarnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    } else {
      console.log('✅ No Vue Router warnings in console');
    }
  });

  test('📊 7. NETWORK ANALYSIS - Failed requests', async ({ page }) => {
    console.log('\n🔧 === PHASE 7: NETWORK ANALYSIS ===');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);

    if (networkErrors.length > 0) {
      console.log('🚨 Network errors found:');
      networkErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.url} - ${error.status} ${error.statusText}`);
      });
    } else {
      console.log('✅ No network errors detected');
    }
  });

  test('📋 8. FINAL REPORT - Summary of all issues', async ({ page }) => {
    console.log('\n🔧 === PHASE 8: FINAL REPORT ===');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    console.log('\n📊 === ISSUE SUMMARY ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`JSON Parse Errors: ${jsonParseErrors.length}`);
    console.log(`Router Warnings: ${routerWarnings.length}`);
    console.log(`Network Errors: ${networkErrors.length}`);

    console.log('\n🎯 === PRIORITY FIXES ===');

    if (routerWarnings.length > 0) {
      console.log('1. 🔥 HIGH: Fix Vue Router <router-view> in <transition> warning');
    }

    if (jsonParseErrors.length > 0) {
      console.log('2. 🔥 HIGH: Fix JSON.parse errors in API calls');
    }

    if (networkErrors.length > 0) {
      console.log('3. ⚠️  MEDIUM: Fix failed network requests');
    }

    if (consoleErrors.length > 0) {
      console.log('4. ⚠️  MEDIUM: Address console errors');
    }

    console.log('\n✅ Analysis complete!');
  });

  test.afterEach(() => {
    // Clear arrays for next test
    consoleErrors = [];
    networkErrors = [];
    jsonParseErrors = [];
    routerWarnings = [];
  });
});