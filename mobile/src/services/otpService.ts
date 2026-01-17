/**
 * OTP Service - SMS.TG Integration
 * Handles OTP sending and verification via SMS.TG API through our backend
 */

import api from './api'

export type OtpPurpose = 'registration' | 'login' | 'password_reset' | 'phone_change'

export interface SendOtpResponse {
  success: boolean
  message: string
  data?: {
    phone?: string
    expires_in?: number // seconds (when OTP sent successfully)
    resend_cooldown?: number // seconds (when OTP sent successfully)
    cooldown_remaining?: number // seconds (when OTP already exists and still valid)
  }
}

export interface VerifyOtpResponse {
  success: boolean
  message: string
  data?: {
    phone: string
    verified: boolean
    remaining_attempts?: number
  }
}

export interface OtpStatusResponse {
  success: boolean
  data: {
    phone: string
    verified: boolean
  }
}

// API response wrapper type
interface ApiOtpResponse<T> {
  success: boolean
  message: string
  data?: T
}

class OtpService {
  /**
   * Send OTP to phone number via SMS
   * @param phone Phone number (with or without country code)
   * @param purpose Purpose of OTP (registration, login, etc.)
   */
  async sendOtp(phone: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    try {
      const response = await api.post<SendOtpResponse>('/auth/otp/send', {
        phone: this.normalizePhone(phone),
        purpose,
      })
      // api.post already returns response.data, so return it directly
      return response
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as SendOtpResponse
      }
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'envoi du code',
      }
    }
  }

  /**
   * Verify OTP code
   * @param phone Phone number
   * @param otp 6-digit OTP code
   * @param purpose Purpose of OTP
   */
  async verifyOtp(phone: string, otp: string, purpose: OtpPurpose = 'registration'): Promise<VerifyOtpResponse> {
    try {
      const response = await api.post<VerifyOtpResponse>('/auth/otp/verify', {
        phone: this.normalizePhone(phone),
        otp,
        purpose,
      })
      // api.post already returns response.data, so return it directly
      return response
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as VerifyOtpResponse
      }
      return {
        success: false,
        message: error.message || 'Erreur lors de la verification',
      }
    }
  }

  /**
   * Resend OTP (same as sendOtp but semantically different)
   * @param phone Phone number
   * @param purpose Purpose of OTP
   */
  async resendOtp(phone: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    try {
      const response = await api.post<SendOtpResponse>('/auth/otp/resend', {
        phone: this.normalizePhone(phone),
        purpose,
      })
      // api.post already returns response.data, so return it directly
      return response
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as SendOtpResponse
      }
      return {
        success: false,
        message: error.message || 'Erreur lors du renvoi du code',
      }
    }
  }

  /**
   * Check if phone is verified
   * @param phone Phone number
   * @param purpose Purpose of OTP
   */
  async checkStatus(phone: string, purpose: OtpPurpose = 'registration'): Promise<OtpStatusResponse> {
    try {
      const response = await api.get<OtpStatusResponse>('/auth/otp/status', {
        params: {
          phone: this.normalizePhone(phone),
          purpose,
        },
      })
      // api.get already returns response.data, so return it directly
      return response
    } catch (error: any) {
      return {
        success: false,
        data: {
          phone,
          verified: false,
        },
      }
    }
  }

  /**
   * Normalize phone number for Togo
   * Accepts various formats and returns standard format
   */
  private normalizePhone(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')

    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }

    // Remove leading 00 if present
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2)
    }

    // If it's a local 8-digit number, add Togo country code
    if (cleaned.length === 8) {
      cleaned = '228' + cleaned
    }

    // If it starts with 0 and is 9 digits, replace 0 with 228
    if (cleaned.length === 9 && cleaned.startsWith('0')) {
      cleaned = '228' + cleaned.substring(1)
    }

    return cleaned
  }

  /**
   * Format phone number for display
   * Returns: +228 90 12 34 56
   */
  formatPhoneForDisplay(phone: string): string {
    const normalized = this.normalizePhone(phone)
    if (normalized.length >= 11) {
      const countryCode = normalized.substring(0, 3)
      const number = normalized.substring(3)
      // Split number into pairs
      const formatted = number.replace(/(\d{2})(?=\d)/g, '$1 ')
      return `+${countryCode} ${formatted}`
    }
    return phone
  }

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    const normalized = this.normalizePhone(phone)
    // Togo numbers: 228 + 8 digits = 11 total
    return normalized.length === 11 && normalized.startsWith('228')
  }
}

export const otpService = new OtpService()
export default otpService
