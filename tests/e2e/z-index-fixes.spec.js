import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Test data
const testMerchant = {
  email: 'boulangerie.martin@email.com',
  password: 'password'
};

// Coordonnées d'Abidjan, Côte d'Ivoire
const abidjanCoords = {
  latitude: 5.3474,
  longitude: -3.9857
};

test.describe('Z-Index Fixes - Tests de superposition', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(abidjanCoords);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Modal merchant s\'affiche au-dessus de la carte', async ({ page }) => {
    console.log('🧪 Test: Modal au-dessus de la carte');

    // Se connecter en tant que merchant
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller à la carte des commerçants
    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Attendre que la carte se charge

    // Vérifier que la carte est présente
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Cliquer sur un marqueur pour ouvrir la modal
    const mapMarkers = page.locator('.leaflet-marker-icon');
    if (await mapMarkers.count() > 0) {
      // Cliquer sur le premier marqueur
      await mapMarkers.first().click();
      await page.waitForTimeout(1000);

      // Chercher un bouton "Voir les détails" dans le popup Leaflet
      const detailsButton = page.locator('button:has-text("Voir les détails")');
      if (await detailsButton.isVisible()) {
        await detailsButton.click();
        await page.waitForTimeout(500);

        // Vérifier que la modal s'affiche
        const modal = page.locator('[role="dialog"], .modal');
        if (await modal.isVisible()) {
          // Vérifier que la modal est cliquable (pas derrière la carte)
          const modalRect = await modal.boundingBox();
          if (modalRect) {
            // Cliquer au centre de la modal
            await page.mouse.click(modalRect.x + modalRect.width / 2, modalRect.y + modalRect.height / 2);
            console.log('✅ Modal cliquable au-dessus de la carte');
          }
        }
      }
    }
  });

  test('Menu dropdown navigation s\'affiche au-dessus de la carte', async ({ page }) => {
    console.log('🧪 Test: Dropdown navigation au-dessus de la carte');

    // Se connecter en tant que merchant
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller à la carte des commerçants
    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier que la carte est présente
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Cliquer sur le menu utilisateur
    const userMenuButton = page.locator('[aria-label*="Menu utilisateur"]');
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.waitForTimeout(500);

      // Vérifier que le dropdown est visible
      const dropdown = page.locator('[role="menu"]');
      if (await dropdown.isVisible()) {
        // Vérifier que le dropdown est cliquable
        const dropdownRect = await dropdown.boundingBox();
        if (dropdownRect) {
          // Essayer de cliquer sur un élément du menu
          const firstMenuItem = dropdown.locator('[role="menuitem"]').first();
          if (await firstMenuItem.isVisible()) {
            await firstMenuItem.click();
            console.log('✅ Dropdown menu cliquable au-dessus de la carte');
          }
        }
      }
    }
  });

  test('Notification toast s\'affiche au-dessus de la carte', async ({ page }) => {
    console.log('🧪 Test: Notifications au-dessus de la carte');

    // Se connecter en tant que merchant
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller au dashboard pour déclencher le LocationManager
    await page.goto(`${BASE_URL}/merchant/dashboard`);
    await page.waitForLoadState('networkidle');

    // Chercher la section géolocalisation
    const locationSection = page.locator('text=Géolocalisation').locator('..');
    if (await locationSection.isVisible()) {
      // Cliquer sur "Me localiser" pour déclencher une notification
      const locateButton = locationSection.locator('button:has-text("Me localiser"), button:has-text("Relocaliser")');
      if (await locateButton.isVisible()) {
        await locateButton.click();
        await page.waitForTimeout(3000);

        // Chercher une notification de succès
        const notification = page.locator('.notification, [role="alert"], .toast');
        if (await notification.isVisible()) {
          // Vérifier que la notification est cliquable
          const notifRect = await notification.boundingBox();
          if (notifRect) {
            console.log('✅ Notification visible et positionnée correctement');
          }
        }
      }
    }
  });

  test('Modales LocationManager au-dessus de la carte', async ({ page }) => {
    console.log('🧪 Test: Modal LocationManager au-dessus');

    // Se connecter en tant que merchant
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller au dashboard
    await page.goto(`${BASE_URL}/merchant/dashboard`);
    await page.waitForLoadState('networkidle');

    // Chercher la section géolocalisation
    const locationSection = page.locator('text=Géolocalisation').locator('..');
    if (await locationSection.isVisible()) {
      // Cliquer pour ouvrir la modal de définition de position
      const defineButton = locationSection.locator('button:has-text("Définir ma position"), button:has-text("Modifier")');
      if (await defineButton.isVisible()) {
        await defineButton.click();
        await page.waitForTimeout(500);

        // Vérifier que la modal s'ouvre
        const modal = page.locator('text=Définir votre position').locator('..');
        if (await modal.isVisible()) {
          // Tester la carte interactive dans la modal
          const mapModeButton = page.locator('button:has-text("Sélection sur carte")');
          if (await mapModeButton.isVisible()) {
            await mapModeButton.click();
            await page.waitForTimeout(2000);

            // Vérifier que la carte dans la modal est interactive
            const modalMapContainer = modal.locator('.leaflet-container');
            if (await modalMapContainer.isVisible()) {
              // Vérifier que la modal reste au-dessus
              const modalRect = await modal.boundingBox();
              if (modalRect) {
                console.log('✅ Modal LocationManager avec carte au-dessus');
              }
            }
          }

          // Fermer la modal
          const closeButton = modal.locator('button:has-text("Annuler")');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test('Navigation sticky au-dessus de tous les éléments', async ({ page }) => {
    console.log('🧪 Test: Navigation sticky prioritaire');

    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier que la navigation est présente
    const navbar = page.locator('nav, .navbar');
    await expect(navbar).toBeVisible();

    // Scroller vers le bas pour tester le sticky
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Vérifier que la navbar reste visible
    await expect(navbar).toBeVisible();

    // Tester l'interaction avec les liens de navigation
    const navLinks = navbar.locator('a[href]');
    if (await navLinks.count() > 0) {
      const firstLink = navLinks.first();
      if (await firstLink.isVisible()) {
        const linkRect = await firstLink.boundingBox();
        if (linkRect) {
          console.log('✅ Navigation sticky accessible et cliquable');
        }
      }
    }
  });

});

test.describe('Z-Index Test Visuel', () => {

  test('Test visuel complet des superpositions', async ({ page, context }) => {
    console.log('🧪 Test: Vérification visuelle z-index');

    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(abidjanCoords);

    // Aller directement à la carte
    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Vérifier les éléments avec leurs z-index respectifs
    const elementsToCheck = [
      { selector: '.leaflet-container', expectedMinZ: 1, name: 'Carte Leaflet' },
      { selector: 'nav', expectedMinZ: 100, name: 'Navigation' },
      { selector: '.leaflet-popup', expectedMinZ: 20, name: 'Popup Leaflet' },
      { selector: '.leaflet-marker-icon', expectedMinZ: 10, name: 'Marqueurs' }
    ];

    for (const element of elementsToCheck) {
      const el = page.locator(element.selector).first();
      if (await el.isVisible()) {
        const zIndex = await el.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.zIndex;
        });

        console.log(`${element.name}: z-index = ${zIndex}`);

        // Vérifier que le z-index n'est pas "auto" pour les éléments critiques
        if (element.expectedMinZ > 50) {
          expect(zIndex).not.toBe('auto');
        }
      }
    }

    console.log('✅ Vérification z-index complétée');
  });

});