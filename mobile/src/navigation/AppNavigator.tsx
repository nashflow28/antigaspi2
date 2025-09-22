import React, { useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { loadStoredAuth } from '../store/slices/authSlice'
import NotificationService from '../services/notificationService'

// Screens
import SplashScreen from '../screens/SplashScreen'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'

const Stack = createNativeStackNavigator()

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth)
  const notificationsReady = useRef(false)

  useEffect(() => {
    // Charger les données d'authentification sauvegardées au démarrage
    dispatch(loadStoredAuth())
  }, [dispatch])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (!notificationsReady.current) {
        notificationsReady.current = true

        NotificationService.initialize().catch((error) => {
          console.error('Erreur lors de l\'initialisation des notifications push:', error)
          notificationsReady.current = false
        })
      }
    } else if (!isAuthenticated) {
      notificationsReady.current = false
    }
  }, [isAuthenticated, loading])

  if (loading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
