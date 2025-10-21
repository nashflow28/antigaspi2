import { apiService } from '@/services/api'
import type { ApiResponse } from '@/types'

export interface ConsumerProfileUpdatePayload {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
}

export interface ConsumerProfileResponse {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  photo_url?: string | null
  updated_at: string
}

export interface ConsumerPhotoResponse {
  photo_url: string | null
  full_url?: string
}

export const updateConsumerProfile = (
  payload: ConsumerProfileUpdatePayload
) => {
  return apiService.put<ApiResponse<ConsumerProfileResponse>>(
    '/consumers/profile',
    payload,
    true
  )
}

export const uploadConsumerPhoto = (file: File) => {
  const formData = new FormData()
  formData.append('photo', file)

  return apiService.postFormData<ApiResponse<ConsumerPhotoResponse>>(
    '/consumers/profile/photo',
    formData,
    true
  )
}
