/**
 * Device Service - Device identification and management
 * Handles unique device ID generation and device info collection
 */

import * as Device from 'expo-device'
import * as Application from 'expo-application'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import api from './api'
import { createLogger } from '../utils/logger'

const log = createLogger('DeviceService')

const DEVICE_ID_KEY = 'antigaspi_device_id'

export interface DeviceInfo {
  device_id: string
  device_name: string
  device_model: string | null
  device_brand: string | null
  device_type: 'android' | 'ios' | 'web'
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
   * This ID persists across app reinstalls on the same device
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId
    }

    try {
      // Try to get existing device ID from secure storage
      const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY)

      if (storedId) {
        this.deviceId = storedId
        return storedId
      }

      // Generate new device ID
      const newId = await this.generateDeviceId()
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newId)
      this.deviceId = newId

      return newId
    } catch (error) {
      // Fallback if secure store fails
      log.warn('SecureStore error, generating temporary device ID:', error)
      return this.generateDeviceId()
    }
  }

  /**
   * Generate a unique device ID based on device characteristics
   */
  private async generateDeviceId(): Promise<string> {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)

    // Try to include some device-specific info
    let devicePart = ''

    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId()
      if (androidId) {
        devicePart = androidId.substring(0, 8)
      }
    } else if (Platform.OS === 'ios') {
      // iOS doesn't provide a persistent device ID for privacy reasons
      // We'll use a combination of device info
      const model = Device.modelName || ''
      const brand = Device.brand || ''
      devicePart = `${model}${brand}`.replace(/\s/g, '').substring(0, 8)
    }

    return `${devicePart}${timestamp}${random}`.toUpperCase()
  }

  /**
   * Get detailed device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId()

    const deviceType: 'android' | 'ios' | 'web' =
      Platform.OS === 'android' ? 'android' :
      Platform.OS === 'ios' ? 'ios' : 'web'

    return {
      device_id: deviceId,
      device_name: Device.deviceName || `${Device.brand} ${Device.modelName}`,
      device_model: Device.modelName,
      device_brand: Device.brand,
      device_type: deviceType,
      os_version: Device.osVersion,
      app_version: Application.nativeApplicationVersion,
    }
  }

  /**
   * Check phone number and determine auth method
   */
  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await api.post<CheckPhoneResponse>('/auth/device/check-phone', {
        phone: this.normalizePhone(phone),
        device_id: deviceInfo.device_id,
        device_info: deviceInfo,
      })

      return response
    } catch (error: any) {
      log.error('Check phone error:', error)
      return {
        success: false,
        message: error.message || 'Erreur lors de la vérification du numéro',
      }
    }
  }

  /**
   * Send OTP for device verification
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/device/send-otp', {
        phone: this.normalizePhone(phone),
      })

      return response
    } catch (error: any) {
      log.error('Send OTP error:', error)
      return {
        success: false,
        message: error.message || "Erreur lors de l'envoi du code OTP",
      }
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyOtpAndLogin(phone: string, otp: string): Promise<OtpLoginResponse> {
    const deviceInfo = await this.getDeviceInfo()

    try {
      const response = await api.post<OtpLoginResponse>('/auth/device/verify-otp', {
        phone: this.normalizePhone(phone),
        otp,
        device_id: deviceInfo.device_id,
        device_info: deviceInfo,
      })

      return response
    } catch (error: any) {
      log.error('Verify OTP error:', error)
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
      const response = await api.post<PinLoginResponse>('/auth/device/login-pin', {
        phone: this.normalizePhone(phone),
        pin,
        device_id: deviceInfo.device_id,
      })

      return response
    } catch (error: any) {
      log.error('PIN login error:', error)
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
      const response = await api.post<{ success: boolean; message: string }>('/auth/device/set-pin', {
        pin,
        pin_confirmation: pinConfirmation,
      })

      return response
    } catch (error: any) {
      log.error('Set PIN error:', error)
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
      const response = await api.post<{ success: boolean; message: string }>('/auth/device/change-pin', {
        current_pin: currentPin,
        new_pin: newPin,
        new_pin_confirmation: newPinConfirmation,
      })

      return response
    } catch (error: any) {
      log.error('Change PIN error:', error)
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
      const response = await api.post<{ success: boolean; message: string }>('/auth/device/logout', {
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
