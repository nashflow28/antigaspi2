import React, { useEffect, useRef, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector, useDispatch } from 'react-redux'
import { Platform } from 'react-native'
import { RootState, AppDispatch } from '../store'
import { loadStoredAuth } from '../store/slices/authSlice'

// Screens
import SplashScreen from '../screens/SplashScreen'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import { navigationRef, flushPendingActions } from './NavigationRef'

const Stack = createNativeStackNavigator()

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [hydrated, setHydrated] = useState(false)
  const previousRouteRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Charger l'état d'auth local sans bloquer les écrans pendant les requêtes réseau
    dispatch(loadStoredAuth())
      .finally(() => setHydrated(true))
  }, [dispatch])

  if (!hydrated) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        flushPendingActions()
        const initialRoute = navigationRef.getCurrentRoute()?.name
        previousRouteRef.current = initialRoute ?? undefined
      }}
      onStateChange={() => {
        const previousRouteName = previousRouteRef.current
        const currentRouteName = navigationRef.getCurrentRoute()?.name

        if (currentRouteName && currentRouteName !== previousRouteName) {
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

