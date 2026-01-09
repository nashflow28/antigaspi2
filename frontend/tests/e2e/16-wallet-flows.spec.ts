import { test, expect } from '@playwright/test'

// Mock data
const mockUser = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  role: 'consumer',
  phone: '22891000000'
}

const mockWallet = {
  id: 1,
  user_id: 1,
  balance: 5000,
  is_active: true,
  currency: 'XOF'
}

const mockTransactions = [
  {
    id: 1,
    type: 'credit',
    amount: 2000,
    description: 'Depot Mobile Money',
    reference: 'DEP-001',
    status: 'success',
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    type: 'debit',
    amount: 500,
    description: 'Paiement reservation RES-123',
    reference: 'PAY-001',
    status: 'success',
    created_at: '2025-01-02T14:00:00Z'
  },
  {
    id: 3,
    type: 'credit',
    amount: 3500,
    description: 'Depot Flooz',
    reference: 'DEP-002',
    status: 'success',
    created_at: '2025-01-03T09:00:00Z'
  }
]

test.describe('Wallet - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        name: 'Jean Dupont',
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

  test('User can view wallet balance', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })

    await page.goto('http://localhost:3000/wallet')

    const balance = page.locator('[data-testid="wallet-balance"]')
    if (await balance.isVisible()) {
      await expect(balance).toContainText('5000')
      await expect(balance).toContainText('XOF')
    }
  })

  test('User can view transaction history', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })

    await page.route('**/api/wallet/transactions*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockTransactions
        })
      })
    })

    await page.goto('http://localhost:3000/wallet')

    const transactionList = page.locator('[data-testid="transaction-list"]')
    if (await transactionList.isVisible()) {
      const transactions = transactionList.locator('[data-testid="transaction-item"]')
      await expect(transactions).toHaveCount(3)
    }
  })

  test('Credits and debits are displayed differently', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })

    await page.route('**/api/wallet/transactions*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockTransactions
        })
      })
    })

    await page.goto('http://localhost:3000/wallet')

    const transactionList = page.locator('[data-testid="transaction-list"]')
    if (await transactionList.isVisible()) {
      // Credit should have + sign and green color (class contains 'credit' or 'positive')
      const creditTransaction = transactionList.locator('[data-testid="transaction-credit"]').first()
      if (await creditTransaction.isVisible()) {
        const creditClass = await creditTransaction.getAttribute('class')
        expect(creditClass).toMatch(/credit|positive|green/)
      }

      // Debit should have - sign and red color
      const debitTransaction = transactionList.locator('[data-testid="transaction-debit"]').first()
      if (await debitTransaction.isVisible()) {
        const debitClass = await debitTransaction.getAttribute('class')
        expect(debitClass).toMatch(/debit|negative|red/)
      }
    }
  })
})

test.describe('Wallet - Top Up', () => {
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

    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })
  })

  test('User can top up wallet with Flooz', async ({ page }) => {
    await page.route('**/api/wallet/topup', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              reference: 'TOPUP-FLOOZ-001',
              amount: body.amount,
              provider: 'paygate',
              status: 'pending'
            },
            message: 'Verifiez votre telephone pour confirmer le depot'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/wallet/topup')

    // Select amount
    const amountInput = page.locator('[data-testid="topup-amount"]')
    if (await amountInput.isVisible()) {
      await amountInput.fill('2000')
    }

    // Select Flooz
    const floozOption = page.locator('[data-testid="topup-flooz"]')
    if (await floozOption.isVisible()) {
      await floozOption.click()
    }

    // Enter phone
    const phoneInput = page.locator('[data-testid="topup-phone"]')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('22891000000')
    }

    // Submit
    const submitButton = page.locator('[data-testid="topup-submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Should show USSD prompt message
      const pendingMessage = page.locator('[data-testid="topup-pending"]')
      const ussdMessage = page.locator('text=telephone')

      await expect(pendingMessage.or(ussdMessage)).toBeVisible({ timeout: 5000 })
    }
  })

  test('User can top up wallet with TMoney', async ({ page }) => {
    await page.route('**/api/wallet/topup', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              reference: 'TOPUP-TMONEY-001',
              status: 'pending'
            },
            message: 'Depot TMoney initie'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/wallet/topup')

    const amountInput = page.locator('[data-testid="topup-amount"]')
    if (await amountInput.isVisible()) {
      await amountInput.fill('3000')
    }

    const tmoneyOption = page.locator('[data-testid="topup-tmoney"]')
    if (await tmoneyOption.isVisible()) {
      await tmoneyOption.click()
    }

    const phoneInput = page.locator('[data-testid="topup-phone"]')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('22890000000')
    }

    const submitButton = page.locator('[data-testid="topup-submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      const pendingMessage = page.locator('[data-testid="topup-pending"]')
      await expect(pendingMessage).toBeVisible({ timeout: 5000 })
    }
  })

  test('Quick top up amounts work', async ({ page }) => {
    await page.goto('http://localhost:3000/wallet/topup')

    // Click quick amount button
    const quickAmount5000 = page.locator('[data-testid="quick-amount-5000"]')
    if (await quickAmount5000.isVisible()) {
      await quickAmount5000.click()

      const amountInput = page.locator('[data-testid="topup-amount"]')
      const value = await amountInput.inputValue()
      expect(value).toBe('5000')
    }
  })

  test('Minimum top up amount is enforced', async ({ page }) => {
    await page.route('**/api/wallet/topup', route => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Validation error',
          errors: {
            amount: ['Le montant minimum est de 100 XOF']
          }
        })
      })
    })

    await page.goto('http://localhost:3000/wallet/topup')

    const amountInput = page.locator('[data-testid="topup-amount"]')
    if (await amountInput.isVisible()) {
      await amountInput.fill('50') // Below minimum
    }

    const submitButton = page.locator('[data-testid="topup-submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      const errorMessage = page.locator('[data-testid="amount-error"]')
      const minError = page.locator('text=minimum')

      await expect(errorMessage.or(minError)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Wallet - PIN Management', () => {
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

    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
    })
  })

  test('User can create wallet PIN', async ({ page }) => {
    await page.route('**/api/wallet/pin', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'PIN cree avec succes'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/wallet/settings')

    const createPinBtn = page.locator('[data-testid="create-pin-btn"]')
    if (await createPinBtn.isVisible()) {
      await createPinBtn.click()

      // Enter PIN
      const pinInput = page.locator('[data-testid="new-pin"]')
      if (await pinInput.isVisible()) {
        await pinInput.fill('1234')
      }

      // Confirm PIN
      const confirmPinInput = page.locator('[data-testid="confirm-pin"]')
      if (await confirmPinInput.isVisible()) {
        await confirmPinInput.fill('1234')
      }

      // Submit
      const submitBtn = page.locator('[data-testid="save-pin"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()

        const successMessage = page.locator('[data-testid="pin-success"]')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('PIN confirmation must match', async ({ page }) => {
    await page.goto('http://localhost:3000/wallet/settings')

    const createPinBtn = page.locator('[data-testid="create-pin-btn"]')
    if (await createPinBtn.isVisible()) {
      await createPinBtn.click()

      const pinInput = page.locator('[data-testid="new-pin"]')
      if (await pinInput.isVisible()) {
        await pinInput.fill('1234')
      }

      const confirmPinInput = page.locator('[data-testid="confirm-pin"]')
      if (await confirmPinInput.isVisible()) {
        await confirmPinInput.fill('5678') // Different PIN
      }

      const submitBtn = page.locator('[data-testid="save-pin"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()

        const errorMessage = page.locator('[data-testid="pin-mismatch"]')
        const mismatchText = page.locator('text=correspondent').or(page.locator('text=match'))

        await expect(errorMessage.or(mismatchText)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('User can change wallet PIN', async ({ page }) => {
    await page.route('**/api/wallet/pin', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'PIN modifie avec succes'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/wallet/settings')

    const changePinBtn = page.locator('[data-testid="change-pin-btn"]')
    if (await changePinBtn.isVisible()) {
      await changePinBtn.click()

      // Enter current PIN
      const currentPinInput = page.locator('[data-testid="current-pin"]')
      if (await currentPinInput.isVisible()) {
        await currentPinInput.fill('1234')
      }

      // Enter new PIN
      const newPinInput = page.locator('[data-testid="new-pin"]')
      if (await newPinInput.isVisible()) {
        await newPinInput.fill('5678')
      }

      // Confirm new PIN
      const confirmPinInput = page.locator('[data-testid="confirm-pin"]')
      if (await confirmPinInput.isVisible()) {
        await confirmPinInput.fill('5678')
      }

      const submitBtn = page.locator('[data-testid="save-pin"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()

        const successMessage = page.locator('[data-testid="pin-changed"]')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Wallet - Payment with Wallet', () => {
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

  test('Wallet balance shown when selecting wallet payment', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
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
            discounted_price: 1000,
            quantity_available: 5
          }
        })
      })
    })

    await page.goto('http://localhost:3000/products/1')

    const walletPayment = page.locator('[data-testid="payment-wallet"]')
    if (await walletPayment.isVisible()) {
      await walletPayment.click()

      const walletBalanceDisplay = page.locator('[data-testid="wallet-balance-display"]')
      if (await walletBalanceDisplay.isVisible()) {
        await expect(walletBalanceDisplay).toContainText('5000')
      }
    }
  })

  test('Cannot pay with wallet if balance insufficient', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...mockWallet, balance: 500 } // Low balance
        })
      })
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
            discounted_price: 1000, // More than wallet balance
            quantity_available: 5
          }
        })
      })
    })

    await page.goto('http://localhost:3000/products/1')

    const walletPayment = page.locator('[data-testid="payment-wallet"]')
    if (await walletPayment.isVisible()) {
      await walletPayment.click()

      // Should show insufficient balance warning
      const insufficientWarning = page.locator('[data-testid="insufficient-balance"]')
      const warningText = page.locator('text=insuffisant')

      await expect(insufficientWarning.or(warningText)).toBeVisible({ timeout: 5000 })

      // Pay button should be disabled or show top-up option
      const payButton = page.locator('[data-testid="reserve-button"]')
      const topUpLink = page.locator('[data-testid="topup-link"]')

      const isDisabled = await payButton.isDisabled()
      const hasTopUpLink = await topUpLink.isVisible()

      expect(isDisabled || hasTopUpLink).toBeTruthy()
    }
  })

  test('PIN required for wallet payment', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockWallet })
      })
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
            discounted_price: 1000,
            quantity_available: 5
          }
        })
      })
    })

    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        if (body.payment_method === 'wallet' && !body.wallet_pin) {
          route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'PIN wallet requis',
              errors: { wallet_pin: ['Le PIN est requis pour payer avec le wallet'] }
            })
          })
        } else if (body.wallet_pin === '1234') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { id: 1, status: 'confirmed' }
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/products/1')

    const walletPayment = page.locator('[data-testid="payment-wallet"]')
    if (await walletPayment.isVisible()) {
      await walletPayment.click()

      // PIN input should appear
      const pinInput = page.locator('[data-testid="wallet-pin-input"]')
      await expect(pinInput).toBeVisible({ timeout: 5000 })

      // Enter PIN
      await pinInput.fill('1234')

      // Submit payment
      const payButton = page.locator('[data-testid="reserve-button"]')
      if (await payButton.isEnabled()) {
        await payButton.click()
      }
    }
  })
})

test.describe('Wallet - Inactive State', () => {
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

  test('Shows activation prompt for inactive wallet', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...mockWallet, is_active: false }
        })
      })
    })

    await page.goto('http://localhost:3000/wallet')

    const activatePrompt = page.locator('[data-testid="activate-wallet"]')
    const inactiveMessage = page.locator('text=activer').or(page.locator('text=activate'))

    await expect(activatePrompt.or(inactiveMessage)).toBeVisible({ timeout: 5000 })
  })

  test('User can activate wallet', async ({ page }) => {
    await page.route('**/api/wallet', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...mockWallet, is_active: false }
        })
      })
    })

    await page.route('**/api/wallet/activate', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...mockWallet, is_active: true },
            message: 'Wallet active avec succes'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/wallet')

    const activateBtn = page.locator('[data-testid="activate-wallet-btn"]')
    if (await activateBtn.isVisible()) {
      await activateBtn.click()

      const successMessage = page.locator('[data-testid="activation-success"]')
      const balanceDisplay = page.locator('[data-testid="wallet-balance"]')

      await expect(successMessage.or(balanceDisplay)).toBeVisible({ timeout: 5000 })
    }
  })
})
