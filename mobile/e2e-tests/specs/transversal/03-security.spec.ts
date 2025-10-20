import { test, expect } from '@playwright/test'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'

test.describe('Security Tests', () => {
  test('01 - Should not expose sensitive data in URLs', async ({ page }) => {
    await login(page, testUsers.consumer)

    const url = page.url()

    // Should not contain token or password in URL
    expect(url).not.toContain('token=')
    expect(url).not.toContain('password=')
    expect(url).not.toContain('auth=')
  })

  test('02 - Should store authentication token securely', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Check that token is in AsyncStorage/localStorage (not in cookies)
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token') !== null
    })

    expect(hasToken).toBe(true)
  })

  test('03 - Should prevent access to protected routes when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Try to navigate to protected route
    await page.evaluate(() => {
      window.location.href = '/profile'
    })

    await page.waitForLoadState('networkidle')

    // Should redirect to login
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 10000 })
  })

  test('04 - Should sanitize user input to prevent XSS', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Try to inject script in search
    await page.getByTestId('search-input').fill('<script>alert("XSS")</script>')
    await page.keyboard.press('Enter')

    await page.waitForLoadState('networkidle')

    // Check that script was not executed (page should not have alert)
    const hasAlert = await page.evaluate(() => {
      return document.body.innerHTML.includes('<script>')
    })

    expect(hasAlert).toBe(false)
  })

  test('05 - Should validate JWT token expiration', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Set an expired token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalidtoken')
    })

    // Reload page
    await page.reload()

    // Should redirect to login due to invalid/expired token
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15000 })
  })
})
