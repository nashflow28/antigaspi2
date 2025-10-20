import { test, expect } from '@playwright/test'
import { testUsers, testProducts } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { navigateToProducts, navigateToProfile, navigateToReservations } from '../../helpers/navigation'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configure viewport for consistent screenshots
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
  })

  test('01 - Login page should match baseline', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
    })
  })

  test('02 - Consumer home page should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)

    await expect(page).toHaveScreenshot('consumer-home.png', {
      maxDiffPixels: 100,
    })
  })

  test('03 - Products list should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    // Wait for products to load
    await page.waitForSelector('[data-testid="products-list"]', { state: 'visible' })

    await expect(page).toHaveScreenshot('products-list.png', {
      maxDiffPixels: 100,
    })
  })

  test('04 - Product detail should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    // Click first product
    await page.getByTestId(`product-card-${testProducts.painComplet.id}`).click()

    await page.waitForSelector('[data-testid="product-name"]', { state: 'visible' })

    await expect(page).toHaveScreenshot('product-detail.png', {
      maxDiffPixels: 100,
    })
  })

  test('05 - Reservations page should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToReservations(page)

    await expect(page).toHaveScreenshot('reservations-page.png', {
      maxDiffPixels: 100,
    })
  })

  test('06 - Profile page should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProfile(page)

    await expect(page).toHaveScreenshot('profile-page.png', {
      maxDiffPixels: 100,
    })
  })

  test('07 - Merchant dashboard should match baseline', async ({ page }) => {
    await login(page, testUsers.merchant)

    await expect(page).toHaveScreenshot('merchant-dashboard.png', {
      maxDiffPixels: 100,
    })
  })

  test('08 - Product creation form should match baseline', async ({ page }) => {
    await login(page, testUsers.merchant)

    await page.getByTestId('add-product-button').click()

    await page.waitForSelector('[data-testid="product-name-input"]', { state: 'visible' })

    await expect(page).toHaveScreenshot('product-form.png', {
      maxDiffPixels: 100,
    })
  })

  test('09 - Admin dashboard should match baseline', async ({ page }) => {
    await login(page, testUsers.admin)

    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      maxDiffPixels: 100,
    })
  })

  test('10 - Error states should match baseline', async ({ page }) => {
    await page.goto('/')

    // Trigger error with invalid login
    await page.getByTestId('login-email-input').fill('invalid@example.com')
    await page.getByTestId('login-password-input').fill('wrongpassword')
    await page.getByTestId('login-submit-button').click()

    // Wait for error
    await page.waitForSelector('[role="alert"]', { state: 'visible', timeout: 10000 })

    await expect(page).toHaveScreenshot('error-state.png', {
      maxDiffPixels: 100,
    })
  })

  test('11 - Empty states should match baseline', async ({ page }) => {
    // Login with user that has no reservations
    await login(page, testUsers.consumer2)
    await navigateToReservations(page)

    // Check for empty state
    const isEmpty = await page.getByTestId('empty-state').isVisible().catch(() => false)

    if (isEmpty) {
      await expect(page).toHaveScreenshot('empty-reservations.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('12 - Dark mode should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProfile(page)

    // Enable dark mode
    await page.getByTestId('dark-mode-toggle').click()

    await page.waitForTimeout(500) // Wait for theme transition

    await expect(page).toHaveScreenshot('dark-mode-profile.png', {
      maxDiffPixels: 100,
    })
  })

  test('13 - Tablet viewport should match baseline', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad size

    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    await expect(page).toHaveScreenshot('tablet-products.png', {
      maxDiffPixels: 100,
    })
  })

  test('14 - Loading states should match baseline', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('login-email-input').fill(testUsers.consumer.email)
    await page.getByTestId('login-password-input').fill(testUsers.consumer.password)

    // Click submit and immediately capture loading state
    await page.getByTestId('login-submit-button').click()

    // Try to capture loading state (might be too fast)
    const loadingVisible = await page.getByTestId('loading-indicator').isVisible({ timeout: 500 }).catch(() => false)

    if (loadingVisible) {
      await expect(page).toHaveScreenshot('loading-state.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('15 - Modal dialogs should match baseline', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    // Click product to open detail (modal on mobile)
    await page.getByTestId(`product-card-${testProducts.croissants.id}`).click()

    await page.waitForSelector('[data-testid="product-name"]', { state: 'visible' })

    // Check if it's displayed as modal
    const modalVisible = await page.getByTestId('product-detail-modal').isVisible().catch(() => false)

    if (modalVisible) {
      await expect(page).toHaveScreenshot('product-modal.png', {
        maxDiffPixels: 100,
      })
    }
  })
})
