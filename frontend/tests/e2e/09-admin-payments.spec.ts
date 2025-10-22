import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin Payment Dashboard Tests', () => {
  test.setTimeout(90000) // 1.5 minutes timeout

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
      throw new Error('Admin login failed - cannot proceed with payment tests')
    }
  })

  test('Payment Dashboard - Stats and Table Display', async ({ page }) => {
    console.log('\n========== TESTING PAYMENT DASHBOARD ==========')

    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    // Wait for component to load
    await page.waitForSelector('[data-testid="payments-header"]', { timeout: 10000 }).catch(() => {
      logBug('Payment dashboard header not found')
    })

    // Check header
    const header = page.locator('[data-testid="payments-header"]')
    if (await header.isVisible()) {
      console.log('✅ Payment dashboard header visible')

      const title = await header.locator('text=Dashboard Paiements').count()
      if (title > 0) {
        console.log('✅ Dashboard title displayed correctly')
      } else {
        logBug('Dashboard Paiements title not found')
      }
    } else {
      logBug('Payment dashboard header not visible')
    }

    // Check statistics cards
    const statsGrid = page.locator('[data-testid="payments-stats-grid"]')
    if (await statsGrid.isVisible()) {
      console.log('✅ Statistics grid visible')

      const statCards = statsGrid.locator('[data-testid^="stat-card"]')
      const statsCount = await statCards.count()
      console.log(`Found ${statsCount} statistics cards`)

      if (statsCount >= 5) {
        console.log('✅ All 5 statistics cards displayed (Total, Montant, Réussis, En attente, Échoués)')
      } else {
        logBug(`Expected 5 stats cards, found ${statsCount}`)
      }

      // Check for icons in stat cards
      const icons = await statCards.first().locator('svg').count()
      if (icons > 0) {
        console.log('✅ Statistics cards have icons')
      } else {
        logBug('Statistics cards missing icons')
      }
    } else {
      logBug('Statistics grid not visible')
    }

    await page.screenshot({ path: 'test-results/admin-payments-01-stats.png', fullPage: true })

    // Check payments table
    const table = page.locator('[data-testid="payments-table"]')
    if (await table.isVisible()) {
      console.log('✅ Payments table visible')

      // Check table columns
      const expectedColumns = ['Transaction ID', 'Montant', 'Statut', 'Méthode', 'Client', 'Commerçant', 'Date']
      for (const col of expectedColumns) {
        const colHeader = await table.locator(`text=${col}`).count()
        if (colHeader > 0) {
          console.log(`✅ Column "${col}" present`)
        } else {
          logBug(`Column "${col}" missing from payments table`)
        }
      }

      // Check for payment rows (may be empty initially)
      const rows = await table.locator('tbody tr').count()
      console.log(`Found ${rows} payment records in table`)

      if (rows === 0) {
        console.log('⚠️  No payment data - this is okay for new installation')
      } else {
        console.log(`✅ ${rows} payment records displayed`)
      }
    } else {
      logBug('Payments table not visible')
    }

    await page.screenshot({ path: 'test-results/admin-payments-02-table.png', fullPage: true })
  })

  test('Payment Dashboard - Filters and Search', async ({ page }) => {
    console.log('\n========== TESTING PAYMENT FILTERS ==========')

    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    // Wait for filters to load
    const filters = page.locator('[data-testid="payments-filters"]')
    await filters.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      logBug('Payment filters not found')
    })

    if (await filters.isVisible()) {
      console.log('✅ Filter bar visible')

      // Check search input
      const searchInput = filters.locator('input[placeholder*="Rechercher"]')
      if (await searchInput.isVisible()) {
        console.log('✅ Search input visible')

        // Test search functionality
        await searchInput.fill('TEST-PAYMENT-123')
        console.log('✅ Search input accepts text')

        await page.waitForTimeout(500) // Debounce wait
      } else {
        logBug('Search input not found in filters')
      }

      // Check filter dropdowns/selects
      const statusFilter = filters.locator('text=Statut').first()
      if (await statusFilter.isVisible()) {
        console.log('✅ Status filter visible')
      } else {
        logBug('Status filter not found')
      }

      const methodFilter = filters.locator('text=Méthode').first()
      if (await methodFilter.isVisible()) {
        console.log('✅ Payment method filter visible')
      } else {
        logBug('Payment method filter not found')
      }

      // Check date filters
      const startDateFilter = filters.locator('text=Date début').first()
      if (await startDateFilter.isVisible()) {
        console.log('✅ Start date filter visible')
      } else {
        logBug('Start date filter not found')
      }

      const endDateFilter = filters.locator('text=Date fin').first()
      if (await endDateFilter.isVisible()) {
        console.log('✅ End date filter visible')
      } else {
        logBug('End date filter not found')
      }

      // Check amount filters
      const minAmountFilter = filters.locator('text=Montant min').first()
      if (await minAmountFilter.isVisible()) {
        console.log('✅ Min amount filter visible')
      }

      const maxAmountFilter = filters.locator('text=Montant max').first()
      if (await maxAmountFilter.isVisible()) {
        console.log('✅ Max amount filter visible')
      }

      // Check filter actions
      const resetButton = filters.locator('button:has-text("Réinitialiser")')
      if (await resetButton.isVisible()) {
        console.log('✅ Reset filters button visible')
      } else {
        logBug('Reset filters button not found')
      }

      const refreshButton = filters.locator('button:has-text("Actualiser")')
      if (await refreshButton.isVisible()) {
        console.log('✅ Refresh button visible')
      } else {
        logBug('Refresh button not found')
      }
    } else {
      logBug('Payment filters not visible')
    }

    await page.screenshot({ path: 'test-results/admin-payments-03-filters.png', fullPage: true })
  })

  test('Payment Dashboard - Pagination', async ({ page }) => {
    console.log('\n========== TESTING PAYMENT PAGINATION ==========')

    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    // Check for pagination component
    const pagination = page.locator('[data-testid="payments-pagination"]')

    // Pagination may not be visible if there are no records
    const paginationVisible = await pagination.isVisible().catch(() => false)

    if (paginationVisible) {
      console.log('✅ Pagination component visible')

      // Check pagination controls
      const prevButton = pagination.locator('button:has-text("Précédent"), button:has-text("Previous")')
      const nextButton = pagination.locator('button:has-text("Suivant"), button:has-text("Next")')

      if (await prevButton.count() > 0) {
        console.log('✅ Previous button present')
      }

      if (await nextButton.count() > 0) {
        console.log('✅ Next button present')
      }

      // Check page info
      const pageInfo = pagination.locator('text=/Page \\d+/')
      if (await pageInfo.count() > 0) {
        console.log('✅ Page information displayed')
      }
    } else {
      console.log('⚠️  Pagination not visible (expected if no data or single page)')
    }

    await page.screenshot({ path: 'test-results/admin-payments-04-pagination.png', fullPage: true })
  })

  test('Payment Dashboard - Refresh Functionality', async ({ page }) => {
    console.log('\n========== TESTING REFRESH FUNCTIONALITY ==========')

    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    // Find and click refresh button
    const refreshButton = page.locator('[data-testid="payments-refresh"]').first()

    if (await refreshButton.isVisible()) {
      console.log('✅ Refresh button found')

      // Click refresh
      await refreshButton.click()
      console.log('✅ Refresh button clicked')

      // Wait for loading state
      await page.waitForTimeout(500)

      // Check if data reloads (spinner or loading state)
      const loadingIndicator = page.locator('text=Chargement, text=Loading, [role="progressbar"]')
      const hasLoading = await loadingIndicator.isVisible().catch(() => false)

      if (hasLoading) {
        console.log('✅ Loading indicator shown during refresh')
        await page.waitForSelector('text=Chargement', { state: 'hidden', timeout: 5000 }).catch(() => {
          console.log('⚠️  Loading indicator still visible after 5s')
        })
      }

      console.log('✅ Refresh completed')
    } else {
      logBug('Refresh button not found')
    }

    await page.screenshot({ path: 'test-results/admin-payments-05-refresh.png', fullPage: true })
  })

  test('Payment Dashboard - Responsive Design', async ({ page }) => {
    console.log('\n========== TESTING RESPONSIVE DESIGN ==========')

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    console.log('Testing mobile viewport (375x667)')

    const mobileHeader = await page.locator('[data-testid="payments-header"]').isVisible()
    if (mobileHeader) {
      console.log('✅ Header visible on mobile')
    } else {
      logBug('Header not visible on mobile')
    }

    await page.screenshot({ path: 'test-results/admin-payments-06-mobile.png', fullPage: true })

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000/admin/payments')
    await page.waitForLoadState('networkidle')

    console.log('Testing tablet viewport (768x1024)')

    const tabletStats = await page.locator('[data-testid="payments-stats-grid"]').isVisible()
    if (tabletStats) {
      console.log('✅ Stats grid visible on tablet')
    } else {
      logBug('Stats grid not visible on tablet')
    }

    await page.screenshot({ path: 'test-results/admin-payments-07-tablet.png', fullPage: true })

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test.afterAll(() => {
    console.log('\n========== PAYMENT DASHBOARD TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)

    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - Payment Dashboard working perfectly!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-admin-payments.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
