/**
 * Firebase Authentication Service
 * Handles phone number authentication with SMS OTP
 */

import {
  PhoneAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth'
import { auth } from '../config/firebase'

export interface FirebaseOTPResult {
  verificationId: string
}

export const firebaseService = {
  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +22890123456)
   * @param recaptchaVerifier - reCAPTCHA verifier instance
   * @returns ConfirmationResult for verifying the code
   */
  sendOTP: async (
    phoneNumber: string,
    recaptchaVerifier: ApplicationVerifier
  ): Promise<ConfirmationResult> => {
    try {
      const provider = new PhoneAuthProvider(auth)
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      )

      // Return a confirmation result-like object
      return {
        verificationId,
        confirm: async (code: string) => {
          const credential = PhoneAuthProvider.credential(verificationId, code)
          return signInWithCredential(auth, credential)
        },
      } as ConfirmationResult
    } catch (error: any) {
      console.error('[FirebaseService] sendOTP error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  /**
   * Verify OTP code and get Firebase ID token
   * @param verificationId - Verification ID from sendOTP
   * @param code - 6-digit OTP code
   * @returns Firebase ID token
   */
  verifyOTP: async (verificationId: string, code: string): Promise<string> => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code)
      const userCredential = await signInWithCredential(auth, credential)

      // Get the ID token to send to backend
      const idToken = await userCredential.user.getIdToken()
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
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
  },

  /**
   * Sign out from Firebase
   */
  signOut: async (): Promise<void> => {
    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      console.error('[FirebaseService] signOut error:', error)
      throw error
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser: () => auth.currentUser,
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
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}

export default firebaseService
