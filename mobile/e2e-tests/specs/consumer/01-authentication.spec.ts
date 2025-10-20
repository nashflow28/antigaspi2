import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'
import { HomePage } from '../../pages/HomePage'
import { ProfilePage } from '../../pages/ProfilePage'
import { testUsers } from '../../fixtures/users'
import { login, logout, clearAuthStorage } from '../../helpers/auth'

test.describe('Consumer Authentication', () => {
  let loginPage: LoginPage
  let homePage: HomePage
  let profilePage: ProfilePage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    homePage = new HomePage(page)
    profilePage = new ProfilePage(page)

    // Clear any existing auth
    await clearAuthStorage(page)
    await loginPage.goto()
  })

  test('01 - Should display login form on initial load', async ({ page }) => {
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.registerLink).toBeVisible()
  })

  test('02 - Should show error with invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword')

    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 })

    // Should still be on login page
    await expect(loginPage.emailInput).toBeVisible()
  })

  test('03 - Should show error with empty email', async ({ page }) => {
    await loginPage.passwordInput.fill('password123')
    await loginPage.submitButton.click()

    // HTML5 validation or error message should appear
    const emailValid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(emailValid).toBe(false)
  })

  test('04 - Should show error with empty password', async ({ page }) => {
    await loginPage.emailInput.fill('test@example.com')
    await loginPage.submitButton.click()

    // HTML5 validation or error message should appear
    const passwordValid = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(passwordValid).toBe(false)
  })

  test('05 - Should successfully login as Consumer', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Should redirect to home page
    await expect(homePage.welcomeMessage).toBeVisible({ timeout: 10000 })

    // Should display user name
    await expect(page.getByText(testUsers.consumer.name)).toBeVisible()
  })

  test('06 - Should persist authentication after page refresh', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Refresh the page
    await page.reload()

    // Should still be authenticated
    await expect(homePage.welcomeMessage).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(testUsers.consumer.name)).toBeVisible()
  })

  test('07 - Should successfully logout', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Navigate to profile
    await homePage.navigateToProfile()
    await expect(profilePage.userName).toBeVisible()

    // Logout
    await logout(page)

    // Should redirect to login page
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 })
  })

  test('08 - Should not persist authentication after logout', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Logout
    await homePage.navigateToProfile()
    await logout(page)

    // Try to navigate to home
    await page.goto('/')

    // Should be redirected to login
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 })
  })

  test('09 - Should navigate to register page', async ({ page }) => {
    await loginPage.clickRegister()

    // Should see register form
    await expect(page.getByTestId('register-name-input')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('register-email-input')).toBeVisible()
    await expect(page.getByTestId('register-password-input')).toBeVisible()
  })

  test('10 - Should disable submit button while loading', async ({ page }) => {
    // Fill form
    await loginPage.emailInput.fill(testUsers.consumer.email)
    await loginPage.passwordInput.fill(testUsers.consumer.password)

    // Click submit
    await loginPage.submitButton.click()

    // Button should be disabled immediately
    await expect(loginPage.submitButton).toBeDisabled({ timeout: 1000 })
  })
})
