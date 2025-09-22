import React, { useEffect, useRef } from 'react'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { loadStoredAuth } from '../store/slices/authSlice'
import NotificationService from '../services/notificationService'
import analyticsService from '../services/analyticsService'

// Screens
import SplashScreen from '../screens/SplashScreen'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'

const Stack = createNativeStackNavigator()

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading, user, token } = useSelector((state: RootState) => state.auth)
  const notificationsReady = useRef(false)
  const navigationRef = useRef<NavigationContainerRef<any>>(null)
  const previousRouteRef = useRef<string | undefined>()
  const analyticsUserRef = useRef<string | null>(null)

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

  useEffect(() => {
    const synchronizeAnalytics = async () => {
      try {
        if (!loading && isAuthenticated && user && token) {
          const userId = String(user.id)

          await analyticsService.initialize(userId, token)

          if (analyticsUserRef.current !== userId) {
            await analyticsService.setUser({
              userId,
              email: user.email,
              role: user.role,
              city: user.city,
              createdAt: new Date(user.created_at),
              lastActiveAt: new Date(),
            })

            analyticsUserRef.current = userId

            await analyticsService.track('User Authenticated', 'User', {
              screen: navigationRef.current?.getCurrentRoute()?.name ?? 'App',
            })
          }
        } else if (!loading && analyticsUserRef.current) {
          try {
            await analyticsService.trackSessionEnd()
          } finally {
            await analyticsService.reset()
            analyticsUserRef.current = null
          }
        }
      } catch (error) {
        console.error('Erreur de synchronisation Analytics:', error)
      }
    }

    void synchronizeAnalytics()
  }, [isAuthenticated, loading, user, token])

  if (loading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialRoute = navigationRef.current?.getCurrentRoute()?.name
        previousRouteRef.current = initialRoute ?? undefined
        if (initialRoute) {
          void analyticsService.trackScreen(initialRoute)
        }
      }}
      onStateChange={() => {
        const previousRouteName = previousRouteRef.current
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name

        if (currentRouteName && currentRouteName !== previousRouteName) {
          void analyticsService.trackScreen(currentRouteName, {
            previousScreen: previousRouteName,
          })
          previousRouteRef.current = currentRouteName
        }
      }}
    >
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
