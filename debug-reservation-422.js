const { chromium } = require('playwright');

async function debugReservation422() {
  console.log('🧠 Starting Sequential Thinking Debug Session: Reservation 422 Error');
  console.log('📋 Context: Frontend Vue.js app vs Laravel API validation');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all network requests
  const networkRequests = [];
  const responses = [];

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`🔍 API Request: ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`📝 Request Data:`, request.postData());
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`📨 API Response: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  try {
    console.log('\n🔄 Step 1: Navigate to frontend application');
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');

    console.log('\n🔄 Step 2: Login as djamichou@gmail.com');

    // Try to find login form or navigate to login page
    try {
      await page.click('a[href*="login"], button:has-text("Login"), .login-button', { timeout: 5000 });
    } catch (e) {
      console.log('🔍 No login button found on homepage, trying /login route');
      await page.goto('http://localhost:3003/login');
    }

    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"], input[name="email"], #email', 'djamichou@gmail.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'password');

    // Submit login
    await page.click('button[type="submit"], .login-submit, button:has-text("Login")');
    await page.waitForLoadState('networkidle');

    console.log('\n🔄 Step 3: Navigate to product reservation page (Product ID: 2)');

    // Try different ways to navigate to product 2
    try {
      await page.goto('http://localhost:3003/products/2/reserve');
    } catch (e) {
      console.log('🔍 Direct route failed, trying to navigate via products list');
      await page.goto('http://localhost:3003/products');
      await page.waitForLoadState('networkidle');

      // Look for product 2 or any reserve button
      await page.click('a[href*="/products/2"], .reserve-button, button:has-text("Reserve")', { timeout: 10000 });
    }

    await page.waitForLoadState('networkidle');

    console.log('\n🔄 Step 4: Fill reservation form and monitor network requests');

    // Clear previous requests to focus on reservation call
    networkRequests.length = 0;
    responses.length = 0;

    // Try to find and fill reservation form
    const quantityInput = await page.locator('input[name="quantity"], #quantity, .quantity-input').first();
    if (await quantityInput.count() > 0) {
      await quantityInput.fill('1');
    }

    // Select wallet payment method if available
    const walletOption = await page.locator('input[value="wallet"], option[value="wallet"], .payment-wallet').first();
    if (await walletOption.count() > 0) {
      await walletOption.click();
    }

    // Fill wallet PIN
    const pinInput = await page.locator('input[name="wallet_pin"], #wallet_pin, .wallet-pin').first();
    if (await pinInput.count() > 0) {
      await pinInput.fill('1234');
    }

    console.log('📝 Form filled, attempting reservation...');

    // Submit reservation
    await page.click('button[type="submit"], .reserve-submit, button:has-text("Reserve")');

    // Wait for network request to complete
    await page.waitForTimeout(3000);

    console.log('\n📊 Step 5: Analyze captured network requests');

    // Find the reservation request
    const reservationRequest = networkRequests.find(req =>
      req.url.includes('/reservations') && req.method === 'POST'
    );

    if (reservationRequest) {
      console.log('\n🎯 Found reservation request:');
      console.log('URL:', reservationRequest.url);
      console.log('Method:', reservationRequest.method);
      console.log('Headers:', JSON.stringify(reservationRequest.headers, null, 2));
      console.log('Payload:', reservationRequest.postData);

      // Parse the payload to see exact structure
      if (reservationRequest.postData) {
        try {
          const payload = JSON.parse(reservationRequest.postData);
          console.log('\n📋 Parsed payload structure:');
          console.log(JSON.stringify(payload, null, 2));

          // Validate against known requirements
          console.log('\n✅ Validation check:');
          console.log('- product_id:', payload.product_id ? '✅' : '❌');
          console.log('- quantity:', payload.quantity ? '✅' : '❌');
          console.log('- payment_method:', payload.payment_method ? '✅' : '❌');
          console.log('- wallet_pin:', payload.wallet_pin ? '✅' : '❌');

        } catch (e) {
          console.log('❌ Could not parse payload as JSON:', reservationRequest.postData);
        }
      }
    } else {
      console.log('❌ No reservation request found in network logs');
    }

    // Find the response
    const reservationResponse = responses.find(resp =>
      resp.url.includes('/reservations') && resp.status === 422
    );

    if (reservationResponse) {
      console.log('\n📨 Found 422 response:', reservationResponse);

      // Try to get response body
      const responseBody = await page.evaluate(() => {
        return window.lastApiError || 'Could not capture response body';
      });
      console.log('Response body:', responseBody);
    }

    // Get any error messages from the UI
    const errorElements = await page.locator('.error, .alert-error, .text-red-500, [class*="error"]').all();
    if (errorElements.length > 0) {
      console.log('\n🚨 UI Error messages:');
      for (const error of errorElements) {
        const text = await error.textContent();
        if (text && text.trim()) {
          console.log('-', text.trim());
        }
      }
    }

    console.log('\n📊 All captured requests:');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Data: ${req.postData.substring(0, 100)}...`);
      }
    });

    console.log('\n📊 All responses:');
    responses.forEach((resp, index) => {
      console.log(`${index + 1}. ${resp.status} ${resp.statusText} - ${resp.url}`);
    });

  } catch (error) {
    console.error('🚨 Debug session error:', error);
  }

  // Keep browser open for manual inspection
  console.log('\n⏸️  Browser kept open for manual inspection. Close manually when done.');
  await page.waitForTimeout(30000); // Wait 30 seconds before auto-closing

  await browser.close();
}

debugReservation422();