import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { Badge, Button, Card, Typography } from '../../components/2025'

interface PendingReview {
  id: number
  rating: number
  title?: string | null
  comment?: string | null
  time_ago: string
  is_verified_purchase: boolean
  user: {
    id: number
    name: string
    email: string
  }
  merchant: {
    id: number
    business_name: string
    owner_name: string
  }
  product?: {
    id: number
    name: string
  } | null
  merchant_response?: string | null
  created_at: string
}

interface ReportedReview {
  id: number
  reason: string
  reason_label: string
  description?: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  status_label: string
  admin_notes?: string | null
  time_ago: string
  review: {
    id: number
    rating: number
    title?: string | null
    comment?: string | null
    is_verified_purchase: boolean
    user: {
      id: number
      name: string
    }
    merchant: {
      id: number
      business_name: string
    }
    product?: {
      id: number
      name: string
    } | null
  }
  reporter: {
    id: number
    name: string
    email: string
  }
  reviewer?: {
    id: number
    name: string
  } | null
  created_at: string
  reviewed_at?: string | null
}

type ReportStatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'
type ReportReasonFilter =
  | 'all'
  | 'inappropriate_content'
  | 'spam'
  | 'fake_review'
  | 'offensive_language'
  | 'harassment'
  | 'copyright_violation'
  | 'other'

interface ModerationStats {
  pending_reviews: number
  pending_reports: number
  total_reports: number
  resolved_reports: number
  reviews_today: number
  reports_today: number
}

interface ModerationDashboardResponse {
  stats: ModerationStats
  report_reasons: Record<string, number>
}

type ActiveTab = 'pending' | 'reported'

type ResolveAction = 'dismiss' | 'remove_review' | 'warn_user'

const AdminReviewModerationScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [reportReasons, setReportReasons] = useState<Record<string, number>>({})
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending')
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatusFilter>('pending')
  const [reportReasonFilter, setReportReasonFilter] = useState<ReportReasonFilter>('all')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [resolvingReportId, setResolvingReportId] = useState<number | null>(null)
  const [hasLoadedReports, setHasLoadedReports] = useState(false)

  useEffect(() => {
    refreshAllData()
  }, [])

  useEffect(() => {
    if (activeTab === 'reported') {
      loadReportedReviews()
    }
  }, [activeTab, reportStatusFilter, reportReasonFilter])

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([loadStats(), loadPendingReviews()])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.get('/admin/reviews/stats')
      // apiService peut retourner directement l'objet ou {data: {...}}
      const data: ModerationDashboardResponse = response.data?.stats ? response.data : (response.data?.data || response.data)
      console.log('🟢 [Moderation] Stats loaded:', data?.stats ? 'OK' : 'null')
      if (data) {
        setStats(data.stats)
        setReportReasons(data.report_reasons || {})
      }
    } catch (error: any) {
      console.error('Erreur chargement statistiques avis:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      Alert.alert('Erreur', 'Impossible de charger les statistiques de modération')
    }
  }, [])

  const loadPendingReviews = useCallback(async () => {
    try {
      const response = await apiService.get('/admin/reviews/pending', {
        params: { per_page: 50 },
      })
      // apiService peut retourner le tableau directement ou {data: [...]}
      const reviews = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      console.log('🟢 [Moderation] Pending reviews:', reviews.length)
      setPendingReviews(reviews)
    } catch (error: any) {
      console.error('Erreur chargement avis en attente:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      Alert.alert('Erreur', 'Impossible de charger les avis en attente')
    }
  }, [])

  const loadReportedReviews = useCallback(async () => {
    if (hasLoadedReports && activeTab !== 'reported') {
      return
    }

    try {
      setListLoading(true)
      const params: Record<string, string | number> = { per_page: 50 }
      if (reportStatusFilter !== 'all') {
        params.status = reportStatusFilter
      }
      if (reportReasonFilter !== 'all') {
        params.reason = reportReasonFilter
      }

      const response = await apiService.get('/admin/reviews/reported', { params })
      // apiService peut retourner le tableau directement ou {data: [...]}
      const reports = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      console.log('🟢 [Moderation] Reported reviews:', reports.length)
      setReportedReviews(reports)
      setHasLoadedReports(true)
    } catch (error: any) {
      console.error('Erreur chargement signalements:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      Alert.alert('Erreur', 'Impossible de charger les signalements')
    } finally {
      setListLoading(false)
    }
  }, [activeTab, hasLoadedReports, reportReasonFilter, reportStatusFilter])

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await Promise.all([loadStats(), loadPendingReviews()])
      if (activeTab === 'reported') {
        await loadReportedReviews()
      } else {
        setHasLoadedReports(false)
      }
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, loadPendingReviews, loadReportedReviews, loadStats])

  const handleApproveReview = useCallback(
    (review: PendingReview) => {
      Alert.alert('Approuver l\'avis', 'Confirmez-vous l\'approbation de cet avis ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              setActionLoadingId(review.id)
              await apiService.post(`/admin/reviews/${review.id}/approve`)
              setPendingReviews(prev => prev.filter(item => item.id !== review.id))
              await loadStats()
              Alert.alert('Succès', 'Avis approuvé')
            } catch (error) {
              console.error('Erreur approbation avis:', error)
              Alert.alert('Erreur', 'Impossible d\'approuver cet avis')
            } finally {
              setActionLoadingId(null)
            }
          },
        },
      ])
    },
    [loadStats]
  )

  const handleRejectReview = useCallback((review: PendingReview) => {
    Alert.alert(
      'Rejeter l\'avis',
      'Voulez-vous rejeter et supprimer cet avis ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(review.id)
              await apiService.post(`/admin/reviews/${review.id}/reject`)
              setPendingReviews(prev => prev.filter(item => item.id !== review.id))
              await loadStats()
              Alert.alert('Succès', 'Avis rejeté et supprimé')
            } catch (error) {
              console.error('Erreur rejet avis:', error)
              Alert.alert('Erreur', 'Impossible de rejeter cet avis')
            } finally {
              setActionLoadingId(null)
            }
          },
        },
      ]
    )
  }, [loadStats])

  const resolveReport = useCallback(
    async (report: ReportedReview, action: ResolveAction) => {
      try {
        setResolvingReportId(report.id)
        await apiService.post(`/admin/reviews/reports/${report.id}/resolve`, {
          action,
          notes: null,
        })

        setReportedReviews(prev => prev.filter(item => item.id !== report.id))
        setPendingReviews(prev =>
          action === 'remove_review' ? prev.filter(item => item.id !== report.review.id) : prev
        )
        await loadStats()

        let message = 'Signalement mis à jour'
        if (action === 'dismiss') {
          message = 'Signalement rejeté'
        } else if (action === 'remove_review') {
          message = 'Avis supprimé et signalement résolu'
        } else if (action === 'warn_user') {
          message = 'Utilisateur averti et signalement résolu'
        }
        Alert.alert('Succès', message)
      } catch (error) {
        console.error('Erreur résolution signalement:', error)
        Alert.alert('Erreur', 'Impossible de mettre à jour le signalement')
      } finally {
        setResolvingReportId(null)
      }
    },
    [loadStats]
  )

  const handleResolveOptions = useCallback(
    (report: ReportedReview) => {
      Alert.alert('Résoudre le signalement', 'Quelle action souhaitez-vous appliquer ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ignorer',
          onPress: () => resolveReport(report, 'dismiss'),
        },
        {
          text: 'Supprimer l\'avis',
          style: 'destructive',
          onPress: () => resolveReport(report, 'remove_review'),
        },
        {
          text: 'Avertir le client',
          onPress: () => resolveReport(report, 'warn_user'),
        },
      ])
    },
    [resolveReport]
  )

  const renderStars = useCallback(
    (rating: number) => (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#F59E0B' : theme.colors.neutral[300]}
          />
        ))}
      </View>
    ),
    [theme.colors.neutral]
  )

  const emptyPendingComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Typography variant="h4" weight="semibold" style={styles.emptyTitle}>
          Aucun avis en attente
        </Typography>
        <Typography variant="body" color="secondary" style={styles.emptySubtitle}>
          Tous les avis ont été traités pour le moment.
        </Typography>
      </View>
    ),
    [theme.colors.success]
  )

  const emptyReportedComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary[500]} />
        <Typography variant="h4" weight="semibold" style={styles.emptyTitle}>
          Aucun signalement
        </Typography>
        <Typography variant="body" color="secondary" style={styles.emptySubtitle}>
          Aucun avis signalé avec les filtres sélectionnés.
        </Typography>
      </View>
    ),
    [theme.colors.primary]
  )

  const reportStatusOptions = useMemo(
    () => [
      { value: 'all', label: 'Tous' },
      { value: 'pending', label: 'En attente' },
      { value: 'reviewed', label: 'En revue' },
      { value: 'resolved', label: 'Résolus' },
      { value: 'dismissed', label: 'Rejetés' },
    ],
    []
  )

  const reportReasonOptions = useMemo(
    () => [
      { value: 'all', label: 'Toutes les raisons' },
      { value: 'inappropriate_content', label: 'Contenu inapproprié' },
      { value: 'spam', label: 'Spam' },
      { value: 'fake_review', label: 'Faux avis' },
      { value: 'offensive_language', label: 'Langage offensant' },
      { value: 'harassment', label: 'Harcèlement' },
      { value: 'copyright_violation', label: 'Droits d\'auteur' },
      { value: 'other', label: 'Autre' },
    ],
    []
  )

  const getReportStatusVariant = useCallback((status: ReportedReview['status']) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'resolved':
        return 'success'
      case 'dismissed':
        return 'neutral'
      case 'reviewed':
      default:
        return 'info'
    }
  }, [])

  const renderPendingReview = ({ item }: { item: PendingReview }) => (
    <Card style={styles.reviewCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="person-circle" size={40} color={theme.colors.primary[500]} />
          <View style={styles.cardHeaderInfo}>
            <Typography variant="h4" weight="semibold">
              {item.user.name}
            </Typography>
            <Typography variant="small" color="secondary">
              {item.user.email}
            </Typography>
            <View style={styles.metaRow}>
              {renderStars(item.rating)}
              <Badge variant="info" size="sm" style={styles.metaBadge}>
                {item.time_ago}
              </Badge>
              {item.is_verified_purchase && (
                <Badge variant="success" size="sm">
                  Achat vérifié
                </Badge>
              )}
            </View>
          </View>
        </View>
        <View>
          <Badge variant="primary" size="sm">
            {item.merchant.business_name}
          </Badge>
        </View>
      </View>

      {item.product && (
        <View style={styles.productTag}>
          <Ionicons name="cube" size={16} color={theme.colors.primary[500]} />
          <Typography variant="small" color="primary" style={styles.productName}>
            {item.product.name}
          </Typography>
        </View>
      )}

      {item.title && (
        <Typography variant="h4" weight="semibold" style={styles.reviewTitle}>
          {item.title}
        </Typography>
      )}
      {item.comment && (
        <Typography variant="body" color="secondary" style={styles.reviewComment}>
          {item.comment}
        </Typography>
      )}

      <View style={styles.actionsRow}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleRejectReview(item)}
          loading={actionLoadingId === item.id}
          leftIcon={<Ionicons name="close-circle" size={18} color={theme.colors.error} />}
          textStyle={{ color: theme.colors.error }}
        >
          Rejeter
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={() => handleApproveReview(item)}
          loading={actionLoadingId === item.id}
          leftIcon={<Ionicons name="checkmark-circle" size={18} color={theme.colors.textInverse} />}
        >
          Approuver
        </Button>
      </View>
    </Card>
  )

  const renderReportedReview = ({ item }: { item: ReportedReview }) => (
    <Card style={styles.reviewCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="alert-circle" size={40} color={theme.colors.warning} />
          <View style={styles.cardHeaderInfo}>
            <Typography variant="h4" weight="semibold">
              {item.review.user.name}
            </Typography>
            <Typography variant="small" color="secondary">
              Signalé par {item.reporter.name}
            </Typography>
            <View style={styles.metaRow}>
              {renderStars(item.review.rating)}
              <Badge variant="info" size="sm" style={styles.metaBadge}>
                {item.time_ago}
              </Badge>
              <Badge variant={getReportStatusVariant(item.status)} size="sm">
                {item.status_label}
              </Badge>
            </View>
          </View>
        </View>
      </View>

      {item.review.product && (
        <View style={styles.productTag}>
          <Ionicons name="cube" size={16} color={theme.colors.primary[500]} />
          <Typography variant="small" color="primary" style={styles.productName}>
            {item.review.product.name}
          </Typography>
        </View>
      )}

      <Badge variant="error" size="sm" style={styles.reasonBadge}>
        {item.reason_label}
      </Badge>
      {item.description && (
        <Typography variant="body" color="secondary" style={styles.reviewComment}>
          {item.description}
        </Typography>
      )}

      {item.review.comment && (
        <View style={styles.reportedContent}>
          <Typography variant="small" color="tertiary">
            Avis original
          </Typography>
          <Typography variant="body" style={styles.reviewComment}>
            {item.review.comment}
          </Typography>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => resolveReport(item, 'dismiss')}
          loading={resolvingReportId === item.id}
          leftIcon={<Ionicons name="eye-off" size={18} color={theme.colors.neutral[700]} />}
          textStyle={{ color: theme.colors.neutral[700] }}
        >
          Rejeter le signalement
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => handleResolveOptions(item)}
          loading={resolvingReportId === item.id}
          leftIcon={<Ionicons name="hammer" size={18} color={theme.colors.textInverse} />}
        >
          Résoudre
        </Button>
      </View>
    </Card>
  )

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  const headerComponent = (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
        {stats && (
          <>
            <Card
              style={StyleSheet.flatten([
                styles.statCard,
                { backgroundColor: theme.colors.surface.light },
              ])}
            >
              <Typography variant="caption" color="secondary">
                Avis en attente
              </Typography>
              <Typography variant="displaySm" weight="semibold">
                {stats.pending_reviews}
              </Typography>
            </Card>
            <Card
              style={StyleSheet.flatten([
                styles.statCard,
                { backgroundColor: theme.colors.surface.light },
              ])}
            >
              <Typography variant="caption" color="secondary">
                Signalements en attente
              </Typography>
              <Typography variant="displaySm" weight="semibold">
                {stats.pending_reports}
              </Typography>
            </Card>
            <Card
              style={StyleSheet.flatten([
                styles.statCard,
                { backgroundColor: theme.colors.surface.light },
              ])}
            >
              <Typography variant="caption" color="secondary">
                Signalements résolus
              </Typography>
              <Typography variant="displaySm" weight="semibold">
                {stats.resolved_reports}
              </Typography>
            </Card>
            <Card
              style={StyleSheet.flatten([
                styles.statCard,
                { backgroundColor: theme.colors.surface.light },
              ])}
            >
              <Typography variant="caption" color="secondary">
                Avis aujourd'hui
              </Typography>
              <Typography variant="displaySm" weight="semibold">
                {stats.reviews_today}
              </Typography>
            </Card>
            <Card
              style={StyleSheet.flatten([
                styles.statCard,
                { backgroundColor: theme.colors.surface.light },
              ])}
            >
              <Typography variant="caption" color="secondary">
                Signalements aujourd'hui
              </Typography>
              <Typography variant="displaySm" weight="semibold">
                {stats.reports_today}
              </Typography>
            </Card>
          </>
        )}
      </ScrollView>

      {reportReasons && Object.keys(reportReasons).length > 0 && (
        <Card
          style={StyleSheet.flatten([
            styles.reasonsCard,
            { backgroundColor: theme.colors.surface.light },
          ])}
        >
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            Principales raisons de signalement
          </Typography>
          <View style={styles.reasonsGrid}>
            {Object.entries(reportReasons).map(([label, count]) => (
              <View key={label} style={styles.reasonItem}>
                <Badge variant="warning" size="sm" style={styles.reasonBadge}>
                  {label}
                </Badge>
                <Typography variant="body" weight="semibold">
                  {count}
                </Typography>
              </View>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === 'pending'
                  ? theme.colors.primary[500]
                  : theme.colors.surface.light,
            },
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Typography
            variant="body"
            weight="semibold"
            color={activeTab === 'pending' ? 'inverse' : 'default'}
          >
            Avis en attente
          </Typography>
          <Badge variant={activeTab === 'pending' ? 'promo' : 'neutral'} size="sm" style={styles.tabBadge}>
            {pendingReviews.length}
          </Badge>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === 'reported'
                  ? theme.colors.primary[500]
                  : theme.colors.surface.light,
            },
          ]}
          onPress={() => setActiveTab('reported')}
        >
          <Typography
            variant="body"
            weight="semibold"
            color={activeTab === 'reported' ? 'inverse' : 'default'}
          >
            Signalements
          </Typography>
          <Badge variant={activeTab === 'reported' ? 'promo' : 'neutral'} size="sm" style={styles.tabBadge}>
            {reportedReviews.length}
          </Badge>
        </TouchableOpacity>
      </View>

      {activeTab === 'reported' && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterGroup}>
              {reportStatusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        reportStatusFilter === option.value
                          ? theme.colors.primary[500]
                          : theme.colors.surface.light,
                      borderColor:
                        reportStatusFilter === option.value
                          ? theme.colors.primary[500]
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => setReportStatusFilter(option.value as ReportStatusFilter)}
                >
                  <Typography
                    variant="small"
                    weight="semibold"
                    color={reportStatusFilter === option.value ? 'inverse' : 'secondary'}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterGroup}>
              {reportReasonOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        reportReasonFilter === option.value
                          ? theme.colors.primary[100]
                          : theme.colors.surface.light,
                      borderColor:
                        reportReasonFilter === option.value
                          ? theme.colors.primary[300]
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => setReportReasonFilter(option.value as ReportReasonFilter)}
                >
                  <Typography
                    variant="small"
                    weight="semibold"
                    color={reportReasonFilter === option.value ? 'primary' : 'secondary'}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {activeTab === 'pending' ? (
        <FlatList
          data={pendingReviews}
          keyExtractor={item => `pending-${item.id}`}
          renderItem={renderPendingReview}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16 }]}
          ListEmptyComponent={emptyPendingComponent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary[500]} />}
          ListHeaderComponent={headerComponent}
        />
      ) : (
        <FlatList
          data={reportedReviews}
          keyExtractor={item => `reported-${item.id}`}
          renderItem={renderReportedReview}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16 }]}
          ListEmptyComponent={emptyReportedComponent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary[500]} />}
          ListHeaderComponent={headerComponent}
          ListFooterComponent={listLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
          ) : null}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  statsScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  statCard: {
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    minWidth: 180,
  },
  reasonsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonBadge: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabBadge: {
    marginLeft: 4,
  },
  filtersContainer: {
    marginTop: 16,
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  reviewCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaBadge: {
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  productName: {
    marginTop: 1,
  },
  reviewTitle: {
    marginTop: 12,
  },
  reviewComment: {
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 24,
  },
  reportedContent: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
})

export default AdminReviewModerationScreen
