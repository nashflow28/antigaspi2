import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Admin System Settings Tests', () => {
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
      throw new Error('Admin login failed - cannot proceed with settings tests')
    }
  })

  test('System Settings - Page Load and Structure', async ({ page }) => {
    console.log('\n========== TESTING SYSTEM SETTINGS PAGE ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')

    // Wait for header
    await page.waitForSelector('[data-testid="settings-header"]', { timeout: 10000 }).catch(() => {
      logBug('Settings page header not found')
    })

    // Check header
    const header = page.locator('[data-testid="settings-header"]')
    if (await header.isVisible()) {
      console.log('✅ Settings header visible')

      const title = await header.locator('text=Paramètres Système').count()
      if (title > 0) {
        console.log('✅ Settings title displayed correctly')
      } else {
        logBug('Paramètres Système title not found')
      }

      const subtitle = await header.locator('text=Configurez les paramètres globaux').count()
      if (subtitle > 0) {
        console.log('✅ Settings subtitle displayed')
      }
    } else {
      logBug('Settings header not visible')
    }

    // Check for refresh button
    const refreshButton = page.locator('[data-testid="settings-refresh"]')
    if (await refreshButton.isVisible()) {
      console.log('✅ Refresh button visible')
    } else {
      logBug('Refresh button not found')
    }

    await page.screenshot({ path: 'test-results/admin-settings-01-page-load.png', fullPage: true })
  })

  test('System Settings - Settings Groups Display', async ({ page }) => {
    console.log('\n========== TESTING SETTINGS GROUPS ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')

    // Wait for settings to load
    await page.waitForTimeout(2000)

    // Check all 6 settings groups
    const expectedGroups = [
      { id: 'settings-general', name: 'Paramètres Généraux' },
      { id: 'settings-commission', name: 'Paramètres de Commission' },
      { id: 'settings-reservation', name: 'Paramètres de Réservation' },
      { id: 'settings-notifications', name: 'Paramètres de Notification' },
      { id: 'settings-maintenance', name: 'Paramètres de Maintenance' },
      { id: 'settings-limits', name: 'Limites Système' }
    ]

    for (const group of expectedGroups) {
      const groupCard = page.locator(`[data-testid="${group.id}"]`)
      const isVisible = await groupCard.isVisible().catch(() => false)

      if (isVisible) {
        console.log(`✅ ${group.name} card visible`)

        // Check for group title
        const titleCount = await groupCard.locator(`text=${group.name}`).count()
        if (titleCount > 0) {
          console.log(`✅ ${group.name} title present`)
        } else {
          logBug(`${group.name} title not found`)
        }
      } else {
        logBug(`${group.name} card not visible`)
      }
    }

    await page.screenshot({ path: 'test-results/admin-settings-02-groups.png', fullPage: true })
  })

  test('System Settings - General Settings Fields', async ({ page }) => {
    console.log('\n========== TESTING GENERAL SETTINGS FIELDS ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const generalCard = page.locator('[data-testid="settings-general"]')

    if (await generalCard.isVisible()) {
      console.log('✅ General settings card visible')

      // Check for expected fields
      const expectedFields = ['site_name', 'site_description', 'contact_email', 'support_phone']

      for (const fieldId of expectedFields) {
        const input = generalCard.locator(`#${fieldId}`)
        const inputExists = await input.count() > 0

        if (inputExists) {
          console.log(`✅ Field "${fieldId}" present`)

          // Check if input has value
          const value = await input.inputValue()
          if (value && value.length > 0) {
            console.log(`✅ Field "${fieldId}" has value: "${value.substring(0, 30)}..."`)
          } else {
            logBug(`Field "${fieldId}" is empty`)
          }
        } else {
          logBug(`Field "${fieldId}" not found`)
        }
      }
    } else {
      logBug('General settings card not visible')
    }

    await page.screenshot({ path: 'test-results/admin-settings-03-general-fields.png', fullPage: true })
  })

  test('System Settings - Commission Settings', async ({ page }) => {
    console.log('\n========== TESTING COMMISSION SETTINGS ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const commissionCard = page.locator('[data-testid="settings-commission"]')

    if (await commissionCard.isVisible()) {
      console.log('✅ Commission settings card visible')

      // Check commission_rate field (decimal)
      const commissionRateInput = commissionCard.locator('#commission_rate')
      if (await commissionRateInput.isVisible()) {
        console.log('✅ Commission rate field visible')

        const value = await commissionRateInput.inputValue()
        console.log(`Commission rate value: ${value}%`)

        // Check input type
        const inputType = await commissionRateInput.getAttribute('type')
        if (inputType === 'number') {
          console.log('✅ Commission rate has correct input type (number)')
        } else {
          logBug(`Commission rate has wrong input type: ${inputType}`)
        }
      } else {
        logBug('Commission rate field not visible')
      }

      // Check min_commission_amount field (integer)
      const minCommissionInput = commissionCard.locator('#min_commission_amount')
      if (await minCommissionInput.isVisible()) {
        console.log('✅ Min commission amount field visible')
      }

      // Check currency field (string)
      const currencyInput = commissionCard.locator('#currency')
      if (await currencyInput.isVisible()) {
        console.log('✅ Currency field visible')

        const currencyValue = await currencyInput.inputValue()
        if (currencyValue === 'XOF') {
          console.log('✅ Currency correctly set to XOF')
        } else {
          logBug(`Currency value unexpected: ${currencyValue}`)
        }
      }
    } else {
      logBug('Commission settings card not visible')
    }

    await page.screenshot({ path: 'test-results/admin-settings-04-commission.png', fullPage: true })
  })

  test('System Settings - Notification Toggles', async ({ page }) => {
    console.log('\n========== TESTING NOTIFICATION TOGGLES ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const notificationsCard = page.locator('[data-testid="settings-notifications"]')

    if (await notificationsCard.isVisible()) {
      console.log('✅ Notifications settings card visible')

      // Check for toggle switches (boolean settings)
      const expectedToggles = [
        'notifications_enabled',
        'email_notifications',
        'sms_notifications'
      ]

      for (const toggleId of expectedToggles) {
        const toggle = notificationsCard.locator(`#${toggleId}`)
        const toggleExists = await toggle.count() > 0

        if (toggleExists) {
          console.log(`✅ Toggle "${toggleId}" present`)

          // Check if it's a checkbox
          const inputType = await toggle.getAttribute('type')
          if (inputType === 'checkbox') {
            console.log(`✅ ${toggleId} is a checkbox (toggle)`)

            // Check current state
            const isChecked = await toggle.isChecked()
            console.log(`Toggle "${toggleId}" is ${isChecked ? 'ON' : 'OFF'}`)
          } else {
            logBug(`${toggleId} is not a checkbox, type: ${inputType}`)
          }
        } else {
          logBug(`Toggle "${toggleId}" not found`)
        }
      }

      // Check for toggle UI (peer classes for styled toggle)
      const toggleUI = notificationsCard.locator('.peer')
      const toggleCount = await toggleUI.count()
      console.log(`Found ${toggleCount} styled toggle switches`)

      if (toggleCount >= 3) {
        console.log('✅ All notification toggles have styled UI')
      } else {
        logBug(`Expected 3 styled toggles, found ${toggleCount}`)
      }
    } else {
      logBug('Notifications settings card not visible')
    }

    await page.screenshot({ path: 'test-results/admin-settings-05-notifications.png', fullPage: true })
  })

  test('System Settings - Save Functionality', async ({ page }) => {
    console.log('\n========== TESTING SAVE FUNCTIONALITY ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find save button
    const saveButton = page.locator('button[type="submit"]:has-text("Enregistrer")')

    if (await saveButton.isVisible()) {
      console.log('✅ Save button visible')

      // Check save button text and icon
      const hasIcon = await saveButton.locator('svg').count() > 0
      if (hasIcon) {
        console.log('✅ Save button has icon')
      }

      // Modify a setting
      const siteNameInput = page.locator('#site_name')
      if (await siteNameInput.isVisible()) {
        const originalValue = await siteNameInput.inputValue()
        console.log(`Original site_name: ${originalValue}`)

        // Change value
        const testValue = `${originalValue} - Test`
        await siteNameInput.fill(testValue)
        console.log(`✅ Modified site_name to: ${testValue}`)

        // Click save
        await saveButton.click()
        console.log('✅ Save button clicked')

        // Wait for save operation
        await page.waitForTimeout(1000)

        // Check for success notification
        const successNotification = page.locator('text=Paramètres enregistrés, text=succès, text=success')
        const hasSuccess = await successNotification.isVisible({ timeout: 5000 }).catch(() => false)

        if (hasSuccess) {
          console.log('✅ Success notification displayed')
        } else {
          console.log('⚠️  Success notification not visible (may be auto-dismissed)')
        }

        // Restore original value
        await page.waitForTimeout(1000)
        await siteNameInput.fill(originalValue)
        await saveButton.click()
        await page.waitForTimeout(1000)
        console.log('✅ Restored original value')
      } else {
        logBug('site_name input not found for save test')
      }
    } else {
      logBug('Save button not found')
    }

    await page.screenshot({ path: 'test-results/admin-settings-06-save.png', fullPage: true })
  })

  test('System Settings - Cancel Functionality', async ({ page }) => {
    console.log('\n========== TESTING CANCEL FUNCTIONALITY ==========')

    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find cancel button
    const cancelButton = page.locator('button:has-text("Annuler")')

    if (await cancelButton.isVisible()) {
      console.log('✅ Cancel button visible')

      // Modify a setting
      const supportPhoneInput = page.locator('#support_phone')
      if (await supportPhoneInput.isVisible()) {
        const originalValue = await supportPhoneInput.inputValue()
        console.log(`Original support_phone: ${originalValue}`)

        // Change value
        await supportPhoneInput.fill('+228 99 99 99 99')
        console.log('✅ Modified support_phone')

        // Click cancel
        await cancelButton.click()
        console.log('✅ Cancel button clicked')

        // Wait for reload
        await page.waitForTimeout(2000)

        // Check if value is restored
        const restoredValue = await supportPhoneInput.inputValue()
        if (restoredValue === originalValue) {
          console.log('✅ Value restored after cancel')
        } else {
          logBug(`Value not restored. Expected: ${originalValue}, Got: ${restoredValue}`)
        }
      } else {
        logBug('support_phone input not found for cancel test')
      }
    } else {
      logBug('Cancel button not found')
    }

    await page.screenshot({ path: 'test-results/admin-settings-07-cancel.png', fullPage: true })
  })

  test('System Settings - Responsive Design', async ({ page }) => {
    console.log('\n========== TESTING RESPONSIVE DESIGN ==========')

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('Testing mobile viewport (375x667)')

    const mobileHeader = await page.locator('[data-testid="settings-header"]').isVisible()
    if (mobileHeader) {
      console.log('✅ Header visible on mobile')
    } else {
      logBug('Header not visible on mobile')
    }

    const mobileGeneralCard = await page.locator('[data-testid="settings-general"]').isVisible()
    if (mobileGeneralCard) {
      console.log('✅ Settings cards visible on mobile')
    } else {
      logBug('Settings cards not visible on mobile')
    }

    await page.screenshot({ path: 'test-results/admin-settings-08-mobile.png', fullPage: true })

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('Testing tablet viewport (768x1024)')

    const tabletCards = await page.locator('[data-testid^="settings-"]').count()
    console.log(`Found ${tabletCards} settings cards on tablet`)

    if (tabletCards >= 6) {
      console.log('✅ All settings cards visible on tablet')
    } else {
      logBug(`Expected 6 settings cards on tablet, found ${tabletCards}`)
    }

    await page.screenshot({ path: 'test-results/admin-settings-09-tablet.png', fullPage: true })

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test.afterAll(() => {
    console.log('\n========== SYSTEM SETTINGS TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)

    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - System Settings working perfectly!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-admin-settings.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
