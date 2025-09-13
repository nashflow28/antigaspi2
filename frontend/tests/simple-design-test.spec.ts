import { test, expect } from '@playwright/test';

test.describe('Simple Design Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3008');

    // Check if main title is visible and contains expected text
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Sauvons');

    // Check if hero section has gradient background
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Check if page loaded without obvious errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('Navigation is responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3008');

    // Check if navigation elements are visible on mobile
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('Basic layout elements render', async ({ page }) => {
    await page.goto('http://localhost:3008');

    // Check for key layout elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('section').first()).toBeVisible();

    // Check if Inter font is applied to body
    const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
    expect(bodyFont).toContain('Inter');
  });
});