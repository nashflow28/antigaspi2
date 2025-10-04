import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'

// Screens
import HomeScreen from '../screens/main/HomeScreen'
import ProductsScreen from '../screens/main/ProductsScreen'
import ReservationsScreen from '../screens/main/ReservationsScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import ProductDetailsScreen from '../screens/main/ProductDetailsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour chaque tab qui peut avoir des sous-écrans
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
  </Stack.Navigator>
)

const ProductsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductsMain" component={ProductsScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
  </Stack.Navigator>
)

const MainNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Products') {
            iconName = focused ? 'bag' : 'bag-outline'
          } else if (route.name === 'Reservations') {
            iconName = focused ? 'bookmark' : 'bookmark-outline'
          } else if (route.name === 'Profile') {
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
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{ title: 'Produits' }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsScreen}
        options={{ title: 'Réservations' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  )
}

export default MainNavigator