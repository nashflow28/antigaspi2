import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin UI/UX Styling Tests', () => {
  test.setTimeout(45000) // 45 seconds timeout

  test('Test modals, notifications, forms, buttons styling', async ({ page }) => {
    // ========== 1. TEST POPUPS/MODALS STYLING ==========
    console.log('\n========== TESTING POPUPS/MODALS ==========')
    await page.goto('http://localhost:3000/products')
    await page.waitForLoadState('networkidle')

    // Try to open a modal (product details)
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()

      // Wait for modal to appear (event-based, not timeout)
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first()

      try {
        await modal.waitFor({ state: 'visible', timeout: 3000 })

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
        } else {
          console.log('✅ Modal has background styling')
        }

        if (modalStyles.boxShadow === 'none') {
          logBug('Modal has no box shadow - may appear flat')
        }

        await page.screenshot({ path: 'test-results/ui-styling-01-modal.png', fullPage: true })

        // Close modal
        const closeBtn = page.locator('button[aria-label*="fermer"], button[aria-label*="close"], [data-testid="close-modal"]').first()
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
          await modal.waitFor({ state: 'hidden', timeout: 2000 })
        }
      } catch {
        console.log('⚠️ No modal appeared or timeout')
      }
    }

    // ========== 2. TEST NOTIFICATIONS STYLING ==========
    console.log('\n========== TESTING NOTIFICATIONS ==========')

    // Navigate to login to trigger error notification
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for notification to appear (event-based)
    try {
      const notification = page.locator('[role="alert"], [role="status"], .notification, [data-testid="notification"]').first()
      await notification.waitFor({ state: 'visible', timeout: 5000 })

      const notifStyles = await notification.evaluate((el) => {
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
      } else {
        console.log('✅ Notification has background styling')
      }

      await page.screenshot({ path: 'test-results/ui-styling-02-notification.png', fullPage: true })
    } catch {
      console.log('⚠️ No notification appeared')
    }

    // ========== 3. TEST FORMS STYLING ==========
    console.log('\n========== TESTING FORMS STYLING ==========')
    await page.goto('http://localhost:3000/register')
    await page.waitForLoadState('networkidle')

    const inputs = page.locator('input:not([type="hidden"])')
    const inputCount = await inputs.count()
    console.log(`Found ${inputCount} visible inputs`)

    let unstyledInputs = 0
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
        unstyledInputs++
      }
    }

    if (unstyledInputs > 0) {
      logBug(`${unstyledInputs} inputs have no border - may be hard to see`)
    } else {
      console.log('✅ All inputs have proper borders')
    }

    await page.screenshot({ path: 'test-results/ui-styling-03-forms.png', fullPage: true })

    // ========== 4. TEST BUTTONS STYLING ==========
    console.log('\n========== TESTING BUTTONS STYLING ==========')

    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()
    console.log(`Found ${buttonCount} visible buttons`)

    let unstyledButtons = 0
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()

      const buttonStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          background: styles.backgroundColor,
          border: styles.border,
          padding: styles.padding,
          cursor: styles.cursor
        }
      })

      console.log(`Button ${i + 1} "${text?.trim()}": ${buttonStyles.background}`)

      if (buttonStyles.background === 'rgba(0, 0, 0, 0)' || buttonStyles.background === 'transparent') {
        unstyledButtons++
      }
    }

    if (unstyledButtons > 0) {
      console.log(`ℹ️ ${unstyledButtons} buttons have transparent background (may be ghost variant - intentional)`)
    } else {
      console.log('✅ All checked buttons have background')
    }

    await page.screenshot({ path: 'test-results/ui-styling-04-buttons.png', fullPage: true })

    // ========== FINAL REPORT ==========
    console.log('\n========== UI STYLING TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No UI styling bugs found!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-ui-styling.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
