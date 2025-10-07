import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'

// Admin Screens (à créer)
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import AdminUsersScreen from '../screens/admin/AdminUsersScreen'
import AdminProductsScreen from '../screens/admin/AdminProductsScreen'
import AdminMerchantsScreen from '../screens/admin/AdminMerchantsScreen'
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen'

const Tab = createBottomTabNavigator()

const AdminNavigator: React.FC = () => {
  const theme = useTheme()

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
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          backgroundColor: theme.colors.surface.light,
          borderTopColor: theme.colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
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
        name="Categories"
        component={AdminCategoriesScreen}
        options={{ title: 'Catégories' }}
      />
    </Tab.Navigator>
  )
}

export default AdminNavigator
