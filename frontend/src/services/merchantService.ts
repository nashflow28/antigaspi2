import { apiService } from '@/services/api'
import type {
  Product,
  Reservation,
  ApiResponse,
  PaginatedResponse,
  Category
} from '@/types'

// Types spécifiques au merchant
export interface MerchantStats {
  total_products: number
  active_products: number
  pending_reservations: number
  completed_reservations: number
  total_revenue: number
  monthly_revenue: number
  average_rating: number
  total_reviews: number
}

export interface ProductCreateData {
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  expiration_date: string
  category_id: number
  image?: File
  is_active?: boolean
}

export interface ProductUpdateData {
  name?: string
  description?: string
  original_price?: number
  discounted_price?: number
  quantity_available?: number
  expiration_date?: string
  category_id?: number
  image?: File
  is_active?: boolean
}

export interface SurpriseBasket {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  is_active: boolean
  products: Product[]
  created_at: string
  updated_at: string
}

export interface SurpriseBasketCreateData {
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  product_ids: number[]
  is_active?: boolean
}

export interface ReservationFilters {
  status?: string
  payment_status?: string
  from_date?: string
  to_date?: string
  product_id?: number
}

class MerchantService {
  private readonly baseUrl = '/api'

  /**
   * Statistiques du tableau de bord merchant
   */
  async getStats(): Promise<ApiResponse<MerchantStats>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/merchant/stats`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // === GESTION DES PRODUITS ===

  /**
   * Récupérer tous les produits du commerçant
   */
  async getProducts(): Promise<ApiResponse<{ products: Product[] }>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/products/merchant`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Créer un nouveau produit
   */
  async createProduct(data: ProductCreateData): Promise<ApiResponse<{ product: Product }>> {
    try {
      const formData = new FormData()

      // Ajouter tous les champs au FormData
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('original_price', data.original_price.toString())
      formData.append('discounted_price', data.discounted_price.toString())
      formData.append('quantity_available', data.quantity_available.toString())
      formData.append('expiration_date', data.expiration_date)
      formData.append('category_id', data.category_id.toString())

      if (data.image) {
        formData.append('image', data.image)
      }

      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active ? '1' : '0')
      }

      const response = await apiService.postFormData(`${this.baseUrl}/products`, formData)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Modifier un produit existant
   */
  async updateProduct(id: number, data: ProductUpdateData): Promise<ApiResponse<{ product: Product }>> {
    try {
      const formData = new FormData()

      // Ajouter la méthode PUT pour Laravel
      formData.append('_method', 'PUT')

      // Ajouter les champs modifiés
      if (data.name !== undefined) formData.append('name', data.name)
      if (data.description !== undefined) formData.append('description', data.description)
      if (data.original_price !== undefined) formData.append('original_price', data.original_price.toString())
      if (data.discounted_price !== undefined) formData.append('discounted_price', data.discounted_price.toString())
      if (data.quantity_available !== undefined) formData.append('quantity_available', data.quantity_available.toString())
      if (data.expiration_date !== undefined) formData.append('expiration_date', data.expiration_date)
      if (data.category_id !== undefined) formData.append('category_id', data.category_id.toString())
      if (data.is_active !== undefined) formData.append('is_active', data.is_active ? '1' : '0')

      if (data.image) {
        formData.append('image', data.image)
      }

      const response = await apiService.postFormData(`${this.baseUrl}/products/${id}`, formData)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Supprimer un produit
   */
  async deleteProduct(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/products/${id}`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Activer/désactiver un produit
   */
  async toggleProductStatus(id: number, isActive: boolean): Promise<ApiResponse<{ product: Product }>> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/products/${id}/status`, {
        is_active: isActive
      })
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // === GESTION DES RÉSERVATIONS ===

  /**
   * Récupérer les réservations reçues par le commerçant
   */
  async getReservations(filters: ReservationFilters = {}, page: number = 1): Promise<ApiResponse<PaginatedResponse<Reservation>>> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      if (page > 1) {
        params.append('page', page.toString())
      }

      const queryString = params.toString()
      const url = queryString ? `${this.baseUrl}/reservations/merchant/list?${queryString}` : `${this.baseUrl}/reservations/merchant/list`

      const response = await apiService.get(url)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Changer le statut d'une réservation
   */
  async updateReservationStatus(id: number, status: string, notes?: string): Promise<ApiResponse<{ reservation: Reservation }>> {
    try {
      const response = await apiService.patch(`${this.baseUrl}/reservations/${id}/status`, {
        status,
        notes
      })
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // === GESTION DES PANIERS SURPRISE ===

  /**
   * Récupérer tous les paniers surprise du commerçant
   */
  async getSurpriseBaskets(): Promise<ApiResponse<{ baskets: SurpriseBasket[] }>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/surprise-baskets/merchant/list`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Créer un nouveau panier surprise
   */
  async createSurpriseBasket(data: SurpriseBasketCreateData): Promise<ApiResponse<{ basket: SurpriseBasket }>> {
    try {
      const response = await apiService.post(`${this.baseUrl}/surprise-baskets`, data)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Modifier un panier surprise
   */
  async updateSurpriseBasket(id: number, data: Partial<SurpriseBasketCreateData>): Promise<ApiResponse<{ basket: SurpriseBasket }>> {
    try {
      const response = await apiService.put(`${this.baseUrl}/surprise-baskets/${id}`, data)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Supprimer un panier surprise
   */
  async deleteSurpriseBasket(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/surprise-baskets/${id}`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // === GESTION DES AVIS ===

  /**
   * Récupérer les avis pour les produits du commerçant
   */
  async getReviews(page: number = 1): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/reviews/merchant?page=${page}`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Répondre à un avis
   */
  async respondToReview(reviewId: number, response: string): Promise<ApiResponse> {
    try {
      const apiResponse = await apiService.post(`${this.baseUrl}/reviews/${reviewId}/respond`, {
        response
      })
      return apiResponse
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  // === UTILITAIRES ===

  /**
   * Récupérer les catégories disponibles
   */
  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/categories`)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Upload d'image de produit
   */
  async uploadProductImage(file: File): Promise<ApiResponse<{ image_url: string }>> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiService.postFormData(`${this.baseUrl}/products/upload-image`, formData)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Mettre à jour les informations du commerçant
   */
  async updateMerchantProfile(data: {
    business_name?: string
    business_type?: string
    address?: string
    phone?: string
    latitude?: number
    longitude?: number
  }): Promise<ApiResponse<{ merchant: any }>> {
    try {
      const response = await apiService.put(`${this.baseUrl}/merchants/profile`, data)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): ApiResponse {
    if (error.response?.data) {
      return error.response.data
    }

    return {
      success: false,
      message: error.message || 'Une erreur inattendue s\'est produite',
      errors: {}
    }
  }

  /**
   * Valider les données d'un produit
   */
  validateProductData(data: ProductCreateData | ProductUpdateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if ('name' in data && (!data.name || data.name.trim().length < 3)) {
      errors.push('Le nom du produit doit contenir au moins 3 caractères')
    }

    if ('description' in data && (!data.description || data.description.trim().length < 10)) {
      errors.push('La description doit contenir au moins 10 caractères')
    }

    if ('original_price' in data && (!data.original_price || data.original_price <= 0)) {
      errors.push('Le prix original doit être supérieur à 0')
    }

    if ('discounted_price' in data && (!data.discounted_price || data.discounted_price <= 0)) {
      errors.push('Le prix réduit doit être supérieur à 0')
    }

    if ('original_price' in data && 'discounted_price' in data &&
        data.original_price && data.discounted_price &&
        data.discounted_price >= data.original_price) {
      errors.push('Le prix réduit doit être inférieur au prix original')
    }

    if ('quantity_available' in data && (!data.quantity_available || data.quantity_available < 1)) {
      errors.push('La quantité disponible doit être d\'au moins 1')
    }

    if ('expiration_date' in data && data.expiration_date) {
      const expirationDate = new Date(data.expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (expirationDate < today) {
        errors.push('La date d\'expiration ne peut pas être dans le passé')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Formater les données pour l'affichage
   */
  formatProductForDisplay(product: Product): Product & { discount_percentage: number; savings: number } {
    const originalPrice = parseFloat(product.original_price)
    const discountedPrice = parseFloat(product.discounted_price)

    const discount_percentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    const savings = originalPrice - discountedPrice

    return {
      ...product,
      discount_percentage,
      savings
    }
  }

  /**
   * Calculer les statistiques d'un produit
   */
  calculateProductStats(product: Product, reservations: Reservation[]): {
    total_reserved: number
    total_revenue: number
    completion_rate: number
  } {
    const productReservations = reservations.filter(r => r.product.id === product.id)

    const total_reserved = productReservations.reduce((sum, r) => sum + (r.quantity || 0), 0)
    const total_revenue = productReservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)

    const completedReservations = productReservations.filter(r => r.status === 'completed').length
    const completion_rate = productReservations.length > 0
      ? Math.round((completedReservations / productReservations.length) * 100)
      : 0

    return {
      total_reserved,
      total_revenue,
      completion_rate
    }
  }
}

export const merchantService = new MerchantService()