import { test, expect } from '@playwright/test'
import * as fs from 'fs'

const BUGS_FOUND: string[] = []

function logBug(bug: string) {
  BUGS_FOUND.push(bug)
  console.log(`🐛 BUG FOUND: ${bug}`)
}

test.describe('Consumer Flows - Complete Journey', () => {
  test.setTimeout(120000) // 2 minutes timeout

  test('Consumer: Complete user journey from signup to reservation', async ({ page }) => {
    const timestamp = Date.now()
    const newUserEmail = `test.consumer.${timestamp}@email.com`
    const newUserPassword = 'TestPassword123!'

    // ========== 1. HOMEPAGE ==========
    console.log('\n========== TESTING HOMEPAGE ==========')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Check hero section
    const heroTitle = page.locator('h1').first()
    if (await heroTitle.isVisible()) {
      console.log('✅ Hero title visible')
    } else {
      logBug('Hero title not visible on homepage')
    }

    // Check if products are displayed
    const productCards = page.locator('[data-testid="product-card"], .product-card, article')
    const productCount = await productCards.count()
    console.log(`Found ${productCount} products on homepage`)

    if (productCount === 0) {
      logBug('No products displayed on homepage')
    } else {
      console.log(`✅ ${productCount} products displayed`)
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true })

    // ========== 2. SIGNUP ==========
    console.log('\n========== TESTING SIGNUP ==========')
    const signupBtn = page.locator('a[href="/register"], button:has-text("Inscription"), a:has-text("Inscription")')

    const signupBtnExists = await signupBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!signupBtnExists) {
      logBug('Signup button not found on homepage')
      // Try direct navigation
      await page.goto('http://localhost:3000/register')
    } else {
      await signupBtn.click()
    }
    await page.waitForURL('**/register', { timeout: 5000 }).catch(() => {})

    // Fill signup form
    await page.fill('input[name="first_name"], input[placeholder*="Prénom"]', 'Test')
    await page.fill('input[name="last_name"], input[placeholder*="Nom"]', 'Consumer')
    await page.fill('input[type="email"]', newUserEmail)
    await page.fill('input[name="phone"], input[placeholder*="Téléphone"]', '0123456789')
    await page.fill('input[name="address"], input[placeholder*="Adresse"]', '123 Test Street')
    await page.fill('input[name="city"], input[placeholder*="Ville"]', 'Lomé')

    const passwordInputs = page.locator('input[type="password"]')
    const passwordCount = await passwordInputs.count()

    if (passwordCount >= 2) {
      await passwordInputs.nth(0).fill(newUserPassword)
      await passwordInputs.nth(1).fill(newUserPassword)
    } else {
      await passwordInputs.first().fill(newUserPassword)
    }

    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Check for errors
    const errorElements = page.locator('[role="alert"], .error, .text-red-500, .text-red-600')
    const errorCount = await errorElements.count()

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent()
        if (errorText && errorText.trim()) {
          logBug(`Signup error: ${errorText}`)
        }
      }
    }

    // Wait for redirect or success
    await page.waitForTimeout(2000)
    const currentUrl = page.url()

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/products')) {
      console.log('✅ Signup successful - redirected to:', currentUrl)
    } else {
      logBug(`Signup may have failed - still on: ${currentUrl}`)
    }

    await page.screenshot({ path: 'test-results/02-after-signup.png', fullPage: true })

    // ========== 3. LOGOUT ==========
    console.log('\n========== TESTING LOGOUT ==========')
    const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await page.waitForTimeout(1000)
      console.log('✅ Logout button clicked')
    } else {
      logBug('Logout button not found')
    }

    // ========== 4. LOGIN WITH NEW ACCOUNT ==========
    console.log('\n========== TESTING LOGIN ==========')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', newUserEmail)
    await page.fill('input[type="password"]', newUserPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const loginUrl = page.url()
    if (loginUrl.includes('/dashboard') || loginUrl.includes('/products')) {
      console.log('✅ Login successful')
    } else {
      logBug(`Login failed - still on: ${loginUrl}`)
    }

    await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true })

    // ========== 5. BROWSE PRODUCTS ==========
    console.log('\n========== TESTING PRODUCT BROWSING ==========')
    await page.goto('http://localhost:3000/products')
    await page.waitForLoadState('networkidle')

    // Check search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="Rechercher"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('pain')
      await page.waitForTimeout(1000)
      console.log('✅ Search input working')
    } else {
      logBug('Search input not found')
    }

    // Check filters
    const filterButtons = page.locator('button:has-text("Catégorie"), button:has-text("Prix"), select')
    const filterCount = await filterButtons.count()
    console.log(`Found ${filterCount} filter controls`)

    // Check product cards
    const productsAfterSearch = await page.locator('[data-testid="product-card"], .product-card, article').count()
    console.log(`Products after search: ${productsAfterSearch}`)

    await page.screenshot({ path: 'test-results/04-products-page.png', fullPage: true })

    // ========== 6. VIEW PRODUCT DETAILS ==========
    console.log('\n========== TESTING PRODUCT DETAILS ==========')
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first()

    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await page.waitForTimeout(2000)

      // Check product details page
      const productName = page.locator('h1, h2').first()
      const productNameText = await productName.textContent()
      console.log(`Product name: ${productNameText}`)

      // Check for price
      const priceElements = page.locator(':text("XOF"), :text("€"), :text("FCFA")')
      const priceCount = await priceElements.count()
      if (priceCount > 0) {
        console.log('✅ Price displayed')
      } else {
        logBug('Price not displayed on product details')
      }

      // Check for reserve/add to cart button
      const reserveButton = page.locator('button:has-text("Réserver"), button:has-text("Ajouter")')
      if (await reserveButton.isVisible()) {
        console.log('✅ Reserve button visible')
      } else {
        logBug('Reserve button not found on product details')
      }

      await page.screenshot({ path: 'test-results/05-product-details.png', fullPage: true })

      // ========== 7. MAKE RESERVATION ==========
      console.log('\n========== TESTING RESERVATION ==========')

      if (await reserveButton.isVisible()) {
        await reserveButton.click()
        await page.waitForTimeout(2000)

        // Check for success notification/modal
        const successElements = page.locator('[role="alert"], .notification, .modal, :has-text("succès"), :has-text("réservé")')
        const successCount = await successElements.count()

        if (successCount > 0) {
          console.log('✅ Reservation success notification displayed')
        } else {
          logBug('No success notification after reservation')
        }

        // Check modal styling
        const modals = page.locator('.modal, [role="dialog"]')
        if (await modals.count() > 0) {
          const modalBg = await modals.first().evaluate((el) => {
            const styles = window.getComputedStyle(el)
            return {
              background: styles.backgroundColor,
              border: styles.border,
              padding: styles.padding
            }
          })
          console.log('Modal styles:', modalBg)

          if (modalBg.background === 'rgba(0, 0, 0, 0)' || modalBg.background === 'transparent') {
            logBug('Modal has no background - unstyled!')
          }
        }

        await page.screenshot({ path: 'test-results/06-after-reservation.png', fullPage: true })
      }
    }

    // ========== 8. VIEW DASHBOARD/RESERVATIONS ==========
    console.log('\n========== TESTING CONSUMER DASHBOARD ==========')
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')

    // Check for reservations list
    const reservations = page.locator('[data-testid="reservation"], .reservation, table tr')
    const reservationCount = await reservations.count()
    console.log(`Found ${reservationCount} reservations in dashboard`)

    await page.screenshot({ path: 'test-results/07-consumer-dashboard.png', fullPage: true })

    // ========== 9. VIEW PROFILE ==========
    console.log('\n========== TESTING PROFILE PAGE ==========')
    await page.goto('http://localhost:3000/profile')
    await page.waitForLoadState('networkidle')

    // Check if user data is displayed
    const emailDisplay = page.locator(`:text("${newUserEmail}")`)
    if (await emailDisplay.isVisible()) {
      console.log('✅ User email displayed in profile')
    } else {
      logBug('User email not displayed in profile')
    }

    await page.screenshot({ path: 'test-results/08-profile.png', fullPage: true })

    // ========== FINAL REPORT ==========
    console.log('\n========== TEST SUMMARY ==========')
    console.log(`Total bugs found: ${BUGS_FOUND.length}`)
    if (BUGS_FOUND.length > 0) {
      console.log('\nBugs:')
      BUGS_FOUND.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`)
      })
    } else {
      console.log('✅ No bugs found - all consumer flows working!')
    }

    // Save bugs to file
    fs.writeFileSync('test-results/bugs-consumer.json', JSON.stringify(BUGS_FOUND, null, 2))
  })
})
