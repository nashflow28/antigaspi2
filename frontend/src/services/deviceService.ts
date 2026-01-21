/**
 * Device Service - Web browser device identification and management
 * Handles unique device ID generation and device info collection for web browsers
 */

import { apiService } from './api'

const DEVICE_ID_KEY = 'antigaspi_device_id'

export interface DeviceInfo {
  device_id: string
  device_name: string
  device_model: string | null
  device_brand: string | null
  device_type: 'web'
  os_version: string | null
  app_version: string | null
}

export interface CheckPhoneResponse {
  success: boolean
  data?: {
    user_exists: boolean
    requires_otp: boolean
    requires_pin: boolean
    has_pin: boolean
    message: string
  }
  message?: string
}

export interface OtpLoginResponse {
  success: boolean
  data?: {
    status: 'success' | 'new_user'
    user?: any
    token?: string
    token_type?: string
    expires_in?: number
    has_pin?: boolean
    requires_pin_setup?: boolean
    requires_registration?: boolean
    phone?: string
    message?: string
  }
  message?: string
}

export interface PinLoginResponse {
  success: boolean
  data?: {
    status: 'success'
    user: any
    token: string
    token_type: string
    expires_in: number
  }
  message?: string
}

class DeviceService {
  private deviceId: string | null = null

  /**
   * Get or generate a unique device ID
   * This ID persists across browser sessions via localStorage
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId
    }

    try {
      // Try to get existing device ID from localStorage
      const storedId = localStorage.getItem(DEVICE_ID_KEY)

      if (storedId) {
        this.deviceId = storedId
        return storedId
      }

      // Generate new device ID
      const newId = await this.generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, newId)
      this.deviceId = newId

      return newId
    } catch (error) {
      // Fallback if localStorage fails
      console.warn('localStorage error, generating temporary device ID:', error)
      return this.generateDeviceId()
    }
  }

  /**
   * Generate a unique device ID based on browser fingerprint
   */
  private async generateDeviceId(): Promise<string> {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)

    // Browser fingerprinting
    const userAgent = navigator.userAgent
    const language = navigator.language
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Create a simple fingerprint
    const fingerprint = `${userAgent}${language}${screenResolution}${timezone}`
    const fingerprintHash = this.simpleHash(fingerprint).substring(0, 8)

    return `WEB${fingerprintHash}${timestamp}${random}`.toUpperCase()
  }

  /**
   * Simple hash function for fingerprinting
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get detailed device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId()

    // Parse user agent to extract OS and browser info
    const userAgent = navigator.userAgent
    let osVersion = 'Unknown'
    let deviceBrand = 'Browser'

    if (userAgent.includes('Windows')) {
      osVersion = 'Windows'
      deviceBrand = 'PC'
    } else if (userAgent.includes('Mac')) {
      osVersion = 'macOS'
      deviceBrand = 'Mac'
    } else if (userAgent.includes('Linux')) {
      osVersion = 'Linux'
      deviceBrand = 'PC'
    } else if (userAgent.includes('Android')) {
      osVersion = 'Android'
      deviceBrand = 'Mobile'
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      osVersion = 'iOS'
      deviceBrand = 'Apple'
    }

    // Browser detection
    let browserName = 'Unknown'
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari'
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge'
    }

    return {
      device_id: deviceId,
      device_name: `${browserName} on ${osVersion}`,
      device_model: browserName,
      device_brand: deviceBrand,
      device_type: 'web',
      os_version: osVersion,
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    }
  }

  /**
   * Check phone number and determine auth method
   */
  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await apiService.post<CheckPhoneResponse>('/auth/device/check-phone', {
        phone: this.normalizePhone(phone),
        device_id: deviceInfo.device_id,
        device_info: deviceInfo,
      })

      return response
    } catch (error: any) {
      console.error('Check phone error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la vérification du numéro',
      }
    }
  }

  /**
   * Send OTP for device verification
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/auth/device/send-otp', {
        phone: this.normalizePhone(phone),
      })

      return response
    } catch (error: any) {
      console.error('Send OTP error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Erreur lors de l'envoi du code OTP",
      }
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyOtpAndLogin(phone: string, otp: string): Promise<OtpLoginResponse> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await apiService.post<OtpLoginResponse>('/auth/device/verify-otp', {
        phone: this.normalizePhone(phone),
        otp,
        device_id: deviceInfo.device_id,
        device_info: deviceInfo,
      })

      return response
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      if (error.response?.data) {
        return error.response.data
      }
      return {
        success: false,
        message: error.message || 'Erreur lors de la vérification du code OTP',
      }
    }
  }

  /**
   * Login with PIN
   */
  async loginWithPin(phone: string, pin: string): Promise<PinLoginResponse> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await apiService.post<PinLoginResponse>('/auth/device/login-pin', {
        phone: this.normalizePhone(phone),
        pin,
        device_id: deviceInfo.device_id,
      })

      return response
    } catch (error: any) {
      console.error('PIN login error:', error)
      if (error.response?.data) {
        return error.response.data
      }
      return {
        success: false,
        message: error.message || 'Erreur de connexion',
      }
    }
  }

  /**
   * Set PIN after OTP verification
   */
  async setPin(pin: string, pinConfirmation: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/auth/device/set-pin', {
        pin,
        pin_confirmation: pinConfirmation,
      })

      return response
    } catch (error: any) {
      console.error('Set PIN error:', error)
      if (error.response?.data) {
        return error.response.data
      }
      return {
        success: false,
        message: error.message || 'Erreur lors de la configuration du code PIN',
      }
    }
  }

  /**
   * Change PIN
   */
  async changePin(currentPin: string, newPin: string, newPinConfirmation: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/auth/device/change-pin', {
        current_pin: currentPin,
        new_pin: newPin,
        new_pin_confirmation: newPinConfirmation,
      })

      return response
    } catch (error: any) {
      console.error('Change PIN error:', error)
      if (error.response?.data) {
        return error.response.data
      }
      return {
        success: false,
        message: error.message || 'Erreur lors du changement de code PIN',
      }
    }
  }

  /**
   * Logout and deactivate device
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/auth/device/logout', {
        device_id: deviceInfo.device_id,
      })

      return response
    } catch (error: any) {
      // Still consider logout successful even if API fails
      return {
        success: true,
        message: 'Déconnexion réussie',
      }
    }
  }

  /**
   * Normalize phone number for Togo
   */
  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '')

    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }

    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2)
    }

    if (cleaned.length === 8) {
      cleaned = '228' + cleaned
    }

    if (cleaned.length === 9 && cleaned.startsWith('0')) {
      cleaned = '228' + cleaned.substring(1)
    }

    return cleaned
  }

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay(phone: string): string {
    const normalized = this.normalizePhone(phone)
    if (normalized.length >= 11) {
      const countryCode = normalized.substring(0, 3)
      const number = normalized.substring(3)
      const formatted = number.replace(/(\d{2})(?=\d)/g, '$1 ')
      return `+${countryCode} ${formatted}`
    }
    return phone
  }
}

export const deviceService = new DeviceService()
export default deviceService
