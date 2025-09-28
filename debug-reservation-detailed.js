const { chromium } = require('playwright');

async function debugReservationDetailed() {
  console.log('🧠 Sequential Thinking Debug Session: Reservation 422 Error - Detailed Analysis');
  console.log('🎯 Goal: Capture exact frontend request payload and compare with working curl');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 2000,
    devtools: true  // Open DevTools for easier debugging
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`🔍 [REQUEST] ${request.method()} ${request.url()}`);
      const headers = request.headers();
      console.log(`📋 [HEADERS]`, headers);
      if (request.postData()) {
        console.log(`📝 [PAYLOAD]`, request.postData());
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`📨 [RESPONSE] ${response.status()} ${response.statusText()} - ${response.url()}`);
      if (response.status() === 422) {
        try {
          const responseBody = await response.text();
          console.log(`🚨 [422 ERROR BODY]`, responseBody);
        } catch (e) {
          console.log(`❌ Could not read response body:`, e.message);
        }
      }
    }
  });

  try {
    console.log('\n🔄 Step 1: Navigate to frontend application');
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    console.log('✅ Homepage loaded successfully');

    console.log('\n🔄 Step 2: Navigate to login page');
    // Try to find login link/button
    try {
      await page.click('text=Login', { timeout: 5000 });
    } catch {
      try {
        await page.click('a[href*="login"]', { timeout: 5000 });
      } catch {
        console.log('🔍 No login button found, navigating to /login directly');
        await page.goto('http://localhost:3003/login');
      }
    }
    await page.waitForLoadState('networkidle');

    console.log('\n🔄 Step 3: Login as djamichou@gmail.com');
    await page.fill('input[type="email"], input[name="email"], #email', 'djamichou@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'password');
    await page.click('button[type="submit"], button:has-text("Login"), [data-variant="primary"]:has-text("Login")');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login completed');

    console.log('\n🔄 Step 4: Navigate to product 2 reservation page');
    await page.goto('http://localhost:3003/products/2/reserve');
    await page.waitForLoadState('networkidle');
    console.log('✅ Reservation page loaded');

    // Take a screenshot to see current state
    await page.screenshot({ path: 'reservation-form-state.png', fullPage: true });
    console.log('📸 Screenshot saved: reservation-form-state.png');

    console.log('\n🔄 Step 5: Fill out reservation form step by step');

    // Step 1: Quantity (already filled by default)
    console.log('📝 Step 1: Confirming quantity...');
    const quantityInput = page.locator('input[type="number"], .quantity input');
    await quantityInput.fill('1');
    await page.click('button:has-text("Étape suivante"), [data-variant]:has-text("suivante")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 1 completed');

    // Step 2: Pickup information
    console.log('📝 Step 2: Filling pickup information...');
    await page.fill('input[type="date"], #pickup-date', '2025-09-22');
    await page.selectOption('select, #pickup-time', '14:00');
    await page.fill('input[type="tel"], #contact-phone', '+22890000000');
    await page.click('button:has-text("Étape suivante"), [data-variant]:has-text("suivante")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 2 completed');

    // Step 3: Payment method - FOCUS HERE
    console.log('📝 Step 3: Selecting wallet payment method...');

    // Look for wallet payment option
    try {
      await page.click('button:has-text("Portefeuille"), .payment-wallet, [data-payment="wallet"]');
      console.log('✅ Wallet payment selected');
    } catch {
      console.log('⚠️ Wallet option not found, looking for other wallet selectors...');
      // Try different selectors for wallet payment
      const walletSelectors = [
        'input[value="wallet"]',
        'button[data-value="wallet"]',
        '.payment-option:has-text("Portefeuille")',
        'button:contains("wallet")'
      ];

      let walletFound = false;
      for (const selector of walletSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          console.log(`✅ Wallet selected with: ${selector}`);
          walletFound = true;
          break;
        } catch {
          continue;
        }
      }

      if (!walletFound) {
        console.log('❌ Could not find wallet payment option');
        // Take screenshot to debug
        await page.screenshot({ path: 'payment-methods-debug.png', fullPage: true });
        console.log('📸 Payment methods screenshot saved: payment-methods-debug.png');
      }
    }

    // Fill wallet PIN
    console.log('📝 Filling wallet PIN...');
    try {
      await page.fill('input[type="password"], #wallet-pin, .wallet-pin', '1234');
      console.log('✅ Wallet PIN filled');
    } catch {
      console.log('⚠️ Wallet PIN field not found');
    }

    await page.click('button:has-text("Étape suivante"), [data-variant]:has-text("suivante")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 3 completed');

    // Step 4: Confirmation
    console.log('📝 Step 4: Final confirmation...');
    await page.check('input[type="checkbox"], #accept-conditions');

    console.log('\n⚡ CRITICAL: About to submit reservation - monitoring network...');

    // Clear previous network logs
    console.log('\n🎯 ===== FINAL RESERVATION REQUEST MONITORING =====');

    await page.click('button:has-text("Confirmer"), [data-variant]:has-text("Confirmer")');

    // Wait for the request to complete
    await page.waitForTimeout(5000);

    console.log('\n📊 ANALYSIS COMPLETE');

  } catch (error) {
    console.error('🚨 Debug session error:', error);

    // Take error screenshot
    await page.screenshot({ path: 'error-state.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-state.png');
  }

  // Keep browser open for manual inspection
  console.log('\n⏸️ Browser kept open for manual inspection. Press Enter to close...');

  // Wait for user input before closing
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    browser.close();
    process.exit(0);
  });
}

debugReservationDetailed();