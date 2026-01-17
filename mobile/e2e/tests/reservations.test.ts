/**
 * Detox E2E Tests - Reservations
 *
 * Tests gray-box pour le flux de réservation complet.
 */

import { device, element, by, expect, waitFor } from 'detox';

const TEST_CONSUMER = {
  email: 'jean.dupont@email.com',
  password: 'password',
};

describe('Reservations', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Login as consumer
    await element(by.id('email-input')).typeText(TEST_CONSUMER.email);
    await element(by.id('password-input')).typeText(TEST_CONSUMER.password);
    await element(by.text('Se connecter')).tap();

    await waitFor(element(by.text('Accueil')))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Navigate to home
    await element(by.text('Accueil')).tap();
  });

  describe('Create Reservation', () => {
    it('should navigate to product list', async () => {
      await element(by.text('Découvrir')).tap();

      await waitFor(element(by.id('product-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should view product details', async () => {
      await element(by.text('Découvrir')).tap();

      await waitFor(element(by.id('product-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on first product
      await element(by.id('product-card')).atIndex(0).tap();

      // Verify product details screen
      await waitFor(element(by.text('Réserver')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Description'))).toBeVisible();
    });

    it('should create a reservation successfully', async () => {
      await element(by.text('Découvrir')).tap();

      await waitFor(element(by.id('product-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Select a product
      await element(by.id('product-card')).atIndex(0).tap();

      await waitFor(element(by.text('Réserver')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap reserve button
      await element(by.text('Réserver')).tap();

      // Handle quantity modal if present
      try {
        await waitFor(element(by.text('Quantité')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.text('Confirmer')).tap();
      } catch (e) {
        // Direct reservation without quantity modal
      }

      // Wait for success
      await waitFor(element(by.text('Réservation créée')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('View Reservations', () => {
    it('should display reservations list', async () => {
      // Navigate to orders/reservations tab
      await element(by.text('Commandes')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show reservation details', async () => {
      await element(by.text('Commandes')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on first reservation
      await element(by.id('reservation-card')).atIndex(0).tap();

      // Verify details screen
      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Code de réservation'))).toBeVisible();
    });
  });

  describe('Cancel Reservation', () => {
    it('should cancel a pending reservation', async () => {
      await element(by.text('Commandes')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Find a pending reservation
      try {
        await element(by.text('En attente')).atIndex(0).tap();
      } catch (e) {
        // No pending reservations, skip test
        console.log('No pending reservations to cancel');
        return;
      }

      // Wait for details
      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap cancel button
      await element(by.text('Annuler')).tap();

      // Confirm cancellation
      await waitFor(element(by.text('Confirmer')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('Confirmer')).tap();

      // Verify cancellation success
      await waitFor(element(by.text('Annulée')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should not allow cancelling confirmed reservations', async () => {
      await element(by.text('Commandes')).tap();

      await waitFor(element(by.id('reservations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Find a confirmed reservation
      try {
        await element(by.text('Confirmée')).atIndex(0).tap();
      } catch (e) {
        console.log('No confirmed reservations to test');
        return;
      }

      await waitFor(element(by.id('reservation-details')))
        .toBeVisible()
        .withTimeout(5000);

      // Cancel button should not be visible for confirmed reservations
      await expect(element(by.text('Annuler'))).not.toBeVisible();
    });
  });
});
