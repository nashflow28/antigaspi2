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
import ProfileEditScreen from '../screens/main/ProfileEditScreen'
import ProductDetailsScreen from '../screens/main/ProductDetailsScreen'
import ReservationDetailsScreen from '../screens/main/ReservationDetailsScreen'
import MerchantDetailScreen from '../screens/main/MerchantDetailScreen'
import ReviewsListScreen from '../screens/main/ReviewsListScreen'
import AddReviewScreen from '../screens/main/AddReviewScreen'
import NotificationSettingsScreen from '../screens/merchant/NotificationSettingsScreen'
import CartScreen from '../screens/main/CartScreen'
import LoyaltyScreen from '../screens/main/LoyaltyScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator pour chaque tab qui peut avoir des sous-écrans
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
    <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
    <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
    <Stack.Screen name="AddReview" component={AddReviewScreen} />
  </Stack.Navigator>
)

const ProductsStack = () => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
      <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
      <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
      <Stack.Screen name="AddReview" component={AddReviewScreen} />
    </Stack.Navigator>
  </ErrorBoundary>
)

const FavoritesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
    <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
    <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
    <Stack.Screen name="AddReview" component={AddReviewScreen} />
  </Stack.Navigator>
)

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersMain" component={CartScreen} />
    <Stack.Screen name="ReservationsList" component={ReservationsScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
    <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
    <Stack.Screen name="AddReview" component={AddReviewScreen} />
  </Stack.Navigator>
)

const AccountStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountMain" component={ProfileScreen} />
    <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    <Stack.Screen name="Notifications" component={NotificationSettingsScreen} />
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
    <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
    <Stack.Screen name="ReviewsList" component={ReviewsListScreen} />
    <Stack.Screen name="AddReview" component={AddReviewScreen} />
  </Stack.Navigator>
)

const ConsumerNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      initialRouteName="Home"
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
          pointerEvents: 'auto',
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
        component={FavoritesStack}
        options={{ title: 'Favoris' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ title: 'Commande' }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{ title: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

export default ConsumerNavigator