const { chromium } = require('playwright');

async function debugSimpleReservation() {
  console.log('🎯 Debug: Capturing exact frontend request for 422 error');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  let reservationRequest = null;
  let reservationResponse = null;

  // Capture the exact reservation request and response
  page.on('request', request => {
    if (request.url().includes('/reservations') && request.method() === 'POST') {
      reservationRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        payload: request.postData()
      };
      console.log('\n🎯 RESERVATION REQUEST CAPTURED:');
      console.log('URL:', reservationRequest.url);
      console.log('Method:', reservationRequest.method);
      console.log('Payload:', reservationRequest.payload);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/reservations') && response.request().method() === 'POST') {
      try {
        const responseText = await response.text();
        reservationResponse = {
          status: response.status(),
          statusText: response.statusText(),
          body: responseText
        };
        console.log('\n📨 RESERVATION RESPONSE CAPTURED:');
        console.log('Status:', reservationResponse.status);
        console.log('Body:', reservationResponse.body);
      } catch (e) {
        console.log('Could not read response body:', e.message);
      }
    }
  });

  try {
    // Quick login and reservation
    console.log('Navigating to login...');
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'djamichou@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    console.log('Navigating to reservation page...');
    await page.goto('http://localhost:3003/products/2/reserve');
    await page.waitForLoadState('networkidle');

    // Try to find and submit reservation form quickly
    console.log('Looking for reservation form...');

    // Check if there's a direct submit button (maybe single-step form)
    const submitButton = page.locator('button:has-text("Réserver"), button:has-text("Confirmer")').first();
    if (await submitButton.count() > 0) {
      console.log('Found submit button, clicking...');
      await submitButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('Multi-step form detected, filling steps...');

      // Fill basic form if needed
      try {
        await page.fill('input[type="number"]', '1');
        await page.fill('input[type="tel"]', '+22890000000');
        await page.selectOption('select', { index: 1 });

        // Look for payment method selection
        const walletOption = page.locator('input[value="wallet"], button[data-value="wallet"]').first();
        if (await walletOption.count() > 0) {
          await walletOption.click();
          await page.fill('input[type="password"]', '1234');
        }

        // Find and click final submit
        const finalSubmit = page.locator('button:has-text("Confirmer"), button:has-text("Réserver")').last();
        await finalSubmit.click();
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('Form filling error:', e.message);
      }
    }

    // Wait a bit more for network activity
    await page.waitForTimeout(2000);

    console.log('\n📊 FINAL ANALYSIS:');
    if (reservationRequest) {
      console.log('✅ Reservation request captured');

      // Parse and analyze payload
      if (reservationRequest.payload) {
        try {
          const payload = JSON.parse(reservationRequest.payload);
          console.log('\n📋 PARSED PAYLOAD:');
          console.log(JSON.stringify(payload, null, 2));

          // Compare with expected structure
          console.log('\n🔍 VALIDATION ANALYSIS:');
          console.log('product_id:', payload.product_id || '❌ MISSING');
          console.log('quantity:', payload.quantity || '❌ MISSING');
          console.log('payment_method:', payload.payment_method || '❌ MISSING');
          console.log('wallet_pin:', payload.wallet_pin || '❌ MISSING');

        } catch (e) {
          console.log('❌ Could not parse payload as JSON');
        }
      }
    } else {
      console.log('❌ No reservation request captured');
    }

    if (reservationResponse) {
      console.log('✅ Reservation response captured');

      if (reservationResponse.status === 422) {
        console.log('\n🚨 422 ERROR DETAILS:');
        try {
          const errorData = JSON.parse(reservationResponse.body);
          console.log('Error message:', errorData.message || 'No message');
          console.log('Validation errors:', errorData.errors || 'No validation errors');
        } catch (e) {
          console.log('Raw response body:', reservationResponse.body);
        }
      }
    } else {
      console.log('❌ No reservation response captured');
    }

  } catch (error) {
    console.error('Script error:', error);
  }

  // Keep browser open
  console.log('\nBrowser kept open for inspection. Press Enter to close...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    browser.close();
    process.exit(0);
  });
}

debugSimpleReservation();