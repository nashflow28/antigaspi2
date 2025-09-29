import { test, expect } from '@playwright/test'

test.describe('Design System 2025 - Theme Toggle', () => {
  test('persists theme preference and exposes accessible controls', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    const toggle = page.getByRole('button', { name: /activer le thème (sombre|clair)/i }).first()
    await expect(toggle).toBeVisible()

    await toggle.focus()
    await expect(toggle).toBeFocused()

    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )

    await toggle.click()

    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark'

    await expect.poll(async () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      )
    ).toBe(expectedTheme)

    const expectedAriaLabel =
      expectedTheme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'
    await expect(
      page.getByRole('button', { name: new RegExp(expectedAriaLabel, 'i') })
    ).toHaveAttribute('aria-label', expectedAriaLabel)

    const storedTheme = await page.evaluate(() => window.localStorage.getItem('theme'))
    expect(storedTheme).toBe(expectedTheme)

    await page.reload()

    const toggleAfterReload = page.getByRole('button', {
      name: new RegExp(expectedAriaLabel, 'i')
    })
    await expect(toggleAfterReload).toBeVisible()
    await expect(toggleAfterReload).toHaveAttribute('aria-label', expectedAriaLabel)

    const persistedTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
    expect(persistedTheme).toBe(expectedTheme)

    await toggleAfterReload.click()
    await expect.poll(async () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      )
    ).toBe(initialTheme)

    const restoredPreference = await page.evaluate(() => window.localStorage.getItem('theme'))
    expect(restoredPreference).toBe(initialTheme)
  })
})
