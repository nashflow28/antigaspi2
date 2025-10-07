import React, { useEffect, useRef } from 'react'
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
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth)
  const previousRouteRef = useRef<string | undefined>()

  useEffect(() => {
    // Charger les données d'authentification sauvegardées au démarrage
    dispatch(loadStoredAuth())
  }, [dispatch])

  if (loading) {
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

