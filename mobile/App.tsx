import React, { useEffect } from 'react'
import { View } from 'react-native'
import { Provider, useDispatch } from 'react-redux'
import { store, AppDispatch } from './src/store'
import { clearAuth } from './src/store/slices/authSlice'
import { hydrateLoyaltyFromCache } from './src/store/slices/loyaltySlice'
import { ThemeProvider } from './src/theme'
import { ToastProvider } from './src/contexts/ToastContext'
import AppNavigator from './src/navigation/AppNavigator'
import apiService from './src/services/api'
import offlineService from './src/services/offlineService'
import usePushNotifications from './src/hooks/usePushNotifications'
import { LoyaltySummary } from './src/types'

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

  useEffect(() => {
    let isMounted = true

    const bootstrapLoyaltyCache = async () => {
      try {
        const cached = await offlineService.getCache<{ summary: LoyaltySummary; syncedAt: string }>('loyalty')
        if (cached && isMounted) {
          dispatch(hydrateLoyaltyFromCache(cached))
        }
      } catch (error) {
        console.warn('Impossible de charger le cache fidélité', error)
      }
    }

    bootstrapLoyaltyCache()

    return () => {
      isMounted = false
    }
  }, [dispatch])

  return <AppNavigator />
}

// ✅ APP FINALE: Tous les providers + AppNavigator
// ThemeProvider AsyncStorage désactivé (fix freeze)
// loadStoredAuth() actif dans AppNavigator
export default function App() {
  console.log('✅ APP FINALE: Redux + Theme + Toast + Navigation')

  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <View style={{ flex: 1 }}>
            <AppContent />
          </View>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  )
}
