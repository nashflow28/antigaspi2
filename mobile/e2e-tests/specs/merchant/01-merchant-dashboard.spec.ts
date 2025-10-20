import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { MerchantDashboardPage } from '../../pages/MerchantDashboardPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { testUsers } from '../../fixtures/users'
import { login, logout } from '../../helpers/auth'

test.describe('Merchant Dashboard', () => {
  let dashboardPage: MerchantDashboardPage
  let profilePage: ProfilePage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new MerchantDashboardPage(page)
    profilePage = new ProfilePage(page)

    // Login as merchant
    await login(page, testUsers.merchant)
  })

  test('01 - Should display merchant dashboard', async ({ page }) => {
    await expect(dashboardPage.welcomeMessage).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(testUsers.merchant.name)).toBeVisible()
  })

  test('02 - Should display merchant role', async ({ page }) => {
    await page.getByTestId('profile-tab').click()

    await expect(profilePage.userRole).toBeVisible()

    const roleText = await profilePage.userRole.textContent()
    expect(roleText).toMatch(/commerçant|merchant/i)
  })

  test('03 - Should display total products statistic', async ({ page }) => {
    await expect(dashboardPage.totalProducts).toBeVisible()

    const total = await dashboardPage.getTotalProducts()
    expect(total).toBeGreaterThanOrEqual(0)
  })

  test('04 - Should display active reservations statistic', async ({ page }) => {
    await expect(dashboardPage.activeReservations).toBeVisible()

    const active = await dashboardPage.getActiveReservations()
    expect(active).toBeGreaterThanOrEqual(0)
  })

  test('05 - Should display today revenue statistic', async ({ page }) => {
    await expect(dashboardPage.todayRevenue).toBeVisible()

    // Should show XOF currency
    await expect(dashboardPage.todayRevenue).toContainText(/XOF|FCFA/)
  })

  test('06 - Should have add product button', async ({ page }) => {
    await expect(dashboardPage.addProductButton).toBeVisible()
    await expect(dashboardPage.addProductButton).toBeEnabled()
  })

  test('07 - Should display merchant products list', async ({ page }) => {
    await expect(dashboardPage.myProductsList).toBeVisible()
  })

  test('08 - Should display merchant reservations list', async ({ page }) => {
    await expect(dashboardPage.reservationsList).toBeVisible()
  })

  test('09 - Should navigate to add product form', async ({ page }) => {
    await dashboardPage.clickAddProduct()

    // Should see product form
    await expect(page.getByTestId('product-name-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('submit-product-button')).toBeVisible()
  })

  test('10 - Should logout successfully', async ({ page }) => {
    await page.getByTestId('profile-tab').click()
    await logout(page)

    // Should redirect to login
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 10000 })
  })
})
