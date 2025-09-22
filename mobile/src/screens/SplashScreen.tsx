import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native'

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />

      {/* Logo ou titre de l'app */}
      <View style={styles.logoContainer}>
        <Text style={styles.title}>🌱 Antigaspi</Text>
        <Text style={styles.subtitle}>Luttons contre le gaspillage</Text>
      </View>

      {/* Indicateur de chargement */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10B981', // Vert primaire d'Antigaspi
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
})

export default SplashScreen