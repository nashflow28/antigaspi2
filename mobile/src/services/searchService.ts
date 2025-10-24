import apiService from './api'

export type SearchType = 'products' | 'merchants'
export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'popularity_desc'

export interface SearchFilters {
  city?: string
  category?: string
  business_type?: string
  is_surprise_basket?: boolean
  is_verified?: boolean
  type?: SearchType
}

export interface SearchParams {
  query?: string
  page?: number
  perPage?: number
  sort?: SearchSort
  filters?: SearchFilters
  type?: SearchType
}

export interface SearchPaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface SearchMeta {
  type: SearchType
  query?: string
  pagination?: SearchPaginationMeta
  applied_filters?: Record<string, unknown>
  facets?: Record<string, unknown>
}

export interface SearchResultBase {
  id: number
  type: SearchType
  score?: number | null
  highlights?: Record<string, unknown> | null
  attributes: Record<string, unknown>
}

export interface ProductSearchAttributes {
  name?: string
  description?: string | null
  discounted_price?: number | string | null
  original_price?: number | string | null
  is_surprise_basket?: boolean | null
  merchant?: {
    id?: number
    business_name?: string
    business_type?: string
    city?: string
    address?: string | null
  } | null
  image_url?: string | null
  quantity_available?: number | null
}

export interface MerchantSearchAttributes {
  business_name?: string
  business_type?: string
  city?: string
  address?: string | null
  is_verified?: boolean | null
  total_products?: number | null
  latitude?: number | null
  longitude?: number | null
}

export type ProductSearchResult = SearchResultBase & {
  type: 'products'
  attributes: ProductSearchAttributes
}

export type MerchantSearchResult = SearchResultBase & {
  type: 'merchants'
  attributes: MerchantSearchAttributes
}

export type SearchResult = ProductSearchResult | MerchantSearchResult

export interface SearchResponse<T extends SearchResult = SearchResult> {
  success: boolean
  data: T[]
  meta: SearchMeta
  message?: string
}

const buildQueryParams = (params: SearchParams): string => {
  const searchParams = new URLSearchParams()

  // 🐛 BUG FIX #38: Sanitize query parameter to prevent SQL injection attempts
  if (params.query) {
    // Remove SQL keywords and dangerous characters (defense in depth)
    const sanitizedQuery = params.query
      .replace(/[;<>\"'`]/g, '') // Remove dangerous characters
      .trim()
      .slice(0, 100) // Limit query length

    if (sanitizedQuery) {
      searchParams.append('q', sanitizedQuery)
    }
  }

  if (params.page) {
    const safePage = Math.max(1, Math.min(Number(params.page) || 1, 1000))
    searchParams.append('page', String(safePage))
  }

  if (params.perPage) {
    const safePerPage = Math.max(1, Math.min(Number(params.perPage) || 20, 100))
    searchParams.append('per_page', String(safePerPage))
  }

  // 🐛 BUG FIX #38: Whitelist validation for sort parameter
  const allowedSortValues: SearchSort[] = ['relevance', 'price_asc', 'price_desc', 'rating_desc', 'popularity_desc']
  if (params.sort && allowedSortValues.includes(params.sort)) {
    searchParams.append('sort', params.sort)
  }

  const filters: SearchFilters = {
    ...params.filters,
  }

  if (params.type) {
    filters.type = params.type
  }

  // 🐛 BUG FIX #38: Whitelist and sanitize filter values
  const allowedFilterKeys = ['city', 'category', 'business_type', 'is_surprise_basket', 'is_verified', 'type']
  const allowedTypes: SearchType[] = ['products', 'merchants']

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    // 🐛 BUG FIX #38: Only allow whitelisted filter keys
    if (!allowedFilterKeys.includes(key)) {
      return
    }

    // 🐛 BUG FIX #38: Validate type filter specifically
    if (key === 'type' && typeof value === 'string' && !allowedTypes.includes(value as SearchType)) {
      return
    }

    const normalizedValue = typeof value === 'boolean' ? Number(value).toString() : String(value)

    // 🐛 BUG FIX #38: Sanitize string filter values (max 50 chars, remove dangerous characters)
    const sanitizedValue = typeof value === 'string'
      ? normalizedValue.replace(/[;<>\"'`]/g, '').slice(0, 50)
      : normalizedValue

    if (sanitizedValue) {
      searchParams.append(`filters[${key}]`, sanitizedValue)
    }
  })

  return searchParams.toString()
}

export const search = async <T extends SearchResult = SearchResult>(
  params: SearchParams,
  options?: { signal?: AbortSignal },
): Promise<SearchResponse<T>> => {
  const queryString = buildQueryParams(params)
  const endpoint = `/search${queryString ? `?${queryString}` : ''}`

  const axiosConfig = options?.signal
    ? { signal: options.signal, timeout: 10000 }
    : { timeout: 10000 }

  return apiService.get<SearchResponse<T>>(endpoint, axiosConfig)
}

const searchService = {
  search,
}

export default searchService
