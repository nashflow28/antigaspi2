#!/usr/bin/env node

/**
 * Visual Regression Baseline Capture - Phase 3
 * Captures screenshots of current UI state before migration for comparison
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const _unused_dirname = path.dirname(__filename)

console.log('📸 Visual Regression Baseline Capture - Phase 3\n')

// Configuration
const PROJECT_ROOT = path.resolve(_unused_dirname, '..')
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'test-screenshots/baseline')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Routes to capture for visual regression testing
const ROUTES_TO_CAPTURE = [
  // Authentication
  { path: '/login', name: 'login-page', waitFor: '[data-testid="login-form"]' },
  { path: '/register', name: 'register-page', waitFor: '[data-testid="register-form"]' },

  // Main views
  { path: '/', name: 'home-page', waitFor: 'main' },
  { path: '/products', name: 'products-catalog', waitFor: '[data-testid="product-grid"]' },
  { path: '/products/1', name: 'product-detail', waitFor: '[data-testid="product-detail"]' },

  // Dashboards (require auth)
  { path: '/dashboard', name: 'consumer-dashboard', requiresAuth: 'consumer' },
  { path: '/merchant/dashboard', name: 'merchant-dashboard', requiresAuth: 'merchant' },
  { path: '/admin/dashboard', name: 'admin-dashboard', requiresAuth: 'admin' },

  // Error states
  { path: '/404', name: 'not-found-page', waitFor: 'h1' }

  // Components showcase (if Storybook available)
  // { path: '/storybook/button', name: 'button-component' }
]

// Viewport configurations
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
]

// Theme configurations
const THEMES = [
  { name: 'light', className: '' },
  { name: 'dark', className: 'dark' }
]

/**
 * Setup authentication for protected routes
 */
async function setupAuth(page, role) {
  const authData = {
    consumer: {
      email: 'jean.dupont@email.com',
      password: 'password',
      token: 'consumer-test-token',
      user: { id: 1, role: 'consumer', email: 'jean.dupont@email.com' }
    },
    merchant: {
      email: 'boulangerie.martin@email.com',
      password: 'password',
      token: 'merchant-test-token',
      user: { id: 2, role: 'merchant', email: 'boulangerie.martin@email.com' }
    },
    admin: {
      email: 'admin@antigaspi.com',
      password: 'password',
      token: 'admin-test-token',
      user: { id: 3, role: 'admin', email: 'admin@antigaspi.com' }
    }
  }

  const auth = authData[role]
  if (!auth) {
    console.warn(`Unknown auth role: ${role}`)
    return false
  }

  // Set localStorage with auth data
  await page.addInitScript((auth) => {
    localStorage.setItem('auth_token', auth.token)
    localStorage.setItem('user', JSON.stringify(auth.user))
  }, auth)

  return true
}

/**
 * Capture screenshot for a specific route, viewport, and theme
 */
async function captureScreenshot(page, route, viewport, theme) {
  try {
    // Set viewport
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    // Apply theme
    if (theme.className) {
      await page.addStyleTag({
        content: `html { @apply ${theme.className}; }`
      })
    }

    // Setup auth if needed
    if (route.requiresAuth) {
      const authSuccess = await setupAuth(page, route.requiresAuth)
      if (!authSuccess) {
        console.warn(`Skipping ${route.name} - auth setup failed`)
        return false
      }
    }

    // Navigate to route
    console.log(`📍 Capturing: ${route.path} (${viewport.name}, ${theme.name})`)
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' })

    // Wait for specific element if specified
    if (route.waitFor) {
      try {
        await page.waitForSelector(route.waitFor, { timeout: 10000 })
      } catch (_error) {
        console.warn(`Warning: Selector ${route.waitFor} not found for ${route.path}`)
      }
    }

    // Additional wait for animations and loading states
    await page.waitForTimeout(1000)

    // Generate filename
    const filename = `${route.name}_${viewport.name}_${theme.name}.png`
    const filepath = path.join(SCREENSHOTS_DIR, filename)

    // Capture screenshot
    await page.screenshot({
      path: filepath,
      fullPage: true,
      animations: 'disabled' // Consistent screenshots
    })

    console.log(`  ✅ Saved: ${filename}`)
    return true

  } catch (_error) {
    console.error(`  ❌ Failed to capture ${route.name}:`, _error.message)
    return false
  }
}

/**
 * Generate metadata file with capture info
 */
function generateMetadata(results) {
  const metadata = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalScreenshots: results.successful,
    failedScreenshots: results.failed,
    viewports: VIEWPORTS,
    themes: THEMES,
    routes: ROUTES_TO_CAPTURE,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }

  const metadataPath = path.join(SCREENSHOTS_DIR, 'capture-metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  console.log(`📄 Metadata saved: ${metadataPath}`)
}

/**
 * Check if application is running
 */
async function checkApplicationRunning() {
  try {
    const response = await fetch(BASE_URL)
    return response.ok
  } catch (_error) {
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting visual regression baseline capture...')

  // Check if application is running
  console.log(`🔍 Checking if application is running at ${BASE_URL}...`)
  const isRunning = await checkApplicationRunning()

  if (!isRunning) {
    console.error('❌ Application is not running!')
    console.log('💡 Please start the application first:')
    console.log('   cd frontend && npm run dev')
    process.exit(1)
  }

  console.log('✅ Application is running\n')

  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    console.log(`📁 Created directory: ${SCREENSHOTS_DIR}`)
  }

  // Launch browser
  console.log('🌐 Launching browser...')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })

  const results = { successful: 0, failed: 0 }

  try {
    // Create browser context
    const context = await browser.newContext({
      // Disable animations for consistent screenshots
      reducedMotion: 'reduce',
      // Set color scheme preference
      colorScheme: 'light'
    })

    const page = await context.newPage()

    // Disable animations globally
    await page.addInitScript(() => {
      // Disable CSS animations and transitions
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
      document.head.appendChild(style)
    })

    console.log('\n📸 Starting screenshot capture...\n')

    // Capture screenshots for each combination
    for (const route of ROUTES_TO_CAPTURE) {
      for (const viewport of VIEWPORTS) {
        for (const theme of THEMES) {
          const success = await captureScreenshot(page, route, viewport, theme)

          if (success) {
            results.successful++
          } else {
            results.failed++
          }
        }
      }
    }

  } catch (_error) {
    console.error('❌ Screenshot capture failed:', _error)
  } finally {
    await browser.close()
  }

  // Generate metadata
  generateMetadata(results)

  // Results summary
  console.log('\n📊 Capture Summary:')
  console.log(`   ✅ Successful: ${results.successful}`)
  console.log(`   ❌ Failed: ${results.failed}`)
  console.log(`   📁 Directory: ${SCREENSHOTS_DIR}`)

  if (results.failed > 0) {
    console.log('\n⚠️  Some screenshots failed. Check the logs above for details.')
    process.exit(1)
  }

  console.log('\n🎉 Baseline capture completed successfully!')
  console.log('💡 Use these screenshots to compare against post-migration UI.')
}

main().catch(console.error)
