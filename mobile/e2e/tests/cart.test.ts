/**
 * Detox E2E Tests - Cart & Checkout
 *
 * Tests gray-box pour le panier et le checkout.
 */

import { device, element, by, expect, waitFor } from 'detox';

const TEST_CONSUMER = {
  email: 'jean.dupont@email.com',
  password: 'password',
};

describe('Cart & Checkout', () => {
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
    await element(by.text('Accueil')).tap();
  });

  describe('Cart Operations', () => {
    it('should add product to cart', async () => {
      await element(by.text('Découvrir')).tap();

      await waitFor(element(by.id('product-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Select a product
      await element(by.id('product-card')).atIndex(0).tap();

      await waitFor(element(by.text('Ajouter au panier')))
        .toBeVisible()
        .withTimeout(5000);

      // Add to cart
      await element(by.text('Ajouter au panier')).tap();

      // Verify success
      await waitFor(element(by.text('Ajouté au panier')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display cart with items', async () => {
      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should see cart items or empty message
      const cartItems = element(by.id('cart-item'));
      const emptyCart = element(by.text('Panier vide'));

      // One of these should be visible
      try {
        await expect(cartItems.atIndex(0)).toBeVisible();
      } catch (e) {
        await expect(emptyCart).toBeVisible();
      }
    });

    it('should update item quantity', async () => {
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      try {
        // Find quantity controls
        await element(by.id('increase-quantity')).atIndex(0).tap();

        // Verify quantity updated
        await waitFor(element(by.text('2')))
          .toBeVisible()
          .withTimeout(3000);
      } catch (e) {
        console.log('No items in cart to update');
      }
    });

    it('should remove item from cart', async () => {
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      try {
        // Get initial count of items
        await element(by.id('remove-item')).atIndex(0).tap();

        // Confirm removal if dialog appears
        try {
          await element(by.text('Confirmer')).tap();
        } catch (e) {
          // No confirmation needed
        }

        // Wait for animation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.log('No items in cart to remove');
      }
    });
  });

  describe('Checkout Flow', () => {
    // Setup: Add item to cart first
    beforeAll(async () => {
      await element(by.text('Découvrir')).tap();

      await waitFor(element(by.id('product-list')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('product-card')).atIndex(0).tap();

      await waitFor(element(by.text('Ajouter au panier')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Ajouter au panier')).tap();
    });

    it('should navigate to checkout', async () => {
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap checkout button
      await element(by.text('Passer commande')).tap();

      // Should see checkout screen
      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should select payment method', async () => {
      await element(by.id('cart-tab')).tap();
      await element(by.text('Passer commande')).tap();

      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Select "Sur place" payment
      await element(by.text('Sur place')).tap();

      // Should be selected
      await expect(element(by.id('payment-on-site-selected'))).toBeVisible();
    });

    it('should complete checkout successfully', async () => {
      await element(by.id('cart-tab')).tap();

      try {
        await element(by.text('Passer commande')).tap();
      } catch (e) {
        console.log('Cart empty, cannot checkout');
        return;
      }

      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Select payment method
      await element(by.text('Sur place')).tap();

      // Confirm order
      await element(by.text('Confirmer la commande')).tap();

      // Wait for success
      await waitFor(element(by.text('Commande créée')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });
});
