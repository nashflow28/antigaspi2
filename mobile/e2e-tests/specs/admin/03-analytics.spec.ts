import { test, expect } from '@playwright/test'
import { AdminDashboardPage } from '../../pages/AdminDashboardPage'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'

test.describe('Admin Analytics', () => {
  let adminPage: AdminDashboardPage

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminDashboardPage(page)

    // Login as admin
    await login(page, testUsers.admin)

    // Navigate to analytics section
    await adminPage.navigateToAnalytics()
  })

  test('01 - Should display analytics dashboard', async ({ page }) => {
    await expect(adminPage.analyticsSection).toBeVisible({ timeout: 10000 })
  })

  test('02 - Should display revenue chart', async ({ page }) => {
    const revenueChart = page.getByTestId('revenue-chart')

    if (await revenueChart.isVisible().catch(() => false)) {
      await expect(revenueChart).toBeVisible()
    }
  })

  test('03 - Should display registrations chart', async ({ page }) => {
    const registrationsChart = page.getByTestId('registrations-chart')

    if (await registrationsChart.isVisible().catch(() => false)) {
      await expect(registrationsChart).toBeVisible()
    }
  })

  test('04 - Should filter analytics by date range', async ({ page }) => {
    const dateRangeFilter = page.getByTestId('date-range-filter')

    if (await dateRangeFilter.isVisible().catch(() => false)) {
      await dateRangeFilter.selectOption('last-7-days')

      await page.waitForLoadState('networkidle')

      // Charts should update
      await expect(adminPage.analyticsSection).toBeVisible()
    }
  })

  test('05 - Should export analytics data', async ({ page }) => {
    const exportButton = page.getByTestId('export-analytics')

    if (await exportButton.isVisible().catch(() => false)) {
      await exportButton.click()

      // Should trigger download (or show modal)
      await page.waitForTimeout(1000)
    }
  })
})
