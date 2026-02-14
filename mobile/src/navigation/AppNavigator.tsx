import React, { useEffect, useRef, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppDispatch } from '../store'
import { loadStoredAuth } from '../store/slices/authSlice'

// Screens
import SplashScreen from '../screens/SplashScreen'
import OnboardingScreen from '../screens/auth/OnboardingScreen'
import AuthNavigator from './AuthNavigator'
import MainNavigator from './MainNavigator'
import { navigationRef, flushPendingActions } from './NavigationRef'

const Stack = createNativeStackNavigator()
const ONBOARDING_KEY = 'antigaspi_onboarding_completed'

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [hydrated, setHydrated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)
  const previousRouteRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const initApp = async () => {
      // Check onboarding status
      try {
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY)
        setShowOnboarding(onboardingCompleted !== 'true')
      } catch {
        setShowOnboarding(false) // Skip onboarding on error
      }

      // Charger l'etat d'auth local sans bloquer les ecrans pendant les requetes reseau
      await dispatch(loadStoredAuth())
      setHydrated(true)
    }

    initApp()
  }, [dispatch])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (!hydrated || showOnboarding === null) {
    return <SplashScreen />
  }

  if (showOnboarding) {
    return <OnboardingScreen navigation={null} onComplete={handleOnboardingComplete} />
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
        {/* Main app - accessible sans authentification */}
        <Stack.Screen name="Main" component={MainNavigator} />

        {/* Auth screens - accessible via navigation quand necessaire */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator

