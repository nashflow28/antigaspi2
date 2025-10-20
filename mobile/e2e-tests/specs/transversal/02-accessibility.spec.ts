// @ts-nocheck
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { testUsers } from '../../fixtures/users'
import { login } from '../../helpers/auth'
import { navigateToProducts, navigateToProfile } from '../../helpers/navigation'

test.describe('Accessibility Tests', () => {
  test('01 - Login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('02 - Home page should have no accessibility violations', async ({ page }) => {
    await login(page, testUsers.consumer)

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('03 - Products page should have no accessibility violations', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('04 - Should have proper heading hierarchy', async ({ page }) => {
    await login(page, testUsers.consumer)

    // Check heading levels
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

    // Should have at least one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // Should not skip heading levels
    const headingLevels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1])))
    )

    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1]
      expect(diff).toBeLessThanOrEqual(1) // Should not skip levels
    }
  })

  test('05 - All images should have alt text', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProducts(page)

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
      expect(alt?.length).toBeGreaterThan(0)
    }
  })

  test('06 - Interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Tab through elements
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'A']).toContain(firstFocused)

    await page.keyboard.press('Tab')
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'A']).toContain(secondFocused)
  })

  test('07 - Form inputs should have associated labels', async ({ page }) => {
    await page.goto('/')

    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all()

    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')

      // Should have either id with label, aria-label, or aria-labelledby
      const hasLabel = id && (await page.locator(`label[for="${id}"]`).count()) > 0
      const isAccessible = hasLabel || ariaLabel || ariaLabelledBy

      expect(isAccessible).toBe(true)
    }
  })

  test('08 - Should have sufficient color contrast', async ({ page }) => {
    await login(page, testUsers.consumer)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter((v) =>
      v.id.includes('color-contrast')
    )

    expect(contrastViolations).toEqual([])
  })

  test('09 - Buttons should have accessible names', async ({ page }) => {
    await login(page, testUsers.consumer)

    const buttons = await page.locator('button').all()

    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      // Should have either text, aria-label, or aria-labelledby
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy
      expect(hasAccessibleName).toBe(true)
    }
  })

  test('10 - Profile page should be accessible', async ({ page }) => {
    await login(page, testUsers.consumer)
    await navigateToProfile(page)

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
