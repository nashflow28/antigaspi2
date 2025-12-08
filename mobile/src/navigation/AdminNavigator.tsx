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

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour le dashboard avec analytics
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={AdminDashboardScreen} />
    <Stack.Screen name="Analytics" component={AdminAnalyticsScreen} />
  </Stack.Navigator>
)

// Stack Navigator pour les notifications broadcast
const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsMain" component={AdminBroadcastScreen} />
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
          } else if (route.name === 'Reviews') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline'
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline'
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
        options={{ title: 'Commerçants' }}
      />
      <Tab.Screen
        name="Reviews"
        component={AdminReviewModerationScreen}
        options={{ title: 'Modération' }}
      />
      <Tab.Screen
        name="Categories"
        component={AdminCategoriesScreen}
        options={{ title: 'Catégories' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{ title: 'Notifications' }}
      />
    </Tab.Navigator>
  )
}

export default AdminNavigator
