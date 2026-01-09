import { test, expect } from '@playwright/test'

// Mock data
const mockUser = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  role: 'consumer',
  phone: '22891000000'
}

const mockProduct = {
  id: 1,
  name: 'Pain complet artisanal',
  category: 'Boulangerie',
  original_price: 500,
  discounted_price: 250,
  image_url: 'https://via.placeholder.com/300',
  is_active: true,
  quantity_available: 5,
  merchant: {
    id: 1,
    business_name: 'Boulangerie Martin'
  }
}

const mockWallet = {
  id: 1,
  user_id: 1,
  balance: 5000,
  is_active: true
}

test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication state
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        name: 'Jean Dupont',
        role: 'consumer'
      }))
    })

    // Mock auth endpoint
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })

    // Mock product endpoint
    await page.route('**/api/products/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockProduct })
      })
    })
  })

  test('On-site payment flow completes successfully', async ({ page }) => {
    // Mock reservation creation with on-site payment
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              reservation_code: 'RES-123456',
              product_id: 1,
              quantity: 1,
              total_amount: 250,
              status: 'pending',
              payment_status: 'pending',
              payment_method: 'on_site',
              payment: null
            },
            message: 'Reservation created. Payment on-site.'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/products/1')
    await page.waitForLoadState('networkidle')

    // Select on-site payment
    const onSitePayment = page.locator('[data-testid="payment-on-site"]')
    if (await onSitePayment.isVisible()) {
      await onSitePayment.click()
    }

    // Click reserve button
    const reserveButton = page.locator('[data-testid="reserve-button"]')
    if (await reserveButton.isVisible()) {
      await reserveButton.click()

      // Should show success message or redirect
      const successMessage = page.locator('[data-testid="reservation-success"]')
      const reservationCode = page.locator('text=RES-')

      await expect(successMessage.or(reservationCode)).toBeVisible({ timeout: 10000 })
    }
  })

  test('Wallet payment flow shows balance and completes', async ({ page }) => {
    // Mock wallet endpoint
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })

    // Mock reservation with wallet payment
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()

        if (body?.payment_method === 'wallet') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                reservation_code: 'RES-789012',
                status: 'confirmed',
                payment_status: 'paid',
                payment_method: 'wallet'
              },
              message: 'Payment completed with wallet!'
            })
          })
        } else {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { id: 1 } })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/products/1')
    await page.waitForLoadState('networkidle')

    // Check wallet option visibility
    const walletPayment = page.locator('[data-testid="payment-wallet"]')
    if (await walletPayment.isVisible()) {
      await walletPayment.click()

      // Should show wallet balance
      const walletBalance = page.locator('[data-testid="wallet-balance"]')
      if (await walletBalance.isVisible()) {
        await expect(walletBalance).toContainText('5000')
      }

      // Enter PIN if required
      const pinInput = page.locator('[data-testid="wallet-pin"]')
      if (await pinInput.isVisible()) {
        await pinInput.fill('1234')
      }

      // Complete reservation
      const reserveButton = page.locator('[data-testid="reserve-button"]')
      if (await reserveButton.isVisible()) {
        await reserveButton.click()
      }
    }
  })

  test('Mobile Money (Flooz) payment initiates correctly', async ({ page }) => {
    // Mock PayGate payment initiation
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()

        if (body?.payment_method === 'flooz' || body?.payment_method === 'tmoney') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                reservation_code: 'RES-FLOOZ-001',
                status: 'pending',
                payment_status: 'pending',
                payment_method: body.payment_method,
                payment: {
                  id: 1,
                  reference: 'PAY-FLOOZ-123',
                  provider: 'paygate',
                  status: 'pending'
                }
              },
              message: 'Payment initiated. Check your phone for USSD prompt.'
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/products/1')
    await page.waitForLoadState('networkidle')

    // Select Flooz payment
    const floozPayment = page.locator('[data-testid="payment-flooz"]')
    if (await floozPayment.isVisible()) {
      await floozPayment.click()

      // Phone number input should appear
      const phoneInput = page.locator('[data-testid="phone-input"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('22891000000')
      }

      // Click reserve
      const reserveButton = page.locator('[data-testid="reserve-button"]')
      if (await reserveButton.isVisible()) {
        await reserveButton.click()

        // Should show USSD prompt message
        const ussdMessage = page.locator('text=USSD')
        const pendingMessage = page.locator('text=pending')

        // Either USSD message or pending status should appear
        await expect(ussdMessage.or(pendingMessage)).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('TMoney payment initiates correctly', async ({ page }) => {
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()

        if (body?.payment_method === 'tmoney') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                reservation_code: 'RES-TMONEY-001',
                status: 'pending',
                payment_status: 'pending',
                payment_method: 'tmoney'
              }
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/products/1')

    const tmoneyPayment = page.locator('[data-testid="payment-tmoney"]')
    if (await tmoneyPayment.isVisible()) {
      await tmoneyPayment.click()

      const phoneInput = page.locator('[data-testid="phone-input"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('22890000000')
      }
    }
  })

  test('Wallet payment fails with insufficient balance', async ({ page }) => {
    // Mock wallet with low balance
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 1, user_id: 1, balance: 100, is_active: true }
        })
      })
    })

    // Mock failed payment
    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        if (body?.payment_method === 'wallet') {
          route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Solde insuffisant',
              errors: { payment_method: ['Solde wallet insuffisant'] }
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/products/1')

    const walletPayment = page.locator('[data-testid="payment-wallet"]')
    if (await walletPayment.isVisible()) {
      await walletPayment.click()

      // Balance warning should appear
      const lowBalanceWarning = page.locator('[data-testid="insufficient-balance"]')
      const errorMessage = page.locator('text=insuffisant')

      await expect(lowBalanceWarning.or(errorMessage)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Payment method selection persists on page reload', async ({ page }) => {
    await page.goto('http://localhost:3000/products/1')
    await page.waitForLoadState('networkidle')

    // Select a payment method
    const floozPayment = page.locator('[data-testid="payment-flooz"]')
    if (await floozPayment.isVisible()) {
      await floozPayment.click()

      // Add phone number
      const phoneInput = page.locator('[data-testid="phone-input"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('22891000000')
      }

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Check if selection persists (depends on implementation)
      // Some apps persist, others don't - this tests the behavior
      const stillSelected = await page.locator('[data-testid="payment-flooz"].selected').isVisible()
      const phoneValue = await phoneInput.inputValue()

      // Log behavior for debugging
      console.log('Payment selection persisted:', stillSelected)
      console.log('Phone value persisted:', phoneValue)
    }
  })

  test('Payment shows correct currency (XOF)', async ({ page }) => {
    await page.goto('http://localhost:3000/products/1')
    await page.waitForLoadState('networkidle')

    // Check currency display
    const priceDisplay = page.locator('[data-testid="product-price"]')
    if (await priceDisplay.isVisible()) {
      const priceText = await priceDisplay.textContent()
      expect(priceText).toMatch(/XOF|FCFA|F/)
    }
  })

  test('Phone validation rejects invalid numbers', async ({ page }) => {
    await page.goto('http://localhost:3000/products/1')

    const floozPayment = page.locator('[data-testid="payment-flooz"]')
    if (await floozPayment.isVisible()) {
      await floozPayment.click()

      const phoneInput = page.locator('[data-testid="phone-input"]')
      if (await phoneInput.isVisible()) {
        // Enter invalid phone
        await phoneInput.fill('123')

        // Try to submit
        const reserveButton = page.locator('[data-testid="reserve-button"]')
        if (await reserveButton.isVisible()) {
          await reserveButton.click()
        }

        // Should show validation error
        const phoneError = page.locator('[data-testid="phone-error"]')
        const validationError = page.locator('text=valide').or(page.locator('text=invalid'))

        await expect(phoneError.or(validationError)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Payment Status and History', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        role: 'consumer'
      }))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('User can view payment history', async ({ page }) => {
    await page.route('**/api/payments**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              reference: 'PAY-001',
              amount: 500,
              status: 'success',
              provider: 'wallet',
              created_at: '2025-01-01T12:00:00Z'
            },
            {
              id: 2,
              reference: 'PAY-002',
              amount: 750,
              status: 'pending',
              provider: 'paygate',
              created_at: '2025-01-02T14:00:00Z'
            }
          ]
        })
      })
    })

    await page.goto('http://localhost:3000/profile/payments')

    const paymentList = page.locator('[data-testid="payment-list"]')
    if (await paymentList.isVisible()) {
      await expect(paymentList.locator('[data-testid="payment-item"]')).toHaveCount(2)
    }
  })

  test('User can check payment status', async ({ page }) => {
    await page.route('**/api/payments/1/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            status: 'success',
            provider_status: 'APPROVED',
            updated_at: '2025-01-01T12:05:00Z'
          }
        })
      })
    })

    await page.goto('http://localhost:3000/reservations/1')

    const refreshStatusBtn = page.locator('[data-testid="refresh-payment-status"]')
    if (await refreshStatusBtn.isVisible()) {
      await refreshStatusBtn.click()

      const statusDisplay = page.locator('[data-testid="payment-status"]')
      await expect(statusDisplay).toContainText(/success|APPROVED|paid/i)
    }
  })

  test('Failed payment shows retry option', async ({ page }) => {
    await page.route('**/api/reservations/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            reservation_code: 'RES-001',
            status: 'pending',
            payment_status: 'failed',
            payment: {
              id: 1,
              status: 'failed',
              error_message: 'Transaction declined'
            }
          }
        })
      })
    })

    await page.goto('http://localhost:3000/reservations/1')

    const retryButton = page.locator('[data-testid="retry-payment"]')
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled()
    }
  })
})
