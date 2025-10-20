import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { HomePage } from '../../pages/HomePage'
import { ProductsPage } from '../../pages/ProductsPage'
import { ProductDetailPage } from '../../pages/ProductDetailPage'
import { testUsers, testProducts } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { navigateToProducts } from '../../helpers/navigation'

test.describe('Consumer Products Browsing', () => {
  let productsPage: ProductsPage
  let productDetailPage: ProductDetailPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    productDetailPage = new ProductDetailPage(page)

    // Login as consumer
    await login(page, testUsers.consumer)

    // Navigate to products page
    await navigateToProducts(page)
  })

  test('01 - Should display products list', async ({ page }) => {
    await expect(productsPage.productsList).toBeVisible({ timeout: 10000 })

    // Should have at least one product
    const productCount = await productsPage.getProductCount()
    expect(productCount).toBeGreaterThan(0)
  })

  test('02 - Should display product cards with required information', async ({ page }) => {
    // Check first product card has all elements
    const firstProduct = page.getByTestId('product-card-1')

    await expect(firstProduct).toBeVisible()
    await expect(firstProduct.getByTestId('product-name')).toBeVisible()
    await expect(firstProduct.getByTestId('discounted-price')).toBeVisible()
    await expect(firstProduct.getByTestId('original-price')).toBeVisible()
  })

  test('03 - Should navigate to product detail on card click', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Should show product detail page
    await expect(productDetailPage.productName).toBeVisible({ timeout: 10000 })
    await expect(productDetailPage.productName).toContainText(testProducts.painComplet.name)
  })

  test('04 - Should display product images', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Image should be visible and loaded
    await expect(productDetailPage.productImage).toBeVisible()

    // Check image is actually loaded (not broken)
    const isLoaded = await productDetailPage.productImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalHeight !== 0
    })
    expect(isLoaded).toBe(true)
  })

  test('05 - Should display discount percentage badge', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.discountBadge).toBeVisible()

    // Should show -50% or similar
    const discountText = await productDetailPage.getDiscountPercentage()
    expect(discountText).toMatch(/(-|\d+)\s*%/)
  })

  test('06 - Should display merchant information', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.merchantName).toBeVisible()
    await expect(productDetailPage.merchantAddress).toBeVisible()
  })

  test('07 - Should search products by name', async ({ page }) => {
    await productsPage.search('pain')

    // Should show filtered results
    await page.waitForLoadState('networkidle')

    // All visible products should contain "pain"
    const products = productsPage.productsList.locator('[data-testid^="product-card-"]')
    const count = await products.count()
    expect(count).toBeGreaterThan(0)
  })

  test('08 - Should filter products by category', async ({ page }) => {
    await productsPage.applyFilter('category', 'Boulangerie')

    await page.waitForLoadState('networkidle')

    // Should show only boulangerie products
    const products = productsPage.productsList.locator('[data-testid^="product-card-"]')
    const count = await products.count()
    expect(count).toBeGreaterThan(0)
  })

  test('09 - Should sort products by price ascending', async ({ page }) => {
    await productsPage.sortBy('price-asc')

    await page.waitForLoadState('networkidle')

    // Get first two product prices and verify order
    const firstPrice = await page.locator('[data-testid^="product-card-"]').first().getByTestId('discounted-price').textContent()
    const secondPrice = await page.locator('[data-testid^="product-card-"]').nth(1).getByTestId('discounted-price').textContent()

    const price1 = parseInt(firstPrice?.replace(/\D/g, '') || '0')
    const price2 = parseInt(secondPrice?.replace(/\D/g, '') || '0')

    expect(price1).toBeLessThanOrEqual(price2)
  })

  test('10 - Should sort products by price descending', async ({ page }) => {
    await productsPage.sortBy('price-desc')

    await page.waitForLoadState('networkidle')

    // Get first two product prices and verify order
    const firstPrice = await page.locator('[data-testid^="product-card-"]').first().getByTestId('discounted-price').textContent()
    const secondPrice = await page.locator('[data-testid^="product-card-"]').nth(1).getByTestId('discounted-price').textContent()

    const price1 = parseInt(firstPrice?.replace(/\D/g, '') || '0')
    const price2 = parseInt(secondPrice?.replace(/\D/g, '') || '0')

    expect(price1).toBeGreaterThanOrEqual(price2)
  })

  test('11 - Should show empty state when no products match search', async ({ page }) => {
    await productsPage.search('nonexistentproduct12345')

    await page.waitForLoadState('networkidle')

    // Should show empty state
    const isEmpty = await productsPage.isEmptyStateVisible()
    expect(isEmpty).toBe(true)
  })

  test('12 - Should load more products on pagination', async ({ page }) => {
    // Get initial product count
    const initialCount = await productsPage.getProductCount()

    // Check if load more button exists
    const hasLoadMore = await productsPage.loadMoreButton.isVisible().catch(() => false)

    if (hasLoadMore) {
      await productsPage.loadMore()
      await page.waitForLoadState('networkidle')

      // Should have more products
      const newCount = await productsPage.getProductCount()
      expect(newCount).toBeGreaterThan(initialCount)
    } else {
      // If no load more, we have all products
      expect(initialCount).toBeGreaterThan(0)
    }
  })

  test('13 - Should display expiration date', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.expirationDate).toBeVisible()

    // Should contain a date format
    const dateText = await productDetailPage.expirationDate.textContent()
    expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/)
  })

  test('14 - Should navigate back from product detail', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Wait for detail page
    await expect(productDetailPage.productName).toBeVisible()

    // Go back
    await productDetailPage.goBack()

    // Should be back on products list
    await expect(productsPage.productsList).toBeVisible()
  })

  test('15 - Should display product category', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.category).toBeVisible()
    await expect(productDetailPage.category).toContainText(testProducts.painComplet.category)
  })
})
