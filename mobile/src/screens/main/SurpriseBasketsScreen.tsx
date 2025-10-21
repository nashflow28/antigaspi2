import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchMoreSurpriseBaskets,
  fetchSurpriseBaskets,
  setSelectedBasket,
} from '../../store/slices/surpriseBasketsSlice'
import { useTheme } from '../../theme'
import { Button, Badge, Card, Typography } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { SurpriseBasket } from '../../types'

interface Props {
  navigation: any
}

const SurpriseBasketsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const { baskets, loading, loadingMore, currentPage, lastPage, hasMore, filters } =
    useAppSelector(state => state.surpriseBaskets)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && baskets.length === 0) {
      dispatch(fetchSurpriseBaskets({ ...filters, page: 1 }))
    }
  }, [dispatch, filters, loading, baskets.length])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await dispatch(fetchSurpriseBaskets({ ...filters, page: 1 })).unwrap()
    } catch (error) {
      // Les erreurs sont déjà gérées dans le slice via l'état `error`
      console.error('Error refreshing surprise baskets:', error)
    }
    setRefreshing(false)
  }, [dispatch, filters])

  const handleLoadMore = useCallback(() => {
    if (loadingMore) {
      return
    }

    if (!hasMore || currentPage >= lastPage) {
      return
    }

    dispatch(
      fetchMoreSurpriseBaskets({
        page: currentPage + 1,
        filters,
      })
    )
  }, [dispatch, filters, loadingMore, currentPage, lastPage, hasMore])

  const goToDetails = useCallback(
    (basket: SurpriseBasket) => {
      dispatch(setSelectedBasket(basket))
      navigation.navigate('SurpriseBasketDetails', { basketId: basket.id })
    },
    [dispatch, navigation]
  )

  const renderBasket = useCallback(
    ({ item }: { item: SurpriseBasket }) => {
      const discountedPrice = Number(item.discounted_price)
      const totalValue = Number(item.total_original_value ?? item.original_price)
      const discount = item.basket_discount_percentage ?? 0
      const badgeLabel = discount
        ? `-${discount}%`
        : `${formatCurrency(totalValue - discountedPrice)} d'économie`

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => goToDetails(item)}
          testID={TEST_IDS.surpriseBasketCard(item.id)}
        >
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: getImageUrl(item.image_url, item.category?.name) }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.cardContent}>
                <Typography variant="h4" weight="semibold" numberOfLines={2}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="secondary" numberOfLines={1}>
                  {item.merchant?.business_name ?? 'Commerçant'}
                </Typography>
                <View style={styles.priceRow}>
                  <Typography variant="h3" weight="bold">
                    {formatCurrency(discountedPrice)}
                  </Typography>
                  <Badge
                    variant="success"
                    style={{ marginLeft: theme.spacing.xs }}
                  >
                    {badgeLabel}
                  </Badge>
                </View>
                <Typography variant="caption" color="secondary">
                  {item.quantity_available > 1
                    ? `${item.quantity_available} paniers disponibles`
                    : 'Dernier panier disponible'}
                </Typography>
              </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.neutral[400]}
            />
            </View>
            {item.surprise_description ? (
              <Typography variant="caption" color="secondary" style={styles.description}>
                {item.surprise_description}
              </Typography>
            ) : null}
          </Card>
        </TouchableOpacity>
      )
    },
    [goToDetails, theme.colors.neutral, theme.spacing.xs]
  )

  const keyExtractor = useCallback((basket: SurpriseBasket) => `basket-${basket.id}`, [])

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Paniers surprise
        </Typography>
        <Typography variant="body" color="secondary" style={styles.headerSubtitle}>
          Découvrez des paniers mystère composés par nos commerçants partenaires.
        </Typography>
        <Button
          variant="secondary"
          onPress={() => navigation.navigate('Discover')}
          style={styles.discoverButton}
          leftIcon={<Ionicons name="search" size={18} color={theme.colors.primary[500]} />}
        >
          Explorer les produits classiques
        </Button>
      </View>
    ),
    [navigation, theme.colors.primary]
  )

  const emptyComponent = useMemo(() => {
    if (loading) {
      return null
    }

    return (
      <View style={styles.emptyState}>
        <Typography variant="h4" weight="semibold">
          Aucun panier surprise disponible pour le moment.
        </Typography>
        <Typography variant="body" color="secondary" style={styles.emptyStateSubtitle}>
          {'Revenez plus tard ou explorez les autres produits disponibles dans l\'application.'}
        </Typography>
        <Button onPress={() => navigation.navigate('Discover')}>
          Parcourir les produits
        </Button>
      </View>
    )
  }, [loading, navigation])

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.surpriseBasketsScreen}
    >
      <FlatList
        data={baskets}
        keyExtractor={keyExtractor}
        renderItem={renderBasket}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        testID={TEST_IDS.surpriseBasketsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={theme.colors.primary[500]} />
            </View>
          ) : null
        }
      />
      {loading && baskets.length === 0 ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={theme.colors.primary[500]} size="large" />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  headerTitle: {
    marginBottom: 8,
  },
  headerSubtitle: {
    marginBottom: 16,
  },
  discoverButton: {
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: '#f5f5f5',
  },
  cardContent: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  description: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    marginVertical: 12,
  },
  footerLoading: {
    paddingVertical: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default SurpriseBasketsScreen
