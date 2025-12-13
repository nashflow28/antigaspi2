import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ProductsState, Product, Category, ProductFilters } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import { storeLogger } from '../../utils/logger'
import { validateSchema, ProductSchema } from '../../utils/schemaValidator'

/**
 * BUG FIX #M-004: Normalize product prices to ensure they are always numbers
 * The API may return prices as strings in some cases
 *
 * BUG FIX #16: Added schema validation to catch malformed backend data early
 */
const normalizeProduct = (product: Product): Product => {
  // BUG FIX #16: Validate product schema before processing
  if (__DEV__) {
    const validation = validateSchema(product, ProductSchema)
    if (!validation.valid) {
      storeLogger.warn(
        `[Schema] Invalid product data (id: ${product?.id}):`,
        validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
      )
    }
  }

  return {
    ...product,
    original_price: Number(product.original_price) || 0,
    discounted_price: Number(product.discounted_price) || 0,
  }
}

const normalizeProducts = (products: Product[]): Product[] =>
  products.map(normalizeProduct)

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

const PRODUCTS_CACHE_KEY = 'products'
const CATEGORIES_CACHE_KEY = 'categories'
const productCacheKey = (id: number) => `product_${id}`

const serializeFilters = (filters?: ProductFilters): string => {
  if (!filters) {
    return ''
  }

  const normalizedEntries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))

  if (normalizedEntries.length === 0) {
    return ''
  }

  return JSON.stringify(Object.fromEntries(normalizedEntries))
}

const buildProductsCacheKey = (filters?: ProductFilters): string => {
  const serialized = serializeFilters(filters)
  return serialized ? `products_${serialized}` : PRODUCTS_CACHE_KEY
}

const safeSetCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await offlineService.setCache(key, value)
  } catch (error) {
    storeLogger.warn('Failed to set cache:', key, error)
    // Continuer malgré l'erreur de cache
  }
}

const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    return await offlineService.getCache<T>(key)
  } catch (error) {
    storeLogger.warn('Failed to get cache:', key, error)
    return null
  }
}

const isOffline = async (): Promise<boolean> => {
  try {
    return !(await offlineService.checkConnectivity())
  } catch {
    return !offlineService.getConnectivityStatus()
  }
}

const mergeProductLists = (existing: Product[] = [], incoming: Product[] = []): Product[] => {
  const result: Product[] = []
  const seen = new Map<number, number>()

  existing.forEach(product => {
    if (!seen.has(product.id)) {
      seen.set(product.id, result.length)
      result.push(product)
    }
  })

  incoming.forEach(product => {
    const index = seen.get(product.id)
    if (index !== undefined) {
      result[index] = product
    } else {
      seen.set(product.id, result.length)
      result.push(product)
    }
  })

  return result
}

const persistProductsList = async (cacheKey: string, products: Product[]): Promise<void> => {
  await safeSetCache(cacheKey, products)
  const results = await Promise.allSettled(
    products.map(product => offlineService.setCache(productCacheKey(product.id), product))
  )
  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length > 0) {
    storeLogger.warn(`Failed to cache ${failures.length}/${products.length} products`)
  }
}

const persistProduct = async (product: Product): Promise<void> => {
  await safeSetCache(productCacheKey(product.id), product)
}

// Actions asynchrones
export const fetchProducts = createAsyncThunk<
  Product[],
  ProductFilters | undefined
>(
  'products/fetchProducts',
  async (filters, { rejectWithValue }) => {
    const cacheKey = buildProductsCacheKey(filters)

    if (await isOffline()) {
      const cached = await safeGetCache<Product[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getProducts(filters)
      const products = response.data
      await persistProductsList(cacheKey, products)
      return products
    } catch (error: any) {
      const fallback = await safeGetCache<Product[]>(cacheKey)
      if (fallback) {
        return fallback
      }

      return rejectWithValue(error.message)
    }
  }
)

export const fetchProduct = createAsyncThunk<
  Product,
  number
>(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    const cacheKey = productCacheKey(id)

    if (await isOffline()) {
      const cached = await safeGetCache<Product>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getProduct(id)
      const product = response.data
      await persistProduct(product)
      return product
    } catch (error: any) {
      const fallback = await safeGetCache<Product>(cacheKey)
      if (fallback) {
        return fallback
      }

      return rejectWithValue(error.message)
    }
  }
)

export const fetchCategories = createAsyncThunk<
  Category[],
  void
>(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    if (await isOffline()) {
      const cached = await safeGetCache<Category[]>(CATEGORIES_CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getCategories()
      const categories = response.data
      await safeSetCache(CATEGORIES_CACHE_KEY, categories)
      return categories
    } catch (error: any) {
      const fallback = await safeGetCache<Category[]>(CATEGORIES_CACHE_KEY)
      if (fallback) {
        return fallback
      }

      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreProducts = createAsyncThunk<
  Product[],
  { filters?: ProductFilters; page: number }
>(
  'products/fetchMoreProducts',
  async ({ filters, page }, { rejectWithValue }) => {
    try {
      const response = await apiService.getProducts({ ...filters, page, per_page: 20 })
      const products = response.data
      const cacheKey = buildProductsCacheKey(filters)
      const existing = await safeGetCache<Product[]>(cacheKey)
      await persistProductsList(cacheKey, mergeProductLists(existing ?? [], products))
      return products
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
        // BUG FIX #M-004: Normalize prices to ensure they are numbers
        state.products = normalizeProducts(action.payload)
        state.currentPage = 1
        state.hasMore = action.payload.length >= 20
        state.error = null
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single product
      .addCase(fetchProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        // BUG FIX #M-004: Normalize prices
        const normalizedProduct = normalizeProduct(action.payload)
        const existingIndex = state.products.findIndex(p => p.id === normalizedProduct.id)
        if (existingIndex !== -1) {
          state.products[existingIndex] = normalizedProduct
        } else {
          state.products.push(normalizedProduct)
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
        // BUG FIX #M-004: Normalize prices
        state.products = mergeProductLists(state.products, normalizeProducts(action.payload))
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
