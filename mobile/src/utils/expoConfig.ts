import Constants from 'expo-constants'
import type { PlatformOSType } from 'react-native'

export type ExpoExtra = Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getExtraFromConstants = (): ExpoExtra | undefined => {
  const legacyManifestExtra = (Constants as unknown as { manifest?: { extra?: unknown } }).manifest?.extra
  const manifestExtra = isRecord(legacyManifestExtra) ? legacyManifestExtra : undefined

  if (isRecord(Constants.expoConfig?.extra)) {
    return Constants.expoConfig?.extra as ExpoExtra
  }

  return manifestExtra
}

const getExtraFromUpdates = (): ExpoExtra | undefined => {
  try {
     
    const updatesModule = require('expo-updates') as {
      manifestExtra?: unknown
      manifest?: { extra?: unknown }
      channel?: string
      isEnabled?: boolean
      runtimeVersion?: string
      releaseChannel?: string
      platform?: PlatformOSType
    }

    if (isRecord(updatesModule?.manifestExtra)) {
      return updatesModule.manifestExtra
    }

    if (isRecord(updatesModule?.manifest?.extra)) {
      return updatesModule.manifest.extra
    }
  } catch {
    // expo-updates est indisponible (ex: plateforme web)
  }

  return undefined
}

const getExtraFromNativeModules = (): ExpoExtra | undefined => {
  try {
     
    const { NativeModules } = require('react-native') as typeof import('react-native')

    const candidates: unknown[] = [
      NativeModules?.ExpoConfig?.extra,
      NativeModules?.ExpoUpdatesConfig?.extra,
      NativeModules?.ExponentConstants?.manifest?.extra,
    ]

    for (const candidate of candidates) {
      if (isRecord(candidate)) {
        return candidate
      }
    }
  } catch {
    // NativeModules peut être indisponible lors de l'exécution web/test
  }

  return undefined
}

export const getExpoExtra = (): ExpoExtra | undefined => {
  return (
    getExtraFromConstants() ??
    getExtraFromUpdates() ??
    getExtraFromNativeModules()
  )
}

export const getExpoExtraValue = <T = unknown>(key: string): T | undefined => {
  const extra = getExpoExtra()
  if (extra && key in extra) {
    return extra[key] as T
  }
  return undefined
}
