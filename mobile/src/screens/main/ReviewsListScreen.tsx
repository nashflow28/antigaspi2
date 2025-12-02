import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchReviews, fetchReviewStats, deleteReview } from '../../store/slices/reviewsSlice'
import ReviewCard from '../../components/reviews/ReviewCard'
import StarRating from '../../components/reviews/StarRating'
import { Button, Card, Typography } from '../../components/2025'
import { Review } from '../../types'
import { useToast } from '../../contexts/ToastContext'

type Props = NativeStackScreenProps<any, 'ReviewsList'>

const ReviewsListScreen = ({ route, navigation }: Props) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()

  const { merchantId, merchantName } = route.params as { merchantId: number; merchantName: string }
  const { reviews, stats, loading, currentPage, hasMore } = useAppSelector((state) => state.reviews)
  const { user } = useAppSelector((state) => state.auth)

  // États locaux
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent')
  const [filterVerified, setFilterVerified] = useState(false)

  // Handler pour éditer un avis
  const handleEditReview = useCallback((review: Review) => {
    navigation.navigate('AddReview', {
      merchantId,
      merchantName,
      editReview: review,
    })
  }, [navigation, merchantId, merchantName])

  // Handler pour supprimer un avis
  const handleDeleteReview = useCallback(async (reviewId: number) => {
    try {
      await dispatch(deleteReview(reviewId)).unwrap()
      showSuccess('Avis supprimé avec succès')
      // Refresh the list
      dispatch(fetchReviews({ merchantId }))
      dispatch(fetchReviewStats(merchantId))
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la suppression')
    }
  }, [dispatch, merchantId, showSuccess, showError])

  // Chargement initial
  useEffect(() => {
    dispatch(fetchReviews({ merchantId }))
    dispatch(fetchReviewStats(merchantId))
  }, [merchantId, dispatch])

  // Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      await Promise.all([
        dispatch(fetchReviews({ merchantId })).unwrap(),
        dispatch(fetchReviewStats(merchantId)).unwrap(),
      ])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des avis')
    } finally {
      setRefreshing(false)
    }
  }

  // Pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || loading) return

    setLoadingMore(true)
    try {
      await dispatch(
        fetchReviews({
          merchantId,
          page: currentPage + 1,
        })
      ).unwrap()
    } catch (err) {
      console.error('Erreur chargement avis:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Tri et filtrage
  const filteredReviews = useMemo(() => {
    let result = [...reviews]

    // Filtre vérifié
    if (filterVerified) {
      result = result.filter((r) => r.is_verified_purchase)
    }

    // Tri
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating)
    } else {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return result
  }, [reviews, sortBy, filterVerified])

  // Loading state initial
  if (loading && reviews.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h3" weight="bold">
            Avis clients
          </Typography>
          <Typography variant="body" color="secondary" style={{ marginTop: 2 }}>
            {merchantName}
          </Typography>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats Summary Card */}
      {stats && (
        <View style={{ margin: 16 }}>
          <Card variant="elevated">
            <View style={styles.statsRow}>
              <Typography variant="h1" weight="bold" style={{ fontSize: 48 }}>
                {stats.average_rating.toFixed(1)}
              </Typography>
              <View style={styles.statsDetails}>
                <StarRating rating={stats.average_rating} size={20} />
                <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
                  {stats.total_reviews} avis • {stats.verified_reviews} vérifiés
                </Typography>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Typography variant="body" style={{ flex: 1, color: theme.colors.error }}>
            {error}
          </Typography>
          <TouchableOpacity onPress={handleRefresh}>
            <Typography variant="body" weight="semibold" style={{ color: theme.colors.error, textDecorationLine: 'underline' }}>
              Réessayer
            </Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* Filtres */}
      <View style={styles.filtersBar}>
        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'recent' && styles.filterChipActive]}
          onPress={() => setSortBy('recent')}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={
              sortBy === 'recent' ? theme.colors.textInverse : theme.colors.text
            }
          />
          <Typography
            variant="body"
            weight="semibold"
            style={{
              color: sortBy === 'recent' ? theme.colors.textInverse : theme.colors.text,
              fontSize: 14,
            }}
          >
            Récents
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'rating' && styles.filterChipActive]}
          onPress={() => setSortBy('rating')}
        >
          <Ionicons
            name="star-outline"
            size={16}
            color={
              sortBy === 'rating' ? theme.colors.textInverse : theme.colors.text
            }
          />
          <Typography
            variant="body"
            weight="semibold"
            style={{
              color: sortBy === 'rating' ? theme.colors.textInverse : theme.colors.text,
              fontSize: 14,
            }}
          >
            Note
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterVerified && styles.filterChipActive]}
          onPress={() => setFilterVerified(!filterVerified)}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={filterVerified ? theme.colors.textInverse : theme.colors.text}
          />
          <Typography
            variant="body"
            weight="semibold"
            style={{
              color: filterVerified ? theme.colors.textInverse : theme.colors.text,
              fontSize: 14,
            }}
          >
            Vérifiés
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Liste des avis */}
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
            <ReviewCard
              review={item}
              isOwn={user?.id === item.user.id}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
            />
          )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbox-outline"
              size={64}
              color={theme.colors.neutral[400]}
            />
            <Typography variant="h3" weight="bold" style={{ marginTop: 16, textAlign: 'center' }}>
              Aucun avis pour le moment
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              Soyez le premier à donner votre avis sur ce marchand !
            </Typography>
            <Button
              variant="primary"
              size="md"
              onPress={() =>
                navigation.navigate('AddReview', { merchantId, merchantName })
              }
              leftIcon={
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.colors.textInverse}
                />
              }
              style={{ marginTop: 24 }}
            >
              Laisser un avis
            </Button>
          </View>
        )}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary[600]} />
              <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                Chargement...
              </Typography>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flex: 1,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statsDetails: {
      flex: 1,
    },
    filtersBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
      gap: 6,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary[600],
      borderColor: theme.colors.primary[600],
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      padding: 12,
      backgroundColor: theme.colors.error + '15',
      borderRadius: 8,
      gap: 8,
    },
    listContent: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    footerLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
  })

export default ReviewsListScreen
