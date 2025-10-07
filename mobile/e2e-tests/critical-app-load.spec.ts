/**
 * Tests E2E critiques - Détection page blanche
 *
 * Ce test aurait détecté le bug Typography.tsx automatiquement
 * en vérifiant que l'app charge correctement sur navigateur
 */

import { test, expect } from '@playwright/test'

test.describe('Critical App Load Tests', () => {
  test('App should load without blank page error', async ({ page }) => {
    // Collecter les erreurs console
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })

    // Naviguer vers l'app
    await page.goto('http://localhost:9001', { waitUntil: 'networkidle' })

    // Vérifier que l'app affiche du contenu (pas de page blanche)
    const hasContent = await page.locator('body').evaluate(el => {
      const text = el.textContent || ''
      const hasVisibleElements = el.querySelectorAll('*').length > 10
      return text.length > 50 || hasVisibleElements
    })

    expect(hasContent).toBe(true)

    // Vérifier qu'on voit soit le logo, soit l'écran de connexion
    const appVisible = await page.locator('text=/Antigaspi|Connexion|Se connecter|Email/i').first().isVisible({ timeout: 10000 })
      .catch(() => false)

    expect(appVisible).toBe(true)

    // Vérifier absence d'erreurs critiques
    const hasCriticalError = pageErrors.some(err =>
      err.includes('CSSStyleDeclaration') ||
      err.includes('indexed property') ||
      err.includes('Cannot read')
    )

    expect(hasCriticalError).toBe(false)

    // Log pour debug si échec
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors)
    }
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors)
    }
  })

  test('Typography component should render with array styles', async ({ page }) => {
    await page.goto('http://localhost:9001')

    // Attendre que le composant Typography soit rendu (via BrandLogo)
    await page.waitForSelector('text=/Antigaspi/i', { timeout: 10000 })

    // Vérifier que le logo est visible (utilise Typography avec array styles)
    const logoVisible = await page.locator('text=/🌱 Antigaspi/i').isVisible()
    expect(logoVisible).toBe(true)
  })

  test('No React errors in console during app initialization', async ({ page }) => {
    const reactErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (
        msg.type() === 'error' &&
        (text.includes('React') || text.includes('Component') || text.includes('render'))
      ) {
        reactErrors.push(text)
      }
    })

    await page.goto('http://localhost:9001')
    await page.waitForTimeout(5000) // Attendre l'initialisation complète

    expect(reactErrors).toHaveLength(0)
  })
})
