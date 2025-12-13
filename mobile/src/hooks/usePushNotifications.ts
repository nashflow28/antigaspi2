import { useEffect } from 'react'
import { Platform } from 'react-native'
import notificationService, {
  ForegroundNotificationEvent,
  NotificationNavigationEvent,
} from '../services/notificationService'
import { useAppSelector } from '../store/hooks'
import { useToast } from '../contexts/ToastContext'
import * as NavigationRef from '../navigation/NavigationRef'
import { createLogger } from '../utils/logger'

const pushNotificationsLogger = createLogger('PushNotifications')

const formatMessage = (event: ForegroundNotificationEvent): string => {
  if (typeof event.body === 'string' && event.body.trim().length > 0) {
    return event.body.trim()
  }

  if (typeof event.title === 'string' && event.title.trim().length > 0) {
    return event.title.trim()
  }

  return 'Nouvelle notification disponible'
}

const usePushNotifications = (): void => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { showInfo, showError } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (Platform.OS === 'web') {
      return
    }

    let cancelled = false

    const setup = async () => {
      try {
        await notificationService.initialize()

        if (cancelled) {
          return
        }

        await notificationService.syncPushTokenOwnership()
      } catch (error) {
        pushNotificationsLogger.warn(
          "Impossible d'initialiser les notifications push:",
          error
        )

        if (!cancelled) {
          showError(
            "Impossible d'activer les notifications push pour le moment. Réessayez plus tard.",
            5000
          )
        }
      }
    }

    setup()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id, showError])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (Platform.OS === 'web') {
      return
    }

    const handleForegroundNotification = (event: ForegroundNotificationEvent) => {
      const message = formatMessage(event)
      showInfo(message, 4000)
    }

    const handleNavigation = (event: NotificationNavigationEvent) => {
      if (!event?.screen) {
        return
      }

      NavigationRef.navigate(event.screen as never, event.params as never)
    }

    notificationService.on('notificationReceived', handleForegroundNotification)
    notificationService.on('navigate', handleNavigation)

    return () => {
      notificationService.off('notificationReceived', handleForegroundNotification)
      notificationService.off('navigate', handleNavigation)
    }
  }, [isAuthenticated, showInfo])
}

export default usePushNotifications
