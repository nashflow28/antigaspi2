import React, { useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import ErrorBoundary from '../components/ErrorBoundary'
import { RootState } from '../store'
import { useHaptics } from '../hooks/useHaptics'

// Screens - Driver specific
import DriverHomeScreen from '../screens/driver/DriverHomeScreen'
import AvailableDeliveriesScreen from '../screens/driver/AvailableDeliveriesScreen'
import ActiveDeliveryScreen from '../screens/driver/ActiveDeliveryScreen'
import DeliveryDetailsScreen from '../screens/driver/DeliveryDetailsScreen'
import DeliveryMapScreen from '../screens/driver/DeliveryMapScreen'
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen'
import DriverProfileScreen from '../screens/driver/DriverProfileScreen'
import DriverProfileEditScreen from '../screens/driver/DriverProfileEditScreen'
import DriverHistoryScreen from '../screens/driver/DriverHistoryScreen'

// Shared screens
import NotificationsScreen from '../screens/main/NotificationsScreen'
import NotificationSettingsScreen from '../screens/merchant/NotificationSettingsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Home Stack - Dashboard
const HomeStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverHomeMain" component={DriverHomeScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

// Deliveries Stack - Available and active
const DeliveriesStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AvailableDeliveriesMain" component={AvailableDeliveriesScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

// Earnings Stack
const EarningsStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EarningsMain" component={DriverEarningsScreen} />
      <Stack.Screen name="DriverHistory" component={DriverHistoryScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

// Map Stack - Navigation view
const MapStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={DeliveryMapScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

// Account Stack
const AccountStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverAccountMain" component={DriverProfileScreen} />
      <Stack.Screen name="DriverProfileEdit" component={DriverProfileEditScreen} />
      <Stack.Screen name="DriverHistory" component={DriverHistoryScreen} />
      <Stack.Screen name="NotificationsInbox" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

const DriverNavigator: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const haptics = useHaptics()

  // Get active delivery from driver state
  const { activeDelivery, availableDeliveries } = useSelector((state: RootState) => state.driver)
  const hasActiveDelivery = !!activeDelivery
  const availableCount = availableDeliveries?.length ?? 0

  // Haptic feedback on tab press
  const handleTabPress = useCallback(() => {
    haptics.lightTap()
  }, [haptics])

  return (
    <Tab.Navigator
      initialRouteName="DriverHome"
      screenListeners={{
        tabPress: handleTabPress,
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'DriverHome') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'bicycle' : 'bicycle-outline'
            // Show badge if there are available deliveries
            return (
              <View style={styles.tabIconContainer}>
                <Ionicons name={iconName} size={size} color={color} />
                {availableCount > 0 && !hasActiveDelivery && (
                  <View style={[styles.tabBadge, { backgroundColor: theme.colors.success }]}>
                    <Text style={styles.tabBadgeText}>
                      {availableCount > 99 ? '99+' : availableCount}
                    </Text>
                  </View>
                )}
                {hasActiveDelivery && (
                  <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary[500] }]} />
                )}
              </View>
            )
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline'
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline'
            // Show indicator if active delivery
            return (
              <View style={styles.tabIconContainer}>
                <Ionicons name={iconName} size={size} color={color} />
                {hasActiveDelivery && (
                  <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary[500] }]} />
                )}
              </View>
            )
          } else if (route.name === 'DriverAccount') {
            iconName = focused ? 'person' : 'person-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        headerShown: false,
        tabBarStyle: {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          backgroundColor: theme.isDark ? theme.colors.cardBackground : theme.colors.surface.light,
          borderTopColor: theme.colors.border,
          pointerEvents: 'auto',
        },
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={HomeStack}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliveriesStack}
        options={{ title: 'Livraisons' }}
      />
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{ title: 'Carte' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsStack}
        options={{ title: 'Gains' }}
      />
      <Tab.Screen
        name="DriverAccount"
        component={AccountStack}
        options={{ title: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})

export default DriverNavigator
