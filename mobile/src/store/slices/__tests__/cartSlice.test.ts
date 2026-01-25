import cartReducer, {
  cartInitialState,
  fetchCart,
  addCartItem,
  clearCart,
  checkoutCart,
} from '../cartSlice'
import { Cart, CartCheckoutResponse, CartResponse } from '../../../types'

describe('cartSlice', () => {
  const buildCart = (): Cart => ({
    id: 1,
    total_amount: 5000,
    items_count: 2,
    merchant: {
      id: 10,
      name: 'Boulangerie GÊLADAL',
      business_type: 'boulangerie',
    },
    items: [
      {
        id: 21,
        product_id: 11,
        quantity: 2,
        unit_price: 2500,
        total_price: 5000,
        product: {
          id: 11,
          name: 'Panier surprise',
          discounted_price: 2500,
          available_quantity: 3,
          image_url: null,
        },
      },
    ],
  })

  it('returns the initial state', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual(cartInitialState)
  })

  it('stores cart data on fetch success', () => {
    const cart = buildCart()
    const response: CartResponse = { success: true, data: cart }
    const state = cartReducer(cartInitialState, fetchCart.fulfilled(response, '', undefined))

    expect(state.cart).toEqual(cart)
    expect(state.loading).toBe(false)
  })

  it('updates cart on add item', () => {
    const cart = buildCart()
    const response: CartResponse = { success: true, data: cart, message: 'Produit ajouté' }
    const state = cartReducer(cartInitialState, addCartItem.fulfilled(response, '', { productId: 11, quantity: 2 }))

    expect(state.cart?.items_count).toBe(2)
    expect(state.updating).toBe(false)
  })

  it('clears cart on checkout', () => {
    const cart = buildCart()
    const populatedState = { ...cartInitialState, cart }
    const checkoutResponse: CartCheckoutResponse = {
      success: true,
      message: 'Réservations créées',
      data: [
        {
          id: 55,
          reservation_code: 'ABC123',
          quantity: 2,
          original_price: 6000,
          discounted_price: 5000,
          status: 'pending',
          product: {
            id: 11,
            name: 'Panier surprise',
            merchant: { name: 'Boulangerie GÊLADAL' },
          },
        } as any,
      ],
      payments: [],
    }

    const state = cartReducer(populatedState, checkoutCart.fulfilled(checkoutResponse, '', {
      paymentMethod: 'on_site',
      pickupDate: '2025-01-01',
      pickupTime: '12:00',
    }))

    expect(state.cart).toBeNull()
    expect(state.lastCheckoutResult?.reservations).toHaveLength(1)
  })

  it('resets cart on clearCart', () => {
    const cart = buildCart()
    const populatedState = { ...cartInitialState, cart }
    const state = cartReducer(populatedState, clearCart.fulfilled({ success: true, data: null }, '', undefined))

    expect(state.cart).toBeNull()
  })
})
