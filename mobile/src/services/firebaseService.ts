/**
 * Firebase Authentication Service
 * Handles phone number authentication with SMS OTP
 * Uses React Native Firebase for native phone authentication
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

// Store the confirmation result for OTP verification
let confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null

export const firebaseService = {
  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +22890123456)
   * @returns void - Confirmation is stored internally
   */
  sendOTP: async (phoneNumber: string): Promise<void> => {
    try {
      console.log('[FirebaseService] Sending OTP to:', phoneNumber)
      confirmationResult = await auth().signInWithPhoneNumber(phoneNumber)
      console.log('[FirebaseService] OTP sent successfully')
    } catch (error: any) {
      console.error('[FirebaseService] sendOTP error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  /**
   * Verify OTP code and get Firebase ID token
   * @param code - 6-digit OTP code
   * @returns Firebase ID token
   */
  verifyOTP: async (code: string): Promise<string> => {
    try {
      if (!confirmationResult) {
        throw new Error('Session expirée. Veuillez redemander un code.')
      }

      console.log('[FirebaseService] Verifying OTP code')
      const userCredential = await confirmationResult.confirm(code)

      if (!userCredential || !userCredential.user) {
        throw new Error('Échec de la vérification.')
      }

      // Get the ID token to send to backend
      const idToken = await userCredential.user.getIdToken()
      console.log('[FirebaseService] OTP verified, got ID token')

      // Clear the confirmation result after successful verification
      confirmationResult = null

      return idToken
    } catch (error: any) {
      console.error('[FirebaseService] verifyOTP error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  /**
   * Get current user's ID token (for authenticated requests)
   */
  getCurrentIdToken: async (): Promise<string | null> => {
    const user = auth().currentUser
    if (!user) return null
    return user.getIdToken()
  },

  /**
   * Sign out from Firebase
   */
  signOut: async (): Promise<void> => {
    try {
      await auth().signOut()
      confirmationResult = null
    } catch (error: any) {
      console.error('[FirebaseService] signOut error:', error)
      throw error
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser: () => auth().currentUser,

  /**
   * Check if OTP session is active
   */
  hasActiveOTPSession: () => confirmationResult !== null,

  /**
   * Clear OTP session (for retry)
   */
  clearOTPSession: () => {
    confirmationResult = null
  },
}

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-phone-number':
      return 'Numéro de téléphone invalide. Vérifiez le format.'
    case 'auth/missing-phone-number':
      return 'Veuillez entrer un numéro de téléphone.'
    case 'auth/quota-exceeded':
      return 'Trop de tentatives. Réessayez plus tard.'
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.'
    case 'auth/invalid-verification-code':
      return 'Code de vérification incorrect.'
    case 'auth/invalid-verification-id':
      return 'Session expirée. Veuillez redemander un code.'
    case 'auth/code-expired':
      return 'Le code a expiré. Veuillez redemander un nouveau code.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez patienter quelques minutes.'
    case 'auth/captcha-check-failed':
      return 'Vérification de sécurité échouée. Réessayez.'
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion internet.'
    case 'auth/session-expired':
      return 'Session expirée. Veuillez redemander un code.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}

export default firebaseService
