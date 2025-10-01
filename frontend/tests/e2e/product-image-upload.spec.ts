import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Product Image Upload', () => {
  test('should trigger file input when clicking add image button', async ({ page }) => {
    // Capture console logs and errors
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      console.log(`[BROWSER ${msg.type()}]`, text)
    })

    page.on('pageerror', error => {
      consoleErrors.push(error.message)
      console.error('[BROWSER ERROR]', error)
    })

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/products') || request.url().includes('/upload')) {
        console.log('[REQUEST]', request.method(), request.url())
      }
    })

    page.on('response', response => {
      if (response.url().includes('/products') || response.url().includes('/upload')) {
        console.log('[RESPONSE]', response.status(), response.url())
      }
    })

    console.log('[TEST] Starting test...')

    // 1. Login as merchant
    console.log('[TEST] Logging in as merchant...')
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'marie.martin@email.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/merchant/dashboard', { timeout: 10000 })
    console.log('[TEST] Logged in successfully')

    // 2. Navigate to product edit page
    await page.goto('http://localhost:3000/merchant/products/1/edit')
    await page.waitForLoadState('networkidle')
    console.log('[TEST] Navigated to product edit page')

    // 3. Check if there's an existing image and remove it first
    const removeImageButton = page.locator('button:has-text("Supprimer")')
    if (await removeImageButton.isVisible()) {
      console.log('[TEST] Removing existing image...')
      await removeImageButton.click()
      await page.waitForTimeout(500)
    }

    // 4. Click "Ajouter une image" button
    console.log('[TEST] Looking for "Ajouter une image" button...')
    const addImageButton = page.locator('button', { hasText: /Ajouter.*image|Changer.*image/i })
    await addImageButton.waitFor({ state: 'visible', timeout: 5000 })
    console.log('[TEST] Found button, clicking...')
    await addImageButton.click()

    // Wait a bit to see if file input appears
    await page.waitForTimeout(1000)

    // 5. Try to find and interact with file input
    console.log('[TEST] Looking for file input...')
    const fileInput = page.locator('input[type="file"]')
    const fileInputCount = await fileInput.count()
    console.log(`[TEST] Found ${fileInputCount} file input(s)`)

    if (fileInputCount > 0) {
      // Check if input is visible or hidden
      const isVisible = await fileInput.first().isVisible()
      console.log(`[TEST] File input visible: ${isVisible}`)

      // Upload image
      const imagePath = path.resolve('C:/xampp/htdocs/antigaspi2/IMAGES_PRODUITS/pain.jpeg')
      console.log(`[TEST] Uploading image from: ${imagePath}`)

      await fileInput.first().setInputFiles(imagePath)
      console.log('[TEST] File set on input')

      // Wait for upload to complete
      await page.waitForTimeout(3000)

      // Check console logs for upload messages
      const uploadLogs = consoleLogs.filter(log => log.includes('ProductEditView2025'))
      console.log('[TEST] Upload-related logs:', uploadLogs)

      // Try to save the product
      console.log('[TEST] Attempting to save product...')
      const saveButton = page.locator('button:has-text("Enregistrer")')
      await saveButton.click()

      // Wait for response
      await page.waitForTimeout(2000)

      // Check for errors
      const errorMessages = page.locator('[role="alert"], .error, .notification-error')
      const errorCount = await errorMessages.count()
      if (errorCount > 0) {
        console.log('[TEST] Found error messages:')
        for (let i = 0; i < errorCount; i++) {
          const text = await errorMessages.nth(i).textContent()
          console.log(`  - ${text}`)
        }
      }
    } else {
      console.log('[TEST] ERROR: No file input found!')
    }

    // Print summary
    console.log('\n========== TEST SUMMARY ==========')
    console.log('Console Logs:', consoleLogs.length)
    consoleLogs.forEach(log => console.log(log))

    console.log('\nConsole Errors:', consoleErrors.length)
    consoleErrors.forEach(err => console.log(err))

    console.log('==================================\n')

    // Take a screenshot for debugging
    await page.screenshot({ path: 'product-edit-screenshot.png', fullPage: true })
    console.log('[TEST] Screenshot saved to product-edit-screenshot.png')
  })
})
