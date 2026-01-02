import React from 'react'
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Typography } from '../2025'
import { useHaptics } from '../../hooks/useHaptics'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightPress?: () => void
  rightIconTestId?: string
}

/**
 * Composant header uniforme pour les ecrans Admin
 * Style: fond vert primary, texte blanc, subtitle "Administrateur"
 */
const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle = 'Administrateur',
  showBack = false,
  rightIcon,
  onRightPress,
  rightIconTestId,
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const haptics = useHaptics()

  const handleBack = async () => {
    await haptics.lightTap()
    navigation.goBack()
  }

  const handleRightPress = async () => {
    if (onRightPress) {
      await haptics.lightTap()
      onRightPress()
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary[500],
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <View style={styles.headerContent}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityLabel="Retour"
              testID="admin-header-back"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            {subtitle && (
              <Typography variant="caption" style={styles.subtitle}>
                {subtitle}
              </Typography>
            )}
            <Typography variant="h2" weight="bold" style={styles.title}>
              {title}
            </Typography>
          </View>
          {rightIcon && onRightPress ? (
            <TouchableOpacity
              onPress={handleRightPress}
              style={styles.rightButton}
              accessibilityLabel="Action"
              testID={rightIconTestId || 'admin-header-right'}
            >
              <Ionicons name={rightIcon} size={24} color="white" />
            </TouchableOpacity>
          ) : rightIcon ? (
            <Ionicons name={rightIcon} size={32} color="white" />
          ) : (
            <View style={styles.rightPlaceholder} />
          )}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    color: 'white',
  },
  rightButton: {
    padding: 4,
  },
  rightPlaceholder: {
    width: 32,
  },
})

export default AdminHeader
