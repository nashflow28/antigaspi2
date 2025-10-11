import React, { useEffect } from 'react'
import { View } from 'react-native'
import { Provider, useDispatch } from 'react-redux'
import { store, AppDispatch } from './src/store'
import { clearAuth } from './src/store/slices/authSlice'
import { ThemeProvider } from './src/theme'
import { ToastProvider } from './src/contexts/ToastContext'
import AppNavigator from './src/navigation/AppNavigator'
import apiService from './src/services/api'

// Composant interne qui a accès au dispatch Redux
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Enregistrer le callback pour gérer l'expiration de session (401)
    apiService.setOnUnauthorizedCallback(() => {
      console.log('🔒 Token expiré détecté - Nettoyage du Redux store')
      dispatch(clearAuth())
    })
  }, [dispatch])

  return <AppNavigator />
}

// TEST PROGRESSIF 3: Full app with AppNavigator
export default function App() {
  console.log('🧪 TEST 3: Redux + Theme + Navigation')

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
