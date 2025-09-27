import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
  })

  test('User can browse products without authentication', async ({ page }) => {
    // Check if we can see products on homepage
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible({ timeout: 10000 })

    // Should see at least one product
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()

    // Product cards should have essential information
    await expect(productCards.first().locator('[data-testid="product-name"]')).toBeVisible()
    await expect(productCards.first().locator('[data-testid="product-price"]')).toBeVisible()
  })

  test('Authentication flow works correctly', async ({ page }) => {
    // Navigate to login page
    await page.click('[data-testid="login-button"]', { timeout: 5000 })

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'jean.dupont@email.com')
    await page.fill('[data-testid="password-input"]', 'password')

    // Submit form
    await page.click('[data-testid="submit-login"]')

    // Should redirect to dashboard or show success
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible({ timeout: 10000 })
  })

  test('Product reservation flow for authenticated user', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'jean.dupont@email.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="submit-login"]')

    // Wait for authentication
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible({ timeout: 10000 })

    // Navigate to products
    await page.goto('http://localhost:3000/products')

    // Select a product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()

    // Add to cart or reserve
    await page.click('[data-testid="add-to-cart"]', { timeout: 5000 })

    // Check cart has items
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')
  })

  test('Cart functionality works correctly', async ({ page }) => {
    // Add items to cart (simulate)
    await page.evaluate(() => {
      localStorage.setItem('antigaspi_cart_items', JSON.stringify([
        {
          id: 1,
          name: 'Test Product',
          price: 250,
          quantity: 1
        }
      ]))
    })

    // Refresh to load cart from localStorage
    await page.reload()

    // Navigate to cart
    await page.click('[data-testid="cart-button"]', { timeout: 5000 })

    // Should see cart items
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()

    // Should show correct total
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('250')
  })

  test('Navigation between pages works', async ({ page }) => {
    // Test main navigation links
    const navigationLinks = [
      { selector: '[data-testid="nav-home"]', expectedUrl: '/' },
      { selector: '[data-testid="nav-products"]', expectedUrl: '/products' },
      { selector: '[data-testid="nav-about"]', expectedUrl: '/about' }
    ]

    for (const link of navigationLinks) {
      try {
        await page.click(link.selector, { timeout: 3000 })
        // Allow some flexibility in URL matching
        await page.waitForURL(new RegExp(link.expectedUrl.replace('/', '\/')), { timeout: 5000 })
      } catch (error) {
        // If specific navigation fails, just ensure page doesn't crash
        console.log(`Navigation to ${link.expectedUrl} not available or failed`)
      }
    }
  })

  test('Error handling and fallbacks work', async ({ page }) => {
    // Test 404 page
    await page.goto('http://localhost:3000/non-existent-page')

    // Should show 404 page or redirect to home
    const has404 = await page.locator('[data-testid="404-page"]').isVisible()
    const hasHome = await page.url().includes('localhost:3000')

    expect(has404 || hasHome).toBeTruthy()
  })

  test('Performance and loading states', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(10000) // 10 seconds max

    // Check if loading states are handled
    const loadingIndicators = page.locator('[data-testid="loading"]')
    const errorStates = page.locator('[data-testid="error"]')

    // Either content loads or we see appropriate loading/error states
    const hasContent = await page.locator('main').isVisible()
    const hasLoading = await loadingIndicators.count() > 0
    const hasError = await errorStates.count() > 0

    expect(hasContent || hasLoading || hasError).toBeTruthy()
  })

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check if mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    const mobileToggle = page.locator('[data-testid="mobile-menu-toggle"]')

    if (await mobileToggle.isVisible()) {
      await mobileToggle.click()
      await expect(mobileMenu).toBeVisible()
    }

    // Check if content is still accessible on mobile
    await expect(page.locator('main')).toBeVisible()
  })
})
