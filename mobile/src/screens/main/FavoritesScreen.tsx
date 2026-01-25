import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { RootState } from '../../store'
import { fetchFavorites, toggleFavorite } from '../../store/slices/favoritesSlice'
import { Product } from '../../types'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { API_BASE_URL } from '../../services/api'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { Button, Card, Badge, Typography, EmptyState } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import { navigationRef } from '../../navigation/NavigationRef'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>

const FavoritesScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = createStyles(theme)
  const dispatch = useAppDispatch()
  const navigation = useNavigation<NavigationProp>()
  const { alertProps, showWarning, hideAlert } = useAlert()

  const { favorites, loading, error } = useAppSelector((state) => state.favorites)
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth)
  const [refreshing, setRefreshing] = useState(false)

  // Reload favorites when screen gains focus (only if authenticated)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchFavorites())
      }
    }, [dispatch, isAuthenticated])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchFavorites())
    setRefreshing(false)
  }

  const handleRemoveFavorite = async (productId: number, productName: string) => {
    showWarning(
      'Retirer des favoris',
      `Voulez-vous retirer "${productName}" de vos favoris ?`,
      [
        { text: 'Annuler', onPress: hideAlert },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            hideAlert()
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
    const imageUrl = getImageUrl(product.image_url, product.category?.name)

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
                {product.merchant?.business_name || 'Commerce partenaire'}
              </Typography>

              <View style={styles.priceRow}>
                <Typography variant="body" weight="bold" color="primary" style={{ marginRight: theme.spacing.xs }}>
                  {formatCurrency(product.discounted_price)}
                </Typography>
                <Typography variant="caption" color="tertiary" style={{ textDecorationLine: 'line-through', marginRight: theme.spacing.xs, fontSize: 11 }}>
                  {formatCurrency(product.original_price)}
                </Typography>
                <Badge variant="success" size="sm">
                  -{product.discount_percentage ?? 0}%
                </Badge>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                    {product.category?.name || 'Catégorie'}
                  </Typography>
                </View>
                <View style={[styles.metaItem, { flexShrink: 0 }]}>
                  <Ionicons name="time" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                    {(() => {
                      const date = new Date(product.expiration_date);
                      return isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    })()}
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

  // Vue pour les utilisateurs non connectes
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Typography variant="h2" weight="bold">
            Favoris
          </Typography>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.lg }}>
          <EmptyState
            variant="no-favorites"
            title="Connectez-vous"
            description="Connectez-vous pour sauvegarder vos produits favoris et les retrouver facilement"
            actions={[
              {
                label: 'Se connecter',
                icon: 'log-in-outline',
                onPress: () => navigationRef.navigate('Auth', { screen: 'Login' }),
              },
              {
                label: 'Creer un compte',
                icon: 'person-add-outline',
                variant: 'secondary',
                onPress: () => navigationRef.navigate('Auth', { screen: 'Login' }),
              },
            ]}
          />
        </View>
      </View>
    )
  }

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Typography variant="h2" weight="bold">
            Favoris
          </Typography>
        </View>
        <EmptyState
          variant="error"
          description={error}
          actions={[
            {
              label: 'Réessayer',
              icon: 'refresh-outline',
              onPress: () => dispatch(fetchFavorites()),
            },
          ]}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
          <EmptyState
            variant="no-favorites"
            actions={[
              {
                label: 'Explorer les produits',
                icon: 'search-outline',
                onPress: () => navigation.getParent()?.navigate('Home'),
              },
            ]}
          />
        ) : (
          favorites.map(renderProduct)
        )}
      </ScrollView>

      <AlertModal {...alertProps} />
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
      flexWrap: 'wrap',
      marginBottom: theme.spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
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
