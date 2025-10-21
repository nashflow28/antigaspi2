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
  async (payload: CartCheckoutPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.checkoutCart(payload)
      return response
    } catch (error: any) {
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
