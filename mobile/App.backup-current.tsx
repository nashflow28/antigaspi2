import React from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import AppNavigator from './src/navigation/AppNavigator'
import { store } from './src/store'
import { ThemeProvider } from './src/theme'

export default function App() {
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
