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

export const checkoutCart = createAsyncThunk(
  'cart/checkout',
  async (payload: CartCheckoutPayload, { rejectWithValue, getState }) => {
    try {
      // Récupérer le cart du state pour extraire les items
      const state = getState() as any
      const cart = state.cart.cart

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Panier vide')
      }

      // Transformer les items du cart en format pour l'API orders
      const orderPayload = {
        items: cart.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        notes: payload.notes
      }

      console.log('📦 [Cart] Creating order from cart with items:', orderPayload.items)

      // Appeler la nouvelle API createOrder au lieu de checkoutCart
      const orderResponse = await apiService.createOrder(orderPayload)

      console.log('✅ [Cart] Order created:', orderResponse.data.order_number)

      // Adapter la réponse pour correspondre à CartCheckoutResponse
      // L'API orders retourne { order, order_id, order_number, ... }
      // Le reducer s'attend à { data: Reservation[], payments: Payment[] }
      const response: CartCheckoutResponse = {
        success: orderResponse.success,
        message: orderResponse.message,
        data: orderResponse.data.order.reservations || [],
        payments: null
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
