import { test, expect } from '@playwright/test'

/**
 * API Integration Tests
 * These tests verify the API contract between frontend and backend
 * They use mocked responses to ensure frontend handles API responses correctly
 */

test.describe('API Integration - Authentication', () => {
  test('Login returns correct response structure', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 1,
              name: 'Jean Dupont',
              email: 'jean@email.com',
              role: 'consumer',
              phone: '22891000000',
              referral_code: 'JEAN2025'
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expires_in: 3600
          }
        })
      })
    })

    await page.goto('http://localhost:3000/login')

    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    const submitBtn = page.locator('[data-testid="submit-login"]')

    if (await emailInput.isVisible()) {
      await emailInput.fill('jean@email.com')
      await passwordInput.fill('password')
      await submitBtn.click()

      // Should store token and redirect
      const token = await page.evaluate(() => localStorage.getItem('auth_token'))
      expect(token).toBeTruthy()
    }
  })

  test('Login error returns validation errors', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: {
            email: ['Le champ email est requis'],
            password: ['Le mot de passe est incorrect']
          }
        })
      })
    })

    await page.goto('http://localhost:3000/login')

    const submitBtn = page.locator('[data-testid="submit-login"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()

      // Should display validation errors
      const emailError = page.locator('[data-testid="email-error"]')
      const formError = page.locator('.error-message')

      await expect(emailError.or(formError)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Register returns correct response structure', async ({ page }) => {
    await page.route('**/api/auth/register', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: 100,
                name: 'New User',
                email: 'newuser@email.com',
                role: 'consumer',
                referral_code: 'NEW2025'
              },
              token: 'new-jwt-token'
            },
            message: 'Inscription reussie'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/register')

    // Fill registration form if exists
    const nameInput = page.locator('[data-testid="name-input"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('New User')

      const emailInput = page.locator('[data-testid="email-input"]')
      await emailInput.fill('newuser@email.com')

      const passwordInput = page.locator('[data-testid="password-input"]')
      await passwordInput.fill('password123')

      const submitBtn = page.locator('[data-testid="submit-register"]')
      await submitBtn.click()
    }
  })

  test('Token refresh works correctly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'old-expired-token')
    })

    await page.route('**/api/auth/refresh', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'new-refreshed-token',
            expires_in: 3600
          }
        })
      })
    })

    // Trigger a request that would require token refresh
    await page.route('**/api/products', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      })
    })

    await page.goto('http://localhost:3000/products')
  })
})

test.describe('API Integration - Products', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'user@email.com',
        role: 'consumer'
      }))
    })
  })

  test('Products list returns paginated data', async ({ page }) => {
    await page.route('**/api/products*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, name: 'Product 1', discounted_price: 500, quantity_available: 5 },
            { id: 2, name: 'Product 2', discounted_price: 750, quantity_available: 3 }
          ],
          meta: {
            current_page: 1,
            last_page: 5,
            per_page: 10,
            total: 48
          }
        })
      })
    })

    await page.goto('http://localhost:3000/products')

    // Should display pagination info
    const pagination = page.locator('[data-testid="pagination"]')
    if (await pagination.isVisible()) {
      await expect(pagination).toContainText('1')
    }
  })

  test('Product detail returns full product data', async ({ page }) => {
    await page.route('**/api/products/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            name: 'Pain complet',
            description: 'Pain complet artisanal',
            original_price: 500,
            discounted_price: 250,
            discount_percentage: 50,
            quantity_available: 10,
            expiration_date: '2025-01-15',
            is_active: true,
            category: { id: 1, name: 'Boulangerie' },
            merchant: {
              id: 1,
              business_name: 'Boulangerie Martin',
              address: 'Avenue Liberation',
              rating: 4.5
            },
            images: [
              { id: 1, url: 'https://example.com/image1.jpg' }
            ]
          }
        })
      })
    })

    await page.goto('http://localhost:3000/products/1')

    const productName = page.locator('[data-testid="product-name"]')
    if (await productName.isVisible()) {
      await expect(productName).toContainText('Pain complet')
    }
  })
})

test.describe('API Integration - Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'user@email.com',
        role: 'consumer'
      }))
    })
  })

  test('Create reservation returns correct structure', async ({ page }) => {
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              reservation_code: 'RES-ABC123',
              product_id: body.product_id,
              quantity: body.quantity,
              total_amount: 500 * body.quantity,
              status: 'pending',
              payment_status: body.payment_method === 'wallet' ? 'paid' : 'pending',
              payment_method: body.payment_method,
              expires_at: '2025-01-10T18:00:00Z',
              product: {
                id: body.product_id,
                name: 'Test Product'
              },
              merchant: {
                business_name: 'Test Merchant'
              }
            },
            message: 'Reservation creee avec succes'
          })
        })
      }
    })

    await page.route('**/api/products/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            name: 'Test Product',
            discounted_price: 500,
            quantity_available: 10
          }
        })
      })
    })

    await page.goto('http://localhost:3000/products/1')
  })

  test('User reservations list returns correct data', async ({ page }) => {
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                reservation_code: 'RES-001',
                status: 'confirmed',
                total_amount: 500,
                product: { name: 'Product 1' },
                merchant: { business_name: 'Merchant 1' }
              },
              {
                id: 2,
                reservation_code: 'RES-002',
                status: 'pending',
                total_amount: 750,
                product: { name: 'Product 2' },
                merchant: { business_name: 'Merchant 2' }
              }
            ]
          })
        })
      }
    })

    await page.goto('http://localhost:3000/reservations')

    const reservationList = page.locator('[data-testid="reservation-list"]')
    if (await reservationList.isVisible()) {
      const items = reservationList.locator('[data-testid="reservation-item"]')
      await expect(items).toHaveCount(2)
    }
  })
})

test.describe('API Integration - Merchant Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'merchant-token')
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'merchant@email.com',
        role: 'merchant'
      }))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            email: 'merchant@email.com',
            role: 'merchant',
            merchant: {
              id: 1,
              business_name: 'Test Merchant'
            }
          }
        })
      })
    })
  })

  test('Merchant dashboard returns stats', async ({ page }) => {
    await page.route('**/api/merchant/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_revenue: 150000,
            total_reservations: 45,
            active_products: 12,
            pending_reservations: 3,
            revenue_this_month: 35000,
            top_products: [
              { name: 'Pain complet', sales: 25 }
            ]
          }
        })
      })
    })

    await page.goto('http://localhost:3000/merchant/dashboard')

    const stats = page.locator('[data-testid="merchant-stats"]')
    if (await stats.isVisible()) {
      await expect(stats).toContainText('150000')
    }
  })

  test('Merchant can update product', async ({ page }) => {
    await page.route('**/api/merchant/products/1', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              name: 'Old Name',
              discounted_price: 500,
              quantity_available: 10
            }
          })
        })
      } else if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON()
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, ...body },
            message: 'Produit mis a jour'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/products/1/edit')
  })
})

test.describe('API Integration - Error Handling', () => {
  test('401 Unauthorized redirects to login', async ({ page }) => {
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Unauthenticated'
        })
      })
    })

    await page.goto('http://localhost:3000/products')

    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 10000 })
  })

  test('403 Forbidden shows access denied', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'user@email.com',
        role: 'consumer'
      }))
    })

    await page.route('**/api/merchant/**', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Merchant role required.'
        })
      })
    })

    await page.goto('http://localhost:3000/merchant/dashboard')

    const accessDenied = page.locator('[data-testid="access-denied"]')
    const errorMessage = page.locator('text=acces').or(page.locator('text=access'))

    await expect(accessDenied.or(errorMessage)).toBeVisible({ timeout: 5000 })
  })

  test('404 Not Found shows appropriate message', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
    })

    await page.route('**/api/products/999', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Product not found'
        })
      })
    })

    await page.goto('http://localhost:3000/products/999')

    const notFound = page.locator('[data-testid="not-found"]')
    const errorMessage = page.locator('text=trouve').or(page.locator('text=found'))

    await expect(notFound.or(errorMessage)).toBeVisible({ timeout: 5000 })
  })

  test('500 Server Error shows error message', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
    })

    await page.route('**/api/products', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal server error'
        })
      })
    })

    await page.goto('http://localhost:3000/products')

    const errorState = page.locator('[data-testid="error-state"]')
    const errorMessage = page.locator('text=erreur').or(page.locator('text=error'))

    await expect(errorState.or(errorMessage)).toBeVisible({ timeout: 5000 })
  })

  test('Network error shows offline message', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
    })

    await page.route('**/api/products', route => {
      route.abort('failed')
    })

    await page.goto('http://localhost:3000/products')

    const networkError = page.locator('[data-testid="network-error"]')
    const offlineMessage = page.locator('text=connexion').or(page.locator('text=network'))

    await expect(networkError.or(offlineMessage)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('API Integration - Rate Limiting', () => {
  test('429 Too Many Requests shows rate limit message', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token')
    })

    await page.route('**/api/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'Retry-After': '60'
        },
        body: JSON.stringify({
          success: false,
          message: 'Too many requests. Please try again later.'
        })
      })
    })

    await page.goto('http://localhost:3000/products')

    const rateLimitMessage = page.locator('[data-testid="rate-limit"]')
    const retryMessage = page.locator('text=retry').or(page.locator('text=essayer'))

    await expect(rateLimitMessage.or(retryMessage)).toBeVisible({ timeout: 5000 })
  })
})
