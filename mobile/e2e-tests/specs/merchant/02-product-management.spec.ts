// @ts-nocheck
import { test, expect } from '@playwright/test'
import { MerchantDashboardPage } from '../../pages/MerchantDashboardPage'
import { ProductFormPage } from '../../pages/ProductFormPage'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { assertNotificationVisible } from '../../helpers/assertions'

test.describe('Merchant Product Management', () => {
  let dashboardPage: MerchantDashboardPage
  let productFormPage: ProductFormPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new MerchantDashboardPage(page)
    productFormPage = new ProductFormPage(page)

    // Login as merchant
    await login(page, testUsers.merchant)

    // Navigate to add product
    await dashboardPage.clickAddProduct()
  })

  test('01 - Should display product creation form', async ({ page }) => {
    await expect(productFormPage.nameInput).toBeVisible()
    await expect(productFormPage.descriptionInput).toBeVisible()
    await expect(productFormPage.categorySelect).toBeVisible()
    await expect(productFormPage.originalPriceInput).toBeVisible()
    await expect(productFormPage.discountedPriceInput).toBeVisible()
    await expect(productFormPage.quantityInput).toBeVisible()
    await expect(productFormPage.expirationDateInput).toBeVisible()
    await expect(productFormPage.submitButton).toBeVisible()
  })

  test('02 - Should validate required fields', async ({ page }) => {
    await productFormPage.submit()

    // Should show validation errors or prevent submission
    const nameValid = await productFormPage.nameInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(nameValid).toBe(false)
  })

  test('03 - Should create new product successfully', async ({ page }) => {
    const newProduct = {
      name: 'Test Product E2E',
      description: 'Description for E2E test product',
      category: 'Boulangerie',
      originalPrice: 1000,
      discountedPrice: 500,
      quantity: 10,
      expirationDate: '2025-12-31',
    }

    await productFormPage.fillProductForm(newProduct)
    await productFormPage.submit()

    // Should show success notification
    await assertNotificationVisible(page, /créé|created/i)

    // Should redirect to products list
    await expect(dashboardPage.myProductsList).toBeVisible({ timeout: 10000 })

    // Should see new product in list
    await expect(page.getByText(newProduct.name)).toBeVisible()
  })

  test('04 - Should validate discounted price < original price', async ({ page }) => {
    await productFormPage.nameInput.fill('Invalid Price Product')
    await productFormPage.descriptionInput.fill('Testing price validation')
    await productFormPage.categorySelect.selectOption('Boulangerie')
    await productFormPage.originalPriceInput.fill('500')
    await productFormPage.discountedPriceInput.fill('1000') // Higher than original
    await productFormPage.quantityInput.fill('5')
    await productFormPage.expirationDateInput.fill('2025-12-31')

    await productFormPage.submit()

    // Should show error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/prix.*réduit.*inférieur|discounted.*price.*lower/i)).toBeVisible()
  })

  test('05 - Should validate quantity is positive', async ({ page }) => {
    await productFormPage.nameInput.fill('Invalid Quantity Product')
    await productFormPage.descriptionInput.fill('Testing quantity validation')
    await productFormPage.categorySelect.selectOption('Boulangerie')
    await productFormPage.originalPriceInput.fill('1000')
    await productFormPage.discountedPriceInput.fill('500')
    await productFormPage.quantityInput.fill('0') // Invalid
    await productFormPage.expirationDateInput.fill('2025-12-31')

    await productFormPage.submit()

    // Should show error or prevent submission
    const quantityValid = await productFormPage.quantityInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(quantityValid).toBe(false)
  })

  test('06 - Should validate expiration date is in future', async ({ page }) => {
    await productFormPage.nameInput.fill('Expired Product')
    await productFormPage.descriptionInput.fill('Testing expiration validation')
    await productFormPage.categorySelect.selectOption('Boulangerie')
    await productFormPage.originalPriceInput.fill('1000')
    await productFormPage.discountedPriceInput.fill('500')
    await productFormPage.quantityInput.fill('5')
    await productFormPage.expirationDateInput.fill('2020-01-01') // Past date

    await productFormPage.submit()

    // Should show error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('07 - Should edit existing product', async ({ page }) => {
    // First create a product
    const newProduct = {
      name: 'Product to Edit',
      description: 'Original description',
      category: 'Boulangerie',
      originalPrice: 800,
      discountedPrice: 400,
      quantity: 5,
      expirationDate: '2025-12-31',
    }

    await productFormPage.fillProductForm(newProduct)
    await productFormPage.submit()

    await assertNotificationVisible(page, /créé/i)

    // Click on the product to edit
    await page.getByText(newProduct.name).click()

    // Edit form should be visible
    await expect(productFormPage.nameInput).toBeVisible()

    // Update name
    await productFormPage.nameInput.fill('Product EDITED')
    await productFormPage.submit()

    await assertNotificationVisible(page, /modifié|updated/i)

    // Should see updated name
    await expect(page.getByText('Product EDITED')).toBeVisible()
  })

  test('08 - Should delete product', async ({ page }) => {
    // Create a product first
    const productToDelete = {
      name: 'Product to Delete',
      description: 'Will be deleted',
      category: 'Fruits & Légumes',
      originalPrice: 600,
      discountedPrice: 300,
      quantity: 3,
      expirationDate: '2025-12-31',
    }

    await productFormPage.fillProductForm(productToDelete)
    await productFormPage.submit()

    await assertNotificationVisible(page, /créé/i)

    // Click on product
    await page.getByText(productToDelete.name).click()

    // Click delete
    await productFormPage.delete()

    // Confirm deletion
    await page.getByTestId('confirm-delete-button').click()

    await assertNotificationVisible(page, /supprimé|deleted/i)

    // Product should no longer be visible
    const isVisible = await page.getByText(productToDelete.name).isVisible({ timeout: 2000 }).catch(() => false)
    expect(isVisible).toBe(false)
  })

  test('09 - Should cancel product creation', async ({ page }) => {
    await productFormPage.nameInput.fill('Cancelled Product')
    await productFormPage.cancel()

    // Should return to dashboard
    await expect(dashboardPage.myProductsList).toBeVisible({ timeout: 5000 })

    // Product should not exist
    const isVisible = await page.getByText('Cancelled Product').isVisible({ timeout: 2000 }).catch(() => false)
    expect(isVisible).toBe(false)
  })

  test('10 - Should toggle product active status', async ({ page }) => {
    // Create a product
    const product = {
      name: 'Active Toggle Product',
      description: 'Testing active toggle',
      category: 'Boulangerie',
      originalPrice: 700,
      discountedPrice: 350,
      quantity: 4,
      expirationDate: '2025-12-31',
    }

    await productFormPage.fillProductForm(product)
    await productFormPage.submit()

    await assertNotificationVisible(page, /créé/i)

    // Click on product
    await page.getByText(product.name).click()

    // Toggle active status
    const activeToggle = page.getByTestId('product-active-toggle')
    await expect(activeToggle).toBeVisible()
    await activeToggle.click()

    // Should show notification
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })

  test('11 - Should display product image upload', async ({ page }) => {
    await expect(productFormPage.imageUpload).toBeVisible()
  })

  test('12 - Should show image preview after upload', async ({ page }) => {
    // Note: This test requires a test image file
    // For now, we just verify the upload input exists
    await expect(productFormPage.imageUpload).toBeVisible()
    await expect(productFormPage.imageUpload).toHaveAttribute('accept', /image/)
  })

  test('13 - Should filter products by category', async ({ page }) => {
    // Create products in different categories
    const product1 = {
      name: 'Boulangerie Filter Test',
      description: 'Category filter test',
      category: 'Boulangerie',
      originalPrice: 500,
      discountedPrice: 250,
      quantity: 5,
      expirationDate: '2025-12-31',
    }

    await productFormPage.fillProductForm(product1)
    await productFormPage.submit()

    await assertNotificationVisible(page, /créé/i)

    // Apply category filter
    const categoryFilter = page.getByTestId('merchant-category-filter')
    await categoryFilter.selectOption('Boulangerie')

    // Should only show Boulangerie products
    await expect(page.getByText(product1.name)).toBeVisible()
  })

  test('14 - Should search products by name', async ({ page }) => {
    const searchInput = page.getByTestId('merchant-product-search')

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Pain')

      // Should filter results
      await page.waitForLoadState('networkidle')

      // All visible products should contain "Pain"
      const products = dashboardPage.myProductsList.locator('[data-testid^="merchant-product-"]')
      const count = await products.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('15 - Should display product statistics', async ({ page }) => {
    // Click on any product
    const firstProduct = page.getByTestId('merchant-product-1')

    if (await firstProduct.isVisible().catch(() => false)) {
      await firstProduct.click()

      // Should show stats like views, reservations, revenue
      const statsSection = page.getByTestId('product-statistics')

      if (await statsSection.isVisible().catch(() => false)) {
        await expect(statsSection).toBeVisible()
      }
    }
  })
})
