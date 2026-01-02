import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import AdminUsersScreen from '../screens/admin/AdminUsersScreen'
import AdminProductsScreen from '../screens/admin/AdminProductsScreen'
import AdminMerchantsScreen from '../screens/admin/AdminMerchantsScreen'
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen'
import AdminReviewModerationScreen from '../screens/admin/AdminReviewModerationScreen'
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen'
import AdminBroadcastScreen from '../screens/admin/AdminBroadcastScreen'
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen'
import AdminPaymentDashboardScreen from '../screens/admin/AdminPaymentDashboardScreen'
import AdminPlusScreen from '../screens/admin/AdminPlusScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour le dashboard
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={AdminDashboardScreen} />
    <Stack.Screen name="Analytics" component={AdminAnalyticsScreen} />
    <Stack.Screen name="Settings" component={AdminSettingsScreen} />
    <Stack.Screen name="Payments" component={AdminPaymentDashboardScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour le hub "Plus" avec les fonctions secondaires
const PlusStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlusMain" component={AdminPlusScreen} />
    <Stack.Screen name="ReviewModeration" component={AdminReviewModerationScreen} />
    <Stack.Screen name="Categories" component={AdminCategoriesScreen} />
    <Stack.Screen name="Broadcast" component={AdminBroadcastScreen} />
    <Stack.Screen name="Analytics" component={AdminAnalyticsScreen} />
    <Stack.Screen name="Payments" component={AdminPaymentDashboardScreen} />
    <Stack.Screen name="Settings" component={AdminSettingsScreen} />
  </Stack.Navigator>
)

const AdminNavigator: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline'
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline'
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline'
          } else if (route.name === 'Merchants') {
            iconName = focused ? 'storefront' : 'storefront-outline'
          } else if (route.name === 'Plus') {
            iconName = focused ? 'apps' : 'apps-outline'
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
          backgroundColor: theme.isDark ? theme.colors.neutral[900] : theme.colors.surface.light,
          borderTopColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ title: 'Utilisateurs' }}
      />
      <Tab.Screen
        name="Products"
        component={AdminProductsScreen}
        options={{ title: 'Produits' }}
      />
      <Tab.Screen
        name="Merchants"
        component={AdminMerchantsScreen}
        options={{ title: 'Commercants' }}
      />
      <Tab.Screen
        name="Plus"
        component={PlusStack}
        options={{ title: 'Plus' }}
      />
    </Tab.Navigator>
  )
}

export default AdminNavigator
