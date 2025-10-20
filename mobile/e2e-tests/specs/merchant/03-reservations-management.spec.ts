import { test, expect } from '@playwright/test'
import { MerchantDashboardPage } from '../../pages/MerchantDashboardPage'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'

test.describe('Merchant Reservations Management', () => {
  let dashboardPage: MerchantDashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new MerchantDashboardPage(page)

    // Login as merchant
    await login(page, testUsers.merchant)
  })

  test('01 - Should display reservations list', async ({ page }) => {
    await expect(dashboardPage.reservationsList).toBeVisible()
  })

  test('02 - Should show reservation details on click', async ({ page }) => {
    // Click first reservation if exists
    const firstReservation = page.getByTestId('merchant-reservation-1')

    if (await firstReservation.isVisible().catch(() => false)) {
      await firstReservation.click()

      // Should show reservation details
      await expect(page.getByTestId('reservation-detail')).toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId('reservation-product-name')).toBeVisible()
      await expect(page.getByTestId('reservation-customer-name')).toBeVisible()
      await expect(page.getByTestId('reservation-quantity')).toBeVisible()
      await expect(page.getByTestId('reservation-total')).toBeVisible()
    }
  })

  test('03 - Should approve pending reservation', async ({ page }) => {
    const pendingReservation = page.locator('[data-testid^="merchant-reservation-"]').filter({ hasText: /en attente|pending/i }).first()

    if (await pendingReservation.isVisible().catch(() => false)) {
      await pendingReservation.click()

      // Click approve button
      const approveButton = page.getByTestId('approve-reservation-button')
      await expect(approveButton).toBeVisible()
      await approveButton.click()

      // Should show confirmation
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    }
  })

  test('04 - Should mark reservation as completed', async ({ page }) => {
    const approvedReservation = page.locator('[data-testid^="merchant-reservation-"]').filter({ hasText: /approuvée|approved/i }).first()

    if (await approvedReservation.isVisible().catch(() => false)) {
      await approvedReservation.click()

      // Click complete button
      const completeButton = page.getByTestId('complete-reservation-button')

      if (await completeButton.isVisible().catch(() => false)) {
        await completeButton.click()

        // Should show confirmation
        await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('05 - Should filter reservations by status', async ({ page }) => {
    const statusFilter = page.getByTestId('reservation-status-filter')

    if (await statusFilter.isVisible().catch(() => false)) {
      // Filter by pending
      await statusFilter.selectOption('pending')

      await page.waitForLoadState('networkidle')

      // All visible reservations should be pending
      const reservations = dashboardPage.reservationsList.locator('[data-testid^="merchant-reservation-"]')
      const count = await reservations.count()

      if (count > 0) {
        // Verify first reservation is pending
        await expect(reservations.first()).toContainText(/en attente|pending/i)
      }
    }
  })
})
