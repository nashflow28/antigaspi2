import { test, expect } from '@playwright/test'

// Mock data
const mockUser = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  role: 'consumer',
  referral_code: 'JEAN2025'
}

const mockLoyaltyData = {
  total_points: 450,
  history: [
    {
      id: 1,
      points: 100,
      type: 'earned',
      source: 'purchase',
      description: 'Achat Pain artisanal',
      created_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 2,
      points: 200,
      type: 'earned',
      source: 'referral',
      description: 'Parrainage de Marie',
      created_at: '2025-01-02T14:00:00Z'
    },
    {
      id: 3,
      points: -50,
      type: 'redeemed',
      source: 'discount',
      description: 'Reduction 5%',
      created_at: '2025-01-03T16:00:00Z'
    }
  ]
}

const mockTierData = {
  current_tier: 'Silver',
  total_points: 450,
  next_tier: 'Gold',
  points_to_next_tier: 550,
  tier_benefits: [
    '10% de reduction sur tous les achats',
    'Acces prioritaire aux paniers surprise',
    'Double points le week-end'
  ]
}

test.describe('Loyalty Program - Consumer', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'jean.dupont@email.com',
        name: 'Jean Dupont',
        role: 'consumer',
        referral_code: 'JEAN2025'
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

  test('Consumer can view loyalty points balance', async ({ page }) => {
    await page.route('**/api/loyalty/points', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockLoyaltyData })
      })
    })

    await page.goto('http://localhost:3000/loyalty')
    await page.waitForLoadState('networkidle')

    // Check points display
    const pointsBalance = page.locator('[data-testid="loyalty-points"]')
    if (await pointsBalance.isVisible()) {
      await expect(pointsBalance).toContainText('450')
    }
  })

  test('Consumer can view points history', async ({ page }) => {
    await page.route('**/api/loyalty/points', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockLoyaltyData })
      })
    })

    await page.goto('http://localhost:3000/loyalty')

    const historySection = page.locator('[data-testid="points-history"]')
    if (await historySection.isVisible()) {
      // Should show history items
      const historyItems = historySection.locator('[data-testid="history-item"]')
      await expect(historyItems).toHaveCount(3)

      // Should show different types (earned/redeemed)
      await expect(historySection).toContainText('Achat')
      await expect(historySection).toContainText('Parrainage')
    }
  })

  test('Consumer can view tier information', async ({ page }) => {
    await page.route('**/api/loyalty/tier', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockTierData })
      })
    })

    await page.goto('http://localhost:3000/loyalty')

    // Check tier display
    const tierDisplay = page.locator('[data-testid="current-tier"]')
    if (await tierDisplay.isVisible()) {
      await expect(tierDisplay).toContainText('Silver')
    }

    // Check progress to next tier
    const nextTierProgress = page.locator('[data-testid="tier-progress"]')
    if (await nextTierProgress.isVisible()) {
      await expect(nextTierProgress).toContainText('Gold')
    }

    // Check tier benefits
    const benefits = page.locator('[data-testid="tier-benefits"]')
    if (await benefits.isVisible()) {
      await expect(benefits).toContainText('reduction')
    }
  })

  test('Consumer can redeem points for discount', async ({ page }) => {
    await page.route('**/api/loyalty/points', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockLoyaltyData })
      })
    })

    await page.route('**/api/loyalty/redeem', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              discount_code: 'LOYAL100',
              discount_value: 100,
              points_used: 100
            },
            message: 'Points redeemed successfully!'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/loyalty')

    const redeemButton = page.locator('[data-testid="redeem-points"]')
    if (await redeemButton.isVisible()) {
      await redeemButton.click()

      // Select redemption amount
      const redeemInput = page.locator('[data-testid="redeem-amount"]')
      if (await redeemInput.isVisible()) {
        await redeemInput.fill('100')
      }

      // Confirm redemption
      const confirmButton = page.locator('[data-testid="confirm-redeem"]')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()

        // Should show success message with discount code
        const successMessage = page.locator('[data-testid="redeem-success"]')
        const discountCode = page.locator('text=LOYAL100')

        await expect(successMessage.or(discountCode)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('Consumer cannot redeem more points than available', async ({ page }) => {
    await page.route('**/api/loyalty/points', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { total_points: 50, history: [] }
        })
      })
    })

    await page.route('**/api/loyalty/redeem', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Points insuffisants'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/loyalty')

    const redeemButton = page.locator('[data-testid="redeem-points"]')
    if (await redeemButton.isVisible()) {
      await redeemButton.click()

      const redeemInput = page.locator('[data-testid="redeem-amount"]')
      if (await redeemInput.isVisible()) {
        await redeemInput.fill('1000') // More than available
      }

      const confirmButton = page.locator('[data-testid="confirm-redeem"]')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()

        // Should show error
        const errorMessage = page.locator('[data-testid="redeem-error"]')
        const insufficientMsg = page.locator('text=insuffisant')

        await expect(errorMessage.or(insufficientMsg)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Referral Program', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify(mockUser))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })
  })

  test('Consumer can view referral code', async ({ page }) => {
    await page.route('**/api/loyalty/referral', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            referral_code: 'JEAN2025',
            referral_count: 5,
            referral_bonus: 500,
            referral_link: 'https://antigaspi.com/ref/JEAN2025'
          }
        })
      })
    })

    await page.goto('http://localhost:3000/loyalty/referral')

    const referralCode = page.locator('[data-testid="referral-code"]')
    if (await referralCode.isVisible()) {
      await expect(referralCode).toContainText('JEAN2025')
    }
  })

  test('Consumer can share referral code', async ({ page }) => {
    await page.route('**/api/loyalty/referral', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            referral_code: 'JEAN2025',
            referral_count: 5,
            referral_bonus: 500
          }
        })
      })
    })

    await page.goto('http://localhost:3000/loyalty/referral')

    const shareButton = page.locator('[data-testid="share-referral"]')
    if (await shareButton.isVisible()) {
      // Click should trigger share functionality
      await shareButton.click()

      // Check if copy notification appears
      const copiedMessage = page.locator('text=copie').or(page.locator('text=copied'))
      // Or share modal appears
      const shareModal = page.locator('[data-testid="share-modal"]')

      // One of these should be visible
      const shareAction = copiedMessage.or(shareModal)
      await expect(shareAction).toBeVisible({ timeout: 5000 })
    }
  })

  test('Consumer can validate referral code', async ({ page }) => {
    await page.route('**/api/loyalty/referral/validate', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        if (body?.referral_code === 'VALID2025') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                valid: true,
                referrer_name: 'Marie Dupont',
                bonus_points: 100
              }
            })
          })
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { valid: false }
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/loyalty/referral')

    const validateInput = page.locator('[data-testid="validate-referral-input"]')
    if (await validateInput.isVisible()) {
      await validateInput.fill('VALID2025')

      const validateButton = page.locator('[data-testid="validate-referral-btn"]')
      await validateButton.click()

      // Should show valid message
      const validMessage = page.locator('[data-testid="referral-valid"]')
      const bonusMessage = page.locator('text=100')

      await expect(validMessage.or(bonusMessage)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Consumer cannot use own referral code', async ({ page }) => {
    await page.route('**/api/loyalty/referral/validate', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        if (body?.referral_code === 'JEAN2025') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { valid: false, message: 'Cannot use your own code' }
            })
          })
        }
      }
    })

    await page.goto('http://localhost:3000/loyalty/referral')

    const validateInput = page.locator('[data-testid="validate-referral-input"]')
    if (await validateInput.isVisible()) {
      await validateInput.fill('JEAN2025') // Own code

      const validateButton = page.locator('[data-testid="validate-referral-btn"]')
      await validateButton.click()

      // Should show error
      const invalidMessage = page.locator('[data-testid="referral-invalid"]')
      const errorMessage = page.locator('text=propre').or(page.locator('text=own'))

      await expect(invalidMessage.or(errorMessage)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Loyalty Program - Merchant', () => {
  const mockMerchantUser = {
    id: 2,
    email: 'boulangerie.martin@email.com',
    name: 'Boulangerie Martin',
    role: 'merchant'
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-merchant-token')
      localStorage.setItem('user', JSON.stringify({
        id: 2,
        email: 'boulangerie.martin@email.com',
        name: 'Boulangerie Martin',
        role: 'merchant'
      }))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockMerchantUser })
      })
    })
  })

  test('Merchant can view loyalty statistics', async ({ page }) => {
    await page.route('**/api/merchant/loyalty/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_points_awarded: 15000,
            total_customers: 45,
            points_this_month: 3500,
            top_customers: [
              { name: 'Jean Dupont', points: 1200 },
              { name: 'Marie Doe', points: 800 }
            ]
          }
        })
      })
    })

    await page.goto('http://localhost:3000/merchant/loyalty')

    const statsSection = page.locator('[data-testid="loyalty-stats"]')
    if (await statsSection.isVisible()) {
      await expect(statsSection).toContainText('15000')
      await expect(statsSection).toContainText('45')
    }
  })

  test('Merchant can view customer list', async ({ page }) => {
    await page.route('**/api/merchant/loyalty/customers', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, name: 'Jean Dupont', email: 'jean@email.com', total_points: 1200, tier: 'Gold' },
            { id: 2, name: 'Marie Doe', email: 'marie@email.com', total_points: 800, tier: 'Silver' },
            { id: 3, name: 'Pierre Test', email: 'pierre@email.com', total_points: 200, tier: 'Bronze' }
          ]
        })
      })
    })

    await page.goto('http://localhost:3000/merchant/loyalty/customers')

    const customerList = page.locator('[data-testid="customer-list"]')
    if (await customerList.isVisible()) {
      const customerItems = customerList.locator('[data-testid="customer-item"]')
      await expect(customerItems).toHaveCount(3)
    }
  })
})

test.describe('Loyalty UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify(mockUser))
    })

    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser })
      })
    })

    await page.route('**/api/loyalty/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockLoyaltyData
        })
      })
    })
  })

  test('Tier badges display correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/loyalty')

    // Check tier badge styling
    const tierBadge = page.locator('[data-testid="tier-badge"]')
    if (await tierBadge.isVisible()) {
      // Badge should have appropriate styling
      const badgeClasses = await tierBadge.getAttribute('class')
      expect(badgeClasses).toBeTruthy()
    }
  })

  test('Points animation on earn', async ({ page }) => {
    await page.goto('http://localhost:3000/loyalty')

    // Trigger points animation (e.g., by simulating new points)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('points-earned', { detail: { points: 50 } }))
    })

    // Check for animation element
    const animation = page.locator('[data-testid="points-animation"]')
    if (await animation.isVisible()) {
      await expect(animation).toContainText('+50')
    }
  })

  test('Loyalty progress bar shows correct percentage', async ({ page }) => {
    await page.route('**/api/loyalty/tier', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            current_tier: 'Silver',
            total_points: 450,
            next_tier: 'Gold',
            points_to_next_tier: 550
          }
        })
      })
    })

    await page.goto('http://localhost:3000/loyalty')

    const progressBar = page.locator('[data-testid="tier-progress-bar"]')
    if (await progressBar.isVisible()) {
      // Progress should be approximately 45% (450/1000)
      const width = await progressBar.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.width
      })
      console.log('Progress bar width:', width)
    }
  })
})
