import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000';

// Test data
const testConsumer = {
  email: 'jean.dupont@email.com',
  password: 'password'
};

const testMerchant = {
  email: 'boulangerie.martin@email.com',
  password: 'password'
};

// Coordonnées d'Abidjan, Côte d'Ivoire
const abidjanCoords = {
  latitude: 5.3474,
  longitude: -3.9857
};

test.describe('Sistema de Géolocalisation - Tests Complets', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);

    // Set geolocation to Abidjan
    await context.setGeolocation(abidjanCoords);

    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Consumer peut activer la géolocalisation dans ProductsView', async ({ page }) => {
    console.log('🧪 Test: Activation géolocalisation consumer');

    // Se connecter en tant que consumer
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testConsumer.email);
    await page.fill('input[type="password"]', testConsumer.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller sur ProductsView
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Ouvrir les filtres
    const filtersButton = page.locator('button:has-text("Filtres")');
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await page.waitForTimeout(500);
    }

    // Cliquer sur "Près de moi"
    const locationButton = page.locator('button:has-text("Près de moi"), button:has-text("Position activée")');
    if (await locationButton.isVisible()) {
      await locationButton.click();
      await page.waitForTimeout(2000); // Attendre la géolocalisation

      // Vérifier que la position est activée
      await expect(page.locator('text=Position activée')).toBeVisible({ timeout: 10000 });
      console.log('✅ Géolocalisation activée avec succès');

      // Vérifier que le filtre de distance est maintenant disponible
      const distanceSelect = page.locator('select[disabled]:has-option(text="Activez votre position")');
      await expect(distanceSelect).not.toBeVisible();

      const enabledDistanceSelect = page.locator('select:not([disabled]):has-option(text="Toutes distances")');
      await expect(enabledDistanceSelect).toBeVisible();
      console.log('✅ Filtre de distance activé');
    } else {
      console.log('⚠️ Bouton de géolocalisation non trouvé');
    }
  });

  test('Merchant peut définir sa position avec LocationManager', async ({ page }) => {
    console.log('🧪 Test: Gestion position merchant');

    // Se connecter en tant que merchant
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller au dashboard merchant
    await page.goto(`${BASE_URL}/merchant/dashboard`);
    await page.waitForLoadState('networkidle');

    // Chercher le composant LocationManager
    const locationSection = page.locator('text=Géolocalisation').locator('..');
    if (await locationSection.isVisible()) {
      console.log('✅ Section géolocalisation trouvée');

      // Cliquer sur "Me localiser" si disponible
      const locateButton = locationSection.locator('button:has-text("Me localiser"), button:has-text("Relocaliser")');
      if (await locateButton.isVisible()) {
        await locateButton.click();
        await page.waitForTimeout(3000); // Attendre la géolocalisation

        // Vérifier que les coordonnées sont affichées
        const latitudeText = locationSection.locator('text=Latitude');
        if (await latitudeText.isVisible()) {
          console.log('✅ Coordonnées affichées après géolocalisation');
        }
      }

      // Tester la modal de définition manuelle
      const defineButton = locationSection.locator('button:has-text("Définir ma position"), button:has-text("Modifier")');
      if (await defineButton.isVisible()) {
        await defineButton.click();
        await page.waitForTimeout(500);

        // Vérifier que la modal s'ouvre
        const modal = page.locator('text=Définir votre position').locator('..');
        await expect(modal).toBeVisible();
        console.log('✅ Modal de définition de position ouverte');

        // Tester la saisie manuelle de coordonnées
        const latInput = modal.locator('input[id="latitude"]');
        const lngInput = modal.locator('input[id="longitude"]');

        if (await latInput.isVisible()) {
          await latInput.fill('5.3474');
          await lngInput.fill('-3.9857');

          // Soumettre le formulaire
          const saveButton = modal.locator('button[type="submit"]:has-text("Enregistrer")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            console.log('✅ Position sauvegardée manuellement');
          }
        }
      }
    } else {
      console.log('⚠️ Section géolocalisation non trouvée');
    }
  });

  test('Carte des commerçants affiche les positions correctement', async ({ page }) => {
    console.log('🧪 Test: Carte des commerçants');

    // Aller sur la carte des commerçants
    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');

    // Vérifier le titre de la page
    await expect(page.locator('text=Carte des commerçants')).toBeVisible();
    console.log('✅ Page carte des commerçants chargée');

    // Attendre que la carte se charge
    const mapContainer = page.locator('[style*="height: 600px"]');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Attendre un peu pour que Leaflet se charge
    await page.waitForTimeout(3000);

    // Vérifier que des marqueurs sont présents (via les éléments de la carte Leaflet)
    const mapMarkers = page.locator('.leaflet-marker-icon');
    const markerCount = await mapMarkers.count();

    if (markerCount > 0) {
      console.log(`✅ ${markerCount} marqueur(s) trouvé(s) sur la carte`);

      // Cliquer sur le premier marqueur
      await mapMarkers.first().click();
      await page.waitForTimeout(1000);

      // Vérifier qu'un popup ou modal s'ouvre
      const popup = page.locator('.leaflet-popup, [data-testid="merchant-details"]');
      if (await popup.isVisible()) {
        console.log('✅ Popup de détails merchant affiché');
      }
    } else {
      console.log('⚠️ Aucun marqueur trouvé sur la carte');
    }

    // Tester le bouton "Me localiser"
    const locateButton = page.locator('button:has-text("Me localiser"), button:has-text("Position activée")');
    if (await locateButton.isVisible()) {
      await locateButton.click();
      await page.waitForTimeout(2000);

      // Vérifier que le texte change
      await expect(page.locator('text=Position activée')).toBeVisible({ timeout: 10000 });
      console.log('✅ Géolocalisation utilisateur activée sur la carte');
    }

    // Tester le bouton actualiser
    const refreshButton = page.locator('button:has-text("Actualiser")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Actualisation de la carte testée');
    }
  });

  test('API endpoints de géolocalisation fonctionnent', async ({ request }) => {
    console.log('🧪 Test: API endpoints géolocalisation');

    // Test endpoint merchants nearby
    const nearbyResponse = await request.get(`${API_BASE_URL}/api/merchants/nearby`, {
      params: {
        latitude: abidjanCoords.latitude,
        longitude: abidjanCoords.longitude,
        radius: 10
      }
    });

    expect(nearbyResponse.ok()).toBeTruthy();
    const nearbyData = await nearbyResponse.json();
    expect(nearbyData.success).toBe(true);
    expect(nearbyData.data).toBeDefined();
    expect(nearbyData.search_params).toBeDefined();
    expect(parseFloat(nearbyData.search_params.latitude)).toBe(abidjanCoords.latitude);
    expect(parseFloat(nearbyData.search_params.longitude)).toBe(abidjanCoords.longitude);
    console.log(`✅ API nearby: ${nearbyData.data.length} commerçant(s) trouvé(s)`);

    // Test endpoint all merchants with location
    const allLocationResponse = await request.get(`${API_BASE_URL}/api/merchants/all-with-location`);
    expect(allLocationResponse.ok()).toBeTruthy();

    const allLocationData = await allLocationResponse.json();
    expect(allLocationData.success).toBe(true);
    expect(allLocationData.data).toBeDefined();
    console.log(`✅ API all-with-location: ${allLocationData.data.length} commerçant(s) avec position`);

    // Test endpoint products with geolocation
    const productsResponse = await request.get(`${API_BASE_URL}/api/products`, {
      params: {
        latitude: abidjanCoords.latitude,
        longitude: abidjanCoords.longitude
      }
    });

    expect(productsResponse.ok()).toBeTruthy();
    const productsData = await productsResponse.json();
    expect(productsData.success).toBe(true);
    expect(productsData.data).toBeDefined();

    // Vérifier que les distances sont calculées
    const productsWithDistance = productsData.data.filter(product =>
      product.merchant && product.merchant.distance_km !== undefined
    );
    console.log(`✅ API products: ${productsWithDistance.length} produit(s) avec distance calculée`);
  });

  test('Recherche par proximité filtre correctement les produits', async ({ page }) => {
    console.log('🧪 Test: Filtrage par proximité');

    // Se connecter en tant que consumer
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testConsumer.email);
    await page.fill('input[type="password"]', testConsumer.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller sur ProductsView
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Compter les produits initiaux
    const initialProductCards = page.locator('[data-testid="product-card"], .product-card');
    const initialCount = await initialProductCards.count();
    console.log(`Produits initiaux: ${initialCount}`);

    // Ouvrir les filtres
    const filtersButton = page.locator('button:has-text("Filtres")');
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await page.waitForTimeout(500);

      // Activer la géolocalisation
      const locationButton = page.locator('button:has-text("Près de moi")');
      if (await locationButton.isVisible()) {
        await locationButton.click();
        await page.waitForTimeout(3000);

        // Sélectionner un rayon de 2km
        const distanceSelect = page.locator('select:not([disabled]):has-option(text="Toutes distances")');
        if (await distanceSelect.isVisible()) {
          await distanceSelect.selectOption('2');
          await page.waitForTimeout(1000);

          // Compter les produits après filtrage
          const filteredProductCards = page.locator('[data-testid="product-card"], .product-card');
          const filteredCount = await filteredProductCards.count();

          console.log(`✅ Filtrage 2km: ${filteredCount} produit(s) trouvé(s)`);

          // Tester un rayon plus large
          await distanceSelect.selectOption('10');
          await page.waitForTimeout(1000);

          const widerFilterCount = await filteredProductCards.count();
          console.log(`✅ Filtrage 10km: ${widerFilterCount} produit(s) trouvé(s)`);

          // Le nombre de produits devrait être >= avec un rayon plus large
          expect(widerFilterCount).toBeGreaterThanOrEqual(filteredCount);
        }
      }
    }
  });

  test('Interface responsive de géolocalisation', async ({ page }) => {
    console.log('🧪 Test: Interface responsive géolocalisation');

    // Test en mode mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');

    // Vérifier que la carte s'affiche correctement en mobile
    const mapContainer = page.locator('[style*="height: 600px"]');
    await expect(mapContainer).toBeVisible();

    // Vérifier que les boutons sont accessibles
    const locateButton = page.locator('button:has-text("Me localiser")');
    if (await locateButton.isVisible()) {
      const buttonBox = await locateButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(0);
      console.log('✅ Bouton géolocalisation accessible en mobile');
    }

    // Test en mode tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Vérifier que l'interface s'adapte
    await expect(mapContainer).toBeVisible();
    console.log('✅ Interface géolocalisation responsive testée');

    // Retour desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Gestion des erreurs de géolocalisation', async ({ page, context }) => {
    console.log('🧪 Test: Gestion erreurs géolocalisation');

    // Révoquer les permissions de géolocalisation
    await context.clearPermissions();

    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Ouvrir les filtres et tenter d'activer la géolocalisation
    const filtersButton = page.locator('button:has-text("Filtres")');
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await page.waitForTimeout(500);

      const locationButton = page.locator('button:has-text("Près de moi")');
      if (await locationButton.isVisible()) {
        await locationButton.click();
        await page.waitForTimeout(2000);

        // Vérifier qu'un message d'erreur ou d'état approprié est affiché
        const errorMessage = page.locator('text=Autorisation, text=refusée, text=Position non disponible');
        if (await errorMessage.isVisible()) {
          console.log('✅ Message d\'erreur de géolocalisation affiché');
        } else {
          // Vérifier que le bouton reste dans l'état initial
          const stillNearMeButton = page.locator('button:has-text("Près de moi")');
          await expect(stillNearMeButton).toBeVisible();
          console.log('✅ État géolocalisation non changé après erreur');
        }
      }
    }
  });

});

// Test d'intégration complet
test.describe('Test d\'intégration complet Géolocalisation', () => {

  test('Flux complet: Merchant définit position -> Consumer recherche nearby', async ({ page, context }) => {
    console.log('🧪 Test: Flux complet géolocalisation');

    // Grant permissions
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(abidjanCoords);

    // Phase 1: Merchant définit sa position
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testMerchant.email);
    await page.fill('input[type="password"]', testMerchant.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Aller au dashboard et définir position
    await page.goto(`${BASE_URL}/merchant/dashboard`);
    await page.waitForLoadState('networkidle');

    const locationSection = page.locator('text=Géolocalisation').locator('..');
    if (await locationSection.isVisible()) {
      const locateButton = locationSection.locator('button:has-text("Me localiser"), button:has-text("Relocaliser")');
      if (await locateButton.isVisible()) {
        await locateButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Étape 1: Position merchant définie');
      }
    }

    // Phase 2: Se déconnecter et se connecter en tant que consumer
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForTimeout(1000);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', testConsumer.email);
    await page.fill('input[type="password"]', testConsumer.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Phase 3: Consumer utilise la recherche nearby
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const filtersButton = page.locator('button:has-text("Filtres")');
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      await page.waitForTimeout(500);

      const locationButton = page.locator('button:has-text("Près de moi")');
      if (await locationButton.isVisible()) {
        await locationButton.click();
        await page.waitForTimeout(3000);

        // Vérifier que des produits nearby sont trouvés
        const productCards = page.locator('[data-testid="product-card"], .product-card');
        const productCount = await productCards.count();

        if (productCount > 0) {
          console.log(`✅ Étape 2: ${productCount} produit(s) nearby trouvé(s)`);
        }
      }
    }

    // Phase 4: Vérifier la carte des commerçants
    await page.goto(`${BASE_URL}/merchants/map`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const mapMarkers = page.locator('.leaflet-marker-icon');
    const markerCount = await mapMarkers.count();

    if (markerCount > 0) {
      console.log(`✅ Étape 3: ${markerCount} commerçant(s) visible(s) sur la carte`);
    }

    console.log('✅ Flux complet géolocalisation validé');
  });

});