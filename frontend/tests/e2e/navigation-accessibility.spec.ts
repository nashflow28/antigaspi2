import { test, expect } from '@playwright/test'

test.describe('Navigation 2025 accessibility', () => {
  test('supports skip links, ARIA roles and keyboard toggling', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.keyboard.press('Tab')
    const skipToContent = page.locator('a.skip-link', { hasText: 'Aller au contenu principal' })
    await expect(skipToContent).toBeVisible()
    await expect(skipToContent).toHaveAttribute('href', '#main-content')

    await page.keyboard.press('Tab')
    const skipToNav = page.locator('a.skip-link', { hasText: 'Aller à la navigation' })
    await expect(skipToNav).toBeVisible()

    const nav = page.locator('nav[aria-label="Navigation principale"]')
    await expect(nav).toBeVisible()
    await expect(nav.locator('[role="menubar"]').first()).toBeVisible()

    await page.keyboard.press('Tab')
    const brandLink = page.locator('a[aria-label="Antigaspi - Retour à l\'accueil"]')
    await expect(brandLink).toBeFocused()

    await page.keyboard.press('Tab')
    const firstMenuItem = nav.locator('[role="menuitem"]').first()
    await expect(firstMenuItem).toBeFocused()

    const darkModeToggle = nav.locator('button[aria-label*="thème" i]').first()
    await expect(darkModeToggle).toBeVisible()

    const mobileToggle = page.locator('button[aria-controls][aria-expanded]')
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')

    await mobileToggle.click()
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')

    const mobileMenuId = await mobileToggle.getAttribute('aria-controls')
    if (mobileMenuId) {
      await expect(page.locator(`#${mobileMenuId}`)).toBeVisible()
    }

    await page.keyboard.press('Escape')
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')

    const loginLink = page.locator('[data-testid="nav-login-mobile"]')
    await mobileToggle.click()
    await expect(loginLink).toBeVisible()
    await loginLink.focus()
    await expect(loginLink).toBeFocused()
  })
})
