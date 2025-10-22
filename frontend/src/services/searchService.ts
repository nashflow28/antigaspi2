import { apiService } from '@/services/api'

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
  /**
   * Raccourci pour définir le type principal sans recréer un objet filters.
   * Si renseigné, a priorité sur filters.type.
   */
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

export interface SearchOptions<T extends SearchResult = SearchResult> {
  fallbackData?: T[]
  fallbackMeta?: Partial<SearchMeta>
}

const buildQueryParams = (params: SearchParams): string => {
  const searchParams = new URLSearchParams()

  if (params.query) {
    searchParams.append('q', params.query)
  }

  if (params.page) {
    searchParams.append('page', String(params.page))
  }

  if (params.perPage) {
    searchParams.append('per_page', String(params.perPage))
  }

  if (params.sort) {
    searchParams.append('sort', params.sort)
  }

  const filters: SearchFilters = {
    ...params.filters,
  }

  if (params.type) {
    filters.type = params.type
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    const normalizedKey = key === 'type' ? 'type' : key
    const normalizedValue = typeof value === 'boolean' ? Number(value).toString() : String(value)
    searchParams.append(`filters[${normalizedKey}]`, normalizedValue)
  })

  return searchParams.toString()
}

const buildFallbackMeta = (params: SearchParams, options?: SearchOptions): SearchMeta => {
  const pagination: SearchPaginationMeta = {
    current_page: options?.fallbackMeta?.pagination?.current_page ?? 1,
    last_page: options?.fallbackMeta?.pagination?.last_page ?? 1,
    per_page:
      options?.fallbackMeta?.pagination?.per_page ??
      (options?.fallbackData ? options.fallbackData.length : params.perPage ?? 0),
    total:
      options?.fallbackMeta?.pagination?.total ??
      (options?.fallbackData ? options.fallbackData.length : params.perPage ?? 0),
  }

  return {
    type: params.type ?? options?.fallbackMeta?.type ?? params.filters?.type ?? 'products',
    query: params.query ?? options?.fallbackMeta?.query,
    pagination,
    applied_filters: options?.fallbackMeta?.applied_filters ?? {},
    facets: options?.fallbackMeta?.facets ?? {},
  }
}

export const search = async <T extends SearchResult = SearchResult>(
  params: SearchParams,
  options?: SearchOptions<T>,
): Promise<SearchResponse<T>> => {
  const queryString = buildQueryParams(params)
  const endpoint = `/search${queryString ? `?${queryString}` : ''}`

  try {
    return await apiService.get<SearchResponse<T>>(endpoint, false)
  } catch (error) {
    if (options?.fallbackData) {
      return {
        success: true,
        data: options.fallbackData,
        meta: buildFallbackMeta(params, options),
        message: options?.fallbackMeta?.query
          ? `Résultats locaux pour "${options.fallbackMeta.query}"`
          : 'Résultats locaux temporaires',
      }
    }

    throw error
  }
}

export const searchService = {
  search,
}

export default searchService
