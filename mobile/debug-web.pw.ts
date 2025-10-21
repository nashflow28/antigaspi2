import { test, expect } from '@playwright/test'

test.describe('Debug Mobile Web App', () => {
  test('Capture all console errors and take screenshots', async ({ page }) => {
    const consoleMessages: string[] = []
    const errors: string[] = []
    const warnings: string[] = []
    const pageErrors: string[] = []

    // Capture console logs
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        errors.push(`[CONSOLE ERROR] ${text}`)
        console.log('❌ Console Error:', text)
      } else if (type === 'warning') {
        warnings.push(`[CONSOLE WARNING] ${text}`)
        console.log('⚠️ Console Warning:', text)
      } else {
        consoleMessages.push(`[${type.toUpperCase()}] ${text}`)
      }
    })

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      const errorDetails = `${error.name}: ${error.message}\n${error.stack}`
      pageErrors.push(errorDetails)
      console.log('🚨 Page Error:', errorDetails)
    })

    // Navigate to the mobile app
    console.log('🔍 Navigating to http://localhost:8081...')

    try {
      await page.goto('http://localhost:8081', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      console.log('✅ Page loaded')

      // Wait a bit for React to render
      await page.waitForTimeout(3000)

      // Take screenshot
      await page.screenshot({
        path: 'test-results/debug-screenshot.png',
        fullPage: true
      })
      console.log('📸 Screenshot saved')

      // Check if ErrorBoundary is visible
      const errorBoundary = await page.locator('text=⚠️ Une erreur est survenue').isVisible().catch(() => false)

      if (errorBoundary) {
        console.log('🔴 ErrorBoundary is visible - app crashed')

        // Extract all text from page
        const pageText = await page.locator('body').textContent()
        console.log('\n📋 Full Error Page Content:')
        console.log(pageText)
      } else {
        console.log('✅ No ErrorBoundary visible')

        // Check for common app elements
        const hasContent = await page.locator('body').textContent()
        console.log('📄 Page content length:', hasContent?.length || 0)
      }

    } catch (error) {
      console.log('❌ Failed to load page:', error)
      await page.screenshot({ path: 'test-results/debug-error.png' })
    }

    // Print summary
    console.log('\n📊 === DEBUG SUMMARY ===')
    console.log(`Console Errors: ${errors.length}`)
    console.log(`Page Errors: ${pageErrors.length}`)
    console.log(`Warnings: ${warnings.length}`)

    if (errors.length > 0) {
      console.log('\n❌ === CONSOLE ERRORS ===')
      errors.forEach((err, i) => console.log(`${i + 1}. ${err}`))
    }

    if (pageErrors.length > 0) {
      console.log('\n🚨 === PAGE ERRORS ===')
      pageErrors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err}`)
      })
    }

    // Fail if critical errors
    if (pageErrors.length > 0) {
      throw new Error(`Found ${pageErrors.length} uncaught exception(s)`)
    }
  })
})
