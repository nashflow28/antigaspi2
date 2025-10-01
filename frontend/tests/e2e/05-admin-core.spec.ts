import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin Core Flows', () => {
  test.setTimeout(60000) // 1 minute timeout (reduced from 2min)

  test('Admin login, dashboard, users, products, analytics', async ({ page }) => {
    // ========== 1. ADMIN LOGIN ==========
    console.log('\n========== ADMIN LOGIN ==========')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'admin@antigaspi.com')
    await page.fill('input[type="password"]', 'password')

    // Wait for navigation to admin area
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
      logBug('Admin login redirect failed')
    }

    await page.screenshot({ path: 'test-results/admin-core-01-login.png', fullPage: true })

    // ========== 2. ADMIN DASHBOARD ==========
    console.log('\n========== TESTING ADMIN DASHBOARD ==========')
    await page.goto('http://localhost:3000/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for analytics/stats
    const statsCards = page.locator('[data-testid="stat-card"], [data-testid="stat"], .stat-card, .metric-card')
    const statsCount = await statsCards.count()
    console.log(`Found ${statsCount} statistics cards`)

    if (statsCount === 0) {
      logBug('No statistics displayed on admin dashboard')
    } else {
      console.log(`✅ ${statsCount} statistics displayed`)
    }

    // Check for charts
    const charts = page.locator('canvas, svg[class*="chart"], [data-testid="chart"]')
    const chartsCount = await charts.count()
    console.log(`Found ${chartsCount} charts/graphs`)

    await page.screenshot({ path: 'test-results/admin-core-02-dashboard.png', fullPage: true })

    // ========== 3. USER MANAGEMENT ==========
    console.log('\n========== TESTING USER MANAGEMENT ==========')
    await page.goto('http://localhost:3000/admin/users')
    await page.waitForLoadState('networkidle')

    const usersTable = page.locator('table, [data-testid="users-list"]')
    if (await usersTable.isVisible()) {
      console.log('✅ Users table visible')

      const userRows = page.locator('table tbody tr')
      const userCount = await userRows.count()
      console.log(`Found ${userCount} users`)

      if (userCount === 0) {
        logBug('No users displayed in admin users table')
      }
    } else {
      logBug('Users table not found')
    }

    await page.screenshot({ path: 'test-results/admin-core-03-users.png', fullPage: true })

    // ========== 4. PRODUCT MODERATION ==========
    console.log('\n========== TESTING PRODUCT MODERATION ==========')
    await page.goto('http://localhost:3000/admin/products')
    await page.waitForLoadState('networkidle')

    const products = page.locator('table tbody tr, .product-item, [data-testid="product"]')
    const productCount = await products.count()
    console.log(`Found ${productCount} products for moderation`)

    if (productCount === 0) {
      logBug('No products visible on admin products page')
    } else {
      console.log(`✅ ${productCount} products displayed`)
    }

    await page.screenshot({ path: 'test-results/admin-core-04-products.png', fullPage: true })

    // ========== 5. ANALYTICS PAGE ==========
    console.log('\n========== TESTING ANALYTICS ==========')
    const analyticsUrls = [
      '/admin/analytics',
      '/admin/stats',
      '/admin/reports'
    ]

    let analyticsFound = false
    for (const url of analyticsUrls) {
      await page.goto(`http://localhost:3000${url}`)
      await page.waitForLoadState('networkidle')

      if (page.url().includes(url.split('/').pop() || '')) {
        analyticsFound = true
        console.log(`✅ Analytics page found at ${url}`)

        // Check for charts
        const analyticsCharts = await page.locator('canvas, svg').count()
        console.log(`Found ${analyticsCharts} charts on analytics page`)

        await page.screenshot({ path: 'test-results/admin-core-05-analytics.png', fullPage: true })
        break
      }
    }

    if (!analyticsFound) {
      logBug('Analytics page not found')
    }

    // ========== FINAL REPORT ==========
    console.log('\n========== ADMIN CORE TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - admin core flows working!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-admin-core.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
