import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin Extended Views Tests', () => {
  test.setTimeout(120000) // 2 minutes timeout

  test.beforeEach(async ({ page }) => {
    // Login as admin
    console.log('\n========== ADMIN LOGIN ==========')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'admin@antigaspi.com')
    await page.fill('input[type="password"]', 'password')

    await Promise.all([
      page.waitForURL(/\/admin/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]).catch(() => {
      logBug(`Admin login failed - URL: ${page.url()}`)
    })

    const currentUrl = page.url()
    if (currentUrl.includes('/admin')) {
      console.log('✅ Admin logged in successfully')
    } else {
      throw new Error('Admin login failed - cannot proceed')
    }
  })

  test('Categories Management View', async ({ page }) => {
    console.log('\n========== TESTING CATEGORIES MANAGEMENT ==========')

    await page.goto('http://localhost:3000/admin/categories')
    await page.waitForLoadState('networkidle')

    // Check page title/header
    const pageTitle = page.locator('h1, h2, [data-testid="categories-header"]')
    const hasTitleText = await pageTitle.locator('text=/Catégories|Categories/i').count() > 0

    if (hasTitleText) {
      console.log('✅ Categories page title visible')
    } else {
      logBug('Categories page title not found')
    }

    // Check for categories list/table
    const categoriesTable = page.locator('table, [data-testid="categories-list"], [data-testid="categories-table"]')
    const tableVisible = await categoriesTable.isVisible().catch(() => false)

    if (tableVisible) {
      console.log('✅ Categories table/list visible')

      // Count categories
      const categoryRows = await page.locator('table tbody tr, .category-item, [data-testid^="category-"]').count()
      console.log(`Found ${categoryRows} categories`)

      if (categoryRows > 0) {
        console.log(`✅ ${categoryRows} categories displayed`)
      } else {
        console.log('⚠️  No categories found (may be empty database)')
      }
    } else {
      console.log('⚠️  Categories table not visible (checking for empty state...)')

      // Check for empty state
      const emptyState = page.locator('text=/Aucune catégorie|No categories/i')
      if (await emptyState.isVisible()) {
        console.log('✅ Empty state displayed correctly')
      }
    }

    // Check for "Add Category" or "Create" button
    const addButton = page.locator('button:has-text("Ajouter"), button:has-text("Créer"), button:has-text("Nouvelle catégorie"), [data-testid="add-category"]')
    const hasAddButton = await addButton.count() > 0

    if (hasAddButton) {
      console.log('✅ Add category button present')
    } else {
      logBug('Add category button not found')
    }

    // Check for search/filter functionality
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      console.log('✅ Search input visible')
    }

    await page.screenshot({ path: 'test-results/admin-extended-01-categories.png', fullPage: true })
  })

  test('Merchants Management View', async ({ page }) => {
    console.log('\n========== TESTING MERCHANTS MANAGEMENT ==========')

    await page.goto('http://localhost:3000/admin/merchants')
    await page.waitForLoadState('networkidle')

    // Check page title/header
    const pageTitle = page.locator('h1, h2, [data-testid="merchants-header"]')
    const hasTitleText = await pageTitle.locator('text=/Commerçants|Merchants/i').count() > 0

    if (hasTitleText) {
      console.log('✅ Merchants page title visible')
    } else {
      logBug('Merchants page title not found')
    }

    // Check for merchants list/table
    const merchantsTable = page.locator('table, [data-testid="merchants-list"], [data-testid="merchants-table"]')
    const tableVisible = await merchantsTable.isVisible().catch(() => false)

    if (tableVisible) {
      console.log('✅ Merchants table/list visible')

      // Count merchants
      const merchantRows = await page.locator('table tbody tr, .merchant-item, [data-testid^="merchant-"]').count()
      console.log(`Found ${merchantRows} merchants`)

      if (merchantRows > 0) {
        console.log(`✅ ${merchantRows} merchants displayed`)

        // Check for merchant details (business name, status, etc.)
        const firstRow = page.locator('table tbody tr, .merchant-item').first()

        // Check for business name
        const hasBusinessName = await firstRow.locator('text=/[A-Za-z]+/').count() > 0
        if (hasBusinessName) {
          console.log('✅ Merchant business names displayed')
        }

        // Check for status badges
        const statusBadge = firstRow.locator('[class*="badge"], [class*="status"]')
        if (await statusBadge.count() > 0) {
          console.log('✅ Status badges present')
        }
      } else {
        console.log('⚠️  No merchants found (may be empty database)')
      }
    } else {
      console.log('⚠️  Merchants table not visible')
    }

    // Check for filter/search functionality
    const filters = page.locator('input[placeholder*="Rechercher"], select, [data-testid="filters"]')
    const filterCount = await filters.count()
    console.log(`Found ${filterCount} filter controls`)

    // Check for action buttons (approve/reject)
    const actionButtons = page.locator('button:has-text("Approuver"), button:has-text("Approve"), button:has-text("Rejeter"), button:has-text("Reject")')
    const hasActionButtons = await actionButtons.count() > 0

    if (hasActionButtons) {
      console.log('✅ Merchant action buttons present (approve/reject)')
    } else {
      console.log('⚠️  Merchant action buttons not visible (may require pending merchants)')
    }

    await page.screenshot({ path: 'test-results/admin-extended-02-merchants.png', fullPage: true })
  })

  test('Review Moderation View', async ({ page }) => {
    console.log('\n========== TESTING REVIEW MODERATION ==========')

    await page.goto('http://localhost:3000/admin/reviews')
    await page.waitForLoadState('networkidle')

    // Check page title/header
    const pageTitle = page.locator('h1, h2, [data-testid="reviews-header"]')
    const hasTitleText = await pageTitle.locator('text=/Avis|Reviews|Modération/i').count() > 0

    if (hasTitleText) {
      console.log('✅ Reviews page title visible')
    } else {
      logBug('Reviews page title not found')
    }

    // Check for reviews list/table
    const reviewsTable = page.locator('table, [data-testid="reviews-list"], [data-testid="reviews-table"]')
    const tableVisible = await reviewsTable.isVisible().catch(() => false)

    if (tableVisible) {
      console.log('✅ Reviews table/list visible')

      // Count reviews
      const reviewRows = await page.locator('table tbody tr, .review-item, [data-testid^="review-"]').count()
      console.log(`Found ${reviewRows} reviews`)

      if (reviewRows > 0) {
        console.log(`✅ ${reviewRows} reviews displayed`)

        // Check for review details
        const firstReview = page.locator('table tbody tr, .review-item').first()

        // Check for rating display
        const ratingDisplay = firstReview.locator('[class*="star"], [class*="rating"], text=/★|⭐/')
        if (await ratingDisplay.count() > 0) {
          console.log('✅ Review ratings displayed')
        }

        // Check for review text/comment
        const reviewText = await firstReview.locator('p, .comment, .review-text').count()
        if (reviewText > 0) {
          console.log('✅ Review comments visible')
        }
      } else {
        console.log('⚠️  No reviews found (may be empty database)')
      }
    } else {
      console.log('⚠️  Reviews table not visible')
    }

    // Check for moderation actions
    const moderationButtons = page.locator('button:has-text("Approuver"), button:has-text("Approve"), button:has-text("Rejeter"), button:has-text("Reject"), button:has-text("Supprimer"), button:has-text("Delete")')
    const hasModerationButtons = await moderationButtons.count() > 0

    if (hasModerationButtons) {
      console.log('✅ Moderation action buttons present')
    } else {
      console.log('⚠️  Moderation buttons not visible (may require pending reviews)')
    }

    // Check for filter tabs (pending, approved, rejected)
    const tabs = page.locator('[role="tab"], .tab, button:has-text("En attente"), button:has-text("Pending")')
    const tabCount = await tabs.count()

    if (tabCount > 0) {
      console.log(`✅ Found ${tabCount} filter tabs`)
    } else {
      console.log('⚠️  Filter tabs not found')
    }

    await page.screenshot({ path: 'test-results/admin-extended-03-reviews.png', fullPage: true })
  })

  test('Products Management View', async ({ page }) => {
    console.log('\n========== TESTING PRODUCTS MANAGEMENT ==========')

    await page.goto('http://localhost:3000/admin/products')
    await page.waitForLoadState('networkidle')

    // Check page title/header
    const pageTitle = page.locator('h1, h2, [data-testid="products-header"]')
    const hasTitleText = await pageTitle.locator('text=/Produits|Products/i').count() > 0

    if (hasTitleText) {
      console.log('✅ Products page title visible')
    } else {
      logBug('Products page title not found')
    }

    // Check for products list/table
    const productsTable = page.locator('table, [data-testid="products-list"], [data-testid="products-table"]')
    const tableVisible = await productsTable.isVisible().catch(() => false)

    if (tableVisible) {
      console.log('✅ Products table/list visible')

      // Count products
      const productRows = await page.locator('table tbody tr, .product-item, [data-testid^="product-"]').count()
      console.log(`Found ${productRows} products`)

      if (productRows > 0) {
        console.log(`✅ ${productRows} products displayed`)

        // Check for product details
        const firstProduct = page.locator('table tbody tr, .product-item').first()

        // Check for product name
        const hasProductName = await firstProduct.locator('text=/[A-Za-z]+/').count() > 0
        if (hasProductName) {
          console.log('✅ Product names displayed')
        }

        // Check for prices
        const priceDisplay = firstProduct.locator('text=/\\d+.*XOF|€|\\$/i')
        if (await priceDisplay.count() > 0) {
          console.log('✅ Product prices displayed')
        }

        // Check for images
        const productImage = firstProduct.locator('img')
        if (await productImage.count() > 0) {
          console.log('✅ Product images present')
        }
      } else {
        console.log('⚠️  No products found (may be empty database)')
      }
    } else {
      console.log('⚠️  Products table not visible')
    }

    // Check for filters
    const filters = page.locator('select, input[type="search"], [data-testid="filters"]')
    const filterCount = await filters.count()
    console.log(`Found ${filterCount} filter controls`)

    // Check for product moderation actions
    const actionButtons = page.locator('button:has-text("Approuver"), button:has-text("Rejeter"), button:has-text("Supprimer")')
    const hasActions = await actionButtons.count() > 0

    if (hasActions) {
      console.log('✅ Product moderation actions present')
    } else {
      console.log('⚠️  Product moderation actions not visible')
    }

    await page.screenshot({ path: 'test-results/admin-extended-04-products.png', fullPage: true })
  })

  test('Users Management View', async ({ page }) => {
    console.log('\n========== TESTING USERS MANAGEMENT ==========')

    await page.goto('http://localhost:3000/admin/users')
    await page.waitForLoadState('networkidle')

    // Check page title/header
    const pageTitle = page.locator('h1, h2, [data-testid="users-header"]')
    const hasTitleText = await pageTitle.locator('text=/Utilisateurs|Users/i').count() > 0

    if (hasTitleText) {
      console.log('✅ Users page title visible')
    } else {
      logBug('Users page title not found')
    }

    // Check for users table
    const usersTable = page.locator('table, [data-testid="users-list"], [data-testid="users-table"]')
    const tableVisible = await usersTable.isVisible().catch(() => false)

    if (tableVisible) {
      console.log('✅ Users table visible')

      // Count users
      const userRows = await page.locator('table tbody tr, .user-item').count()
      console.log(`Found ${userRows} users`)

      if (userRows > 0) {
        console.log(`✅ ${userRows} users displayed`)

        // Check table columns
        const expectedColumns = ['Email', 'Nom', 'Name', 'Rôle', 'Role', 'Statut', 'Status']
        let columnsFound = 0

        for (const col of expectedColumns) {
          const colHeader = await page.locator(`th:has-text("${col}"), [data-testid*="${col.toLowerCase()}"]`).count()
          if (colHeader > 0) {
            columnsFound++
          }
        }

        console.log(`✅ Found ${columnsFound} expected columns`)

        // Check for role badges
        const roleBadges = page.locator('[class*="badge"], [class*="role"]')
        const badgeCount = await roleBadges.count()
        if (badgeCount > 0) {
          console.log(`✅ Role badges displayed (${badgeCount})`)
        }
      } else {
        logBug('No users found in table')
      }
    } else {
      logBug('Users table not visible')
    }

    // Check for user actions
    const actionButtons = page.locator('button:has-text("Suspendre"), button:has-text("Suspend"), button:has-text("Activer"), button:has-text("Activate")')
    const hasActions = await actionButtons.count() > 0

    if (hasActions) {
      console.log('✅ User action buttons present')
    } else {
      console.log('⚠️  User action buttons not visible')
    }

    // Check for search/filter
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]')
    if (await searchInput.isVisible()) {
      console.log('✅ Search functionality present')
    }

    await page.screenshot({ path: 'test-results/admin-extended-05-users.png', fullPage: true })
  })

  test('Navigation Between Admin Views', async ({ page }) => {
    console.log('\n========== TESTING NAVIGATION ==========')

    await page.goto('http://localhost:3000/admin/dashboard')
    await page.waitForLoadState('networkidle')

    const adminViews = [
      { path: '/admin/dashboard', name: 'Dashboard' },
      { path: '/admin/users', name: 'Users' },
      { path: '/admin/merchants', name: 'Merchants' },
      { path: '/admin/categories', name: 'Categories' },
      { path: '/admin/products', name: 'Products' },
      { path: '/admin/reviews', name: 'Reviews' },
      { path: '/admin/payments', name: 'Payments' },
      { path: '/admin/settings', name: 'Settings' }
    ]

    let navigationSuccess = 0

    for (const view of adminViews) {
      await page.goto(`http://localhost:3000${view.path}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      if (page.url().includes(view.path)) {
        console.log(`✅ Successfully navigated to ${view.name}`)
        navigationSuccess++
      } else {
        logBug(`Failed to navigate to ${view.name} - URL: ${page.url()}`)
      }
    }

    console.log(`\n✅ Navigation test: ${navigationSuccess}/${adminViews.length} views accessible`)

    if (navigationSuccess < adminViews.length) {
      logBug(`Only ${navigationSuccess}/${adminViews.length} admin views accessible`)
    }

    await page.screenshot({ path: 'test-results/admin-extended-06-navigation.png', fullPage: true })
  })

  test.afterAll(() => {
    console.log('\n========== ADMIN EXTENDED TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)

    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No critical bugs found - Admin extended views working!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-admin-extended.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
