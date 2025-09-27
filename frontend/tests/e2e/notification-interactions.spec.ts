import { test, expect, type Page } from '@playwright/test'

// Helper to wait for notification to appear
const waitForNotification = async (page: Page, type: 'success' | 'error' | 'warning' | 'info') => {
  return page.waitForSelector(`[data-testid="notification-${type}"]`, { timeout: 5000 })
}

// Helper to click notification action button
const clickNotificationAction = async (page: Page, actionText: string) => {
  return page.click(`[data-testid="notification-action-btn"]:has-text("${actionText}")`)
}

test.describe('Notification Callbacks - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Authentication Flow', () => {
    test('should show error notification with retry on failed login', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        })
      })

      // Attempt login
      await page.fill('[data-testid="email"]', 'wrong@test.com')
      await page.fill('[data-testid="password"]', 'wrongpassword')
      await page.click('[data-testid="login-btn"]')

      // Wait for error notification
      const errorNotification = await waitForNotification(page, 'error')
      await expect(errorNotification).toBeVisible()

      // Check error message
      await expect(errorNotification).toContainText('Invalid credentials')
      await expect(errorNotification).toContainText('Authentification')

      // Check retry button is present
      const retryButton = page.locator('[data-testid="notification-action-btn"]:has-text("Réessayer")')
      await expect(retryButton).toBeVisible()
    })

    test('should retry login when error notification action is clicked', async ({ page }) => {
      let loginAttempts = 0

      // Mock API - fail first, succeed second
      await page.route('**/api/auth/login', route => {
        loginAttempts++
        if (loginAttempts === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Server error'
            })
          })
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                token: 'test-token',
                user: { id: 1, email: 'test@test.com', role: 'consumer' }
              }
            })
          })
        }
      })

      // Fill login form
      await page.fill('[data-testid="email"]', 'test@test.com')
      await page.fill('[data-testid="password"]', 'password')
      await page.click('[data-testid="login-btn"]')

      // Wait for error notification
      await waitForNotification(page, 'error')

      // Click retry button
      await clickNotificationAction(page, 'Réessayer')

      // Should see success notification
      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('should show success notification on successful login', async ({ page }) => {
      // Mock successful API response
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'test-token',
              user: { id: 1, email: 'test@test.com', role: 'consumer' }
            }
          })
        })
      })

      await page.fill('[data-testid="email"]', 'test@test.com')
      await page.fill('[data-testid="password"]', 'password')
      await page.click('[data-testid="login-btn"]')

      // Should show success notification
      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')
      await expect(notification).toContainText('Authentification')
    })
  })

  test.describe('Products Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication for merchant
      await page.addInitScript(() => {
        localStorage.setItem('auth_token', 'test-token')
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'merchant@test.com',
          role: 'merchant'
        }))
      })

      await page.goto('/merchant/products')
    })

    test('should show error with retry on product creation failure', async ({ page }) => {
      // Mock product creation failure
      await page.route('**/api/products', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Validation failed: Name is required'
            })
          })
        }
      })

      // Try to create product
      await page.click('[data-testid="add-product-btn"]')
      await page.fill('[data-testid="product-name"]', '')  // Invalid: empty name
      await page.fill('[data-testid="product-price"]', '10')
      await page.click('[data-testid="save-product-btn"]')

      // Check error notification
      const errorNotification = await waitForNotification(page, 'error')
      await expect(errorNotification).toContainText('Validation failed: Name is required')

      // Check retry button
      const retryButton = page.locator('[data-testid="notification-action-btn"]:has-text("Réessayer")')
      await expect(retryButton).toBeVisible()
    })

    test('should retry product creation when error notification action is clicked', async ({ page }) => {
      let creationAttempts = 0

      await page.route('**/api/products', route => {
        if (route.request().method() === 'POST') {
          creationAttempts++
          if (creationAttempts === 1) {
            route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                success: false,
                message: 'Server error'
              })
            })
          } else {
            route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  id: 1,
                  name: 'Test Product',
                  price: 10
                }
              })
            })
          }
        }
      })

      // Fill product form
      await page.click('[data-testid="add-product-btn"]')
      await page.fill('[data-testid="product-name"]', 'Test Product')
      await page.fill('[data-testid="product-price"]', '10')
      await page.click('[data-testid="save-product-btn"]')

      // Wait for error and retry
      await waitForNotification(page, 'error')
      await clickNotificationAction(page, 'Réessayer')

      // Should show success notification
      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')
      await expect(notification).toContainText('Produit créé avec succès')
    })

    test('should show success notification on product creation success', async ({ page }) => {
      await page.route('**/api/products', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                name: 'New Product',
                price: 15
              }
            })
          })
        }
      })

      await page.click('[data-testid="add-product-btn"]')
      await page.fill('[data-testid="product-name"]', 'New Product')
      await page.fill('[data-testid="product-price"]', '15')
      await page.click('[data-testid="save-product-btn"]')

      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')
      await expect(notification).toContainText('Produit créé avec succès')
      await expect(notification).toContainText('Catalogue')
    })
  })

  test.describe('Auto-close Behavior', () => {
    test('should auto-close success notifications after duration', async ({ page }) => {
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { token: 'test', user: { id: 1, role: 'consumer' } }
          })
        })
      })

      await page.fill('[data-testid="email"]', 'test@test.com')
      await page.fill('[data-testid="password"]', 'password')
      await page.click('[data-testid="login-btn"]')

      // Success notification should appear
      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')
      await expect(notification).toBeVisible()

      // Wait for auto-close (should be ~3 seconds for success)
      await page.waitForTimeout(4000)

      // Notification should be gone
      await expect(notification).not.toBeVisible()
    })

    test('should not auto-close error notifications', async ({ page }) => {
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          })
        })
      })

      await page.fill('[data-testid="email"]', 'wrong@test.com')
      await page.fill('[data-testid="password"]', 'wrong')
      await page.click('[data-testid="login-btn"]')

      const errorNotification = await waitForNotification(page, 'error')
      await expect(errorNotification).toBeVisible()

      // Wait longer than typical auto-close duration
      await page.waitForTimeout(6000)

      // Error notification should still be visible
      await expect(errorNotification).toBeVisible()
    })
  })

  test.describe('Notification Interactions', () => {
    test('should close notification when close button is clicked', async ({ page }) => {
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Test error'
          })
        })
      })

      await page.fill('[data-testid="email"]', 'test@test.com')
      await page.fill('[data-testid="password"]', 'wrong')
      await page.click('[data-testid="login-btn"]')

      const errorNotification = await waitForNotification(page, 'error')
      await expect(errorNotification).toBeVisible()

      // Click close button
      await page.click('[data-testid="notification-close-btn"]')

      // Notification should be gone
      await expect(errorNotification).not.toBeVisible()
    })

    test('should show progress bar on auto-closing notifications', async ({ page }) => {
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { token: 'test', user: { id: 1 } }
          })
        })
      })

      await page.fill('[data-testid="email"]', 'test@test.com')
      await page.fill('[data-testid="password"]', 'password')
      await page.click('[data-testid="login-btn"]')

      await waitForNotification(page, 'success')
      const notification = page.locator('[data-testid="notification-success"]')
      await expect(notification).toContainText('Connexion réussie')

      // Check progress bar is present
      const progressBar = page.locator('[data-testid="notification-progress"]')
      await expect(progressBar).toBeVisible()

      // Progress should decrease over time
      const initialWidth = await progressBar.evaluate(el => el.style.width)
      await page.waitForTimeout(1000)
      const laterWidth = await progressBar.evaluate(el => el.style.width)

      expect(parseFloat(laterWidth)).toBeLessThan(parseFloat(initialWidth))
    })
  })
})
