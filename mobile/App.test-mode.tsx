// @ts-nocheck
import React from 'react'
import { Text, View } from 'react-native'

// Import des tests
import {
  Test1_MinimalApp,
  Test2_WithRedux,
  Test3_WithTheme,
  Test4_UseThemeHook,
  Test5_ConnectivityBanner,
  Test6_MainNavigator,
  Test7_AppOriginal,
  Test8_AppNavigator
} from './App.test'

// ⚠️ CHANGEZ LE NUMÉRO DU TEST ICI (1-7) ⚠️
// Commencez par 1, puis augmentez progressivement
const TEST_NUMBER = 7

console.log(`
========================================
📱 MODE TEST ACTIVÉ - TEST ${TEST_NUMBER}
========================================
1 = App minimal (doit afficher écran vert)
2 = Avec Redux (doit afficher écran bleu)
3 = Avec Theme (doit afficher écran violet)
4 = Hook useTheme (doit afficher écran orange)
5 = ConnectivityBanner (doit afficher écran cyan)
6 = MainNavigator (navigation complète)
7 = App Originale (AppContent)
8 = AppNavigator (app avec auth)
========================================
`)

function getTestComponent() {
  switch(TEST_NUMBER) {
    case 1: return Test1_MinimalApp
    case 2: return Test2_WithRedux
    case 3: return Test3_WithTheme
    case 4: return Test4_UseThemeHook
    case 5: return Test5_ConnectivityBanner
    case 6: return Test6_MainNavigator
    case 7: return Test7_AppOriginal
    case 8: return Test8_AppNavigator
    default:
      console.error(`❌ Test ${TEST_NUMBER} n'existe pas!`)
      return () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
          <Text style={{ fontSize: 24, color: 'white' }}>Test {TEST_NUMBER} n'existe pas!</Text>
        </View>
      )
  }
}

export default function App() {
  const TestComponent = getTestComponent()
  return <TestComponent />
}