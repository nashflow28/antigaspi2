const { test, expect } = require('@playwright/test');

test.describe('Interface Consumer - Tests E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as consumer before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'jean.dupont@email.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Consumer dashboard should load with welcome message and stats', async ({ page }) => {
    // Check that we're on the consumer dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/);

    // Check welcome message
    await expect(page.locator('text=Bienvenue')).toBeVisible();

    // Check stats cards are visible
    await expect(page.locator('text=Réservations')).toBeVisible();
    await expect(page.locator('text=Économies')).toBeVisible();

    // Check recent reservations section
    await expect(page.locator('text=Réservations récentes')).toBeVisible();
  });

  test('Products page should display products with filters', async ({ page }) => {
    await page.goto('http://localhost:3000/products');

    // Check page title
    await expect(page.locator('h1, h2')).toContainText('Produits');

    // Check that products are displayed
    await expect(page.locator('[data-testid="product-card"], .product-card')).toHaveCount({ min: 1 });

    // Check filter options
    await expect(page.locator('select, input[type="search"]')).toHaveCount({ min: 1 });

    // Test search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche"], input[placeholder*="chercher"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('pain');
      await page.waitForTimeout(1000); // Wait for search results
    }
  });

  test('Product detail page should show product info and reservation button', async ({ page }) => {
    await page.goto('http://localhost:3000/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.click();

    // Should be on product detail page
    await expect(page).toHaveURL(/.*\/products\/\d+$/);

    // Check product details are visible
    await expect(page.locator('h1, h2')).toBeVisible();
    await expect(page.locator('text=F CFA, text=XOF')).toBeVisible();

    // Check reservation button
    await expect(page.locator('button, a').filter({ hasText: /réserver|commander/i })).toBeVisible();
  });

  test('Reservation process should work end-to-end', async ({ page }) => {
    await page.goto('http://localhost:3000/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.click();

    // Click reservation button
    const reserveButton = page.locator('button, a').filter({ hasText: /réserver|commander/i }).first();
    await reserveButton.click();

    // Should be on reservation page
    await expect(page).toHaveURL(/.*\/products\/\d+\/reserve$/);

    // Fill reservation form
    const quantityInput = page.locator('input[type="number"], input[name="quantity"]').first();
    if (await quantityInput.count() > 0) {
      await quantityInput.fill('1');
    }

    // Submit reservation
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /confirmer|réserver/i }).first();
    await submitButton.click();

    // Check for success message or redirect
    await page.waitForTimeout(3000);
    const currentUrl = page.url();

    // Should either show success message or redirect to reservations/dashboard
    const hasSuccessMessage = await page.locator('text=succès, text=confirmé, text=réservé').count() > 0;
    const redirectedToReservations = currentUrl.includes('/reservations') || currentUrl.includes('/dashboard');

    expect(hasSuccessMessage || redirectedToReservations).toBe(true);
  });

  test('Reservations page should show user reservations', async ({ page }) => {
    await page.goto('http://localhost:3000/reservations');

    // Check page title
    await expect(page.locator('h1, h2')).toContainText(/réservations|commandes/i);

    // Check if reservations are displayed or "no reservations" message
    const hasReservations = await page.locator('[data-testid="reservation-card"], .reservation-card').count() > 0;
    const hasNoReservationsMessage = await page.locator('text=aucune réservation, text=pas de réservation').count() > 0;

    expect(hasReservations || hasNoReservationsMessage).toBe(true);
  });

  test('Profile page should be accessible and editable', async ({ page }) => {
    await page.goto('http://localhost:3000/profile');

    // Check page title
    await expect(page.locator('h1, h2')).toContainText(/profil|compte/i);

    // Check that user info is pre-filled
    await expect(page.locator('input[name="first_name"], input[id="first_name"]')).toHaveValue('Jean');
    await expect(page.locator('input[name="last_name"], input[id="last_name"]')).toHaveValue('Dupont');
    await expect(page.locator('input[name="email"], input[id="email"]')).toHaveValue('jean.dupont@email.com');
  });

  test('Navigation should work properly', async ({ page }) => {
    // Test navigation from dashboard to different pages
    await page.goto('http://localhost:3000/dashboard');

    // Test navigation to products
    await page.click('a[href="/products"], a:has-text("Produits")');
    await expect(page).toHaveURL(/.*\/products$/);

    // Test navigation to reservations
    await page.click('a[href="/reservations"], a:has-text("Réservations")');
    await expect(page).toHaveURL(/.*\/reservations$/);

    // Test navigation back to dashboard via logo or home link
    await page.click('a[href="/"], a[href="/dashboard"], .logo').first();
    await expect(page).toHaveURL(/.*\/(dashboard)?$/);
  });

  test('Logout should work properly', async ({ page }) => {
    // Find and click logout button/link
    const logoutButton = page.locator('button, a').filter({ hasText: /déconnexion|logout/i }).first();

    if (await logoutButton.count() > 0) {
      await logoutButton.click();

      // Should redirect to home or login page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(login|register)?$/);

      // Should not be able to access protected pages
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*\/login$/);
    }
  });
});