import React from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import { store } from './src/store'
import { ThemeProvider } from './src/theme'
import AppNavigator from './src/navigation/AppNavigator'

// TEST 3: Navigation complète
export default function App() {
  console.log('🧪 TEST 3: Redux + Theme + Navigation')

  return (
    <Provider store={store}>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
        </View>
      </ThemeProvider>
    </Provider>
  )
}
