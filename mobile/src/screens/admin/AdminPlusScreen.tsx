import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Typography, Card } from '../../components/2025'
import { useHaptics } from '../../hooks/useHaptics'

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  onPress: () => void
  color?: string
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, description, onPress, color }) => {
  const theme = useTheme()
  const haptics = useHaptics()

  const handlePress = async () => {
    await haptics.lightTap()
    onPress()
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.menuItem}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (color || theme.colors.primary[500]) + '20' },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={color || theme.colors.primary[500]}
          />
        </View>
        <View style={styles.menuContent}>
          <Typography variant="body" weight="semibold" style={{ color: theme.colors.text }}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: theme.colors.textSecondary, marginTop: 2 }}
          >
            {description}
          </Typography>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textTertiary}
        />
      </Card>
    </TouchableOpacity>
  )
}

const AdminPlusScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()

  const menuItems: MenuItemProps[] = [
    {
      icon: 'chatbubbles',
      title: 'Moderation',
      description: 'Gerer les avis et commentaires',
      onPress: () => navigation.navigate('ReviewModeration'),
      color: '#F59E0B', // Orange warning
    },
    {
      icon: 'grid',
      title: 'Categories',
      description: 'Organiser les categories de produits',
      onPress: () => navigation.navigate('Categories'),
      color: '#3B82F6', // Blue
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      description: 'Envoyer des notifications broadcast',
      onPress: () => navigation.navigate('Broadcast'),
      color: theme.colors.primary[500],
    },
    {
      icon: 'analytics',
      title: 'Analytics',
      description: 'Statistiques detaillees de la plateforme',
      onPress: () => navigation.navigate('Analytics'),
      color: '#8B5CF6', // Purple
    },
    {
      icon: 'card',
      title: 'Paiements',
      description: 'Tableau de bord des transactions',
      onPress: () => navigation.navigate('Payments'),
      color: '#10B981', // Green
    },
    {
      icon: 'settings',
      title: 'Parametres',
      description: 'Configuration de la plateforme',
      onPress: () => navigation.navigate('Settings'),
      color: theme.colors.neutral[500],
    },
  ]

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Typography variant="h2" weight="bold" style={{ color: theme.colors.text }}>
          Plus
        </Typography>
        <Typography variant="body" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
          Fonctionnalites supplementaires
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Typography
            variant="caption"
            style={{ color: theme.colors.textTertiary, textAlign: 'center' }}
          >
            GÊLADAL Admin v1.0
          </Typography>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuSection: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  appInfo: {
    marginTop: 32,
    paddingVertical: 16,
  },
})

export default AdminPlusScreen
