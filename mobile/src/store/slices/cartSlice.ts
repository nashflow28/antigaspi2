import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

import apiService from '../../services/api'
import {
  Cart,
  CartCheckoutPayload,
  CartCheckoutResponse,
  CartItemPayload,
  CartResponse,
  CartState,
  CartUpdatePayload,
} from '../../types'
import { logoutUser } from './authSlice'
import { fetchWallet } from './walletSlice'

export const cartInitialState: CartState = {
  cart: null,
  loading: false,
  updating: false,
  checkoutLoading: false,
  error: null,
  checkoutError: null,
  lastCheckoutResult: null,
}

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getCart()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const addCartItem = createAsyncThunk(
  'cart/addItem',
  async (payload: CartItemPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.addCartItem(payload)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async (
    payload: CartUpdatePayload & { itemId: number },
    { rejectWithValue }
  ) => {
    try {
      const { itemId, ...rest } = payload
      const response = await apiService.updateCartItem(itemId, rest)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.removeCartItem(itemId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.clearCart()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Extended checkout result with payment info for Mobile Money
export interface CheckoutResultWithPayment extends CartCheckoutResponse {
  orderNumber?: string
  orderId?: number
  totalAmount?: number
  payment?: {
    id: number
    status: string
    reference: string
    provider: string
    amount: number
  }
  requiresPaymentConfirmation?: boolean
}

export const checkoutCart = createAsyncThunk(
  'cart/checkout',
  async (payload: CartCheckoutPayload, { rejectWithValue, getState, dispatch }) => {
    try {
      // Récupérer le cart du state pour extraire les items
      const state = getState() as any
      const cart = state.cart.cart

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Panier vide')
      }

      // Transformer les items du cart en format pour l'API orders
      // Inclure payment_method et wallet_pin pour le paiement
      const orderPayload = {
        items: cart.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        payment_method: payload.paymentMethod,
        wallet_pin: payload.walletPin,
        notes: payload.notes ?? undefined
      }

      console.log('📦 [Cart] Creating order from cart with items:', orderPayload.items)
      console.log('💳 [Cart] Payment method:', payload.paymentMethod)
      console.log('🔑 [Cart] Wallet PIN present:', !!payload.walletPin)
      console.log('📋 [Cart] Full orderPayload:', JSON.stringify(orderPayload, null, 2))

      // Appeler la nouvelle API createOrder au lieu de checkoutCart
      const orderResponse = await apiService.createOrder(orderPayload)

      console.log('✅ [Cart] Order created:', orderResponse.data.order_number)
      console.log('💰 [Cart] Payment status:', orderResponse.data.order?.payment_status)
      console.log('💳 [Cart] Payment info:', orderResponse.data.payment)

      // Si paiement wallet, rafraîchir le solde du portefeuille
      if (payload.paymentMethod === 'wallet') {
        console.log('🔄 [Cart] Refreshing wallet balance after wallet payment...')
        dispatch(fetchWallet())
      }

      // Adapter la réponse pour correspondre à CartCheckoutResponse
      // L'API orders retourne { order, order_id, order_number, payment?, requires_payment_confirmation? }
      const response: CheckoutResultWithPayment = {
        success: orderResponse.success,
        message: orderResponse.message,
        data: orderResponse.data.order?.reservations || [],
        payments: null,
        // Include additional order and payment info for Mobile Money flow
        orderNumber: orderResponse.data.order_number,
        orderId: orderResponse.data.order_id,
        totalAmount: orderResponse.data.total_amount,
        payment: orderResponse.data.payment,
        requiresPaymentConfirmation: orderResponse.data.requires_payment_confirmation,
      }

      return response
    } catch (error: any) {
      console.error('❌ [Cart] Checkout failed:', error.message)
      return rejectWithValue(error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: cartInitialState,
  reducers: {
    resetCartState: () => ({ ...cartInitialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.loading = false
        state.cart = action.payload.data
        state.error = null
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(addCartItem.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(addCartItem.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.updating = false
        state.cart = action.payload.data
        state.error = null
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      .addCase(updateCartItem.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(updateCartItem.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.updating = false
        state.cart = action.payload.data
        state.error = null
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      .addCase(removeCartItem.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(removeCartItem.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.updating = false
        state.cart = action.payload.data
        state.error = null
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      .addCase(clearCart.pending, (state) => {
        state.updating = true
        state.error = null
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.updating = false
        state.cart = null
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.updating = false
        state.error = action.payload as string
      })

      .addCase(checkoutCart.pending, (state) => {
        state.checkoutLoading = true
        state.checkoutError = null
      })
      .addCase(
        checkoutCart.fulfilled,
        (state, action: PayloadAction<CartCheckoutResponse>) => {
          state.checkoutLoading = false
          state.cart = null
          const payments = action.payload.payments ?? []
          state.lastCheckoutResult = {
            reservations: action.payload.data,
            payments,
          }
          state.checkoutError = null
        }
      )
      .addCase(checkoutCart.rejected, (state, action) => {
        state.checkoutLoading = false
        state.checkoutError = action.payload as string
      })

      .addCase(logoutUser.fulfilled, () => ({ ...cartInitialState }))
  },
})

export const { resetCartState } = cartSlice.actions
export const cartReducer = cartSlice.reducer
export default cartReducer
