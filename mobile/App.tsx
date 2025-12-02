import React, { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider, useDispatch } from 'react-redux'
import { store, AppDispatch } from './src/store'
import { clearAuth } from './src/store/slices/authSlice'
import { ThemeProvider } from './src/theme'
import { ToastProvider } from './src/contexts/ToastContext'
import { AlertProvider } from './src/contexts/AlertContext'
import AppNavigator from './src/navigation/AppNavigator'
import apiService from './src/services/api'
import usePushNotifications from './src/hooks/usePushNotifications'

// Composant interne qui a accès au dispatch Redux
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>()
  usePushNotifications()

  useEffect(() => {
    // Enregistrer le callback pour gérer l'expiration de session (401)
    apiService.setOnUnauthorizedCallback(() => {
      console.log('🔒 Token expiré détecté - Nettoyage du Redux store')
      dispatch(clearAuth())
    })
  }, [dispatch])

  return <AppNavigator />
}

// ✅ APP FINALE: Tous les providers + AppNavigator
// ThemeProvider AsyncStorage désactivé (fix freeze)
// loadStoredAuth() actif dans AppNavigator
export default function App() {
  console.log('✅ APP FINALE: Redux + Theme + Toast + Navigation')

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>
              <View style={{ flex: 1 }}>
                <AppContent />
              </View>
            </AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}
