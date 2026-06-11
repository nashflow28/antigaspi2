import React, { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider, useDispatch } from 'react-redux'
import { store, AppDispatch } from './src/store'
import { clearAuth } from './src/store/slices/authSlice'
import { ThemeProvider } from './src/theme'
import { ToastProvider } from './src/contexts/ToastContext'
import { AlertProvider } from './src/contexts/AlertContext'
import { AuthPromptProvider } from './src/contexts/AuthPromptContext'
import AppNavigator from './src/navigation/AppNavigator'
import apiService from './src/services/api'
import usePushNotifications from './src/hooks/usePushNotifications'
import { initSentry, wrapWithSentry, setUser } from './src/utils/sentryInit'
import { initI18n } from './src/i18n'
import { createLogger } from './src/utils/logger'

const log = createLogger('App')

// Initialize Sentry as early as possible
initSentry()

// BUG FIX #18: Initialize i18n with device/persisted locale
initI18n()

// Composant interne qui a accès au dispatch Redux
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>()
  usePushNotifications()

  useEffect(() => {
    // Enregistrer le callback pour gérer l'expiration de session (401)
    apiService.setOnUnauthorizedCallback(() => {
      log.log('🔒 Token expiré détecté - Nettoyage du Redux store')
      dispatch(clearAuth())
    })
  }, [dispatch])

  return <AppNavigator />
}

// ✅ APP FINALE: Tous les providers + AppNavigator + Sentry
// ThemeProvider AsyncStorage désactivé (fix freeze)
// loadStoredAuth() actif dans AppNavigator
// Sentry wrap pour capture automatique des erreurs React
function App() {
  if (__DEV__) {
    log.log('✅ APP FINALE: Redux + Theme + Toast + Navigation + Sentry')
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>
              <AuthPromptProvider>
                <View style={{ flex: 1 }}>
                  <AppContent />
                </View>
              </AuthPromptProvider>
            </AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

// Wrap with Sentry for automatic error boundary
export default wrapWithSentry(App)
