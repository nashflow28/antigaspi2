import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchFavorites, toggleFavorite } from '../../store/slices/favoritesSlice'
import { Product } from '../../types'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { API_BASE_URL } from '../../services/api'
import { formatCurrency } from '../../utils/currencyHelpers'
import { Button, Card, Badge, Typography } from '../../components/2025'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>

const FavoritesScreen: React.FC = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const dispatch = useAppDispatch()
  const navigation = useNavigation<NavigationProp>()

  const { favorites, loading, error } = useAppSelector((state) => state.favorites)
  const [refreshing, setRefreshing] = useState(false)

  // 🐛 BUG FIX #MOB-M-004: Use useFocusEffect to reload only when screen gains focus
  // This prevents duplicate calls and ensures fresh data when navigating back
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFavorites())
    }, [dispatch])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchFavorites())
    setRefreshing(false)
  }

  const handleRemoveFavorite = async (productId: number, productName: string) => {
    Alert.alert(
      'Retirer des favoris',
      `Voulez-vous retirer "${productName}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            await dispatch(toggleFavorite(productId))
            // Rafraîchir la liste après le retrait
            dispatch(fetchFavorites())
          },
        },
      ]
    )
  }

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetails', { productId })
  }

  const renderProduct = (product: Product) => {
    const imageUrl = product.image_url
      ? product.image_url.startsWith('http')
        ? product.image_url
        : `${API_BASE_URL.replace('/api', '')}/${product.image_url}`
      : null

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => handleProductPress(product.id)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={{ marginBottom: theme.spacing.md, overflow: 'hidden' }}>
          <View style={styles.productContent}>
            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.productImage} contentFit="cover" />
            )}
            {!imageUrl && (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={32} color={theme.colors.neutral[300]} />
              </View>
            )}

            <View style={styles.productInfo}>
              <Typography variant="body" weight="semibold" numberOfLines={2} style={{ marginBottom: theme.spacing.xs }}>
                {product.name}
              </Typography>
              <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: theme.spacing.sm }}>
                {product.merchant.business_name}
              </Typography>

              <View style={styles.priceRow}>
                <Typography variant="h3" weight="bold" color="primary" style={{ marginRight: theme.spacing.sm }}>
                  {formatCurrency(product.discounted_price)}
                </Typography>
                <Typography variant="caption" color="tertiary" style={{ textDecorationLine: 'line-through', marginRight: theme.spacing.sm }}>
                  {formatCurrency(product.original_price)}
                </Typography>
                <Badge variant="success" size="sm">
                  -{product.discount_percentage}%
                </Badge>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                    {product.category.name}
                  </Typography>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                    Exp. {new Date(product.expiration_date).toLocaleDateString('fr-FR')}
                  </Typography>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeFavoriteButton}
            accessibilityRole="button"
            accessibilityLabel={`Retirer ${product.name} des favoris`}
            onPress={() => handleRemoveFavorite(product.id, product.name)}
          >
            <Ionicons name="heart" size={24} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        </Card>
      </TouchableOpacity>
    )
  }

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" weight="bold">
            Favoris
          </Typography>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.md }}>
            Chargement de vos favoris...
          </Typography>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" weight="bold">
            Favoris
          </Typography>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.semantic.error} />
          <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            Erreur
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
            {error}
          </Typography>
          <Button
            variant="primary"
            size="md"
            onPress={() => dispatch(fetchFavorites())}
          >
            Réessayer
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" weight="bold">
          Favoris
        </Typography>
        {favorites.length > 0 && (
          <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
            {favorites.length} produit(s)
          </Typography>
        )}
      </View>

      <ScrollView
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[600]]}
          />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={theme.colors.neutral[300]} />
            <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
              Aucun favori
            </Typography>
            <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
              Ajoutez des produits à vos favoris en appuyant sur le{' '}
              <Ionicons name="heart" size={16} /> dans la liste des produits
            </Typography>
          </View>
        ) : (
          favorites.map(renderProduct)
        )}
      </ScrollView>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    content: {
      padding: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: theme.spacing['3xl'],
      paddingHorizontal: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    productContent: {
      flexDirection: 'row',
      padding: theme.spacing.md,
    },
    productImage: {
      width: 80,
      height: 80,
      borderRadius: theme.radius.md,
      marginRight: theme.spacing.md,
    },
    placeholderImage: {
      backgroundColor: theme.colors.neutral[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    productInfo: {
      flex: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    removeFavoriteButton: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
  })

export default FavoritesScreen
