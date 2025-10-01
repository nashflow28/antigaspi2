import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Responsive Design & Accessibility Tests', () => {
  test.setTimeout(45000) // 45 seconds timeout

  test('Test responsive design, product visibility, and accessibility', async ({ page }) => {
    // ========== 1. TEST RESPONSIVE DESIGN ==========
    console.log('\n========== TESTING RESPONSIVE DESIGN ==========')

    // Test mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    const mobileMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"]')

    try {
      await mobileMenu.waitFor({ state: 'visible', timeout: 3000 })
      console.log('✅ Mobile menu button visible')
    } catch {
      logBug('Mobile menu button not found in mobile viewport')
    }

    await page.screenshot({ path: 'test-results/responsive-01-mobile.png', fullPage: true })

    // Test tablet viewport (iPad size)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/responsive-02-tablet.png', fullPage: true })
    console.log('✅ Tablet viewport tested')

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })

    // ========== 2. TEST PRODUCT VISIBILITY ==========
    console.log('\n========== TESTING PRODUCT VISIBILITY ==========')
    await page.goto('http://localhost:3000/products')
    await page.waitForLoadState('networkidle')

    const visibleProducts = page.locator('[data-testid="product-card-2025"]:visible, [role="article"]:visible, article:visible')
    const visibleCount = await visibleProducts.count()
    console.log(`${visibleCount} products visible on page`)

    if (visibleCount === 0) {
      logBug('No products visible on products page')
    } else {
      console.log(`✅ ${visibleCount} products displayed`)

      // Check first product has image
      const firstProductImg = visibleProducts.first().locator('img')
      try {
        await firstProductImg.waitFor({ state: 'visible', timeout: 2000 })
        console.log('✅ Product images displayed')
      } catch {
        logBug('Product images not visible')
      }

      // Check first product has price
      const firstProductPrice = visibleProducts.first().locator(':text("CFA"), :text("XOF"), :text("€"), :text("F ")')
      if (await firstProductPrice.count() > 0) {
        console.log('✅ Product prices displayed')
      } else {
        logBug('Product prices not visible')
      }
    }

    await page.screenshot({ path: 'test-results/responsive-03-products-visibility.png', fullPage: true })

    // ========== 3. TEST ACCESSIBILITY ==========
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
      logBug(`${missingAlt}/${Math.min(imagesCount, 10)} images missing alt text (accessibility issue)`)
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
      logBug(`${unlabeledButtons}/${Math.min(allButtonsCount, 10)} buttons have no text or aria-label (accessibility issue)`)
    } else {
      console.log('✅ All checked buttons have proper labels')
    }

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count()
    console.log(`Found ${h1Count} h1 heading(s)`)

    if (h1Count === 0) {
      logBug('No h1 heading found on page (accessibility issue)')
    } else if (h1Count > 1) {
      logBug(`Multiple h1 headings (${h1Count}) found - should only have one`)
    } else {
      console.log('✅ Single h1 heading found')
    }

    // Check for skip links
    const skipLinks = page.locator('a[href*="#"]:has-text("Aller au contenu"), a.skip-link')
    const skipLinkCount = await skipLinks.count()

    if (skipLinkCount > 0) {
      console.log(`✅ Skip links found (${skipLinkCount})`)
    } else {
      console.log('ℹ️ No skip links found (recommended for accessibility)')
    }

    await page.screenshot({ path: 'test-results/responsive-04-accessibility.png', fullPage: true })

    // ========== FINAL REPORT ==========
    console.log('\n========== RESPONSIVE & A11Y TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No responsive or accessibility bugs found!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-responsive-a11y.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
