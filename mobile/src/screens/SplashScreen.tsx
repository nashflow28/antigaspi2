import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { Typography } from '../components/2025'
import { useTheme } from '../theme'

const SplashScreen: React.FC = () => {
  const theme = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary[500], paddingHorizontal: theme.spacing.lg }]}>
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <View style={{ alignItems: 'center', marginBottom: theme.spacing['4xl'] }}>
        <Typography variant="displayXl" weight="bold" style={{ color: theme.colors.textInverse, marginBottom: theme.spacing.sm, textAlign: 'center' }}>
          🌱 Antigaspi
        </Typography>
        <Typography variant="h3" style={{ color: theme.colors.textInverse, opacity: 0.9, textAlign: 'center', fontWeight: '300' }}>
          Luttons contre le gaspillage
        </Typography>
      </View>

      <View style={{ alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.textInverse} />
        <Typography variant="body" style={{ marginTop: theme.spacing.md, color: theme.colors.textInverse, opacity: 0.8 }}>
          Chargement...
        </Typography>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default SplashScreen
