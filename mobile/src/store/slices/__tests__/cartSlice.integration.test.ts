import { configureStore } from '@reduxjs/toolkit'
import cartReducer, {
  fetchCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
  resetCartState,
  cartInitialState,
} from '../cartSlice'
import apiService from '../../../services/api'

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getCart: jest.fn(),
    addCartItem: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    createOrder: jest.fn(),
  },
}))

jest.mock('../../../utils/logger', () => ({
  storeLogger: { warn: jest.fn(), log: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  createLogger: () => ({ warn: jest.fn(), log: jest.fn() }),
}))

jest.mock('../walletSlice', () => ({
  fetchWallet: jest.fn(() => ({ type: 'wallet/fetch/pending' })),
}))

const mockedApi = apiService as jest.Mocked<typeof apiService>

type Cart = import('../../../types').Cart
type CartItem = import('../../../types').CartItem
type CartCheckoutPayload = import('../../../types').CartCheckoutPayload
type OrderCreationResponse = import('../../../types').OrderCreationResponse

function createCartTestStore() {
  return configureStore({ reducer: { cart: cartReducer } })
}

type CartTestStore = ReturnType<typeof createCartTestStore>

function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 1,
    items: [{
      id: 1,
      product_id: 1,
      quantity: 2,
      unit_price: 250,
      total_price: 500,
      product: { id: 1, name: 'Pain complet', discounted_price: 250, available_quantity: 10 },
    }],
    total_amount: 500,
    items_count: 1,
    ...overrides,
  }
}

function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    product_id: 1,
    quantity: 1,
    unit_price: 250,
    total_price: 250,
    product: { id: 1, name: 'Pain complet', discounted_price: 250, available_quantity: 10 },
    ...overrides,
  }
}

function createCheckoutPayload(overrides: Partial<CartCheckoutPayload> = {}): CartCheckoutPayload {
  return {
    paymentMethod: 'on_site',
    pickupDate: '2026-01-15',
    pickupTime: '12:00',
    ...overrides,
  }
}

function createOrderResponse(orderNumber: string, overrides: Partial<OrderCreationResponse['data']> = {}): OrderCreationResponse {
  return {
    success: true,
    message: 'Commande créée',
    data: {
      order: {
        id: 1,
        user_id: 1,
        order_number: orderNumber,
        total_amount: 500,
        status: 'pending',
        payment_status: 'pending',
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        notes: null,
        reservations: [],
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
      order_id: 1,
      order_number: orderNumber,
      total_amount: 500,
      items_count: 1,
      payment_status: 'pending',
      ...overrides,
    },
  }
}

describe('cartSlice - Integration Tests', () => {
  let store: CartTestStore

  beforeEach(() => {
    store = createCartTestStore()
    jest.clearAllMocks()
  })

  describe('fetchCart', () => {
    it('should load cart from API and update state', async () => {
      const mockCart = createMockCart()
      mockedApi.getCart.mockResolvedValue({
        success: true,
        data: mockCart,
      })

      expect(store.getState().cart.cart).toBeNull()

      await store.dispatch(fetchCart())

      const state = store.getState().cart
      expect(state.cart).toEqual(mockCart)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle empty cart', async () => {
      const emptyCart = createMockCart({ items: [], items_count: 0, total_amount: 0 })
      mockedApi.getCart.mockResolvedValue({
        success: true,
        data: emptyCart,
      })

      await store.dispatch(fetchCart())

      expect(store.getState().cart.cart?.items).toHaveLength(0)
      expect(store.getState().cart.cart?.total_amount).toBe(0)
    })

    it('should set error on fetch failure', async () => {
      mockedApi.getCart.mockRejectedValue(new Error('Erreur réseau'))

      await store.dispatch(fetchCart())

      const state = store.getState().cart
      expect(state.error).toBe('Erreur réseau')
      expect(state.loading).toBe(false)
    })
  })

  describe('addCartItem', () => {
    it('should add item to cart and update state', async () => {
      const initialCart = createMockCart({ items: [], items_count: 0 })
      const updatedCart = createMockCart()

      mockedApi.getCart.mockResolvedValue({ success: true, data: initialCart })
      await store.dispatch(fetchCart())
      expect(store.getState().cart.cart?.items).toHaveLength(0)

      mockedApi.addCartItem.mockResolvedValue({ success: true, data: updatedCart })

      await store.dispatch(addCartItem({ productId: 1, quantity: 2 }))

      const state = store.getState().cart
      expect(state.cart?.items).toHaveLength(1)
      expect(state.cart?.items[0].product_id).toBe(1)
      expect(state.updating).toBe(false)
    })

    it('should handle adding item that exceeds stock', async () => {
      mockedApi.addCartItem.mockRejectedValue(new Error('Stock insuffisant'))

      await store.dispatch(addCartItem({ productId: 1, quantity: 100 }))

      expect(store.getState().cart.error).toBe('Stock insuffisant')
    })

    it('should update existing item quantity if product already in cart', async () => {
      const cartWithItem = createMockCart({
        items: [createMockCartItem({ quantity: 2 })],
        items_count: 2,
      })
      const cartWithUpdatedItem = createMockCart({
        items: [createMockCartItem({ quantity: 4 })],
        items_count: 4,
      })

      mockedApi.getCart.mockResolvedValue({ success: true, data: cartWithItem })
      await store.dispatch(fetchCart())

      mockedApi.addCartItem.mockResolvedValue({ success: true, data: cartWithUpdatedItem })
      await store.dispatch(addCartItem({ productId: 1, quantity: 2 }))

      expect(store.getState().cart.cart?.items[0].quantity).toBe(4)
    })
  })

  describe('updateCartItem', () => {
    beforeEach(async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())
    })

    it('should update item quantity', async () => {
      const updatedCart = createMockCart({
        items: [createMockCartItem({ quantity: 5, total_price: 1250 })],
        items_count: 5,
        total_amount: 1250,
      })
      mockedApi.updateCartItem.mockResolvedValue({ success: true, data: updatedCart })

      await store.dispatch(updateCartItem({ itemId: 1, quantity: 5 }))

      const state = store.getState().cart
      expect(state.cart?.items[0].quantity).toBe(5)
      expect(state.cart?.total_amount).toBe(1250)
    })

    it('should handle quantity update failure', async () => {
      mockedApi.updateCartItem.mockRejectedValue(new Error('Quantité non disponible'))

      await store.dispatch(updateCartItem({ itemId: 1, quantity: 100 }))

      expect(store.getState().cart.error).toBe('Quantité non disponible')
    })
  })

  describe('removeCartItem', () => {
    beforeEach(async () => {
      const cart = createMockCart({
        items: [
          createMockCartItem({ id: 1, product_id: 1 }),
          createMockCartItem({ id: 2, product_id: 2 }),
        ],
      })
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())
    })

    it('should remove item from cart', async () => {
      const cartAfterRemoval = createMockCart({
        items: [createMockCartItem({ id: 2, product_id: 2 })],
        items_count: 1,
      })
      mockedApi.removeCartItem.mockResolvedValue({ success: true, data: cartAfterRemoval })

      await store.dispatch(removeCartItem(1))

      const state = store.getState().cart
      expect(state.cart?.items).toHaveLength(1)
      expect(state.cart?.items[0].id).toBe(2)
    })

    it('should handle removing non-existent item', async () => {
      mockedApi.removeCartItem.mockRejectedValue(new Error('Article introuvable'))

      await store.dispatch(removeCartItem(999))

      expect(store.getState().cart.error).toBe('Article introuvable')
    })
  })

  describe('clearCart', () => {
    beforeEach(async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())
    })

    it('should clear all items from cart', async () => {
      mockedApi.clearCart.mockResolvedValue({ success: true, data: null })

      await store.dispatch(clearCart())

      expect(store.getState().cart.cart).toBeNull()
    })

    it('should handle clear failure', async () => {
      mockedApi.clearCart.mockRejectedValue(new Error('Erreur serveur'))

      await store.dispatch(clearCart())

      expect(store.getState().cart.error).toBe('Erreur serveur')
    })
  })

  describe('checkoutCart', () => {
    beforeEach(async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())
    })

    it('should process checkout and clear cart', async () => {
      mockedApi.createOrder.mockResolvedValue(createOrderResponse('ORD-001'))

      await store.dispatch(checkoutCart(createCheckoutPayload()))

      const state = store.getState().cart
      expect(state.cart).toBeNull()
      expect(state.checkoutLoading).toBe(false)
      expect(state.lastCheckoutResult).not.toBeNull()
    })

    it('should handle checkout with wallet payment', async () => {
      mockedApi.createOrder.mockResolvedValue(createOrderResponse('ORD-002', { payment_status: 'success' }))

      await store.dispatch(checkoutCart(createCheckoutPayload({
        paymentMethod: 'wallet',
        walletPin: '1234',
      })))

      expect(mockedApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'wallet',
          wallet_pin: '1234',
        })
      )
    })

    it('should set checkoutError on failure', async () => {
      mockedApi.createOrder.mockRejectedValue(new Error('Solde insuffisant'))

      await store.dispatch(checkoutCart(createCheckoutPayload({ paymentMethod: 'wallet', walletPin: '1234' })))

      const state = store.getState().cart
      expect(state.checkoutError).toBe('Solde insuffisant')
      expect(state.checkoutLoading).toBe(false)
      expect(state.cart).not.toBeNull()
    })

    it('should fail checkout if cart is empty', async () => {
      mockedApi.clearCart.mockResolvedValue({ success: true, data: null })
      await store.dispatch(clearCart())

      await store.dispatch(checkoutCart(createCheckoutPayload()))

      expect(store.getState().cart.checkoutError).toBe('Panier vide')
    })
  })

  describe('resetCartState', () => {
    it('should reset to initial state', async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())
      expect(store.getState().cart.cart).not.toBeNull()

      store.dispatch(resetCartState())

      expect(store.getState().cart).toEqual(cartInitialState)
    })
  })

  describe('Cart Total Calculations', () => {
    it('should correctly reflect total from API', async () => {
      const cart = createMockCart({
        items: [
          createMockCartItem({ quantity: 3, unit_price: 250, total_price: 750 }),
          createMockCartItem({ id: 2, product_id: 2, quantity: 2, unit_price: 500, total_price: 1000 }),
        ],
        items_count: 5,
        total_amount: 1750, // 3*250 + 2*500
      })
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })

      await store.dispatch(fetchCart())

      expect(store.getState().cart.cart?.total_amount).toBe(1750)
      expect(store.getState().cart.cart?.items_count).toBe(5)
    })
  })

  describe('Loading States', () => {
    it('should track loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      mockedApi.getCart.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any
      )

      const dispatchPromise = store.dispatch(fetchCart())
      expect(store.getState().cart.loading).toBe(true)

      resolvePromise!({ success: true, data: createMockCart() })
      await dispatchPromise

      expect(store.getState().cart.loading).toBe(false)
    })

    it('should track updating state during item operations', async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())

      let resolvePromise: (value: any) => void
      mockedApi.addCartItem.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any
      )

      const dispatchPromise = store.dispatch(addCartItem({ productId: 2, quantity: 1 }))
      expect(store.getState().cart.updating).toBe(true)

      resolvePromise!({ success: true, data: cart })
      await dispatchPromise

      expect(store.getState().cart.updating).toBe(false)
    })

    it('should track checkoutLoading during checkout', async () => {
      const cart = createMockCart()
      mockedApi.getCart.mockResolvedValue({ success: true, data: cart })
      await store.dispatch(fetchCart())

      let resolvePromise: (value: any) => void
      mockedApi.createOrder.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any
      )

      const dispatchPromise = store.dispatch(checkoutCart(createCheckoutPayload()))
      expect(store.getState().cart.checkoutLoading).toBe(true)

      resolvePromise!(createOrderResponse('ORD-001'))
      await dispatchPromise

      expect(store.getState().cart.checkoutLoading).toBe(false)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle rapid add/remove operations', async () => {
      const initialCart = createMockCart({ items: [] })
      mockedApi.getCart.mockResolvedValue({ success: true, data: initialCart })
      await store.dispatch(fetchCart())

      // Mock sequential cart states
      const cart1 = createMockCart({ items: [createMockCartItem({ id: 1 })] })
      const cart2 = createMockCart({ items: [createMockCartItem({ id: 1 }), createMockCartItem({ id: 2 })] })
      const cart3 = createMockCart({ items: [createMockCartItem({ id: 2 })] })

      mockedApi.addCartItem
        .mockResolvedValueOnce({ success: true, data: cart1 })
        .mockResolvedValueOnce({ success: true, data: cart2 })
      mockedApi.removeCartItem.mockResolvedValue({ success: true, data: cart3 })

      // Ajouter deux items puis en retirer un
      await store.dispatch(addCartItem({ productId: 1, quantity: 1 }))
      await store.dispatch(addCartItem({ productId: 2, quantity: 1 }))
      await store.dispatch(removeCartItem(1))

      expect(store.getState().cart.cart?.items).toHaveLength(1)
      expect(store.getState().cart.cart?.items[0].id).toBe(2)
    })
  })
})
