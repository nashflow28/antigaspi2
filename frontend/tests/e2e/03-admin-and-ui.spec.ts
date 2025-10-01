import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin & UI/UX Comprehensive Tests', () => {
  test.setTimeout(120000) // 2 minutes timeout

  test('Admin flows and UI/UX validation', async ({ page }) => {
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
    }

    await page.screenshot({ path: 'test-results/admin-01-login.png', fullPage: true })

    // ========== 2. ADMIN DASHBOARD ==========
    console.log('\n========== TESTING ADMIN DASHBOARD ==========')
    await page.goto('http://localhost:3000/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for analytics/stats
    const statsCards = page.locator('[data-testid="stat"], .stat-card, .metric-card')
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

    await page.screenshot({ path: 'test-results/admin-02-dashboard.png', fullPage: true })

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

    // Check for action buttons (edit, delete, ban)
    const actionBtns = page.locator('button[aria-label*="edit"], button[aria-label*="delete"], button:has-text("Bannir")')
    const actionsCount = await actionBtns.count()
    console.log(`Found ${actionsCount} user action buttons`)

    await page.screenshot({ path: 'test-results/admin-03-users.png', fullPage: true })

    // ========== 4. PRODUCT MODERATION ==========
    console.log('\n========== TESTING PRODUCT MODERATION ==========')
    await page.goto('http://localhost:3000/admin/products')
    await page.waitForLoadState('networkidle')

    const products = page.locator('table tbody tr, .product-item')
    const productCount = await products.count()
    console.log(`Found ${productCount} products for moderation`)

    // Check for approve/reject buttons
    const moderationBtns = page.locator('button:has-text("Approuver"), button:has-text("Rejeter"), button:has-text("Valider")')
    const moderationCount = await moderationBtns.count()
    console.log(`Found ${moderationCount} moderation buttons`)

    await page.screenshot({ path: 'test-results/admin-04-products.png', fullPage: true })

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
      await page.waitForTimeout(1000)

      if (page.url().includes(url.split('/').pop() || '')) {
        analyticsFound = true
        console.log(`✅ Analytics page found at ${url}`)

        // Check for charts
        const analyticsCharts = await page.locator('canvas, svg').count()
        console.log(`Found ${analyticsCharts} charts on analytics page`)

        await page.screenshot({ path: 'test-results/admin-05-analytics.png', fullPage: true })
        break
      }
    }

    if (!analyticsFound) {
      logBug('Analytics page not found')
    }

    // ========== UI/UX TESTS ==========
    console.log('\n========== TESTING UI/UX ELEMENTS ==========')

    // ========== 6. TEST POPUPS/MODALS STYLING ==========
    console.log('\n========== TESTING POPUPS/MODALS ==========')
    await page.goto('http://localhost:3000/products')
    await page.waitForLoadState('networkidle')

    // Try to open a modal (product details, filters, etc.)
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await page.waitForTimeout(1000)

      // Check for modal
      const modals = page.locator('[role="dialog"], .modal, [data-testid="modal"]')
      const modalCount = await modals.count()

      if (modalCount > 0) {
        const modal = modals.first()

        // Check modal styling
        const modalStyles = await modal.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            background: styles.backgroundColor,
            border: styles.border,
            boxShadow: styles.boxShadow,
            padding: styles.padding,
            borderRadius: styles.borderRadius
          }
        })

        console.log('Modal styles:', modalStyles)

        // Check if unstyled
        if (modalStyles.background === 'rgba(0, 0, 0, 0)' || modalStyles.background === 'transparent') {
          logBug('Modal has no background - appears unstyled!')
        }

        if (modalStyles.boxShadow === 'none') {
          logBug('Modal has no box shadow - may appear flat')
        }

        console.log('✅ Modal styling checked')
        await page.screenshot({ path: 'test-results/ui-01-modal.png', fullPage: true })

        // Close modal
        const closeBtn = page.locator('button[aria-label*="fermer"], button[aria-label*="close"], [data-testid="close-modal"]')
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
          await page.waitForTimeout(500)
        }
      }
    }

    // ========== 7. TEST NOTIFICATIONS STYLING ==========
    console.log('\n========== TESTING NOTIFICATIONS ==========')

    // Navigate to a page that might trigger notifications
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // Check for error notification
    const notifications = page.locator('[role="alert"], .notification, [data-testid="notification"]')
    const notifCount = await notifications.count()

    if (notifCount > 0) {
      const notif = notifications.first()

      const notifStyles = await notif.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          background: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
          padding: styles.padding
        }
      })

      console.log('Notification styles:', notifStyles)

      if (notifStyles.background === 'rgba(0, 0, 0, 0)' || notifStyles.background === 'transparent') {
        logBug('Notification has no background - unstyled!')
      }

      await page.screenshot({ path: 'test-results/ui-02-notification.png', fullPage: true })
    }

    // ========== 8. TEST FORMS STYLING ==========
    console.log('\n========== TESTING FORMS STYLING ==========')
    await page.goto('http://localhost:3000/register')

    const inputs = page.locator('input:not([type="hidden"])')
    const inputCount = await inputs.count()

    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i)

      const inputStyles = await input.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          border: styles.border,
          padding: styles.padding,
          background: styles.backgroundColor
        }
      })

      console.log(`Input ${i + 1} styles:`, inputStyles)

      if (inputStyles.border === 'none' || inputStyles.border === '0px none') {
        logBug(`Input ${i + 1} has no border - may be hard to see`)
      }
    }

    await page.screenshot({ path: 'test-results/ui-03-forms.png', fullPage: true })

    // ========== 9. TEST BUTTONS STYLING ==========
    console.log('\n========== TESTING BUTTONS STYLING ==========')

    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()
    console.log(`Found ${buttonCount} visible buttons`)

    let unstyledButtons = 0
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)

      const buttonStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          background: styles.backgroundColor,
          border: styles.border,
          padding: styles.padding,
          cursor: styles.cursor
        }
      })

      if (buttonStyles.background === 'rgba(0, 0, 0, 0)' || buttonStyles.background === 'transparent') {
        unstyledButtons++
      }
    }

    if (unstyledButtons > 0) {
      logBug(`${unstyledButtons} buttons appear unstyled (no background)`)
    }

    // ========== 10. TEST RESPONSIVE DESIGN ==========
    console.log('\n========== TESTING RESPONSIVE DESIGN ==========')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]')
    if (await mobileMenu.isVisible()) {
      console.log('✅ Mobile menu button visible')
    } else {
      logBug('Mobile menu button not found in mobile viewport')
    }

    await page.screenshot({ path: 'test-results/ui-04-mobile.png', fullPage: true })

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/ui-05-tablet.png', fullPage: true })

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })

    // ========== 11. TEST PRODUCT VISIBILITY ==========
    console.log('\n========== TESTING PRODUCT VISIBILITY ==========')
    await page.goto('http://localhost:3000/products')
    await page.waitForLoadState('networkidle')

    const visibleProducts = page.locator('[data-testid="product-card"]:visible, .product-card:visible, article:visible')
    const visibleCount = await visibleProducts.count()
    console.log(`${visibleCount} products visible on page`)

    if (visibleCount === 0) {
      logBug('No products visible on products page')
    } else {
      // Check first product has image
      const firstProductImg = visibleProducts.first().locator('img')
      if (await firstProductImg.isVisible()) {
        console.log('✅ Product images displayed')
      } else {
        logBug('Product images not visible')
      }

      // Check first product has price
      const firstProductPrice = visibleProducts.first().locator(':text("XOF"), :text("€")')
      if (await firstProductPrice.count() > 0) {
        console.log('✅ Product prices displayed')
      } else {
        logBug('Product prices not visible')
      }
    }

    await page.screenshot({ path: 'test-results/ui-06-products-visibility.png', fullPage: true })

    // ========== 12. TEST ACCESSIBILITY ==========
    console.log('\n========== TESTING ACCESSIBILITY ==========')

    // Check for alt texts on images
    const images = page.locator('img')
    const imagesCount = await images.count()
    let missingAlt = 0

    for (let i = 0; i < Math.min(imagesCount, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      if (!alt || alt.trim() === '') {
        missingAlt++
      }
    }

    if (missingAlt > 0) {
      logBug(`${missingAlt} images missing alt text (accessibility issue)`)
    } else {
      console.log('✅ All checked images have alt text')
    }

    // Check for button labels
    const allButtons = page.locator('button')
    const allButtonsCount = await allButtons.count()
    let unlabeledButtons = 0

    for (let i = 0; i < Math.min(allButtonsCount, 10); i++) {
      const button = allButtons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')

      if ((!text || text.trim() === '') && (!ariaLabel || ariaLabel.trim() === '')) {
        unlabeledButtons++
      }
    }

    if (unlabeledButtons > 0) {
      logBug(`${unlabeledButtons} buttons have no text or aria-label (accessibility issue)`)
    }

    // ========== FINAL REPORT ==========
    console.log('\n========== ADMIN & UI/UX TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - all admin and UI/UX working!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-admin-ui.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
