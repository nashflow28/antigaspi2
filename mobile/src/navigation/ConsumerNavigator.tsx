import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import ErrorBoundary from '../components/ErrorBoundary'

// Screens
import HomeScreen from '../screens/main/HomeScreen'
import ProductsScreen from '../screens/main/ProductsScreen'
import FavoritesScreen from '../screens/main/FavoritesScreen'
import ReservationsScreen from '../screens/main/ReservationsScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import ProductDetailsScreen from '../screens/main/ProductDetailsScreen'
import MerchantDetailScreen from '../screens/main/MerchantDetailScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour chaque tab qui peut avoir des sous-écrans
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
  </Stack.Navigator>
)

const ProductsStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

const ConsumerNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Home') {
            iconName = focused ? 'grid' : 'grid-outline'
          } else if (route.name === 'Discover') {
            iconName = focused ? 'compass' : 'compass-outline'
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Orders') {
            iconName = focused ? 'cart' : 'cart-outline'
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
        name="Home"
        component={HomeStack}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Discover"
        component={ProductsStack}
        options={{ title: 'Découvrir' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favoris' }}
      />
      <Tab.Screen
        name="Orders"
        component={ReservationsScreen}
        options={{ title: 'Commande' }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{ title: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

export default ConsumerNavigator