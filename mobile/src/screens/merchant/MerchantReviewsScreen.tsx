import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'

interface Review {
  id: number
  rating: number
  title: string
  comment: string
  time_ago: string
  is_verified_purchase: boolean
  merchant_response?: string
  merchant_response_at?: string
  user: {
    id: number
    name: string
  }
  product: {
    id: number
    name: string
  } | null
  created_at: string
}

interface Stats {
  total_reviews: number
  average_rating: number
  verified_reviews: number
  reviews_today: number
  reviews_this_week: number
  reviews_this_month: number
  rating_distribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

const MerchantReviewsScreen: React.FC = () => {
  const theme = useTheme()
  const [stats, setStats] = useState<Stats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')

  // Modal state
  const [respondModalVisible, setRespondModalVisible] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  useEffect(() => {
    loadReviewsData()
  }, [])

  const loadReviewsData = async () => {
    try {
      setLoading(true)

      // Charger les stats
      const dashboardResponse = await apiService.get('/merchants/reviews/dashboard')
      if (dashboardResponse.data.success) {
        setStats(dashboardResponse.data.data.stats)
      }

      // Charger la liste des avis
      const listResponse = await apiService.get('/merchants/reviews/list', {
        params: {
          per_page: 50, // 🐛 BUG FIX: Backend validation max is 50
          sort: 'recent',
        }
      })

      if (listResponse.data.success) {
        setReviews(listResponse.data.data || [])
      }
    } catch (error) {
      console.error('Erreur chargement avis:', error)
      Alert.alert('Erreur', 'Impossible de charger les avis')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadReviewsData()
  }

  const handleRespondPress = (review: Review) => {
    setSelectedReview(review)
    setResponseText(review.merchant_response || '')
    setRespondModalVisible(true)
  }

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une réponse')
      return
    }

    try {
      setSubmittingResponse(true)

      if (selectedReview.merchant_response) {
        // Mettre à jour une réponse existante
        await apiService.put(`/reviews/${selectedReview.id}/response`, {
          response: responseText.trim()
        })
      } else {
        // Créer une nouvelle réponse
        await apiService.post(`/reviews/${selectedReview.id}/respond`, {
          response: responseText.trim()
        })
      }

      Alert.alert('Succès', 'Réponse ajoutée avec succès')
      setRespondModalVisible(false)
      setResponseText('')
      setSelectedReview(null)
      loadReviewsData()
    } catch (error: any) {
      console.error('Erreur soumission réponse:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'ajouter la réponse')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const handleDeleteResponse = async (review: Review) => {
    Alert.alert(
      'Supprimer la réponse',
      'Êtes-vous sûr de vouloir supprimer votre réponse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/reviews/${review.id}/response`)
              Alert.alert('Succès', 'Réponse supprimée')
              loadReviewsData()
            } catch (error) {
              console.error('Erreur suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer la réponse')
            }
          },
        },
      ]
    )
  }

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#F59E0B' : theme.colors.neutral[300]}
          />
        ))}
      </View>
    )
  }

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter))

  const renderReview = ({ item }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: theme.colors.surface.light }]}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={40} color={theme.colors.primary[500]} />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.user.name}
            </Text>
            {item.is_verified_purchase && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.semantic.success} />
                <Text style={[styles.verifiedText, { color: theme.colors.semantic.success }]}>
                  Achat vérifié
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.timeAgo, { color: theme.colors.textSecondary }]}>
          {item.time_ago}
        </Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingRow}>
        {renderStars(item.rating)}
        {item.title && (
          <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
        )}
      </View>

      {/* Comment */}
      {item.comment && (
        <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>
          {item.comment}
        </Text>
      )}

      {/* Product */}
      {item.product && (
        <View style={[styles.productTag, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
          <Ionicons name="cube-outline" size={14} color={theme.colors.primary[500]} />
          <Text style={[styles.productName, { color: theme.colors.primary[500] }]}>
            {item.product.name}
          </Text>
        </View>
      )}

      {/* Merchant Response */}
      {item.merchant_response && (
        <View style={[styles.merchantResponse, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.05) }]}>
          <View style={styles.responseHeader}>
            <Ionicons name="business" size={16} color={theme.colors.primary[500]} />
            <Text style={[styles.responseLabel, { color: theme.colors.primary[500] }]}>
              Votre réponse
            </Text>
          </View>
          <Text style={[styles.responseText, { color: theme.colors.text }]}>
            {item.merchant_response}
          </Text>
          <View style={styles.responseActions}>
            <TouchableOpacity onPress={() => handleRespondPress(item)} style={styles.responseActionButton}>
              <Ionicons name="create-outline" size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.responseActionText, { color: theme.colors.primary[500] }]}>
                Modifier
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteResponse(item)} style={styles.responseActionButton}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.semantic.error} />
              <Text style={[styles.responseActionText, { color: theme.colors.semantic.error }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Button */}
      {!item.merchant_response && (
        <TouchableOpacity
          style={[styles.respondButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={() => handleRespondPress(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="white" />
          <Text style={styles.respondButtonText}>Répondre</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Avis Clients</Text>
          <TouchableOpacity onPress={loadReviewsData}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{(stats.average_rating ?? 0).toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {renderStars(Math.round(stats.average_rating ?? 0))}
              </View>
              <Text style={styles.mainStatLabel}>{stats.total_reviews} avis</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.verified_reviews}</Text>
                <Text style={styles.statLabel}>Vérifiés</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.reviews_this_week}</Text>
                <Text style={styles.statLabel}>Cette semaine</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.reviews_this_month}</Text>
                <Text style={styles.statLabel}>Ce mois</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { value: 'all', label: 'Tous' },
            { value: '5', label: '5 ⭐' },
            { value: '4', label: '4 ⭐' },
            { value: '3', label: '3 ⭐' },
            { value: '2', label: '2 ⭐' },
            { value: '1', label: '1 ⭐' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === filterOption.value
                    ? 'white'
                    : 'rgba(255, 255, 255, 0.2)',
                }
              ]}
              onPress={() => setFilter(filterOption.value as any)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: filter === filterOption.value
                    ? theme.colors.primary[500]
                    : 'white'
                }
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des avis */}
      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="star-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {filter === 'all'
                ? 'Aucun avis pour le moment'
                : `Aucun avis avec ${filter} étoile${filter === '1' ? '' : 's'}`
              }
            </Text>
          </View>
        }
      />

      {/* Modal Répondre */}
      <Modal
        visible={respondModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRespondModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface.light }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedReview?.merchant_response ? 'Modifier la réponse' : 'Répondre à l\'avis'}
              </Text>
              <TouchableOpacity onPress={() => setRespondModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedReview && (
              <View style={styles.reviewPreview}>
                <View style={styles.ratingRow}>
                  {renderStars(selectedReview.rating)}
                  <Text style={[styles.userName, { color: theme.colors.text, marginLeft: 8 }]}>
                    {selectedReview.user.name}
                  </Text>
                </View>
                <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>
                  {selectedReview.comment}
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.responseInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.neutral[200]
              }]}
              placeholder="Votre réponse (max 1000 caractères)..."
              placeholderTextColor={theme.colors.textSecondary}
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {responseText.length}/1000 caractères
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRespondModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.colors.primary[500] }]}
                onPress={handleSubmitResponse}
                disabled={submittingResponse || !responseText.trim()}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  {submittingResponse ? 'Envoi...' : 'Envoyer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 16,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  mainStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  filtersContainer: {
    marginTop: 8,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
  },
  merchantResponse: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  responseActions: {
    flexDirection: 'row',
    gap: 16,
  },
  responseActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  respondButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reviewPreview: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  responseInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  submitButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default MerchantReviewsScreen
