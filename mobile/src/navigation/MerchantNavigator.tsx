import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'

// Merchant Screens
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen'
import MerchantAnalyticsScreen from '../screens/merchant/MerchantAnalyticsScreen'
import MerchantProductsScreen from '../screens/merchant/MerchantProductsScreen'
import MerchantReservationsScreen from '../screens/merchant/MerchantReservationsScreen'
import MerchantReviewsScreen from '../screens/merchant/MerchantReviewsScreen'
import MerchantLoyaltyScreen from '../screens/merchant/MerchantLoyaltyScreen'
import MerchantSurpriseBasketsScreen from '../screens/merchant/MerchantSurpriseBasketsScreen'
import MerchantProfileEditScreen from '../screens/merchant/MerchantProfileEditScreen'
import MerchantOpeningHoursScreen from '../screens/merchant/MerchantOpeningHoursScreen'
import MerchantNotificationsScreen from '../screens/merchant/MerchantNotificationsScreen'
import NotificationSettingsScreen from '../screens/merchant/NotificationSettingsScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import ProductFormScreen from '../screens/merchant/ProductFormScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour les produits avec création/édition et paniers surprise
const ProductsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductsList" component={MerchantProductsScreen} />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} />
    <Stack.Screen name="SurpriseBaskets" component={MerchantSurpriseBasketsScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour le dashboard avec avis et analytics
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={MerchantDashboardScreen} />
    <Stack.Screen name="Analytics" component={MerchantAnalyticsScreen} />
    <Stack.Screen name="Reviews" component={MerchantReviewsScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour les réservations
const ReservationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReservationsMain" component={MerchantReservationsScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour le programme fidélité
const LoyaltyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LoyaltyMain" component={MerchantLoyaltyScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour le compte
const AccountStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountMain" component={ProfileScreen} />
    <Stack.Screen name="ProfileEdit" component={MerchantProfileEditScreen} />
    <Stack.Screen name="OpeningHours" component={MerchantOpeningHoursScreen} />
    <Stack.Screen name="Reviews" component={MerchantReviewsScreen} />
    <Stack.Screen name="Notifications" component={MerchantNotificationsScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
  </Stack.Navigator>
)

const MerchantNavigator: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline'
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline'
          } else if (route.name === 'Reservations') {
            iconName = focused ? 'receipt' : 'receipt-outline'
          } else if (route.name === 'Loyalty') {
            iconName = focused ? 'gift' : 'gift-outline'
          } else if (route.name === 'Account') {
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
          backgroundColor: theme.colors.surface.light,
          borderTopColor: theme.colors.border,
          pointerEvents: 'auto',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: 'Tableau de bord' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ title: 'Mes Produits' }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsStack}
        options={{ title: 'Réservations' }}
      />
      <Tab.Screen
        name="Loyalty"
        component={LoyaltyStack}
        options={{ title: 'Fidélité' }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{ title: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

export default MerchantNavigator
