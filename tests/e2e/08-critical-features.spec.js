const { test, expect } = require('@playwright/test');

test.describe('Tests Critiques - Nouvelles Fonctionnalités', () => {

  test.describe('Système de Notifications', () => {
    test('Notification système should be present on page', async ({ page }) => {
      await page.goto('/');

      // Vérifier que le système de notifications est présent
      await expect(page.locator('[data-testid="notification-container"]')).toBeAttached();

      // Tester notification d'erreur (simulée avec JS)
      await page.evaluate(() => {
        window.notify?.error?.('Test error message', 'Test Title');
      });

      // Vérifier qu'une notification apparaît
      await expect(page.locator('.notification')).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Navigation Mobile', () => {
    test('Mobile navigation should work on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.goto('/');

      // Le menu mobile devrait être visible sur petits écrans
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], .md\\:hidden button');
      await expect(mobileMenuButton).toBeVisible();

      // Cliquer sur le bouton pour ouvrir le menu
      await mobileMenuButton.click();

      // Le menu mobile devrait s'ouvrir
      await expect(page.locator('[data-testid="mobile-menu"], nav.mobile-menu')).toBeVisible({ timeout: 3000 });
    });

    test('Mobile menu should show user profile when authenticated', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Simuler connexion avec localStorage
      await page.goto('/login');
      await page.fill('input[type="email"]', 'jean.dupont@email.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');

      // Attendre redirection
      await page.waitForURL('/', { timeout: 10000 });

      // Ouvrir menu mobile
      const mobileMenuButton = page.locator('.md\\:hidden button').first();
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();

        // Vérifier que le profil utilisateur est visible
        await expect(page.locator('text=Jean')).toBeVisible({ timeout: 5000 });
      }
    });

    test('Mobile drawer toggles and theme persists', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('theme', 'light');
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');

      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenuButton).toBeVisible();

      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toHaveCount(0);

      const themeToggleButton = page.locator('button[aria-label*="thème" i]').first();
      await expect(themeToggleButton).toBeVisible();

      await themeToggleButton.click();
      await expect.poll(async () => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      await expect.poll(async () =>
        page.evaluate(() => document.documentElement.classList.contains('dark'))
      ).toBe(true);
    });
  });

  test.describe('Gestion d\'Erreurs Améliorée', () => {
    test('Network errors should show user-friendly notifications', async ({ page }) => {
      // Simuler une erreur réseau en interceptant les requêtes
      await page.route('**/api/**', route => route.abort());

      await page.goto('/products');

      // Une notification d'erreur devrait apparaître
      await expect(page.locator('.notification, .error-message')).toBeVisible({ timeout: 10000 });
    });

    test('Form validation should show proper error messages', async ({ page }) => {
      await page.goto('/login');

      // Soumettre form vide
      await page.click('button[type="submit"]');

      // Des messages d'erreur devraient apparaître (soit via notifications soit validation HTML5)
      const hasNotification = await page.locator('.notification').isVisible({ timeout: 3000 });
      const hasValidationError = await page.locator('input:invalid, .error').isVisible({ timeout: 3000 });

      expect(hasNotification || hasValidationError).toBeTruthy();
    });
  });

  test.describe('Réservations avec Nouvelles Notifications', () => {
    test('Reservation process should use notifications instead of alerts', async ({ page }) => {
      // Aller à la page de réservation d'un produit
      await page.goto('/products/1/reserve');

      // Si on n'est pas connecté, on devrait voir une notification et être redirigé
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        // Se connecter
        await page.fill('input[type="email"]', 'jean.dupont@email.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        await page.waitForURL('/products/1/reserve', { timeout: 10000 });
      }

      // Surcharger window.alert pour vérifier qu'il n'est pas appelé
      await page.addInitScript(() => {
        window.alertCalled = false;
        window.originalAlert = window.alert;
        window.alert = (msg) => {
          window.alertCalled = true;
          window.originalAlert?.(msg);
        };
      });

      // Essayer de finaliser réservation avec données invalides
      if (await page.locator('button:has-text("Confirmer")').isVisible({ timeout: 5000 })) {
        await page.click('button:has-text("Confirmer")');

        // Vérifier qu'aucune alerte n'a été appelée
        const alertWasCalled = await page.evaluate(() => window.alertCalled);
        expect(alertWasCalled).toBeFalsy();

        // Une notification devrait apparaître à la place
        await expect(page.locator('.notification')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Géolocalisation avec Notifications', () => {
    test('Geolocation errors should show notifications instead of alerts', async ({ page }) => {
      await page.goto('/products');

      // Simuler refus de géolocalisation
      await page.context().grantPermissions([], { origin: page.url() });

      // Surcharger window.alert
      await page.addInitScript(() => {
        window.alertCalled = false;
        window.originalAlert = window.alert;
        window.alert = () => { window.alertCalled = true; };
      });

      // Cliquer sur bouton de géolocalisation s'il existe
      const locationButton = page.locator('button:has-text("localiser"), button:has-text("position")').first();
      if (await locationButton.isVisible({ timeout: 3000 })) {
        await locationButton.click();

        await page.waitForTimeout(2000);

        // Vérifier qu'aucune alerte n'a été appelée
        const alertWasCalled = await page.evaluate(() => window.alertCalled);
        expect(alertWasCalled).toBeFalsy();

        // Une notification devrait apparaître
        await expect(page.locator('.notification')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Interface Admin avec Notifications', () => {
    test('Admin actions should use notification system', async ({ page }) => {
      // Se connecter en tant qu'admin
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@antigaspi.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(3000);

      // Aller au dashboard admin
      await page.goto('/admin/dashboard');

      // Surcharger window.alert
      await page.addInitScript(() => {
        window.alertCalled = false;
        window.originalAlert = window.alert;
        window.alert = () => { window.alertCalled = true; };
      });

      // Essayer une action admin (comme modération d'avis)
      const adminButton = page.locator('button:has-text("Modérer"), button:has-text("Approuver"), button:has-text("Rejeter")').first();
      if (await adminButton.isVisible({ timeout: 3000 })) {
        await adminButton.click();

        await page.waitForTimeout(2000);

        // Vérifier qu'aucune alerte n'a été appelée
        const alertWasCalled = await page.evaluate(() => window.alertCalled);
        expect(alertWasCalled).toBeFalsy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(viewport => {
      test(`Layout should work on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize(viewport);

        await page.goto('/');

        // La page devrait se charger sans erreurs
        await expect(page.locator('body')).toBeVisible();

        // Le header/navbar devrait être visible
        await expect(page.locator('nav, header')).toBeVisible();

        // Aucun élément ne devrait déborder horizontalement
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBeFalsy();
      });
    });
  });

  test.describe('Performance basique', () => {
    test('Pages should load in reasonable time', async ({ page }) => {
      const pages = ['/', '/products', '/login', '/register'];

      for (const url of pages) {
        const startTime = Date.now();
        await page.goto(url);
        const loadTime = Date.now() - startTime;

        // La page devrait se charger en moins de 5 secondes
        expect(loadTime).toBeLessThan(5000);

        // Le contenu principal devrait être visible
        await expect(page.locator('main, .container, body')).toBeVisible();
      }
    });

    test('Images should have proper optimization', async ({ page }) => {
      await page.goto('/products');

      // Attendre que les images se chargent
      await page.waitForTimeout(3000);

      const images = await page.locator('img').all();
      for (let img of images) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          // Les images devraient avoir des attributs alt
          const alt = await img.getAttribute('alt');
          expect(alt).toBeTruthy();
        }
      }
    });
  });
});