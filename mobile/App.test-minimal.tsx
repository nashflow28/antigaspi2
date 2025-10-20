import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// TEST MINIMAL: Just Hello World
export default function App() {
  console.log('🧪 TEST MINIMAL: Hello World Only')

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Hello World!</Text>
      <Text style={styles.subtext}>App Antigaspi - Test Minimal</Text>
      <Text style={styles.info}>Si vous voyez ceci, React Native fonctionne!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  subtext: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
})
