import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ProductsState, Product, Category, ProductFilters } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'

const initialState: ProductsState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
  filters: {},
}

// Actions asynchrones
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters?: ProductFilters, { rejectWithValue }) => {
    const hasFilters = filters && Object.keys(filters).length > 0
    const cacheKey = hasFilters ? `products_${JSON.stringify(filters)}` : 'products'
    const cachedProducts = await offlineService.getCache<Product[]>(cacheKey)
    const isOnline = offlineService.getConnectivityStatus()

    if (!isOnline && cachedProducts) {
      return cachedProducts
    }

    try {
      const response = await apiService.getProducts(filters)
      await offlineService.setCache(cacheKey, response.data)
      return response.data
    } catch (error: any) {
      if (cachedProducts) {
        return cachedProducts
      }
      return rejectWithValue(error.message)
    }
  }
)

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id: number, { rejectWithValue }) => {
    const cacheKey = `product_${id}`
    const cachedProduct = await offlineService.getCache<Product>(cacheKey)
    const isOnline = offlineService.getConnectivityStatus()

    if (!isOnline && cachedProduct) {
      return cachedProduct
    }

    try {
      const response = await apiService.getProduct(id)
      await offlineService.setCache(cacheKey, response.data)
      return response.data
    } catch (error: any) {
      if (cachedProduct) {
        return cachedProduct
      }
      return rejectWithValue(error.message)
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    const cacheKey = 'categories'
    const cachedCategories = await offlineService.getCache<Category[]>(cacheKey)
    const isOnline = offlineService.getConnectivityStatus()

    if (!isOnline && cachedCategories) {
      return cachedCategories
    }

    try {
      const response = await apiService.getCategories()
      await offlineService.setCache(cacheKey, response.data)
      return response.data
    } catch (error: any) {
      if (cachedCategories) {
        return cachedCategories
      }
      return rejectWithValue(error.message)
    }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ProductFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
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
  },
})

export const { setFilters, clearFilters, clearError, updateProduct } = productsSlice.actions
export default productsSlice.reducer