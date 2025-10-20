// @ts-nocheck
import { test, expect } from '@playwright/test'
import { ProductsPage } from '../../pages/ProductsPage'
import { ProductDetailPage } from '../../pages/ProductDetailPage'
import { ReservationsPage } from '../../pages/ReservationsPage'
import { testUsers, testProducts } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { navigateToProducts, navigateToReservations } from '../../helpers/navigation'
import { assertNotificationVisible } from '../../helpers/assertions'

test.describe('Consumer Reservation Flow', () => {
  let productsPage: ProductsPage
  let productDetailPage: ProductDetailPage
  let reservationsPage: ReservationsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    productDetailPage = new ProductDetailPage(page)
    reservationsPage = new ReservationsPage(page)

    // Login as consumer
    await login(page, testUsers.consumer)

    // Navigate to products page
    await navigateToProducts(page)
  })

  test('01 - Should display reserve button on product detail', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.reserveButton).toBeVisible()
    await expect(productDetailPage.reserveButton).toBeEnabled()
  })

  test('02 - Should have quantity selector with default value 1', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    await expect(productDetailPage.quantitySelector).toBeVisible()

    const value = await productDetailPage.quantitySelector.inputValue()
    expect(parseInt(value)).toBe(1)
  })

  test('03 - Should increment quantity', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Click increment 3 times
    await productDetailPage.quantityIncrement.click()
    await productDetailPage.quantityIncrement.click()
    await productDetailPage.quantityIncrement.click()

    const value = await productDetailPage.quantitySelector.inputValue()
    expect(parseInt(value)).toBe(4)
  })

  test('04 - Should decrement quantity', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Set to 5
    await productDetailPage.setQuantity(5)

    // Decrement 2 times
    await productDetailPage.quantityDecrement.click()
    await productDetailPage.quantityDecrement.click()

    const value = await productDetailPage.quantitySelector.inputValue()
    expect(parseInt(value)).toBe(3)
  })

  test('05 - Should not allow quantity below 1', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Try to decrement from 1
    await productDetailPage.quantityDecrement.click()

    const value = await productDetailPage.quantitySelector.inputValue()
    expect(parseInt(value)).toBe(1)
  })

  test('06 - Should create reservation with quantity 1', async ({ page }) => {
    await productsPage.clickProduct(testProducts.croissants.id)

    // Reserve
    await productDetailPage.reserve(1)

    // Should show success notification
    await assertNotificationVisible(page, /réservation.*créée|reservation.*created/i)
  })

  test('07 - Should create reservation with quantity > 1', async ({ page }) => {
    await productsPage.clickProduct(testProducts.bananes.id)

    // Reserve 3 units
    await productDetailPage.reserve(3)

    // Should show success notification
    await assertNotificationVisible(page, /réservation.*créée|reservation.*created/i)
  })

  test('08 - Should display created reservation in reservations list', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Get product name for later verification
    const productName = await productDetailPage.productName.textContent()

    // Reserve
    await productDetailPage.reserve(1)

    // Wait for success notification
    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations
    await navigateToReservations(page)

    // Should see the reservation
    await expect(page.getByText(productName || '')).toBeVisible({ timeout: 10000 })
  })

  test('09 - Should show reservation status as pending', async ({ page }) => {
    await productsPage.clickProduct(testProducts.croissants.id)
    await productDetailPage.reserve(1)

    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations
    await navigateToReservations(page)

    // Click first reservation
    const firstReservation = await reservationsPage.getReservationCount()
    expect(firstReservation).toBeGreaterThan(0)

    await reservationsPage.clickReservationByIndex(0)

    // Should show pending status
    await expect(page.getByText(/en attente|pending/i)).toBeVisible()
  })

  test('10 - Should display reservation total price', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)

    // Reserve 2 units
    await productDetailPage.reserve(2)

    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations
    await navigateToReservations(page)

    // Click first reservation
    await reservationsPage.clickReservationByIndex(0)

    // Should show total: 2 * 250 = 500 XOF
    const expectedTotal = testProducts.painComplet.price * 2
    await expect(page.getByText(new RegExp(`${expectedTotal}\\s*(XOF|FCFA)`))).toBeVisible()
  })

  test('11 - Should allow cancelling pending reservation', async ({ page }) => {
    await productsPage.clickProduct(testProducts.bananes.id)
    await productDetailPage.reserve(1)

    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations
    await navigateToReservations(page)

    // Click first reservation
    await reservationsPage.clickReservationByIndex(0)

    // Click cancel button
    const cancelButton = page.getByTestId('cancel-reservation-button')
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    // Confirm cancellation in modal
    const confirmButton = page.getByTestId('confirm-cancel-button')
    await confirmButton.click()

    // Should show success notification
    await assertNotificationVisible(page, /annulée|cancelled/i)
  })

  test('12 - Should show cancelled reservations in cancelled tab', async ({ page }) => {
    await productsPage.clickProduct(testProducts.croissants.id)
    await productDetailPage.reserve(1)

    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations
    await navigateToReservations(page)

    // Cancel reservation
    await reservationsPage.clickReservationByIndex(0)
    await page.getByTestId('cancel-reservation-button').click()
    await page.getByTestId('confirm-cancel-button').click()

    await assertNotificationVisible(page, /annulée/i)

    // Go back to list
    await navigateToReservations(page)

    // Switch to cancelled tab
    await reservationsPage.switchToCancelled()

    // Should see cancelled reservation
    const count = await reservationsPage.getReservationCount()
    expect(count).toBeGreaterThan(0)
  })

  test('13 - Should not allow cancelling already cancelled reservation', async ({ page }) => {
    await productsPage.clickProduct(testProducts.painComplet.id)
    await productDetailPage.reserve(1)

    await assertNotificationVisible(page, /réservation.*créée/i)

    // Navigate to reservations and cancel
    await navigateToReservations(page)
    await reservationsPage.clickReservationByIndex(0)
    await page.getByTestId('cancel-reservation-button').click()
    await page.getByTestId('confirm-cancel-button').click()

    // Go to cancelled tab
    await navigateToReservations(page)
    await reservationsPage.switchToCancelled()
    await reservationsPage.clickReservationByIndex(0)

    // Cancel button should not exist or be disabled
    const cancelButton = page.getByTestId('cancel-reservation-button')
    const isVisible = await cancelButton.isVisible().catch(() => false)

    if (isVisible) {
      await expect(cancelButton).toBeDisabled()
    } else {
      expect(isVisible).toBe(false)
    }
  })

  test('14 - Should work in offline mode', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true)

    await productsPage.clickProduct(testProducts.bananes.id)
    await productDetailPage.reserve(1)

    // Should show offline notification
    await assertNotificationVisible(page, /hors ligne|offline/i)

    // Go online
    await page.context().setOffline(false)

    // Wait for sync
    await page.waitForTimeout(2000)

    // Navigate to reservations
    await navigateToReservations(page)

    // Should see synced reservation
    const count = await reservationsPage.getReservationCount()
    expect(count).toBeGreaterThan(0)
  })

  test('15 - Should display empty state when no reservations', async ({ page }) => {
    // Navigate to reservations
    await navigateToReservations(page)

    // If there are no reservations, should show empty state
    const isEmpty = await reservationsPage.isEmptyStateVisible()

    if (isEmpty) {
      await expect(reservationsPage.emptyState).toBeVisible()
      await expect(page.getByText(/aucune réservation|no reservations/i)).toBeVisible()
    } else {
      // Has reservations, which is also valid
      const count = await reservationsPage.getReservationCount()
      expect(count).toBeGreaterThan(0)
    }
  })
})
