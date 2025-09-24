import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { Merchant } from '@/types'
import { merchantService, type MerchantDetail, type MerchantWithLocation } from '@/services/merchantService'
import { notify } from '@/composables/useNotifications'

interface MerchantFetchOptions {
  withLocation?: boolean
  force?: boolean
  params?: Record<string, unknown>
  silent?: boolean
}

interface MerchantState {
  list: MerchantWithLocation[]
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  lastFetchWithLocation: boolean
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const normalizeMerchant = (merchant: Partial<MerchantWithLocation | MerchantDetail | Merchant>): MerchantWithLocation => {
  const baseMerchant = merchant as Partial<MerchantWithLocation>
  const user = baseMerchant.user ?? {
    city: (merchant as Merchant)?.city ?? null,
    address: (merchant as Merchant)?.address ?? null,
    phone: (merchant as Merchant)?.phone ?? null,
  }

  return {
    id: (merchant as Merchant)?.id ?? 0,
    business_name: (merchant as Merchant)?.business_name ?? 'Commerçant',
    business_type: (merchant as Merchant)?.business_type ?? 'Commerce',
    city: (merchant as Merchant)?.city ?? user?.city ?? '',
    address: (merchant as Merchant)?.address ?? user?.address ?? undefined,
    phone: (merchant as Merchant)?.phone ?? user?.phone ?? '',
    is_verified: Boolean((merchant as Merchant)?.is_verified),
    latitude: baseMerchant.latitude ?? null,
    longitude: baseMerchant.longitude ?? null,
    distance_km: baseMerchant.distance_km ?? null,
    products_count: baseMerchant.products_count ?? null,
    user,
  }
}

const extractMerchantList = (
  payload: MerchantWithLocation[] | { merchants?: MerchantWithLocation[] } | { data?: MerchantWithLocation[] }
): MerchantWithLocation[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload.merchants && Array.isArray(payload.merchants)) {
    return payload.merchants
  }

  if (payload.data && Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

const extractMerchantDetail = (
  payload: MerchantDetail | { merchant?: MerchantDetail } | { data?: MerchantDetail }
): MerchantDetail | null => {
  if (!payload) {
    return null
  }

  if ('merchant' in payload && payload.merchant) {
    return payload.merchant
  }

  if ('data' in payload && payload.data) {
    return payload.data
  }

  return payload as MerchantDetail
}

export const useMerchantsStore = defineStore('merchants', () => {
  const state = reactive<MerchantState>({
    list: [],
    loading: false,
    error: null,
    lastFetchedAt: null,
    lastFetchWithLocation: false,
  })

  const detailsCache = ref<Map<number, MerchantDetail>>(new Map())
  const currentMerchantId = ref<number | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)

  const merchants = computed(() => state.list)
  const hasMerchants = computed(() => state.list.length > 0)
  const isStale = (withLocation: boolean) => {
    if (!state.lastFetchedAt) {
      return true
    }

    if (withLocation && !state.lastFetchWithLocation) {
      return true
    }

    return Date.now() - state.lastFetchedAt > CACHE_DURATION
  }

  const setError = (message: string, silent?: boolean) => {
    state.error = message
    if (!silent) {
      notify.error(message, 'Commerçants')
    }
  }

  const clearError = () => {
    state.error = null
  }

  const fetchMerchants = async (options: MerchantFetchOptions = {}) => {
    const { withLocation = false, force = false, params, silent } = options

    if (!force && hasMerchants.value && !isStale(withLocation)) {
      return { success: true, fromCache: true, data: state.list }
    }

    state.loading = true
    clearError()

    try {
      const response = withLocation
        ? await merchantService.getMerchantsWithLocation(params)
        : await merchantService.getMerchants(params)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement des commerçants')
      }

      const merchantsData = extractMerchantList(response.data as any)
      state.list = merchantsData.map(normalizeMerchant)
      state.lastFetchedAt = Date.now()
      state.lastFetchWithLocation = withLocation

      return { success: true, data: state.list }
    } catch (error: any) {
      const message = error?.message || 'Erreur lors du chargement des commerçants'
      setError(message, silent)
      return { success: false, error: message }
    } finally {
      state.loading = false
    }
  }

  const fetchMerchantDetail = async (id: number, options: { force?: boolean; silent?: boolean } = {}) => {
    const { force = false, silent } = options

    if (!force && detailsCache.value.has(id)) {
      const cached = detailsCache.value.get(id)!
      currentMerchantId.value = id
      return { success: true, data: cached, fromCache: true }
    }

    detailLoading.value = true
    detailError.value = null

    try {
      const response = await merchantService.getMerchantDetail(id)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement du commerçant')
      }

      const payload = extractMerchantDetail(response.data as any)
      if (!payload) {
        throw new Error('Réponse invalide du serveur')
      }

      const merchant = {
        ...normalizeMerchant(payload),
        ...payload,
      }

      detailsCache.value.set(id, merchant)
      currentMerchantId.value = id

      return { success: true, data: merchant }
    } catch (error: any) {
      const message = error?.message || 'Erreur lors du chargement du commerçant'
      detailError.value = message
      if (!silent) {
        notify.error(message, 'Commerçants')
      }
      return { success: false, error: message }
    } finally {
      detailLoading.value = false
    }
  }

  const currentMerchant = computed(() => {
    if (currentMerchantId.value === null) {
      return null
    }

    return detailsCache.value.get(currentMerchantId.value) ?? null
  })

  const reset = () => {
    state.list = []
    state.lastFetchedAt = null
    state.lastFetchWithLocation = false
    detailsCache.value.clear()
    currentMerchantId.value = null
    state.error = null
    detailError.value = null
  }

  return {
    // State
    merchants,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    detailLoading: computed(() => detailLoading.value),
    detailError: computed(() => detailError.value),
    currentMerchant,

    // Getters
    hasMerchants,

    // Actions
    fetchMerchants,
    fetchMerchantDetail,
    reset,
  }
})

export type { MerchantWithLocation, MerchantDetail }
