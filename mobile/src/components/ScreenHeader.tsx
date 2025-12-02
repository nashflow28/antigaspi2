import React from 'react'
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'

interface ScreenHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

/**
 * Composant header qui gère automatiquement le safe area (status bar)
 * sur tous les téléphones Android et iOS.
 */
const ScreenHeader: React.FC<ScreenHeaderProps> = ({ children, style }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
          },
          style,
        ]}
      >
        {children}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
})

export default ScreenHeader
