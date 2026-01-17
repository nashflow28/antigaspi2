/**
 * Detox E2E Tests - Authentication
 *
 * Tests gray-box pour l'authentification.
 * Ces tests sont plus robustes que Maestro car ils ont accès
 * aux internals de React Native.
 */

import { device, element, by, expect } from 'detox';

// Test credentials
const TEST_CREDENTIALS = {
  consumer: {
    email: 'jean.dupont@email.com',
    password: 'password',
  },
  merchant: {
    email: 'boulangerie.martin@email.com',
    password: 'password',
  },
  admin: {
    email: 'admin@antigaspi.com',
    password: 'password',
  },
};

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Consumer Login', () => {
    it('should display login screen on app launch', async () => {
      await expect(element(by.text('Connexion'))).toBeVisible();
      await expect(element(by.text('Email'))).toBeVisible();
      await expect(element(by.text('Mot de passe'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@email.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.text('Se connecter')).tap();

      // Attendre l'erreur
      await waitFor(element(by.text('Identifiants incorrects')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should login successfully with valid consumer credentials', async () => {
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.consumer.email);
      await element(by.id('password-input')).clearText();
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.consumer.password);
      await element(by.text('Se connecter')).tap();

      // Attendre la navigation vers l'accueil
      await waitFor(element(by.text('Accueil')))
        .toBeVisible()
        .withTimeout(15000);

      // Vérifier les onglets consumer
      await expect(element(by.text('Découvrir'))).toBeVisible();
      await expect(element(by.text('Favoris'))).toBeVisible();
    });

    it('should navigate to account screen after login', async () => {
      // Login first
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.consumer.email);
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.consumer.password);
      await element(by.text('Se connecter')).tap();

      await waitFor(element(by.text('Accueil')))
        .toBeVisible()
        .withTimeout(15000);

      // Navigate to Account
      await element(by.text('Compte')).tap();
      await expect(element(by.text('Jean'))).toBeVisible();
    });
  });

  describe('Merchant Login', () => {
    it('should login successfully with merchant credentials', async () => {
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.merchant.email);
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.merchant.password);
      await element(by.text('Se connecter')).tap();

      // Merchant devrait voir le Dashboard
      await waitFor(element(by.text('Dashboard')))
        .toBeVisible()
        .withTimeout(15000);

      // Vérifier les onglets merchant
      await expect(element(by.text('Produits'))).toBeVisible();
      await expect(element(by.text('Réservations'))).toBeVisible();
    });
  });

  describe('Logout', () => {
    it('should logout and return to login screen', async () => {
      // Login first
      await element(by.id('email-input')).typeText(TEST_CREDENTIALS.consumer.email);
      await element(by.id('password-input')).typeText(TEST_CREDENTIALS.consumer.password);
      await element(by.text('Se connecter')).tap();

      await waitFor(element(by.text('Accueil')))
        .toBeVisible()
        .withTimeout(15000);

      // Navigate to Account
      await element(by.text('Compte')).tap();

      // Scroll down to find logout button
      await element(by.id('account-scroll-view')).scrollTo('bottom');
      await element(by.text('Déconnexion')).tap();

      // Confirm logout if dialog appears
      try {
        await element(by.text('Confirmer')).tap();
      } catch (e) {
        // Dialog might not appear
      }

      // Should return to login
      await waitFor(element(by.text('Connexion')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
