import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'

import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSurpriseBasketById, setSelectedBasket } from '../../store/slices/surpriseBasketsSlice'
import { addCartItem } from '../../store/slices/cartSlice'
import { useTheme } from '../../theme'
import { Typography, Button, Badge, Card } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { SurpriseBasket, SurpriseBasketItem } from '../../types'
import AlertModal from '../../components/AlertModal'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface RouteParams {
  basketId: number
}

export default function SurpriseBasketDetailsScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { basketId } = route.params as RouteParams
  const dispatch = useAppDispatch()
  const theme = useTheme()

  const { selectedBasket, loading, error } = useAppSelector(state => state.surpriseBaskets)
  const { user } = useAppSelector(state => state.auth)
  const [refreshing, setRefreshing] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  }>({ type: 'info', title: '', message: '' })

  useEffect(() => {
    dispatch(fetchSurpriseBasketById(basketId))
  }, [dispatch, basketId])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await dispatch(fetchSurpriseBasketById(basketId))
    setRefreshing(false)
  }, [dispatch, basketId])

  const handleAddToCart = useCallback(async () => {
    if (!selectedBasket) return

    if (!user) {
      setAlertConfig({
        type: 'info',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour ajouter ce panier à votre commande.',
      })
      setAlertVisible(true)
      return
    }

    try {
      await dispatch(addCartItem({
        productId: selectedBasket.id,
        quantity,
      })).unwrap()

      setAlertConfig({
        type: 'success',
        title: 'Ajouté au panier',
        message: `${selectedBasket.name} a été ajouté à votre panier.`,
      })
      setAlertVisible(true)
    } catch (err: any) {
      setAlertConfig({
        type: 'error',
        title: 'Erreur',
        message: err?.message || 'Impossible d\'ajouter au panier.',
      })
      setAlertVisible(true)
    }
  }, [dispatch, selectedBasket, quantity, user])

  const handleGoToMerchant = useCallback(() => {
    if (selectedBasket?.merchant) {
      navigation.navigate('MerchantDetail', { merchantId: selectedBasket.merchant.id })
    }
  }, [navigation, selectedBasket])

  const formatExpirationDate = (dateString?: string | null): string => {
    if (!dateString) return 'Non spécifiée'
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (diffHours < 0) return 'Expiré'
    if (diffHours < 24) return `Dans ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }

  if (loading && !selectedBasket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
            Chargement du panier...
          </Typography>
        </View>
      </SafeAreaView>
    )
  }

  if (error && !selectedBasket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.semantic.error} />
          <Typography variant="h4" style={{ marginTop: 12, textAlign: 'center' }}>
            {error}
          </Typography>
          <Button onPress={handleRefresh} style={{ marginTop: 16 }}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (!selectedBasket) return null

  const basket = selectedBasket
  const discountedPrice = Number(basket.discounted_price)
  const originalValue = Number(basket.total_original_value ?? basket.original_price)
  const savings = originalValue - discountedPrice
  const discountPercent = basket.basket_discount_percentage ?? Math.round((savings / originalValue) * 100)
  const isAvailable = basket.quantity_available > 0 && basket.is_active

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h4" weight="semibold" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          Panier surprise
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(basket.image_url, basket.category?.name) }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {discountPercent > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.semantic.success }]}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
          <View style={[styles.mysteryOverlay, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.9) }]}>
            <Ionicons name="gift" size={32} color="#fff" />
            <Text style={styles.mysteryText}>Panier Mystère</Text>
          </View>
        </View>

        {/* Info principale */}
        <View style={styles.infoSection}>
          <Typography variant="h2" weight="bold">
            {basket.name}
          </Typography>

          {/* Prix */}
          <View style={styles.priceContainer}>
            <Typography variant="h1" weight="bold" style={{ color: theme.colors.primary[500] }}>
              {formatCurrency(discountedPrice)}
            </Typography>
            {savings > 0 && (
              <View style={styles.savingsContainer}>
                <Typography
                  variant="body"
                  color="secondary"
                  style={{ textDecorationLine: 'line-through', marginRight: 8 }}
                >
                  {formatCurrency(originalValue)}
                </Typography>
                <Badge variant="success">
                  {formatCurrency(savings)} d'économie
                </Badge>
              </View>
            )}
          </View>

          {/* Disponibilité */}
          <View style={styles.availabilityRow}>
            <View style={[
              styles.stockBadge,
              { backgroundColor: isAvailable ? theme.colors.semantic.success + '20' : theme.colors.semantic.error + '20' }
            ]}>
              <Ionicons
                name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isAvailable ? theme.colors.semantic.success : theme.colors.semantic.error}
              />
              <Typography
                variant="caption"
                style={{ color: isAvailable ? theme.colors.semantic.success : theme.colors.semantic.error, marginLeft: 4 }}
              >
                {isAvailable
                  ? `${basket.quantity_available} disponible${basket.quantity_available > 1 ? 's' : ''}`
                  : 'Épuisé'}
              </Typography>
            </View>
            <View style={styles.expirationBadge}>
              <Ionicons name="time-outline" size={14} color={theme.colors.neutral[500]} />
              <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                {formatExpirationDate(basket.expiration_date)}
              </Typography>
            </View>
          </View>

          {/* Description surprise */}
          {basket.surprise_description && (
            <Card style={[styles.descriptionCard, { backgroundColor: theme.colors.primary[50] }]}>
              <View style={styles.descriptionHeader}>
                <Ionicons name="sparkles" size={20} color={theme.colors.primary[500]} />
                <Typography variant="h4" weight="semibold" style={{ marginLeft: 8, color: theme.colors.primary[700] }}>
                  Ce qui vous attend
                </Typography>
              </View>
              <Typography variant="body" style={{ marginTop: 8, color: theme.colors.primary[700] }}>
                {basket.surprise_description}
              </Typography>
            </Card>
          )}

          {/* Description générale */}
          {basket.description && (
            <View style={styles.section}>
              <Typography variant="h4" weight="semibold">
                Description
              </Typography>
              <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
                {basket.description}
              </Typography>
            </View>
          )}
        </View>

        {/* Contenu du panier */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket-outline" size={20} color={theme.colors.primary[500]} />
            <Typography variant="h4" weight="semibold" style={{ marginLeft: 8 }}>
              Contenu du panier
            </Typography>
          </View>

          {basket.min_items && (
            <View style={[styles.itemsInfoCard, { backgroundColor: theme.colors.surface.light }]}>
              <View style={styles.itemsInfoRow}>
                <Ionicons name="cube-outline" size={18} color={theme.colors.neutral[600]} />
                <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                  Minimum {basket.min_items} article{basket.min_items > 1 ? 's' : ''} inclus
                </Typography>
              </View>
              {basket.max_items && basket.max_items !== basket.min_items && (
                <View style={[styles.itemsInfoRow, { marginTop: 4 }]}>
                  <Ionicons name="layers-outline" size={18} color={theme.colors.neutral[600]} />
                  <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                    Jusqu'à {basket.max_items} articles possibles
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* Liste des articles (si disponible) */}
          {basket.surprise_basket_items && basket.surprise_basket_items.length > 0 ? (
            <View style={styles.itemsList}>
              {basket.surprise_basket_items.map((item: SurpriseBasketItem) => (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.colors.cardBackground }]}>
                  <Image
                    source={{ uri: getImageUrl(item.product?.image_url, item.product?.category?.name) }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Typography variant="body" weight="medium" numberOfLines={2}>
                      {item.product?.name || 'Article mystère'}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      Quantité: {item.quantity}
                    </Typography>
                  </View>
                  <Typography variant="body" weight="semibold">
                    {formatCurrency(item.unit_price)}
                  </Typography>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.mysteryItemsCard, { backgroundColor: theme.colors.surface.light }]}>
              <Ionicons name="help-circle-outline" size={40} color={theme.colors.primary[400]} />
              <Typography variant="body" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
                Le contenu exact est une surprise !{'\n'}
                Vous découvrirez les articles lors du retrait.
              </Typography>
            </View>
          )}
        </View>

        {/* Commerçant */}
        {basket.merchant && (
          <TouchableOpacity
            style={[styles.merchantCard, { backgroundColor: theme.colors.cardBackground }]}
            onPress={handleGoToMerchant}
            activeOpacity={0.7}
          >
            <View style={[styles.merchantAvatar, { backgroundColor: theme.colors.primary[100] }]}>
              <Ionicons name="storefront" size={24} color={theme.colors.primary[500]} />
            </View>
            <View style={styles.merchantInfo}>
              <Typography variant="h4" weight="semibold">
                {basket.merchant.business_name}
              </Typography>
              {basket.merchant.address && (
                <Typography variant="caption" color="secondary" numberOfLines={1}>
                  {basket.merchant.address}
                </Typography>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        )}

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        {isAvailable && (
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={[styles.quantityButton, { borderColor: theme.colors.border }]}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? theme.colors.neutral[300] : theme.colors.text} />
            </TouchableOpacity>
            <Typography variant="h4" weight="semibold" style={{ marginHorizontal: 16 }}>
              {quantity}
            </Typography>
            <TouchableOpacity
              onPress={() => setQuantity(Math.min(basket.quantity_available, quantity + 1))}
              style={[styles.quantityButton, { borderColor: theme.colors.border }]}
              disabled={quantity >= basket.quantity_available}
            >
              <Ionicons
                name="add"
                size={20}
                color={quantity >= basket.quantity_available ? theme.colors.neutral[300] : theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
        <Button
          onPress={handleAddToCart}
          disabled={!isAvailable}
          style={styles.addToCartButton}
          size="lg"
        >
          {isAvailable
            ? `Ajouter au panier • ${formatCurrency(discountedPrice * quantity)}`
            : 'Épuisé'}
        </Button>
      </View>

      <AlertModal
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        buttons={[
          alertConfig.type === 'success'
            ? { text: 'Voir le panier', onPress: () => { setAlertVisible(false); navigation.navigate('Orders' as never, { screen: 'Cart' } as never) } }
            : undefined,
          { text: 'OK', onPress: () => setAlertVisible(false) },
        ].filter(Boolean) as any}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mysteryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  mysteryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    padding: 20,
  },
  priceContainer: {
    marginTop: 12,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionCard: {
    marginTop: 20,
    padding: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsInfoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  itemsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  mysteryItemsCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  merchantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
  },
})
