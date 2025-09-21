import { test, expect } from '@playwright/test'

test.describe('Wallet Basic Tests', () => {
  // Use existing test user
  const testUser = {
    email: 'jean.dupont@email.com',
    password: 'password'
  }

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login')

    // Wait for page to load
    await page.waitForSelector('#email', { timeout: 10000 })

    // Fill login form
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)

    // Submit form
    await page.click('button:has-text("Se connecter")')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('1. Access wallet dashboard', async ({ page }) => {
    // Navigate to wallet
    await page.goto('http://localhost:3000/wallet')

    // Check if wallet page loads
    await expect(page.locator('h1')).toContainText('Portefeuille')

    // Check for wallet card
    await expect(page.locator('.wallet-card')).toBeVisible()

    // Check for balance display
    const balanceElement = page.locator('[data-testid="wallet-balance"]').or(page.locator('text=/\\d+ XOF/'))
    await expect(balanceElement).toBeVisible()
  })

  test('2. Check wallet components', async ({ page }) => {
    await page.goto('http://localhost:3000/wallet')

    // Check for main sections
    await expect(page.locator('text=Solde')).toBeVisible()

    // Check for action buttons
    const rechargeButton = page.locator('button:has-text("Recharger")').or(page.locator('text=Recharger'))
    await expect(rechargeButton).toBeVisible()

    // Check for transaction section
    const transactionSection = page.locator('text=/transaction|historique/i')
    await expect(transactionSection).toBeVisible()
  })

  test('3. Open recharge modal', async ({ page }) => {
    await page.goto('http://localhost:3000/wallet')

    // Click recharge button
    const rechargeButton = page.locator('button:has-text("Recharger")').first()
    await rechargeButton.click()

    // Check if modal opens
    await expect(page.locator('text=Recharger le portefeuille')).toBeVisible()

    // Check for amount input
    await expect(page.locator('input[type="number"]')).toBeVisible()

    // Check for payment method options
    await expect(page.locator('text=/Flooz|T-Money/i')).toBeVisible()
  })

  test('4. Check PIN setup prompt', async ({ page }) => {
    await page.goto('http://localhost:3000/wallet')

    // Check if PIN setup is mentioned
    const pinSection = page.locator('text=/PIN|code/i')

    // If wallet doesn't have PIN, setup button should be visible
    const setupPinButton = page.locator('button:has-text("Configurer")').or(page.locator('text=Configurer un PIN'))
    const hasPinButton = await setupPinButton.isVisible().catch(() => false)

    if (hasPinButton) {
      await setupPinButton.click()
      // Check if PIN setup modal opens
      await expect(page.locator('text=/configurer.*PIN/i')).toBeVisible()
    } else {
      // PIN already configured
      await expect(pinSection).toBeVisible()
    }
  })

  test('5. Navigate from product to wallet payment', async ({ page }) => {
    // Go to products page
    await page.goto('http://localhost:3000/products')

    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 10000 })

    // Click first product to see details
    await page.locator('.product-card').first().click()

    // Click reserve button if on detail page, or directly reserve
    const reserveButton = page.locator('button:has-text("Réserver")').first()
    await reserveButton.click()

    // Check if wallet payment option is available in reservation flow
    await page.waitForURL('**/reserve', { timeout: 10000 })

    // Look for payment method selection
    const paymentSection = page.locator('text=/méthode.*paiement|payment/i')
    await expect(paymentSection).toBeVisible()

    // Check if wallet option is present
    const walletOption = page.locator('text=Portefeuille électronique').or(page.locator('text=/wallet|portefeuille/i'))
    await expect(walletOption).toBeVisible()
  })
})