import { test, expect } from '@playwright/test'
import path from 'path'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Merchant Flows - Complete Management', () => {
  test.setTimeout(120000) // 2 minutes timeout

  test('Merchant: Complete product and reservation management', async ({ page }) => {
    const timestamp = Date.now()

    // ========== 1. LOGIN AS MERCHANT ==========
    console.log('\n========== MERCHANT LOGIN ==========')
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'marie.martin@email.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    if (currentUrl.includes('/merchant/dashboard')) {
      console.log('✅ Merchant logged in successfully')
    } else {
      logBug(`Merchant login failed - URL: ${currentUrl}`)
    }

    await page.screenshot({ path: 'test-results/merchant-01-login.png', fullPage: true })

    // ========== 2. MERCHANT DASHBOARD ==========
    console.log('\n========== TESTING MERCHANT DASHBOARD ==========')
    await page.goto('http://localhost:3000/merchant/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for statistics cards
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card, .card')
    const statsCount = await statsCards.count()
    console.log(`Found ${statsCount} statistics cards`)

    if (statsCount === 0) {
      logBug('No statistics displayed on merchant dashboard')
    }

    // Check for charts/graphs
    const charts = page.locator('canvas, svg[class*="chart"]')
    const chartsCount = await charts.count()
    console.log(`Found ${chartsCount} charts`)

    await page.screenshot({ path: 'test-results/merchant-02-dashboard.png', fullPage: true })

    // ========== 3. PRODUCTS LIST ==========
    console.log('\n========== TESTING PRODUCTS LIST ==========')
    await page.goto('http://localhost:3000/merchant/products')
    await page.waitForLoadState('networkidle')

    const productsTable = page.locator('table, .product-list, [data-testid="product-list"]')
    if (await productsTable.isVisible()) {
      console.log('✅ Products list visible')
    } else {
      logBug('Products list not visible')
    }

    // Check for "Add Product" button
    const addProductBtn = page.locator('button:has-text("Ajouter"), a:has-text("Nouveau produit")')
    if (await addProductBtn.isVisible()) {
      console.log('✅ Add product button visible')
    } else {
      logBug('Add product button not found')
    }

    // Count products
    const productRows = page.locator('table tbody tr, .product-item')
    const productCount = await productRows.count()
    console.log(`Merchant has ${productCount} products`)

    await page.screenshot({ path: 'test-results/merchant-03-products-list.png', fullPage: true })

    // ========== 4. CREATE NEW PRODUCT ==========
    console.log('\n========== TESTING PRODUCT CREATION ==========')

    if (await addProductBtn.isVisible()) {
      await addProductBtn.click()
      await page.waitForTimeout(1000)

      // Fill product form
      const productName = `Test Product ${timestamp}`
      await page.fill('input[name="name"], input[placeholder*="Nom"]', productName)
      await page.fill('textarea[name="description"], textarea[placeholder*="Description"]', 'Test product description for automated testing')

      // Select category
      const categorySelect = page.locator('select[name="category_id"], select[name="category"]')
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 })
        console.log('✅ Category selected')
      } else {
        logBug('Category select not found')
      }

      // Fill prices
      await page.fill('input[name="original_price"], input[placeholder*="Prix original"]', '1000')
      await page.fill('input[name="discounted_price"], input[placeholder*="Prix réduit"]', '500')
      await page.fill('input[name="quantity_available"], input[placeholder*="Quantité"]', '10')

      // Fill expiration date
      const expirationInput = page.locator('input[type="date"], input[name*="expiration"]')
      if (await expirationInput.isVisible()) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 2)
        const dateStr = tomorrow.toISOString().split('T')[0]
        await expirationInput.fill(dateStr)
        console.log('✅ Expiration date set')
      }

      await page.screenshot({ path: 'test-results/merchant-04-product-form.png', fullPage: true })

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Enregistrer")')
      await submitBtn.click()
      await page.waitForTimeout(2000)

      // Check for success
      const successNotif = page.locator('[role="alert"]:has-text("succès"), .notification:has-text("succès")')
      if (await successNotif.count() > 0) {
        console.log('✅ Product created successfully')
      } else {
        logBug('No success notification after product creation')
      }

      // Check if redirected to products list
      await page.waitForTimeout(1000)
      const afterCreateUrl = page.url()
      console.log(`After create URL: ${afterCreateUrl}`)

      await page.screenshot({ path: 'test-results/merchant-05-after-create.png', fullPage: true })
    }

    // ========== 5. EDIT EXISTING PRODUCT ==========
    console.log('\n========== TESTING PRODUCT EDIT ==========')
    await page.goto('http://localhost:3000/merchant/products')
    await page.waitForLoadState('networkidle')

    // Find first edit button
    const editBtn = page.locator('a[href*="/edit"], button:has-text("Modifier")').first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await page.waitForTimeout(2000)

      console.log('✅ Edit page loaded')

      // Check form is populated
      const nameInput = page.locator('input[name="name"]')
      const nameValue = await nameInput.inputValue()
      console.log(`Product name: ${nameValue}`)

      if (!nameValue) {
        logBug('Product form not populated on edit page')
      }

      await page.screenshot({ path: 'test-results/merchant-06-edit-form.png', fullPage: true })

      // ========== 6. TEST IMAGE UPLOAD ==========
      console.log('\n========== TESTING IMAGE UPLOAD ==========')

      const addImageBtn = page.locator('button:has-text("Ajouter une image"), button:has-text("Changer")')
      if (await addImageBtn.isVisible()) {
        console.log('✅ Add image button found')

        // Click button
        await addImageBtn.click()
        await page.waitForTimeout(500)

        // Upload image
        const fileInput = page.locator('input[type="file"]')
        const imagePath = path.resolve('C:/xampp/htdocs/antigaspi2/IMAGES_PRODUITS/pain.jpeg')

        await fileInput.first().setInputFiles(imagePath)
        console.log('Image file selected')

        // Wait for upload
        await page.waitForTimeout(3000)

        // Check if image preview appears
        const imagePreview = page.locator('img[src*="storage"], img[src*="products"]')
        if (await imagePreview.isVisible()) {
          console.log('✅ Image preview displayed')
        } else {
          logBug('Image preview not displayed after upload')
        }

        await page.screenshot({ path: 'test-results/merchant-07-after-image-upload.png', fullPage: true })

        // Save product
        const saveBtn = page.locator('button:has-text("Enregistrer")')
        await saveBtn.click()
        await page.waitForTimeout(2000)

        // Check for errors in console
        const errorAlerts = page.locator('[role="alert"]:has-text("erreur"), .error, .text-red')
        const errorCount = await errorAlerts.count()

        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const errorText = await errorAlerts.nth(i).textContent()
            logBug(`Error after save: ${errorText}`)
          }
        } else {
          console.log('✅ Product saved successfully with image')
        }

        await page.screenshot({ path: 'test-results/merchant-08-after-save.png', fullPage: true })
      } else {
        logBug('Add image button not found')
      }
    } else {
      logBug('Edit button not found')
    }

    // ========== 7. DELETE PRODUCT ==========
    console.log('\n========== TESTING PRODUCT DELETION ==========')
    await page.goto('http://localhost:3000/merchant/products')
    await page.waitForLoadState('networkidle')

    const initialCount = await page.locator('table tbody tr, .product-item').count()
    console.log(`Initial product count: ${initialCount}`)

    const deleteBtn = page.locator('button:has-text("Supprimer"), button[aria-label*="Supprimer"]').first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      await page.waitForTimeout(500)

      // Check for confirmation modal
      const confirmModal = page.locator('[role="dialog"], .modal')
      if (await confirmModal.isVisible()) {
        console.log('✅ Confirmation modal displayed')

        // Check modal styling
        const modalBg = await confirmModal.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            background: styles.backgroundColor,
            border: styles.border
          }
        })

        if (modalBg.background === 'rgba(0, 0, 0, 0)' || modalBg.background === 'transparent') {
          logBug('Delete confirmation modal is unstyled!')
        }

        await page.screenshot({ path: 'test-results/merchant-09-delete-modal.png', fullPage: true })

        // Confirm deletion
        const confirmBtn = page.locator('button:has-text("Confirmer"), button:has-text("Oui")')
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click()
          await page.waitForTimeout(2000)

          const finalCount = await page.locator('table tbody tr, .product-item').count()
          console.log(`Final product count: ${finalCount}`)

          if (finalCount < initialCount) {
            console.log('✅ Product deleted successfully')
          } else {
            logBug('Product count did not decrease after deletion')
          }
        }
      } else {
        logBug('No confirmation modal for delete action')
      }
    }

    // ========== 8. RESERVATIONS MANAGEMENT ==========
    console.log('\n========== TESTING RESERVATIONS MANAGEMENT ==========')
    await page.goto('http://localhost:3000/merchant/reservations')
    await page.waitForLoadState('networkidle')

    const reservations = page.locator('table tbody tr, .reservation-item')
    const reservationCount = await reservations.count()
    console.log(`Found ${reservationCount} reservations`)

    if (reservationCount === 0) {
      console.log('⚠️ No reservations to test')
    } else {
      // Check for status update buttons
      const statusBtns = page.locator('button:has-text("Confirmer"), button:has-text("Annuler"), select')
      const statusCount = await statusBtns.count()
      console.log(`Found ${statusCount} status control buttons`)

      if (statusCount === 0) {
        logBug('No status update controls on reservations page')
      }
    }

    await page.screenshot({ path: 'test-results/merchant-10-reservations.png', fullPage: true })

    // ========== 9. TEST RESPONSIVE SIDEBAR ==========
    console.log('\n========== TESTING SIDEBAR NAVIGATION ==========')

    const sidebar = page.locator('aside, nav, [data-testid="sidebar"]')
    if (await sidebar.isVisible()) {
      console.log('✅ Sidebar visible')

      // Check sidebar links
      const navLinks = sidebar.locator('a')
      const linksCount = await navLinks.count()
      console.log(`Found ${linksCount} navigation links in sidebar`)

      if (linksCount < 3) {
        logBug('Too few navigation links in sidebar')
      }
    } else {
      logBug('Sidebar not visible')
    }

    // ========== 10. CHECK NOTIFICATIONS ==========
    console.log('\n========== TESTING NOTIFICATIONS UI ==========')

    // Try to trigger a notification by clicking profile or settings
    const notificationBtn = page.locator('[data-testid="notifications"], button[aria-label*="notification"]')
    if (await notificationBtn.isVisible()) {
      await notificationBtn.click()
      await page.waitForTimeout(500)

      const notificationPanel = page.locator('[role="menu"], .notification-panel, .dropdown')
      if (await notificationPanel.isVisible()) {
        // Check styling
        const panelStyles = await notificationPanel.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            background: styles.backgroundColor,
            boxShadow: styles.boxShadow
          }
        })

        if (panelStyles.background === 'rgba(0, 0, 0, 0)') {
          logBug('Notification panel is unstyled!')
        }

        console.log('✅ Notification panel displayed')
        await page.screenshot({ path: 'test-results/merchant-11-notifications.png', fullPage: true })
      }
    }

    // ========== FINAL REPORT ==========
    console.log('\n========== MERCHANT TESTS SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - all merchant flows working!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-merchant.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
