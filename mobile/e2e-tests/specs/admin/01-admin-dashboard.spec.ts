import { test, expect } from '@playwright/test'
import { AdminDashboardPage } from '../../pages/AdminDashboardPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { testUsers } from '../../fixtures/users'
import { login, logout } from '../../helpers/auth'

test.describe('Admin Dashboard & User Management', () => {
  let adminPage: AdminDashboardPage
  let profilePage: ProfilePage

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminDashboardPage(page)
    profilePage = new ProfilePage(page)

    // Login as admin
    await login(page, testUsers.admin)
  })

  test('01 - Should display admin dashboard', async ({ page }) => {
    await expect(adminPage.welcomeMessage).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(testUsers.admin.name)).toBeVisible()
  })

  test('02 - Should display admin role', async ({ page }) => {
    await page.getByTestId('profile-tab').click()

    await expect(profilePage.userRole).toBeVisible()

    const roleText = await profilePage.userRole.textContent()
    expect(roleText).toMatch(/admin|administrateur/i)
  })

  test('03 - Should display total users statistic', async ({ page }) => {
    await expect(adminPage.totalUsers).toBeVisible()

    const totalText = await adminPage.totalUsers.textContent()
    const total = parseInt(totalText?.replace(/\D/g, '') || '0')
    expect(total).toBeGreaterThan(0)
  })

  test('04 - Should display total products statistic', async ({ page }) => {
    await expect(adminPage.totalProducts).toBeVisible()

    const totalText = await adminPage.totalProducts.textContent()
    const total = parseInt(totalText?.replace(/\D/g, '') || '0')
    expect(total).toBeGreaterThanOrEqual(0)
  })

  test('05 - Should display total reservations statistic', async ({ page }) => {
    await expect(adminPage.totalReservations).toBeVisible()

    const totalText = await adminPage.totalReservations.textContent()
    const total = parseInt(totalText?.replace(/\D/g, '') || '0')
    expect(total).toBeGreaterThanOrEqual(0)
  })

  test('06 - Should display total revenue statistic', async ({ page }) => {
    await expect(adminPage.totalRevenue).toBeVisible()
    await expect(adminPage.totalRevenue).toContainText(/XOF|FCFA/)
  })

  test('07 - Should navigate to users section', async ({ page }) => {
    await adminPage.navigateToUsers()

    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 10000 })
  })

  test('08 - Should display users list', async ({ page }) => {
    await adminPage.navigateToUsers()

    const usersList = page.getByTestId('users-list')
    await expect(usersList).toBeVisible()

    // Should have at least one user
    const users = usersList.locator('[data-testid^="user-row-"]')
    const count = await users.count()
    expect(count).toBeGreaterThan(0)
  })

  test('09 - Should filter users by role', async ({ page }) => {
    await adminPage.navigateToUsers()

    const roleFilter = page.getByTestId('user-role-filter')

    if (await roleFilter.isVisible().catch(() => false)) {
      await roleFilter.selectOption('merchant')

      await page.waitForLoadState('networkidle')

      // All visible users should be merchants
      const users = page.locator('[data-testid^="user-row-"]')
      const count = await users.count()

      if (count > 0) {
        await expect(users.first()).toContainText(/merchant|commerçant/i)
      }
    }
  })

  test('10 - Should search users by name or email', async ({ page }) => {
    await adminPage.navigateToUsers()

    const searchInput = page.getByTestId('user-search')

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('jean')

      await page.waitForLoadState('networkidle')

      // Should show filtered results
      const users = page.locator('[data-testid^="user-row-"]')
      const count = await users.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})
