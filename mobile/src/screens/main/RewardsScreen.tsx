import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'

import rewardsService, { Reward, RewardRedemption } from '../../services/rewardsService'
import { useAppSelector } from '../../store/hooks'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'

const REWARD_TYPES = [
  { key: 'all', label: 'Tout', icon: 'grid-outline' },
  { key: 'discount', label: 'Réductions', icon: 'pricetag-outline' },
  { key: 'product', label: 'Produits', icon: 'gift-outline' },
  { key: 'voucher', label: 'Bons', icon: 'ticket-outline' },
  { key: 'experience', label: 'Expériences', icon: 'star-outline' },
]

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#F5C518',
  platinum: '#E5E4E2',
}

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
}

export default function RewardsScreen() {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const { showAlert } = useAlert()
  const user = useAppSelector((state) => state.auth.user)

  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showAffordableOnly, setShowAffordableOnly] = useState(false)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [loyaltyTier, setLoyaltyTier] = useState('bronze')
  const [activeTab, setActiveTab] = useState<'catalog' | 'myRewards'>('catalog')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: theme.colors.background },
    surface: { backgroundColor: theme.colors.surface.light },
    text: { color: theme.colors.text },
    textSecondary: { color: theme.colors.textSecondary },
    textTertiary: { color: theme.colors.textTertiary },
    primary: { backgroundColor: theme.colors.primary[500] },
    primaryText: { color: theme.colors.primary[500] },
    border: { borderColor: theme.colors.border },
    error: { color: theme.colors.error },
    warning: { color: theme.colors.warning },
  }), [theme])

  const fetchRewards = useCallback(async () => {
    try {
      const response = await rewardsService.getRewards({
        type: selectedType !== 'all' ? selectedType : undefined,
        affordable_only: showAffordableOnly,
        per_page: 50,
      })

      if (response.success) {
        setRewards(response.data)
        setCurrentPoints(response.user_context.current_points)
        setLoyaltyTier(response.user_context.loyalty_tier)
      }
    } catch (error) {
      // Error handled silently - rewards list stays empty
    }
  }, [selectedType, showAffordableOnly])

  const fetchRedemptions = useCallback(async () => {
    try {
      const response = await rewardsService.getMyRedemptions({ per_page: 50 })
      if (response.success) {
        setRedemptions(response.data)
      }
    } catch (error) {
      // Error handled silently - redemptions list stays empty
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchRewards(), fetchRedemptions()])
    setLoading(false)
  }, [fetchRewards, fetchRedemptions])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchRewards(), fetchRedemptions()])
    setRefreshing(false)
  }, [fetchRewards, fetchRedemptions])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    fetchRewards()
  }, [selectedType, showAffordableOnly])

  const executeRedeem = async (reward: Reward) => {
    setRedeeming(true)
    try {
      const response = await rewardsService.redeemReward(reward.id)
      if (response.success) {
        showAlert({
          title: 'Succès !',
          message: `Votre code de récompense : ${response.data?.redemption.redemption_code}\n\nPrésentez ce code au commerçant pour l'utiliser.`,
          type: 'success',
        })
        setCurrentPoints(response.data?.remaining_points || 0)
        setSelectedReward(null)
        fetchRedemptions()
        fetchRewards()
      } else {
        showAlert({
          title: 'Erreur',
          message: response.message || 'Échec de l\'échange',
          type: 'error',
        })
      }
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'échange',
        type: 'error',
      })
    } finally {
      setRedeeming(false)
    }
  }

  const handleRedeem = async (reward: Reward) => {
    if (currentPoints < reward.points_required) {
      showAlert({
        title: 'Points insuffisants',
        message: `Vous avez ${currentPoints} points, mais cette récompense en nécessite ${reward.points_required}.`,
        type: 'warning',
      })
      return
    }

    showAlert({
      title: 'Confirmer l\'échange',
      message: `Voulez-vous échanger ${reward.points_required} points contre "${reward.name}" ?`,
      type: 'info',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => executeRedeem(reward) },
      ],
    })
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={styles.pointsCard}
      >
        <View style={styles.pointsRow}>
          <View>
            <Text style={styles.pointsLabel}>Mes Points</Text>
            <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[loyaltyTier] }]}>
            <Ionicons name="medal" size={20} color="#fff" />
            <Text style={styles.tierText}>{TIER_LABELS[loyaltyTier]}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabs, dynamicStyles.surface]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'catalog' && dynamicStyles.primary]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, dynamicStyles.textSecondary, activeTab === 'catalog' && styles.activeTabText]}>
            Catalogue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myRewards' && dynamicStyles.primary]}
          onPress={() => setActiveTab('myRewards')}
        >
          <Text style={[styles.tabText, dynamicStyles.textSecondary, activeTab === 'myRewards' && styles.activeTabText]}>
            Mes Récompenses
          </Text>
          {redemptions.filter(r => r.status === 'pending').length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.badgeText}>
                {redemptions.filter(r => r.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters for catalog */}
      {activeTab === 'catalog' && (
        <>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={REWARD_TYPES}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  dynamicStyles.surface,
                  selectedType === item.key && dynamicStyles.primary,
                ]}
                onPress={() => setSelectedType(item.key)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={selectedType === item.key ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    dynamicStyles.textSecondary,
                    selectedType === item.key && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.affordableFilter}
            onPress={() => setShowAffordableOnly(!showAffordableOnly)}
          >
            <Ionicons
              name={showAffordableOnly ? 'checkbox' : 'square-outline'}
              size={20}
              color={theme.colors.primary[500]}
            />
            <Text style={[styles.affordableFilterText, dynamicStyles.text]}>
              Uniquement les récompenses accessibles
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )

  const renderRewardItem = ({ item }: { item: Reward }) => {
    const canAfford = currentPoints >= item.points_required

    return (
      <TouchableOpacity
        style={[
          styles.rewardCard,
          dynamicStyles.surface,
          !canAfford && styles.rewardCardDisabled
        ]}
        onPress={() => setSelectedReward(item)}
        activeOpacity={0.7}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.rewardImage} />
        ) : (
          <View style={[styles.rewardImage, styles.rewardImagePlaceholder, dynamicStyles.container]}>
            <Ionicons name="gift" size={40} color={theme.colors.textTertiary} />
          </View>
        )}

        <View style={styles.rewardContent}>
          <View style={styles.rewardHeader}>
            <Text style={[styles.rewardName, dynamicStyles.text]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#F5C518" />
              </View>
            )}
          </View>

          <Text style={[styles.rewardDescription, dynamicStyles.textSecondary]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.rewardFooter}>
            <View style={styles.pointsRequired}>
              <Ionicons name="diamond" size={16} color={theme.colors.primary[500]} />
              <Text style={[styles.pointsText, dynamicStyles.primaryText, !canAfford && dynamicStyles.error]}>
                {item.points_required.toLocaleString()} pts
              </Text>
            </View>

            {item.tier_required && (
              <View
                style={[
                  styles.tierRequired,
                  { backgroundColor: TIER_COLORS[item.tier_required] + '30' },
                ]}
              >
                <Text
                  style={[styles.tierRequiredText, { color: TIER_COLORS[item.tier_required] }]}
                >
                  {TIER_LABELS[item.tier_required]}
                </Text>
              </View>
            )}
          </View>

          {item.remaining_quantity !== null && item.remaining_quantity < 10 && (
            <Text style={[styles.stockWarning, dynamicStyles.warning]}>
              Plus que {item.remaining_quantity} disponible(s) !
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderRedemptionItem = ({ item }: { item: RewardRedemption }) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#D97706' },
      used: { bg: '#D1FAE5', text: '#059669' },
      expired: { bg: '#FEE2E2', text: '#DC2626' },
      cancelled: { bg: '#E5E7EB', text: '#6B7280' },
    }

    const statusLabels: Record<string, string> = {
      pending: 'À utiliser',
      used: 'Utilisé',
      expired: 'Expiré',
      cancelled: 'Annulé',
    }

    const colors = statusColors[item.status] || statusColors.pending

    return (
      <View style={[styles.redemptionCard, dynamicStyles.surface]}>
        <View style={styles.redemptionHeader}>
          <Text style={[styles.redemptionName, dynamicStyles.text]}>
            {item.reward?.name || 'Récompense'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>

        <View style={[styles.redemptionCode, dynamicStyles.container]}>
          <Text style={[styles.codeLabel, dynamicStyles.textSecondary]}>Code:</Text>
          <Text style={[styles.codeValue, dynamicStyles.text]}>{item.redemption_code}</Text>
        </View>

        <View style={styles.redemptionInfo}>
          <Text style={[styles.redemptionInfoText, dynamicStyles.textSecondary]}>
            {item.points_spent} points - {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
          {item.expires_at && item.status === 'pending' && (
            <Text style={[styles.expiresText, dynamicStyles.warning]}>
              Expire le {new Date(item.expires_at).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </View>
    )
  }

  const renderRewardModal = () => {
    if (!selectedReward) return null

    const canAfford = currentPoints >= selectedReward.points_required

    return (
      <Modal
        visible={!!selectedReward}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReward(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.surface]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedReward(null)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            {selectedReward.image_url ? (
              <Image
                source={{ uri: selectedReward.image_url }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.modalImage, styles.modalImagePlaceholder, dynamicStyles.container]}>
                <Ionicons name="gift" size={60} color={theme.colors.textTertiary} />
              </View>
            )}

            <Text style={[styles.modalTitle, dynamicStyles.text]}>{selectedReward.name}</Text>
            <Text style={[styles.modalDescription, dynamicStyles.textSecondary]}>
              {selectedReward.description}
            </Text>

            {selectedReward.merchant && (
              <View style={styles.merchantInfo}>
                <Ionicons name="storefront-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.merchantName, dynamicStyles.textSecondary]}>
                  {selectedReward.merchant.business_name}
                </Text>
              </View>
            )}

            <View style={[styles.modalDetails, dynamicStyles.container]}>
              <View style={[styles.detailRow, dynamicStyles.border]}>
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Points requis</Text>
                <Text style={[styles.detailValue, dynamicStyles.text]}>
                  {selectedReward.points_required.toLocaleString()}
                </Text>
              </View>
              {selectedReward.value && (
                <View style={[styles.detailRow, dynamicStyles.border]}>
                  <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Valeur</Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {selectedReward.formatted_value}
                  </Text>
                </View>
              )}
              {selectedReward.valid_until && (
                <View style={[styles.detailRow, dynamicStyles.border]}>
                  <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Valide jusqu'au</Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {new Date(selectedReward.valid_until).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.redeemButton,
                dynamicStyles.primary,
                (!canAfford || redeeming) && { backgroundColor: theme.colors.textTertiary },
              ]}
              onPress={() => handleRedeem(selectedReward)}
              disabled={!canAfford || redeeming}
            >
              {redeeming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="gift" size={20} color="#fff" />
                  <Text style={styles.redeemButtonText}>
                    {canAfford
                      ? 'Échanger cette récompense'
                      : `Il vous manque ${selectedReward.points_required - currentPoints} points`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>
            Chargement des récompenses...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {activeTab === 'catalog' ? (
        <FlashList<Reward>
          data={rewards}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRewardItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary[500]}
              colors={[theme.colors.primary[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="gift-outline" size={60} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                Aucune récompense disponible
              </Text>
            </View>
          }
        />
      ) : (
        <FlashList<RewardRedemption>
          data={redemptions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRedemptionItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary[500]}
              colors={[theme.colors.primary[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>
                Vous n'avez pas encore échangé de récompenses
              </Text>
            </View>
          }
        />
      )}

      {renderRewardModal()}
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingBottom: 8,
  },
  pointsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  affordableFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  affordableFilterText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  rewardCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardImage: {
    width: 100,
    height: 100,
  },
  rewardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardContent: {
    flex: 1,
    padding: 12,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  featuredBadge: {
    padding: 4,
  },
  rewardDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pointsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierRequired: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierRequiredText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockWarning: {
    fontSize: 11,
    marginTop: 4,
  },
  redemptionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  redemptionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  redemptionCode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  redemptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redemptionInfoText: {
    fontSize: 13,
  },
  expiresText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  merchantName: {
    fontSize: 14,
  },
  modalDetails: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
