/**
 * Utilitaires pour la gestion des tokens JWT
 */

import { authLogger } from './logger'

/**
 * Décode un token JWT sans vérifier la signature
 * (la vérification de signature se fait côté serveur)
 */
export function decodeJWT(token: string): { exp?: number; iat?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Décoder la partie payload (index 1)
    const payload = parts[1]
    // Convertir de base64url à base64 standard
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // Décoder le base64
    const jsonPayload = atob(base64)
    return JSON.parse(jsonPayload)
  } catch {
    authLogger.warn('JWT decode error')
    return null
  }
}

/**
 * Vérifie si un token JWT est expiré
 * @param token Le token JWT à vérifier
 * @param bufferSeconds Marge de sécurité en secondes (défaut: 60s)
 * @returns true si le token est expiré ou invalide
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const decoded = decodeJWT(token)

  if (!decoded || !decoded.exp) {
    // Token invalide ou sans expiration = considéré comme expiré
    authLogger.warn('Token without expiration or invalid')
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const expirationTime = decoded.exp

  // Token expiré si: temps actuel + marge >= temps d'expiration
  const isExpired = currentTime + bufferSeconds >= expirationTime

  if (isExpired) {
    const expiredAgo = currentTime - expirationTime
    authLogger.log(`Token expired ${expiredAgo > 0 ? expiredAgo : 0}s ago`)
  } else {
    const expiresIn = expirationTime - currentTime
    authLogger.log(`Token valid, expires in ${Math.floor(expiresIn / 60)}min`)
  }

  return isExpired
}

/**
 * Obtient le temps restant avant expiration en secondes
 * @returns Secondes restantes, ou 0 si expiré/invalide
 */
export function getTokenTimeRemaining(token: string): number {
  const decoded = decodeJWT(token)

  if (!decoded || !decoded.exp) {
    return 0
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const remaining = decoded.exp - currentTime

  return remaining > 0 ? remaining : 0
}
