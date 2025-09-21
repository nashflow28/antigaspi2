const { chromium } = require('playwright');

async function testFinalFix() {
  console.log('🧪 Testing final wallet fix - should now show wallet option');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  let reservationRequest = null;
  let reservationResponse = null;

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('wallet') || request.url().includes('reservations')) {
      console.log(`🔍 API request: ${request.method()} ${request.url()}`);
    }
    if (request.url().includes('/reservations') && request.method() === 'POST') {
      reservationRequest = {
        url: request.url(),
        payload: request.postData()
      };
    }
  });

  page.on('response', response => {
    if (response.url().includes('wallet') || response.url().includes('reservations')) {
      console.log(`📨 API response: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  try {
    // Quick login
    console.log('Logging in...');
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'djamichou@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to reservation
    console.log('Going to reservation page...');
    await page.goto('http://localhost:3003/products/2/reserve');
    await page.waitForLoadState('networkidle');

    // Navigate through steps
    console.log('Step 1...');
    await page.click('button:has-text("Étape suivante")');
    await page.waitForTimeout(1000);

    console.log('Step 2...');
    await page.fill('input[type="date"]', '2025-09-22');
    await page.selectOption('select', '14:00');
    await page.fill('input[type="tel"]', '+22890000000');
    await page.click('button:has-text("Étape suivante")');
    await page.waitForTimeout(1000);

    console.log('Step 3 - Checking payment options...');
    await page.screenshot({ path: 'final-payment-options.png', fullPage: true });

    // Check for wallet option
    const walletButtons = await page.locator('button:has-text("Portefeuille"), button:has-text("wallet"), [data-value="wallet"]').count();
    console.log(`Wallet buttons found: ${walletButtons}`);

    if (walletButtons > 0) {
      console.log('✅ SUCCESS: Wallet option is now available!');

      // Select wallet payment
      await page.click('button:has-text("Portefeuille"), button:has-text("wallet")');
      await page.waitForTimeout(500);

      // Fill PIN
      const pinField = page.locator('input[type="password"], #wallet-pin');
      await pinField.fill('1234');
      console.log('✅ PIN entered');

      await page.click('button:has-text("Étape suivante")');
      await page.waitForTimeout(1000);

      console.log('Step 4 - Final confirmation...');
      await page.check('input[type="checkbox"]');

      console.log('🎯 Submitting reservation...');
      await page.click('button:has-text("Confirmer")');
      await page.waitForTimeout(5000);

      if (reservationRequest) {
        console.log('\n🎯 RESERVATION REQUEST CAPTURED:');
        console.log('Payload:', reservationRequest.payload);

        try {
          const payload = JSON.parse(reservationRequest.payload);
          console.log('\n📋 PARSED PAYLOAD:');
          console.log(JSON.stringify(payload, null, 2));

          console.log('\n✅ VALIDATION CHECK:');
          console.log('product_id:', payload.product_id || '❌ MISSING');
          console.log('quantity:', payload.quantity || '❌ MISSING');
          console.log('payment_method:', payload.payment_method || '❌ MISSING');
          console.log('wallet_pin:', payload.wallet_pin || '❌ MISSING');

          // Compare with working curl
          console.log('\n🔍 COMPARISON WITH WORKING CURL:');
          console.log('Expected: {"product_id": 2, "quantity": 1, "payment_method": "wallet", "wallet_pin": "1234"}');
          console.log('Actual  :', JSON.stringify(payload));

        } catch (e) {
          console.log('❌ Could not parse payload as JSON');
        }
      }

      // Check final result
      const currentUrl = page.url();
      console.log('\nFinal URL:', currentUrl);

      if (currentUrl.includes('reservations')) {
        console.log('✅ SUCCESS: Redirected to reservations page - likely successful!');
      } else {
        console.log('🤔 Still on reservation page - checking for messages...');
        const messages = await page.locator('.success, .error, .alert').allTextContents();
        console.log('Messages:', messages);
      }

    } else {
      console.log('❌ FAILED: Wallet option still not showing');

      // Debug: check all button text content
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons.filter(text => text.trim()));
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('\nTest complete. Closing browser in 5 seconds...');
  setTimeout(() => {
    browser.close();
  }, 5000);
}

testFinalFix();