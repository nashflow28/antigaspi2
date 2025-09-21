const { chromium } = require('playwright');

async function testWalletFix() {
  console.log('🧪 Testing wallet API fix');

  const browser = await chromium.launch({ headless: false, slowMo: 1500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor wallet API calls
  page.on('request', request => {
    if (request.url().includes('wallet')) {
      console.log(`🔍 Wallet API request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('wallet')) {
      console.log(`📨 Wallet API response: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3003/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'djamichou@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to reservation page
    console.log('Navigating to reservation page...');
    await page.goto('http://localhost:3003/products/2/reserve');
    await page.waitForLoadState('networkidle');

    // Go through steps to reach payment selection
    console.log('Navigating to payment step...');

    // Step 1: Quantity
    await page.click('button:has-text("Étape suivante")');
    await page.waitForTimeout(1000);

    // Step 2: Pickup info
    await page.fill('input[type="date"]', '2025-09-22');
    await page.selectOption('select', '14:00');
    await page.fill('input[type="tel"]', '+22890000000');
    await page.click('button:has-text("Étape suivante")');
    await page.waitForTimeout(1000);

    // Step 3: Payment - check if wallet option is now available
    console.log('Checking payment options...');
    await page.screenshot({ path: 'payment-options-after-fix.png', fullPage: true });

    const walletOption = page.locator('button:has-text("Portefeuille"), button:has-text("wallet")');
    const walletCount = await walletOption.count();

    if (walletCount > 0) {
      console.log('✅ SUCCESS: Wallet payment option is now available!');

      // Try to select wallet and fill PIN
      await walletOption.first().click();
      await page.waitForTimeout(500);

      const pinInput = page.locator('input[type="password"], #wallet-pin');
      if (await pinInput.count() > 0) {
        await pinInput.fill('1234');
        console.log('✅ Wallet PIN field found and filled');
      }

      await page.click('button:has-text("Étape suivante")');
      await page.waitForTimeout(1000);

      // Step 4: Confirmation
      await page.check('input[type="checkbox"]');

      console.log('🎯 Ready to test actual reservation submission...');
      await page.screenshot({ path: 'ready-for-submission.png', fullPage: true });

      // Test the actual reservation submission
      console.log('Submitting reservation...');
      await page.click('button:has-text("Confirmer")');
      await page.waitForTimeout(3000);

      // Check for success message or error
      const successMessage = page.locator('.success, .alert-success, :has-text("succès")');
      const errorMessage = page.locator('.error, .alert-error, :has-text("erreur")');

      if (await successMessage.count() > 0) {
        console.log('✅ SUCCESS: Reservation created successfully!');
      } else if (await errorMessage.count() > 0) {
        console.log('⚠️ Error occurred during submission');
        const errorText = await errorMessage.first().textContent();
        console.log('Error message:', errorText);
      } else {
        console.log('🤔 Submission completed, checking current page...');
        console.log('Current URL:', page.url());
      }

    } else {
      console.log('❌ FAILED: Wallet option still not available');

      // List available payment options
      const paymentButtons = page.locator('button[class*="payment"], .payment-option');
      const buttonCount = await paymentButtons.count();
      console.log(`Available payment options: ${buttonCount}`);

      for (let i = 0; i < buttonCount; i++) {
        const buttonText = await paymentButtons.nth(i).textContent();
        console.log(`- ${buttonText}`);
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('\nTest complete. Browser kept open for inspection. Press Enter to close...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    browser.close();
    process.exit(0);
  });
}

testWalletFix();