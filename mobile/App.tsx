import React from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { store } from './src/store'
import { ThemeProvider } from './src/theme'
import MainNavigator from './src/navigation/MainNavigator'
import ConnectivityBanner from './src/components/ConnectivityBanner'

// Version simplifiée sans offlineService ni AppNavigator complexe
export default function App() {
  console.log('🚀 App simplifiée démarrée - Sans offlineService')

  return (
    <Provider store={store}>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <ConnectivityBanner />
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </View>
      </ThemeProvider>
    </Provider>
  )
}