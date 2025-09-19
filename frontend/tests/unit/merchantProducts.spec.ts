import { beforeEach, describe, expect, it, vi } from 'vitest'

const API_BASE_URL = 'https://api.example.com'

const createJsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = { 'Content-Type': 'application/json' }
) => {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  )

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => normalizedHeaders[key.toLowerCase()] ?? null
    } as Headers,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
  } as unknown as Response
}

describe('apiService merchant product management', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('loads, toggles and deletes merchant products via the API service', async () => {
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)

    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const productsResponse = { data: [{ id: 1, name: 'Produit test', is_active: true }] }
    const toggleResponse = { data: { id: 1, is_active: false } }

    fetchMock
      .mockResolvedValueOnce(createJsonResponse(productsResponse))
      .mockResolvedValueOnce(createJsonResponse(toggleResponse))
      .mockResolvedValueOnce(createJsonResponse(null, 204, {}))

    localStorage.setItem('auth_token', 'token-value')

    const { apiService } = await import('@/services/api')

    const products = await apiService.getMerchantProducts()
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/products/merchant`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-value',
          'Content-Type': 'application/json'
        })
      })
    )
    expect(products.data).toEqual(productsResponse.data)

    await apiService.updateProductStatus(1, false)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/products/1`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ is_active: false })
      })
    )

    await apiService.deleteProduct(1)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/products/1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('propagates API errors when deletion fails', async () => {
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)

    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const errorPayload = { message: 'Not Found' }
    fetchMock.mockResolvedValueOnce(createJsonResponse(errorPayload, 404))

    localStorage.setItem('auth_token', 'token-value')

    const { apiService } = await import('@/services/api')

    await expect(apiService.deleteProduct(42)).rejects.toThrow('Not Found')
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/products/42`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
