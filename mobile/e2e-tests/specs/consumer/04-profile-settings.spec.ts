import { test, expect } from '@playwright/test'
import { ProfilePage } from '../../pages/ProfilePage'
import { testUsers } from '../../fixtures/users'
import { login, logout } from '../../helpers/auth'
import { navigateToProfile } from '../../helpers/navigation'

test.describe('Consumer Profile & Settings', () => {
  let profilePage: ProfilePage

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page)

    // Login as consumer
    await login(page, testUsers.consumer)

    // Navigate to profile page
    await navigateToProfile(page)
  })

  test('01 - Should display user profile information', async ({ page }) => {
    await expect(profilePage.userName).toBeVisible()
    await expect(profilePage.userEmail).toBeVisible()

    // Verify correct user info
    const name = await profilePage.getUserName()
    const email = await profilePage.getUserEmail()

    expect(name).toContain(testUsers.consumer.name)
    expect(email).toContain(testUsers.consumer.email)
  })

  test('02 - Should display user role as Consumer', async ({ page }) => {
    await expect(profilePage.userRole).toBeVisible()

    const roleText = await profilePage.userRole.textContent()
    expect(roleText).toMatch(/consommateur|consumer/i)
  })

  test('03 - Should have edit profile button', async ({ page }) => {
    await expect(profilePage.editProfileButton).toBeVisible()
    await expect(profilePage.editProfileButton).toBeEnabled()
  })

  test('04 - Should open edit profile form', async ({ page }) => {
    await profilePage.editProfile()

    // Should show edit form
    await expect(page.getByTestId('edit-name-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('edit-email-input')).toBeVisible()
  })

  test('05 - Should update profile name', async ({ page }) => {
    await profilePage.editProfile()

    // Change name
    const newName = 'Jean Updated'
    await page.getByTestId('edit-name-input').fill(newName)
    await page.getByTestId('save-profile-button').click()

    // Should show success notification
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })

    // Name should be updated
    await expect(profilePage.userName).toContainText(newName)
  })

  test('06 - Should display logout button', async ({ page }) => {
    await expect(profilePage.logoutButton).toBeVisible()
    await expect(profilePage.logoutButton).toBeEnabled()
  })

  test('07 - Should logout successfully from profile', async ({ page }) => {
    await logout(page)

    // Should redirect to login
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 10000 })
  })

  test('08 - Should toggle notifications setting', async ({ page }) => {
    // Check initial state
    const initialState = await profilePage.notificationsToggle.isChecked()

    // Toggle
    await profilePage.toggleNotifications()

    // Wait for state change
    await page.waitForTimeout(500)

    // Should be opposite of initial
    const newState = await profilePage.notificationsToggle.isChecked()
    expect(newState).toBe(!initialState)
  })

  test('09 - Should toggle dark mode', async ({ page }) => {
    await profilePage.toggleDarkMode()

    // Wait for theme change
    await page.waitForTimeout(500)

    // Check if dark mode is applied (body should have dark class or dark background)
    const isDark = await page.evaluate(() => {
      const body = document.body
      return body.classList.contains('dark') ||
             getComputedStyle(body).backgroundColor === 'rgb(0, 0, 0)' ||
             getComputedStyle(body).backgroundColor === 'rgb(17, 24, 39)' // Dark gray
    })

    expect(isDark).toBe(true)
  })

  test('10 - Should display reservations history section', async ({ page }) => {
    await expect(profilePage.reservationsHistory).toBeVisible()

    // Click to view history
    await profilePage.reservationsHistory.click()

    // Should navigate to reservations page
    await expect(page.getByTestId('reservations-list')).toBeVisible({ timeout: 5000 })
  })
})
