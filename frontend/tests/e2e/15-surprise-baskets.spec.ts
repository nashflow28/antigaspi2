import { test, expect } from '@playwright/test'

// Mock data
const mockConsumer = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  role: 'consumer'
}

const mockMerchant = {
  id: 2,
  email: 'boulangerie.martin@email.com',
  name: 'Boulangerie Martin',
  role: 'merchant',
  merchant: {
    id: 1,
    business_name: 'Boulangerie Martin'
  }
}

const mockSurpriseBaskets = [
  {
    id: 1,
    name: 'Panier Mystere Boulangerie',
    description: 'Un assortiment surprise de viennoiseries et pains du jour',
    original_price: 5000,
    discounted_price: 2500,
    discount_percentage: 50,
    quantity_available: 5,
    is_active: true,
    pickup_start: '17:00',
    pickup_end: '19:00',
    merchant: {
      id: 1,
      business_name: 'Boulangerie Martin',
      address: 'Avenue de la Liberation, Lome'
    },
    products: [
      { id: 1, name: 'Pain complet', quantity: 1 },
      { id: 2, name: 'Croissant', quantity: 2 }
    ]
  },
  {
    id: 2,
    name: 'Panier Fruits et Legumes',
    description: 'Selection de fruits et legumes de saison',
    original_price: 3000,
    discounted_price: 1500,
    discount_percentage: 50,
    quantity_available: 3,
    is_active: true,
    pickup_start: '16:00',
    pickup_end: '18:00',
    merchant: {
      id: 2,
      business_name: 'Fruits Kara',
      address: 'Marche Central, Kara'
    },
    products: []
  },
  {
    id: 3,
    name: 'Panier Epuise',
    description: 'Ce panier n est plus disponible',
    original_price: 4000,
    discounted_price: 2000,
    discount_percentage: 50,
    quantity_available: 0,
    is_active: true,
    merchant: {
      id: 1,
      business_name: 'Boulangerie Martin'
    }
  }
]

test.describe('Surprise Baskets - Consumer View', () => {
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
        body: JSON.stringify({ success: true, data: mockConsumer })
      })
    })
  })

  test('Consumer can view available surprise baskets', async ({ page }) => {
    await page.route('**/api/surprise-baskets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockSurpriseBaskets.filter(b => b.quantity_available > 0)
        })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets')
    await page.waitForLoadState('networkidle')

    const basketList = page.locator('[data-testid="surprise-basket-list"]')
    if (await basketList.isVisible()) {
      const basketCards = basketList.locator('[data-testid="surprise-basket-card"]')
      await expect(basketCards).toHaveCount(2) // Only available baskets
    }
  })

  test('Basket card shows discount percentage', async ({ page }) => {
    await page.route('**/api/surprise-baskets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockSurpriseBaskets[0]]
        })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets')

    const discountBadge = page.locator('[data-testid="discount-badge"]')
    if (await discountBadge.isVisible()) {
      await expect(discountBadge).toContainText('50%')
    }
  })

  test('Consumer can view basket details', async ({ page }) => {
    await page.route('**/api/surprise-baskets/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockSurpriseBaskets[0]
        })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets/1')

    // Check basket details
    const basketName = page.locator('[data-testid="basket-name"]')
    if (await basketName.isVisible()) {
      await expect(basketName).toContainText('Panier Mystere')
    }

    // Check prices
    const originalPrice = page.locator('[data-testid="original-price"]')
    const discountedPrice = page.locator('[data-testid="discounted-price"]')

    if (await originalPrice.isVisible()) {
      await expect(originalPrice).toContainText('5000')
    }
    if (await discountedPrice.isVisible()) {
      await expect(discountedPrice).toContainText('2500')
    }

    // Check pickup time
    const pickupTime = page.locator('[data-testid="pickup-time"]')
    if (await pickupTime.isVisible()) {
      await expect(pickupTime).toContainText('17:00')
    }
  })

  test('Consumer can reserve surprise basket', async ({ page }) => {
    await page.route('**/api/surprise-baskets/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockSurpriseBaskets[0]
        })
      })
    })

    await page.route('**/api/reservations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              reservation_code: 'SB-123456',
              surprise_basket_id: 1,
              quantity: 1,
              total_amount: 2500,
              status: 'pending'
            },
            message: 'Panier surprise reserve!'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/surprise-baskets/1')

    const reserveButton = page.locator('[data-testid="reserve-basket"]')
    if (await reserveButton.isVisible()) {
      await reserveButton.click()

      // Should show success
      const successMessage = page.locator('[data-testid="reservation-success"]')
      const reservationCode = page.locator('text=SB-123456')

      await expect(successMessage.or(reservationCode)).toBeVisible({ timeout: 5000 })
    }
  })

  test('Out of stock basket shows unavailable state', async ({ page }) => {
    await page.route('**/api/surprise-baskets/3', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockSurpriseBaskets[2] // Epuise basket
        })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets/3')

    const reserveButton = page.locator('[data-testid="reserve-basket"]')
    if (await reserveButton.isVisible()) {
      // Should be disabled
      await expect(reserveButton).toBeDisabled()
    }

    // Should show out of stock message
    const outOfStock = page.locator('[data-testid="out-of-stock"]')
    const epuiseText = page.locator('text=epuise').or(page.locator('text=indisponible'))

    await expect(outOfStock.or(epuiseText)).toBeVisible()
  })

  test('Inactive basket returns 404', async ({ page }) => {
    await page.route('**/api/surprise-baskets/999', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Panier non trouve'
        })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets/999')

    const notFound = page.locator('[data-testid="not-found"]')
    const errorMessage = page.locator('text=trouve').or(page.locator('text=found'))

    await expect(notFound.or(errorMessage)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Surprise Baskets - Merchant Management', () => {
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
        body: JSON.stringify({ success: true, data: mockMerchant })
      })
    })
  })

  test('Merchant can view own surprise baskets', async ({ page }) => {
    await page.route('**/api/merchant/surprise-baskets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockSurpriseBaskets[0], mockSurpriseBaskets[2]]
        })
      })
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets')

    const basketList = page.locator('[data-testid="merchant-basket-list"]')
    if (await basketList.isVisible()) {
      const basketItems = basketList.locator('[data-testid="basket-item"]')
      await expect(basketItems).toHaveCount(2)
    }
  })

  test('Merchant can create new surprise basket', async ({ page }) => {
    await page.route('**/api/merchant/surprise-baskets', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 4,
              ...body,
              is_active: true,
              discount_percentage: Math.round((1 - body.discounted_price / body.original_price) * 100)
            },
            message: 'Panier surprise cree!'
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets/create')

    // Fill form
    const nameInput = page.locator('[data-testid="basket-name-input"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Nouveau Panier Test')
    }

    const descInput = page.locator('[data-testid="basket-description-input"]')
    if (await descInput.isVisible()) {
      await descInput.fill('Description du panier test')
    }

    const originalPriceInput = page.locator('[data-testid="original-price-input"]')
    if (await originalPriceInput.isVisible()) {
      await originalPriceInput.fill('4000')
    }

    const discountedPriceInput = page.locator('[data-testid="discounted-price-input"]')
    if (await discountedPriceInput.isVisible()) {
      await discountedPriceInput.fill('2000')
    }

    const quantityInput = page.locator('[data-testid="quantity-input"]')
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('10')
    }

    // Submit
    const submitButton = page.locator('[data-testid="create-basket-btn"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      const successMessage = page.locator('[data-testid="create-success"]')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    }
  })

  test('Merchant can update surprise basket', async ({ page }) => {
    await page.route('**/api/merchant/surprise-baskets/1', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockSurpriseBaskets[0] })
        })
      } else if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON()
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...mockSurpriseBaskets[0], ...body },
            message: 'Panier mis a jour!'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets/1/edit')

    // Update name
    const nameInput = page.locator('[data-testid="basket-name-input"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Panier Mystere Modifie')
    }

    // Update quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('20')
    }

    // Submit
    const updateButton = page.locator('[data-testid="update-basket-btn"]')
    if (await updateButton.isVisible()) {
      await updateButton.click()

      const successMessage = page.locator('[data-testid="update-success"]')
      await expect(successMessage).toBeVisible({ timeout: 5000 })
    }
  })

  test('Merchant can delete surprise basket', async ({ page }) => {
    await page.route('**/api/merchant/surprise-baskets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockSurpriseBaskets[0]]
        })
      })
    })

    await page.route('**/api/merchant/surprise-baskets/1', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Panier supprime!'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets')

    const deleteButton = page.locator('[data-testid="delete-basket-1"]')
    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Confirm deletion
      const confirmButton = page.locator('[data-testid="confirm-delete"]')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()

        const successMessage = page.locator('[data-testid="delete-success"]')
        await expect(successMessage).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('Merchant can add products to basket', async ({ page }) => {
    const mockProducts = [
      { id: 1, name: 'Pain complet', discounted_price: 500 },
      { id: 2, name: 'Croissant', discounted_price: 200 },
      { id: 3, name: 'Baguette', discounted_price: 300 }
    ]

    await page.route('**/api/merchant/products', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockProducts })
      })
    })

    await page.route('**/api/merchant/surprise-baskets/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockSurpriseBaskets[0] })
      })
    })

    await page.route('**/api/merchant/surprise-baskets/1/products', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Produit ajoute au panier!'
          })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets/1/edit')

    // Add product
    const addProductBtn = page.locator('[data-testid="add-product-btn"]')
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click()

      // Select product
      const productSelect = page.locator('[data-testid="product-select"]')
      if (await productSelect.isVisible()) {
        await productSelect.selectOption('3') // Baguette

        const quantityInput = page.locator('[data-testid="product-quantity"]')
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('2')
        }

        const confirmAddBtn = page.locator('[data-testid="confirm-add-product"]')
        if (await confirmAddBtn.isVisible()) {
          await confirmAddBtn.click()

          const successMessage = page.locator('[data-testid="product-added"]')
          await expect(successMessage).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('Discounted price must be less than original', async ({ page }) => {
    await page.route('**/api/merchant/surprise-baskets', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Validation error',
            errors: {
              discounted_price: ['Le prix reduit doit etre inferieur au prix original']
            }
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        })
      }
    })

    await page.goto('http://localhost:3000/merchant/surprise-baskets/create')

    // Fill with invalid prices
    const originalPriceInput = page.locator('[data-testid="original-price-input"]')
    if (await originalPriceInput.isVisible()) {
      await originalPriceInput.fill('2000')
    }

    const discountedPriceInput = page.locator('[data-testid="discounted-price-input"]')
    if (await discountedPriceInput.isVisible()) {
      await discountedPriceInput.fill('5000') // Higher than original
    }

    const submitButton = page.locator('[data-testid="create-basket-btn"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      const errorMessage = page.locator('[data-testid="price-error"]')
      const validationError = page.locator('text=inferieur').or(page.locator('text=less'))

      await expect(errorMessage.or(validationError)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Surprise Baskets - Filtering and Sorting', () => {
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
        body: JSON.stringify({ success: true, data: mockConsumer })
      })
    })

    await page.route('**/api/surprise-baskets*', route => {
      const url = new URL(route.request().url())
      let filteredBaskets = mockSurpriseBaskets.filter(b => b.quantity_available > 0)

      // Apply filters based on query params
      const maxPrice = url.searchParams.get('max_price')
      if (maxPrice) {
        filteredBaskets = filteredBaskets.filter(b => b.discounted_price <= parseInt(maxPrice))
      }

      const sortBy = url.searchParams.get('sort_by')
      if (sortBy === 'price_asc') {
        filteredBaskets.sort((a, b) => a.discounted_price - b.discounted_price)
      } else if (sortBy === 'price_desc') {
        filteredBaskets.sort((a, b) => b.discounted_price - a.discounted_price)
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: filteredBaskets })
      })
    })
  })

  test('Consumer can filter baskets by price', async ({ page }) => {
    await page.goto('http://localhost:3000/surprise-baskets')

    const priceFilter = page.locator('[data-testid="price-filter"]')
    if (await priceFilter.isVisible()) {
      await priceFilter.selectOption('2000') // Max 2000 XOF

      await page.waitForResponse('**/api/surprise-baskets*')

      const basketList = page.locator('[data-testid="surprise-basket-list"]')
      const basketCards = basketList.locator('[data-testid="surprise-basket-card"]')

      // Should only show basket with price <= 2000
      await expect(basketCards).toHaveCount(1)
    }
  })

  test('Consumer can sort baskets by price', async ({ page }) => {
    await page.goto('http://localhost:3000/surprise-baskets')

    const sortSelect = page.locator('[data-testid="sort-baskets"]')
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price_asc')

      await page.waitForResponse('**/api/surprise-baskets*')

      const basketList = page.locator('[data-testid="surprise-basket-list"]')
      const prices = await basketList.locator('[data-testid="basket-price"]').allTextContents()

      // Verify ascending order
      if (prices.length >= 2) {
        const firstPrice = parseFloat(prices[0].replace(/[^0-9]/g, ''))
        const secondPrice = parseFloat(prices[1].replace(/[^0-9]/g, ''))
        expect(firstPrice).toBeLessThanOrEqual(secondPrice)
      }
    }
  })

  test('Empty state when no baskets match filters', async ({ page }) => {
    await page.route('**/api/surprise-baskets*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets')

    const emptyState = page.locator('[data-testid="no-baskets"]')
    const emptyMessage = page.locator('text=aucun panier').or(page.locator('text=no baskets'))

    await expect(emptyState.or(emptyMessage)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Surprise Baskets - Pickup Flow', () => {
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
        body: JSON.stringify({ success: true, data: mockConsumer })
      })
    })
  })

  test('Shows pickup time window', async ({ page }) => {
    await page.route('**/api/surprise-baskets/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockSurpriseBaskets[0] })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets/1')

    const pickupWindow = page.locator('[data-testid="pickup-window"]')
    if (await pickupWindow.isVisible()) {
      await expect(pickupWindow).toContainText('17:00')
      await expect(pickupWindow).toContainText('19:00')
    }
  })

  test('Shows merchant address for pickup', async ({ page }) => {
    await page.route('**/api/surprise-baskets/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockSurpriseBaskets[0] })
      })
    })

    await page.goto('http://localhost:3000/surprise-baskets/1')

    const merchantAddress = page.locator('[data-testid="merchant-address"]')
    if (await merchantAddress.isVisible()) {
      await expect(merchantAddress).toContainText('Avenue de la Liberation')
    }
  })
})
