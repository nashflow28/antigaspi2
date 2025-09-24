import { test, expect } from '@playwright/test';

test.describe('Design Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Assume we have authentication bypass for testing
    await page.goto('http://localhost:3008');
  });

  test('Homepage loads with proper styling', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sauvons');

    // Check if gradients are applied
    const heroSection = page.locator('[data-testid="hero-section"]').first();
    const bgColor = await heroSection.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bgColor).toContain('gradient');
  });

  test('Profile page renders correctly', async ({ page }) => {
    // Navigate to profile (assuming we can bypass auth for testing)
    await page.goto('http://localhost:3008/profile');

    // Check if profile header exists
    await expect(page.locator('h1')).toContainText('Mon Profil');

    // Check if tabs are visible
    await expect(page.locator('button', { hasText: 'Informations personnelles' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sécurité' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Préférences' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Statistiques' })).toBeVisible();
  });

  test('Merchant dashboard has proper layout', async ({ page }) => {
    await page.goto('http://localhost:3008/merchant/dashboard');

    // Check if dashboard title exists
    await expect(page.locator('h1')).toContainText('Tableau de bord Commerçant');

    // Check if statistics cards are present
    await expect(page.locator('[data-testid="stats-card"]').first()).toBeVisible();

    // Check if quick actions are visible
    await expect(page.locator('text=Actions rapides')).toBeVisible();
  });

  test('Responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3008');

    // Check if navigation is properly responsive
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible();

    // Check if content is readable on mobile
    const mainContent = page.locator('main').first();
    const width = await mainContent.boundingBox();
    expect(width?.width).toBeLessThanOrEqual(375);
  });

  test('Color scheme and typography are consistent', async ({ page }) => {
    await page.goto('http://localhost:3008');

    // Check if Inter font is loaded
    const bodyFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
    expect(bodyFont).toContain('Inter');

    // Check if primary colors are applied
    const primaryButton = page.locator('.btn-primary').first();
    if (await primaryButton.isVisible()) {
      const bgColor = await primaryButton.evaluate(el => getComputedStyle(el).backgroundColor);
      // Should have some color (not transparent)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Icons render properly', async ({ page }) => {
    await page.goto('http://localhost:3008/profile');

    // Check if heroicons are rendering (look for SVG elements)
    const icons = page.locator('svg');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);

    // Check if icons have proper sizes
    const firstIcon = icons.first();
    const iconBox = await firstIcon.boundingBox();
    expect(iconBox?.width).toBeGreaterThan(0);
    expect(iconBox?.height).toBeGreaterThan(0);
  });

  test('Form inputs have proper styling', async ({ page }) => {
    await page.goto('http://localhost:3008/profile');

    // Click on personal information tab if not active
    await page.click('button:has-text("Informations personnelles")');

    // Check if form inputs are styled
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      const borderRadius = await input.evaluate(el => getComputedStyle(el).borderRadius);
      expect(parseFloat(borderRadius)).toBeGreaterThan(0); // Should have rounded corners
    }
  });

  test('Dashboard statistics cards display correctly', async ({ page }) => {
    await page.goto('http://localhost:3008/merchant/dashboard');

    // Check if statistics cards have proper layout
    const statsCards = page.locator('[class*="grid"]').first();
    await expect(statsCards).toBeVisible();

    // Check if cards have proper spacing and shadows
    const firstCard = page.locator('.bg-white').first();
    if (await firstCard.isVisible()) {
      const boxShadow = await firstCard.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).not.toBe('none');
    }
  });

  test('Theme toggle enables persistent dark mode', async ({ page }) => {
    await page.goto('http://localhost:3008');

    const themeToggle = page.getByRole('button', { name: /thème sombre/i }).first();
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBeTruthy();

    await page.reload();
    const persisted = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(persisted).toBeTruthy();
  });

  test('Mobile navigation toggle exposes accessible attributes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('http://localhost:3008');

    const menuToggle = page.getByTestId('mobile-menu-button');
    await expect(menuToggle).toHaveAttribute('aria-haspopup', 'true');

    const menuId = await menuToggle.getAttribute('aria-controls');
    expect(menuId).toBeTruthy();

    await menuToggle.press('Enter');
    await expect(page.locator(`#${menuId}`)).toBeVisible();

    await menuToggle.press('Enter');
    await expect(page.locator(`#${menuId}`)).toBeHidden();
  });
});