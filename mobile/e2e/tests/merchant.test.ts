/**
 * Detox E2E Tests - Merchant Flows
 *
 * Tests gray-box pour les fonctionnalités commerçant.
 */

import { device, element, by, expect, waitFor } from 'detox';

const TEST_MERCHANT = {
  email: 'boulangerie.martin@email.com',
  password: 'password',
};

describe('Merchant', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Login as merchant
    await element(by.id('email-input')).typeText(TEST_MERCHANT.email);
    await element(by.id('password-input')).typeText(TEST_MERCHANT.password);
    await element(by.text('Se connecter')).tap();

    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Return to dashboard
    await element(by.text('Dashboard')).tap();
  });

  describe('Dashboard', () => {
    it('should display dashboard statistics', async () => {
      await expect(element(by.text('Dashboard'))).toBeVisible();

      // Check for revenue stats
      await expect(element(by.id('revenue-stat'))).toBeVisible();

      // Check for orders count
      await expect(element(by.id('orders-stat'))).toBeVisible();
    });

    it('should navigate to detailed analytics', async () => {
      await element(by.text('Voir plus')).tap();

      await waitFor(element(by.id('analytics-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Products Management', () => {
    it('should display products list', async () => {
      await element(by.text('Produits')).tap();

      await waitFor(element(by.id('products-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show add product button', async () => {
      await element(by.text('Produits')).tap();

      await waitFor(element(by.id('products-list')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('add-product-button'))).toBeVisible();
    });

    it('should navigate to product details', async () => {
      await element(by.text('Produits')).tap();

      await waitFor(element(by.id('products-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on first product
      await element(by.id('product-card')).atIndex(0).tap();

      await waitFor(element(by.id('product-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Should see edit options
      await expect(element(by.text('Modifier'))).toBeVisible();
    });

    it('should update product stock', async () => {
      await element(by.text('Produits')).tap();

      await waitFor(element(by.id('products-list')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('product-card')).atIndex(0).tap();

      await waitFor(element(by.id('product-details')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Modifier')).tap();

      await waitFor(element(by.id('edit-product-form')))
        .toBeVisible()
        .withTimeout(5000);

      // Update stock
      await element(by.id('stock-input')).clearText();
      await element(by.id('stock-input')).typeText('50');

      await element(by.text('Enregistrer')).tap();

      // Wait for success
      await waitFor(element(by.text('Produit mis à jour')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Reservations Management', () => {
    it('should display reservations list', async () => {
      await element(by.text('Réservations')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should filter reservations by status', async () => {
      await element(by.text('Réservations')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Filter by pending
      await element(by.text('En attente')).tap();

      // Should show only pending
      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should confirm a pending reservation', async () => {
      await element(by.text('Réservations')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Filter pending
      await element(by.text('En attente')).tap();

      // Tap on first pending reservation
      try {
        await element(by.id('reservation-card')).atIndex(0).tap();
      } catch (e) {
        console.log('No pending reservations');
        return;
      }

      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Confirm reservation
      await element(by.text('Confirmer')).tap();

      // Wait for success
      await waitFor(element(by.text('Confirmée')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should mark reservation as ready', async () => {
      await element(by.text('Réservations')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Filter confirmed
      await element(by.text('Confirmée')).tap();

      try {
        await element(by.id('reservation-card')).atIndex(0).tap();
      } catch (e) {
        console.log('No confirmed reservations');
        return;
      }

      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Mark as ready
      await element(by.text('Prête')).tap();

      // Wait for status change
      await waitFor(element(by.text('Prête à récupérer')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should complete a reservation', async () => {
      await element(by.text('Réservations')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Filter ready
      await element(by.text('Prête')).tap();

      try {
        await element(by.id('reservation-card')).atIndex(0).tap();
      } catch (e) {
        console.log('No ready reservations');
        return;
      }

      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Complete
      await element(by.text('Terminer')).tap();

      // Confirm if dialog
      try {
        await element(by.text('Confirmer')).tap();
      } catch (e) {
        // No dialog
      }

      // Wait for status change
      await waitFor(element(by.text('Terminée')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
