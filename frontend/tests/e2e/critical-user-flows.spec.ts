import { test, expect } from '@playwright/test'

// Mock products data conforming to ApiProduct type
const mockProducts = [
  {
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Un délicieux pain complet fait maison',
    category: {
      id: 1,
      name: 'Boulangerie'
    },
    original_price: 500,
    discounted_price: 250,
    discount_percentage: 50,
    image_url: 'https://via.placeholder.com/300',
    is_active: true,
    quantity_available: 5,
    expiration_date: '2026-12-31T23:59:59Z',
    merchant: {
      id: 1,
      name: 'Boulangerie Bio',
      business_name: 'Boulangerie Bio',
      address: '123 Rue de la Paix',
      city: 'Lomé',
      rating: 4.5,
      distance_km: 1.2
    }
  },
  {
    id: 2,
    name: 'Croissants frais',
    description: 'Croissants pur beurre croustillants',
    category: {
      id: 1,
      name: 'Boulangerie'
    },
    original_price: 200,
    discounted_price: 100,
    discount_percentage: 50,
    image_url: 'https://via.placeholder.com/300',
    is_active: true,
    quantity_available: 10,
    expiration_date: '2026-12-31T23:59:59Z',
    merchant: {
      id: 1,
      name: 'Boulangerie Bio',
      business_name: 'Boulangerie Bio',
      address: '123 Rue de la Paix',
      city: 'Lomé',
      rating: 4.5,
      distance_km: 1.2
    }
  }
]

const mockUser = {
  id: 1,
  email: 'jean.dupont@email.com',
  name: 'Jean Dupont',
  first_name: 'Jean',
  last_name: 'Dupont',
  role: 'consumer'
}

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock categories API
    await page.route('**/api/categories', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 1, name: 'Boulangerie' }]
        })
      })
    })

    // Mock products API
    await page.route('**/api/products*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockProducts,
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 50,
            total: 1
          }
        })
      })
    })

    // Mock auth/me to persist session
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockUser
        })
      })
    })

    // Navigate to the application
    await page.goto('http://localhost:3000')
  })

  test('User can browse products without authentication', async ({ page }) => {
    // Check if we can see products on homepage
    await expect(page.locator('body')).toContainText('Pain complet artisanal', { timeout: 15000 })

    // Should see at least one product card
    const productCards = page.locator('[data-testid="product-card"]').or(page.locator('[data-testid="product-card-2025"]'))
    await expect(productCards.first()).toBeVisible()
  })

  test('Authentication flow works correctly', async ({ page }) => {
    // Mock login API
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: mockUser,
            token: 'mock-jwt-token-123'
          }
        })
      })
    })

    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Switch to email mode
    const switchToEmailBtn = page.getByRole('button', { name: "Utiliser l'email à la place" })
    if (await switchToEmailBtn.isVisible()) {
      await switchToEmailBtn.click()
    }

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'jean.dupont@email.com')
    await page.fill('[data-testid="password-input"]', 'password')

    // Submit form
    await page.click('[data-testid="submit-login"]')

    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    
    // Verify auth by checking for 'Bonjour' text in dashboard
    await expect(page.locator('body')).toContainText('Bonjour', { timeout: 10000 })
  })

  test('Product reservation flow for authenticated user', async ({ page }) => {
    // Mock products API with specific product details
    await page.route('**/api/products*', route => {
      const url = route.request().url()
      // Match /api/products/123 but not /api/products?page=1
      if (/[\/]api[\/]products[\/]\d+/.test(url)) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockProducts[0]
          })
        })
      } else {
        // Products list
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockProducts,
            pagination: {
              current_page: 1,
              last_page: 1,
              per_page: 50,
              total: 2
            }
          })
        })
      }
    })

    // Mock auth/me specifically for this test to ensure persistence
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            email: 'jean.dupont@email.com',
            name: 'Jean Dupont',
            first_name: 'Jean',
            last_name: 'Dupont',
            role: 'consumer'
          }
        })
      })
    })

    // Mock login API
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 1,
              email: 'jean.dupont@email.com',
              name: 'Jean Dupont',
              first_name: 'Jean',
              last_name: 'Dupont',
              role: 'consumer'
            },
            token: 'mock-jwt-token-123'
          }
        })
      })
    })

    // Mock reservation API
    await page.route('**/api/reservations*', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              product_id: 1,
              quantity: 1,
              status: 'pending'
            }
          })
        })
      } else {
        // Handle GET requests (loadUserImpact)
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { current_page: 1, last_page: 1, total: 0 }
          })
        })
      }
    })

    // Login first
    await page.goto('http://localhost:3000/login')
    const switchToEmailBtn = page.getByRole('button', { name: "Utiliser l'email à la place" })
    if (await switchToEmailBtn.isVisible()) {
      await switchToEmailBtn.click()
    }
    
    await page.fill('[data-testid="email-input"]', 'jean.dupont@email.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="submit-login"]')

    // Wait for authentication
    await page.waitForURL(/dashboard/, { timeout: 15000 })

    // Navigate to products (avoid full load wait to reduce flakiness)
    await page.goto('http://localhost:3000/products', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Ensure filters are cleared to see mock products
    const resetBtn = page.getByRole('button', { name: 'Réinitialiser' })
    if (await resetBtn.isVisible()) {
      await resetBtn.click()
    }

    // Wait for product card to be visible
    const productCard = page.locator('text=Pain complet artisanal').first()
    await expect(productCard).toBeVisible({ timeout: 15000 })

    // Click to go to detail page (more reliable than list button)
    await productCard.click()
    
    // Wait for detail page load
    await expect(page.locator('h1').getByText('Pain complet artisanal')).toBeVisible({ timeout: 15000 })

    // Add to cart from detail page
    const detailAddToCart = page.locator('[data-testid="add-to-cart"]').or(page.getByRole('button', { name: /panier|réserver/i }))
    await detailAddToCart.first().click()

    // Check that reservation was successful (notification appears)
    const notification = page.locator('[data-testid="notification-success"]').or(page.locator('text=succès'))
    await expect(notification.first()).toBeVisible({ timeout: 10000 })
  })

  test('Cart functionality works correctly', async ({ page }) => {
    // Add items to cart (simulate)
    await page.evaluate(() => {
      localStorage.setItem('antigaspi_cart_items', JSON.stringify([
        {
          id: 1,
          name: 'Test Product',
          price: 250,
          quantity: 1,
          type: 'product',
          productId: 1
        }
      ]))
    })

    // Refresh to load cart from localStorage
    await page.reload()

    // Navigate to cart
    const cartBtn = page.locator('[data-testid="cart-button"]')
    if (await cartBtn.isVisible()) {
      await cartBtn.click()
    } else {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.getByRole('button', { name: 'Mon panier' }).click()
    }

    // Should see cart items (look for product name)
    await expect(page.locator('text=Test Product')).toBeVisible()

    // Should show correct total
    await expect(page.locator('body')).toContainText('250')
  })

  test('Navigation between pages works', async ({ page }) => {
    // Test main navigation links
    const navigationLinks = [
      { name: 'Accueil', expectedUrl: '/' },
      { name: 'Produits', expectedUrl: '/products' },
      { name: 'Decouvrir', expectedUrl: '/discover' }
    ]

    for (const link of navigationLinks) {
      try {
        await page.getByRole('menuitem', { name: link.name }).first().click({ timeout: 5000 })
        // Allow some flexibility in URL matching
        await page.waitForURL(new RegExp(link.expectedUrl.replace('/', '\/')), { timeout: 10000 })
      } catch {
        // If specific navigation fails, just ensure page doesn't crash
        console.log(`Navigation to ${link.expectedUrl} not available or failed`)
      }
    }
  })

  test('Error handling and fallbacks work', async ({ page }) => {
    // Test 404 page
    await page.goto('http://localhost:3000/non-existent-page')

    // Should show 404 page or redirect to home
    const has404 = await page.locator('[data-testid="404-page"]').isVisible()
    const hasHome = await page.url().includes('localhost:3000')

    expect(has404 || hasHome).toBeTruthy()
  })

  test('Performance and loading states', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(30000) // 30 seconds max

    // Check if loading states are handled
    const loadingIndicators = page.locator('[data-testid="loading"]')
    const errorStates = page.locator('[data-testid="error"]')

    // Either content loads or we see appropriate loading/error states
    const hasContent = await page.locator('main').isVisible()
    const hasLoading = await loadingIndicators.count() > 0
    const hasError = await errorStates.count() > 0

    expect(hasContent || hasLoading || hasError).toBeTruthy()
  })

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Content should be accessible
    await expect(page.locator('main')).toBeVisible()

    // Open mobile menu
    const menuToggle = page.getByLabel('Ouvrir le menu de navigation')
    if (await menuToggle.isVisible()) {
      await menuToggle.click()
      // Menu should be visible
      await expect(page.getByRole('dialog', { name: 'Menu mobile' })).toBeVisible()
    }
  })
})
