import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'

// Merchant Screens (à créer)
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen'
import MerchantProductsScreen from '../screens/merchant/MerchantProductsScreen'
import MerchantReservationsScreen from '../screens/merchant/MerchantReservationsScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import ProductFormScreen from '../screens/merchant/ProductFormScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour les produits avec création/édition
const ProductsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductsList" component={MerchantProductsScreen} />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} />
  </Stack.Navigator>
)

const MerchantNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline'
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline'
          } else if (route.name === 'Reservations') {
            iconName = focused ? 'receipt' : 'receipt-outline'
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
          paddingBottom: 5,
          height: 60,
          backgroundColor: theme.colors.surface.light,
          borderTopColor: theme.colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MerchantDashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ title: 'Mes Produits' }}
      />
      <Tab.Screen
        name="Reservations"
        component={MerchantReservationsScreen}
        options={{ title: 'Réservations' }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{ title: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

export default MerchantNavigator
