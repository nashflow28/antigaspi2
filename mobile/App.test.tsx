import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { store } from './src/store'
import { ThemeProvider } from './src/theme/ThemeContext'

// Test 1: App minimal sans aucune dépendance
export function Test1_MinimalApp() {
  console.log('🧪 TEST 1: App minimal')
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'green' }}>
      <Text style={{ fontSize: 24, color: 'white' }}>TEST 1: React Native OK ✅</Text>
    </View>
  )
}

// Test 2: App avec Redux Provider uniquement
export function Test2_WithRedux() {
  console.log('🧪 TEST 2: Avec Redux')
  return (
    <Provider store={store}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue' }}>
        <Text style={{ fontSize: 24, color: 'white' }}>TEST 2: Redux OK ✅</Text>
      </View>
    </Provider>
  )
}

// Test 3: App avec Redux + ThemeProvider
export function Test3_WithTheme() {
  console.log('🧪 TEST 3: Avec Theme')
  return (
    <Provider store={store}>
      <ThemeProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'purple' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>TEST 3: Theme OK ✅</Text>
        </View>
      </ThemeProvider>
    </Provider>
  )
}

// Test 4: Tester le hook useTheme isolément
export function Test4_UseThemeHook() {
  console.log('🧪 TEST 4: Hook useTheme')

  const TestComponent = () => {
    try {
      const { useTheme } = require('./src/theme')
      const theme = useTheme()
      console.log('Theme loaded:', !!theme)
      console.log('Theme colors:', !!theme.colors)
      console.log('Theme neutral:', !!theme.colors?.neutral)

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'orange' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>TEST 4: useTheme OK ✅</Text>
          <Text style={{ fontSize: 16, color: 'white' }}>neutral[50]: {theme.colors?.neutral?.[50] || 'UNDEFINED'}</Text>
        </View>
      )
    } catch (error) {
      console.error('❌ TEST 4 ERREUR:', error)
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>TEST 4: ERREUR ❌</Text>
          <Text style={{ fontSize: 14, color: 'white'}}>{String(error)}</Text>
        </View>
      )
    }
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    </Provider>
  )
}

// Test 5: ConnectivityBanner isolé
export function Test5_ConnectivityBanner() {
  console.log('🧪 TEST 5: ConnectivityBanner')

  const TestComponent = () => {
    try {
      const ConnectivityBanner = require('./src/components/ConnectivityBanner').default

      return (
        <View style={{ flex: 1, backgroundColor: 'cyan' }}>
          <ConnectivityBanner />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: 'black' }}>TEST 5: ConnectivityBanner OK ✅</Text>
          </View>
        </View>
      )
    } catch (error) {
      console.error('❌ TEST 5 ERREUR:', error)
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>TEST 5: ERREUR ❌</Text>
          <Text style={{ fontSize: 14, color: 'white'}}>{String(error)}</Text>
        </View>
      )
    }
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    </Provider>
  )
}

// Test 6: MainNavigator isolé
export function Test6_MainNavigator() {
  console.log('🧪 TEST 6: MainNavigator')

  const TestComponent = () => {
    try {
      const { NavigationContainer } = require('@react-navigation/native')
      const MainNavigator = require('./src/navigation/MainNavigator').default

      return (
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      )
    } catch (error) {
      console.error('❌ TEST 6 ERREUR:', error)
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>TEST 6: ERREUR ❌</Text>
          <Text style={{ fontSize: 14, color: 'white'}}>{String(error)}</Text>
        </View>
      )
    }
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    </Provider>
  )
}

// Test 7: App normale avec AppContent depuis App.original
export function Test7_AppOriginal() {
  console.log('🧪 TEST 7: App originale avec AppContent')

  try {
    const originalApp = require('./App.original')

    // Utilise AppContent directement sans NavigationRef
    return <originalApp.default />
  } catch (error) {
    console.error('❌ TEST 7 ERREUR:', error)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
        <Text style={{ fontSize: 24, color: 'white' }}>TEST 7: ERREUR ❌</Text>
        <Text style={{ fontSize: 14, color: 'white'}}>{String(error)}</Text>
      </View>
    )
  }
}

// Test 8: AppNavigator complet
export function Test8_AppNavigator() {
  console.log('🧪 TEST 8: AppNavigator complet')

  try {
    const AppNavigator = require('./src/navigation/AppNavigator').default

    return (
      <Provider store={store}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </Provider>
    )
  } catch (error) {
    console.error('❌ TEST 8 ERREUR:', error)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
        <Text style={{ fontSize: 24, color: 'white' }}>TEST 8: ERREUR ❌</Text>
        <Text style={{ fontSize: 14, color: 'white'}}>{String(error)}</Text>
      </View>
    )
  }
}

// Export actuel pour test
export default Test1_MinimalApp