import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Buttons Styling Quick Test', () => {
  test.setTimeout(30000) // 30 seconds

  test('Check buttons have proper styling', async ({ page }) => {
    console.log('\n========== TESTING BUTTONS STYLING ==========')

    // Test on register page (has multiple buttons)
    await page.goto('http://localhost:3000/register')
    await page.waitForLoadState('networkidle')

    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()
    console.log(`Found ${buttonCount} visible buttons`)

    let unstyledButtons = 0
    const buttonDetails: Array<{ index: number; text: string; styles: any }> = []

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()

      const buttonStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          background: styles.backgroundColor,
          border: styles.border,
          padding: styles.padding,
          cursor: styles.cursor,
          classes: el.className
        }
      })

      buttonDetails.push({
        index: i,
        text: text?.trim() || 'No text',
        styles: buttonStyles
      })

      console.log(`Button ${i + 1} "${text?.trim()}":`, buttonStyles)

      if (buttonStyles.background === 'rgba(0, 0, 0, 0)' || buttonStyles.background === 'transparent') {
        unstyledButtons++
      }
    }

    if (unstyledButtons > 0) {
      logBug(`${unstyledButtons}/${buttonCount} buttons appear unstyled (transparent background)`)
      console.log('\n📋 Detailed button analysis:')
      buttonDetails.forEach((btn, idx) => {
        const isUnstyled = btn.styles.background === 'rgba(0, 0, 0, 0)' || btn.styles.background === 'transparent'
        console.log(`  ${isUnstyled ? '❌' : '✅'} Button ${idx + 1}: "${btn.text}"`)
        console.log(`     Background: ${btn.styles.background}`)
        console.log(`     Classes: ${btn.styles.classes}`)
      })
    } else {
      console.log('✅ All checked buttons have background styling')
    }

    await page.screenshot({ path: 'test-results/buttons-test.png', fullPage: true })

    // Test on admin dashboard too
    console.log('\n========== TESTING ADMIN BUTTONS ==========')

    // Login as admin first
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'admin@antigaspi.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin
    await page.waitForURL(/\/admin/, { timeout: 10000 }).catch(() => {
      console.log('⚠️ Admin login may have failed')
    })

    if (page.url().includes('/admin')) {
      console.log('✅ Admin logged in')

      const adminButtons = page.locator('button:visible')
      const adminButtonCount = await adminButtons.count()
      console.log(`Found ${adminButtonCount} visible admin buttons`)

      let adminUnstyledButtons = 0
      for (let i = 0; i < Math.min(adminButtonCount, 5); i++) {
        const button = adminButtons.nth(i)
        const text = await button.textContent()

        const buttonStyles = await button.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            background: styles.backgroundColor,
            classes: el.className
          }
        })

        console.log(`Admin Button ${i + 1} "${text?.trim()}": ${buttonStyles.background}`)

        if (buttonStyles.background === 'rgba(0, 0, 0, 0)' || buttonStyles.background === 'transparent') {
          adminUnstyledButtons++
        }
      }

      if (adminUnstyledButtons > 0) {
        logBug(`${adminUnstyledButtons}/${adminButtonCount} admin buttons appear unstyled`)
      }

      await page.screenshot({ path: 'test-results/admin-buttons-test.png', fullPage: true })
    }

    // ========== FINAL REPORT ==========
    console.log('\n========== BUTTONS TEST SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No button styling bugs found!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-buttons.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
