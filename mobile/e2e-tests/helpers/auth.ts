import { Page, expect } from '@playwright/test'
import { TestUser } from '../fixtures/users'

/**
 * Authentication helper functions for E2E tests
 */

export async function login(page: Page, user: TestUser) {
  await page.goto('/')

  // Wait for app to load (may show splash screen first)
  await page.waitForLoadState('networkidle')

  // Check if already on login screen or need to navigate
  const loginButtonVisible = await page.getByTestId('login-email-input').isVisible().catch(() => false)

  if (!loginButtonVisible) {
    // May need to click "Se connecter" button on home/welcome screen
    const connectButton = page.getByRole('button', { name: /se connecter|connexion/i })
    if (await connectButton.isVisible().catch(() => false)) {
      await connectButton.click()
    }
  }

  // Fill login form
  await page.getByTestId('login-email-input').fill(user.email)
  await page.getByTestId('login-password-input').fill(user.password)
  await page.getByTestId('login-submit-button').click()

  // Wait for navigation to home/dashboard
  await page.waitForLoadState('networkidle')

  // Verify login success by checking for user-specific content
  await expect(page.getByText(new RegExp(user.name, 'i'))).toBeVisible({ timeout: 10000 })
}

export async function logout(page: Page) {
  // Navigate to profile/settings
  const profileButton = page.getByTestId('profile-tab').or(page.getByRole('button', { name: /profil|profile/i }))
  await profileButton.click()

  await page.waitForLoadState('networkidle')

  // Click logout button
  const logoutButton = page.getByTestId('logout-button').or(page.getByRole('button', { name: /déconnexion|logout/i }))
  await logoutButton.click()

  // Wait for redirect to login screen
  await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 10000 })
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated UI elements
    const homeTab = await page.getByTestId('home-tab').isVisible({ timeout: 2000 })
    return homeTab
  } catch {
    return false
  }
}

export async function waitForApiResponse(page: Page, endpoint: string, timeout = 10000) {
  return page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  )
}

export async function clearAuthStorage(page: Page) {
  try {
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        // localStorage might not be accessible in certain contexts (e.g., iframe)
        console.warn('Failed to clear storage:', e)
      }
    })
  } catch (error) {
    // Silently fail if storage is not accessible
    console.warn('Storage access denied, skipping clear')
  }
}
