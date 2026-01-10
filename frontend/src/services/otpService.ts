/**
 * OTP Service
 * Handles SMS OTP verification via backend API
 */

import { apiService } from '@/services/api'

// API Response types
interface OTPApiResponse {
  success: boolean
  message?: string
  data?: {
    expires_at?: string
    token?: string
    user?: unknown
  }
}

interface AuthRegisterResponse {
  success: boolean
  message?: string
  data?: {
    token?: string
    user?: unknown
  }
}

export interface OTPSendResult {
  success: boolean
  message?: string
  error?: string
  expires_at?: string
}

export interface OTPVerifyResult {
  success: boolean
  token?: string
  user?: unknown
  message?: string
  error?: string
}

class OTPService {
  private readonly baseUrl = '/auth/otp'

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string, purpose: 'login' | 'register' | 'verify' = 'verify'): Promise<OTPSendResult> {
    try {
      const response = await apiService.post<OTPApiResponse>(`${this.baseUrl}/send`, {
        phone: this.formatPhone(phone),
        purpose
      })

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Code envoyé avec succès',
          expires_at: response.data?.expires_at
        }
      }

      return {
        success: false,
        error: response.message || 'Erreur lors de l\'envoi du code'
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur lors de l\'envoi du code'
      }
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, code: string): Promise<OTPVerifyResult> {
    try {
      const response = await apiService.post<OTPApiResponse>(`${this.baseUrl}/verify`, {
        phone: this.formatPhone(phone),
        otp: code
      })

      if (response.success) {
        return {
          success: true,
          token: response.data?.token,
          user: response.data?.user,
          message: response.message || 'Vérification réussie'
        }
      }

      return {
        success: false,
        error: response.message || 'Code incorrect'
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur de vérification'
      }
    }
  }

  /**
   * Resend OTP (with rate limiting)
   */
  async resendOTP(phone: string): Promise<OTPSendResult> {
    try {
      const response = await apiService.post<OTPApiResponse>(`${this.baseUrl}/resend`, {
        phone: this.formatPhone(phone)
      })

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Nouveau code envoyé',
          expires_at: response.data?.expires_at
        }
      }

      return {
        success: false,
        error: response.message || 'Impossible de renvoyer le code'
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
      // Handle rate limiting
      if (err.response?.status === 429) {
        return {
          success: false,
          error: 'Veuillez patienter avant de demander un nouveau code'
        }
      }

      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur lors du renvoi'
      }
    }
  }

  /**
   * Login with OTP
   */
  async loginWithOTP(phone: string, code: string): Promise<OTPVerifyResult> {
    try {
      const response = await apiService.post<OTPApiResponse>('/auth/otp/verify', {
        phone: this.formatPhone(phone),
        otp: code,
        purpose: 'login'
      })

      if (response.success) {
        return {
          success: true,
          token: response.data?.token,
          user: response.data?.user,
          message: 'Connexion réussie'
        }
      }

      return {
        success: false,
        error: response.message || 'Échec de connexion'
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur de connexion'
      }
    }
  }

  /**
   * Register with OTP
   */
  async registerWithOTP(data: {
    phone: string
    code: string
    name: string
    email?: string
    password?: string
  }): Promise<OTPVerifyResult> {
    try {
      // First verify OTP
      const verifyResponse = await apiService.post<OTPApiResponse>('/auth/otp/verify', {
        phone: this.formatPhone(data.phone),
        otp: data.code,
        purpose: 'registration'
      })

      if (!verifyResponse.success) {
        return {
          success: false,
          error: verifyResponse.message || 'Code incorrect'
        }
      }

      // Then register the user
      const response = await apiService.post<AuthRegisterResponse>('/auth/register', {
        name: data.name,
        email: data.email,
        phone: this.formatPhone(data.phone),
        password: data.password || Math.random().toString(36).slice(-8), // Generate random password if not provided
        phone_verified: true
      })

      if (response.success) {
        return {
          success: true,
          token: response.data?.token,
          user: response.data?.user,
          message: 'Inscription réussie'
        }
      }

      return {
        success: false,
        error: response.message || 'Échec de l\'inscription'
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur d\'inscription'
      }
    }
  }

  /**
   * Verify phone number for existing user
   */
  async verifyPhoneForUser(phone: string, code: string): Promise<OTPVerifyResult> {
    try {
      const response = await apiService.post<OTPApiResponse>('/profile/verify-phone', {
        phone: this.formatPhone(phone),
        code
      })

      if (response.success) {
        return {
          success: true,
          message: 'Numéro vérifié avec succès'
        }
      }

      return {
        success: false,
        error: response.message || 'Échec de la vérification'
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Erreur de vérification'
      }
    }
  }

  /**
   * Format phone number
   */
  private formatPhone(phone: string): string {
    // Remove spaces and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')

    // Ensure it starts with country code
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2)
      } else if (cleaned.length === 8) {
        // Assume Togo
        cleaned = '+228' + cleaned
      }
    }

    return cleaned
  }

  /**
   * Validate OTP format
   */
  validateOTP(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: 'Le code est requis' }
    }

    if (code.length < 4 || code.length > 6) {
      return { valid: false, error: 'Le code doit contenir 4 à 6 chiffres' }
    }

    if (!/^\d+$/.test(code)) {
      return { valid: false, error: 'Le code ne doit contenir que des chiffres' }
    }

    return { valid: true }
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): { valid: boolean; error?: string } {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')

    if (!cleaned) {
      return { valid: false, error: 'Le numéro de téléphone est requis' }
    }

    // Check for valid phone format
    const phoneRegex = /^(\+?\d{1,3})?[\d]{8,12}$/
    if (!phoneRegex.test(cleaned)) {
      return { valid: false, error: 'Format de numéro invalide' }
    }

    return { valid: true }
  }
}

export const otpService = new OTPService()
