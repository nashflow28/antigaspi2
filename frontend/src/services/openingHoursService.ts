import { apiService } from '@/services/api'
import type { ApiResponse } from '@/types'

export interface OpeningHourEntry {
  day: string
  is_open: boolean
  morning_start: string | null
  morning_end: string | null
  afternoon_start: string | null
  afternoon_end: string | null
}

export interface OpeningHoursPayload {
  opening_hours: OpeningHourEntry[]
}

export type OpeningHoursResponse = ApiResponse<{
  opening_hours: OpeningHourEntry[]
  updated_at?: string | null
}>

export const fetchOpeningHours = () => {
  return apiService.get<OpeningHoursResponse>('/merchants/opening-hours', true)
}

export const updateOpeningHours = (payload: OpeningHoursPayload) => {
  return apiService.put<OpeningHoursResponse>('/merchants/opening-hours', payload, true)
}
