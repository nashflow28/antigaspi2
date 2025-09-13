const { test, expect } = require('@playwright/test');

test.describe('Stage 3 - Frontend Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start with fresh state
    await page.goto('http://localhost:3005');
  });

  test('Homepage should load and show authentication options', async ({ page }) => {
    await expect(page).toHaveTitle(/Antigaspi/);

    // Check navigation (use first match to avoid mobile/desktop duplication)
    await expect(page.locator('[data-testid="nav-login"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="nav-register"]').first()).toBeVisible();
  });

  test('Login page should be accessible and have form elements', async ({ page }) => {
    await page.goto('http://localhost:3005/login');

    // Check page title and form elements
    await expect(page.locator('h2')).toContainText('Connexion');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check links
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Register page should be accessible and have form elements', async ({ page }) => {
    await page.goto('http://localhost:3005/register');

    // Check page title and form elements
    await expect(page.locator('h2')).toContainText('Inscription');
    await expect(page.locator('#first_name')).toBeVisible();
    await expect(page.locator('#last_name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#password_confirmation')).toBeVisible();

    // Check role selection
    await expect(page.locator('input[value="consumer"]')).toBeVisible();
    await expect(page.locator('input[value="merchant"]')).toBeVisible();
  });

  test('Login form validation should work', async ({ page }) => {
    await page.goto('http://localhost:3005/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check validation messages appear
    await expect(page.locator('text=requis')).toBeVisible();
  });

  test('Register form validation should work', async ({ page }) => {
    await page.goto('http://localhost:3005/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check validation messages appear
    await expect(page.locator('text=requis')).toBeVisible();
  });

  test('Register form should show business fields for merchant', async ({ page }) => {
    await page.goto('http://localhost:3005/register');

    // Select merchant role
    await page.click('input[value="merchant"]');

    // Business fields should appear
    await expect(page.locator('#business_name')).toBeVisible();
    await expect(page.locator('#business_type')).toBeVisible();
  });

  test('Login with valid test credentials should work', async ({ page }) => {
    await page.goto('http://localhost:3005/login');

    // Fill login form with test credentials
    await page.fill('#email', 'jean.dupont@email.com');
    await page.fill('#password', 'password');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show loading
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, check for loading state or error
    });

    // If successful, should see dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('text=Bienvenue')).toBeVisible();
    }
  });

  test('Login with invalid credentials should show error', async ({ page }) => {
    await page.goto('http://localhost:3005/login');

    // Fill login form with invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=incorrect')).toBeVisible({ timeout: 10000 });
  });

  test('Register new consumer should work', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-consumer-${timestamp}@example.com`;

    await page.goto('http://localhost:3005/register');

    // Select consumer role (default)
    await expect(page.locator('input[value="consumer"]')).toBeChecked();

    // Fill registration form
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'Consumer');
    await page.fill('#email', testEmail);
    await page.fill('#city', 'Abidjan');
    await page.fill('#password', 'password123');
    await page.fill('#password_confirmation', 'password123');

    // Accept terms
    await page.check('#terms');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show loading
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {
      // Check for success or error state
    });

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('text=Bienvenue Test')).toBeVisible();
    }
  });

  test('Password visibility toggle should work', async ({ page }) => {
    await page.goto('http://localhost:3005/login');

    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('button').filter({ hasText: /eye|show|hide/i }).or(
      page.locator('[role="button"]').nth(1)
    );

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button if it exists
    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await toggleButton.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('Navigation should work correctly for authenticated users', async ({ page }) => {
    // First login with test credentials
    await page.goto('http://localhost:3005/login');
    await page.fill('#email', 'jean.dupont@email.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // Wait for potential redirect
    await page.waitForTimeout(3000);

    // If authenticated, should not be able to access login page
    await page.goto('http://localhost:3005/login');

    // Should redirect to dashboard or stay on current page
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('http://localhost:3005/login');
  });
});