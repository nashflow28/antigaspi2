import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import notificationService, {
  NotificationChannelPreferences,
} from '../services/notificationService'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { refreshProfile } from '../store/slices/authSlice'

const DEFAULT_PREFERENCES: NotificationChannelPreferences = {
  email: true,
  sms: false,
  push: true,
}

const formatSyncError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return "Impossible de synchroniser vos préférences pour le moment."
}

export const useNotificationPreferences = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const [preferences, setPreferences] = useState<NotificationChannelPreferences>(
    DEFAULT_PREFERENCES
  )
  const [initialPreferences, setInitialPreferences] =
    useState<NotificationChannelPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const syncFromUserProfile = useCallback(() => {
    if (!user) {
      return
    }

    const syncedFromProfile: NotificationChannelPreferences = {
      email: user.prefers_email_notifications ?? DEFAULT_PREFERENCES.email,
      sms: user.prefers_sms_notifications ?? DEFAULT_PREFERENCES.sms,
      push: user.prefers_push_notifications ?? DEFAULT_PREFERENCES.push,
    }

    setPreferences(syncedFromProfile)
    setInitialPreferences(syncedFromProfile)
  }, [user])

  useEffect(() => {
    syncFromUserProfile()
  }, [syncFromUserProfile])

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const remotePreferences = await notificationService.loadContactPreferences()

      setPreferences(remotePreferences)
      setInitialPreferences(remotePreferences)
      setLastSyncedAt(new Date())

      try {
        await dispatch(refreshProfile()).unwrap()
      } catch (refreshError) {
        // Profile refresh error after loading preferences handled silently
      }
    } catch (loadError) {
      setError(formatSyncError(loadError))
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  const savePreferences = useCallback(async () => {
    try {
      setSaving(true)
      setError(null)

      const updatedPreferences = await notificationService.saveContactPreferences(
        preferences
      )

      setPreferences(updatedPreferences)
      setInitialPreferences(updatedPreferences)
      setLastSyncedAt(new Date())

      try {
        await dispatch(refreshProfile()).unwrap()
      } catch (refreshError) {
        // Profile refresh error after saving preferences handled silently
      }

      return updatedPreferences
    } catch (saveError) {
      const message = formatSyncError(saveError)
      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }, [dispatch, preferences])

  const togglePreference = useCallback(
    (key: keyof NotificationChannelPreferences) => {
      setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
    },
    []
  )

  const hasChanges = useMemo(() => {
    return (
      preferences.email !== initialPreferences.email ||
      preferences.sms !== initialPreferences.sms ||
      preferences.push !== initialPreferences.push
    )
  }, [preferences, initialPreferences])

  useEffect(() => {
    const handleExternalUpdate = (
      updated: NotificationChannelPreferences
    ): void => {
      setPreferences(updated)
      setInitialPreferences(updated)
      setLastSyncedAt(new Date())
      setError(null)
    }

    notificationService.on('contactPreferencesChanged', handleExternalUpdate)

    return () => {
      notificationService.off('contactPreferencesChanged', handleExternalUpdate)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPreferences()
    }, [loadPreferences])
  )

  return {
    preferences,
    loading,
    saving,
    error,
    lastSyncedAt,
    hasChanges,
    togglePreference,
    refresh: loadPreferences,
    save: savePreferences,
  }
}

export type UseNotificationPreferencesReturn = ReturnType<
  typeof useNotificationPreferences
>
