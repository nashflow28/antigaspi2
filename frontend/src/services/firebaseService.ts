/**
 * Firebase Service for Web
 * Handles phone authentication via Firebase
 */

import { apiService } from '@/services/api'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface PhoneAuthResult {
  success: boolean
  verificationId?: string
  message?: string
  error?: string
}

export interface VerifyOTPResult {
  success: boolean
  token?: string
  user?: any
  message?: string
  error?: string
}

class FirebaseService {
  private initialized = false
  private recaptchaVerifier: any = null
  private confirmationResult: any = null

  /**
   * Initialize Firebase (lazy load)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true

    try {
      // Firebase is loaded dynamically to reduce initial bundle size
      const { initializeApp, getApps } = await import('firebase/app')
      const { getAuth } = await import('firebase/auth')

      // Get config from environment or API
      const config = await this.getFirebaseConfig()

      if (!config) {
        console.warn('Firebase config not available')
        return false
      }

      // Initialize only if not already initialized
      if (getApps().length === 0) {
        initializeApp(config)
      }

      this.initialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize Firebase:', error)
      return false
    }
  }

  /**
   * Get Firebase config from environment or API
   */
  private async getFirebaseConfig(): Promise<FirebaseConfig | null> {
    // Try environment variables first
    const envConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    }

    if (envConfig.apiKey) {
      return envConfig
    }

    // Fallback: get from API
    try {
      const response = await apiService.get('/config/firebase')
      return response.data as FirebaseConfig
    } catch {
      return null
    }
  }

  /**
   * Setup reCAPTCHA verifier for phone auth
   */
  async setupRecaptcha(containerId: string): Promise<boolean> {
    try {
      await this.initialize()

      const { getAuth, RecaptchaVerifier } = await import('firebase/auth')
      const auth = getAuth()

      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified')
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired')
        }
      })

      await this.recaptchaVerifier.render()
      return true
    } catch (error) {
      console.error('Failed to setup reCAPTCHA:', error)
      return false
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      await this.initialize()

      const { getAuth, signInWithPhoneNumber } = await import('firebase/auth')
      const auth = getAuth()

      if (!this.recaptchaVerifier) {
        return {
          success: false,
          error: 'reCAPTCHA not initialized. Please refresh the page.'
        }
      }

      // Format phone number if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber)

      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        this.recaptchaVerifier
      )

      return {
        success: true,
        verificationId: this.confirmationResult.verificationId,
        message: 'Code OTP envoyé avec succès'
      }
    } catch (error: any) {
      console.error('Send OTP error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<VerifyOTPResult> {
    try {
      if (!this.confirmationResult) {
        return {
          success: false,
          error: 'Aucune vérification en cours. Veuillez renvoyer le code.'
        }
      }

      const result = await this.confirmationResult.confirm(code)
      const idToken = await result.user.getIdToken()

      // Send to backend for verification and get JWT token
      const response = await apiService.post('/auth/firebase/verify', {
        firebase_token: idToken,
        phone: result.user.phoneNumber
      })

      if (response.success) {
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          message: 'Vérification réussie'
        }
      }

      return {
        success: false,
        error: response.message || 'Erreur de vérification'
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      }
    }
  }

  /**
   * Login with Firebase (existing user)
   */
  async loginWithPhone(phoneNumber: string): Promise<PhoneAuthResult> {
    // First check if user exists
    try {
      const response = await apiService.post('/auth/check-phone', {
        phone: phoneNumber
      })

      if (!response.data?.exists) {
        return {
          success: false,
          error: 'Aucun compte associé à ce numéro. Veuillez vous inscrire.'
        }
      }

      return await this.sendOTP(phoneNumber)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la vérification du numéro'
      }
    }
  }

  /**
   * Register with Firebase (new user)
   */
  async registerWithPhone(phoneNumber: string, userData: { name: string; email?: string }): Promise<PhoneAuthResult> {
    // Store user data for after OTP verification
    sessionStorage.setItem('pendingRegistration', JSON.stringify({
      phone: phoneNumber,
      ...userData
    }))

    return await this.sendOTP(phoneNumber)
  }

  /**
   * Complete registration after OTP verification
   */
  async completeRegistration(firebaseToken: string): Promise<VerifyOTPResult> {
    try {
      const pendingData = sessionStorage.getItem('pendingRegistration')

      if (!pendingData) {
        return {
          success: false,
          error: 'Données d\'inscription manquantes'
        }
      }

      const userData = JSON.parse(pendingData)

      const response = await apiService.post('/auth/firebase/register', {
        firebase_token: firebaseToken,
        ...userData
      })

      if (response.success) {
        sessionStorage.removeItem('pendingRegistration')
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          message: 'Inscription réussie'
        }
      }

      return {
        success: false,
        error: response.message || 'Erreur lors de l\'inscription'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'inscription'
      }
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')

    // Add Togo country code if not present
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2)
      } else if (cleaned.length === 8) {
        // Togo local number
        cleaned = '+228' + cleaned
      } else {
        cleaned = '+' + cleaned
      }
    }

    return cleaned
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'auth/invalid-phone-number': 'Numéro de téléphone invalide',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/quota-exceeded': 'Quota SMS dépassé. Veuillez réessayer demain.',
      'auth/invalid-verification-code': 'Code de vérification incorrect',
      'auth/code-expired': 'Le code a expiré. Veuillez en demander un nouveau.',
      'auth/missing-verification-code': 'Veuillez entrer le code de vérification',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'auth/captcha-check-failed': 'Échec de vérification CAPTCHA. Actualisez la page.'
    }

    return messages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.'
  }

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    try {
      const { getAuth, signOut } = await import('firebase/auth')
      const auth = getAuth()
      await signOut(auth)
    } catch (error) {
      console.error('Firebase signOut error:', error)
    }
  }

  /**
   * Clean up reCAPTCHA
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear()
      this.recaptchaVerifier = null
    }
    this.confirmationResult = null
  }
}

export const firebaseService = new FirebaseService()
