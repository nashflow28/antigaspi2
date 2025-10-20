import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ProductsState, Product, Category, ProductFilters } from '../../types'
import apiService from '../../services/api'
// import offlineService from '../../services/offlineService' // Désactivé temporairement pour le web

export const productsInitialState: ProductsState = {
  products: [],
  categories: [],
  loading: false,
  loadingMore: false,
  error: null,
  filters: {},
  currentPage: 1,
  hasMore: true,
}

// Actions asynchrones
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters | undefined, { rejectWithValue }) => {
    // Version simplifiée sans cache offline pour le web
    try {
      const response = await apiService.getProducts(filters)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getProduct(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getCategories()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreProducts = createAsyncThunk(
  'products/fetchMoreProducts',
  async ({ filters, page }: { filters?: ProductFilters; page: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.getProducts({ ...filters, page, per_page: 20 })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState: productsInitialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ProductFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.currentPage = 1
      state.hasMore = true
    },
    clearFilters: (state) => {
      state.filters = {}
      state.currentPage = 1
      state.hasMore = true
    },
    clearError: (state) => {
      state.error = null
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.products[index] = action.payload
      }
    },
    resetProducts: (state) => {
      state.products = []
      state.currentPage = 1
      state.hasMore = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false
        state.products = action.payload
        state.error = null
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single product
      .addCase(fetchProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const existingIndex = state.products.findIndex(p => p.id === action.payload.id)
        if (existingIndex !== -1) {
          state.products[existingIndex] = action.payload
        } else {
          state.products.push(action.payload)
        }
      })

      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false
        state.categories = action.payload
        state.error = null
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch more products (pagination)
      .addCase(fetchMoreProducts.pending, (state) => {
        state.loadingMore = true
        state.error = null
      })
      .addCase(fetchMoreProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loadingMore = false
        state.products = [...state.products, ...action.payload]
        state.currentPage += 1
        state.hasMore = action.payload.length >= 20
        state.error = null
      })
      .addCase(fetchMoreProducts.rejected, (state, action) => {
        state.loadingMore = false
        state.error = action.payload as string
      })
  },
})

export const { setFilters, clearFilters, clearError, updateProduct, resetProducts } = productsSlice.actions
export const productsReducer = productsSlice.reducer
export default productsReducer
