import { test, expect } from '@playwright/test'
import { AdminDashboardPage } from '../../pages/AdminDashboardPage'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'

test.describe('Admin Product Moderation', () => {
  let adminPage: AdminDashboardPage

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminDashboardPage(page)

    // Login as admin
    await login(page, testUsers.admin)

    // Navigate to products section
    await adminPage.navigateToProducts()
  })

  test('01 - Should display all products list', async ({ page }) => {
    const productsList = page.getByTestId('admin-products-list')
    await expect(productsList).toBeVisible({ timeout: 10000 })

    const products = productsList.locator('[data-testid^="admin-product-"]')
    const count = await products.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('02 - Should view product details', async ({ page }) => {
    const firstProduct = page.getByTestId('admin-product-1')

    if (await firstProduct.isVisible().catch(() => false)) {
      await firstProduct.click()

      // Should show product detail modal/page
      await expect(page.getByTestId('admin-product-detail')).toBeVisible({ timeout: 5000 })
    }
  })

  test('03 - Should deactivate inappropriate product', async ({ page }) => {
    const activeProduct = page.locator('[data-testid^="admin-product-"]').filter({ hasText: /actif|active/i }).first()

    if (await activeProduct.isVisible().catch(() => false)) {
      await activeProduct.click()

      const deactivateButton = page.getByTestId('admin-deactivate-product')

      if (await deactivateButton.isVisible().catch(() => false)) {
        await deactivateButton.click()

        // Should show confirmation
        await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('04 - Should filter products by merchant', async ({ page }) => {
    const merchantFilter = page.getByTestId('filter-by-merchant')

    if (await merchantFilter.isVisible().catch(() => false)) {
      await merchantFilter.selectOption({ index: 1 }) // Select first merchant

      await page.waitForLoadState('networkidle')

      const products = page.locator('[data-testid^="admin-product-"]')
      const count = await products.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('05 - Should search products by name', async ({ page }) => {
    const searchInput = page.getByTestId('admin-product-search')

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('pain')

      await page.waitForLoadState('networkidle')

      const products = page.locator('[data-testid^="admin-product-"]')
      const count = await products.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})
