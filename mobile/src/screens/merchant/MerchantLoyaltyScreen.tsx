import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

interface Customer {
  id: number
  name: string
  email: string
  total_points: number
}

interface Stats {
  total_points_distributed: number
  monthly_points_distributed: number
  customers_with_points: number
  top_customers: Customer[]
}

const MerchantLoyaltyScreen: React.FC = () => {
  const theme = useTheme()
  const [stats, setStats] = useState<Stats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Modal state for awarding points
  const [awardModalVisible, setAwardModalVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [pointsToAward, setPointsToAward] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadLoyaltyData()
  }, [])

  const loadLoyaltyData = async () => {
    try {
      setLoading(true)

      // Charger les stats
      const statsResponse = await apiService.get('/merchants/loyalty/stats')
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data)
      }

      // Charger la liste des clients
      const customersResponse = await apiService.get('/merchants/loyalty/customers')
      if (customersResponse.data.success) {
        setCustomers(customersResponse.data.data || [])
      }
    } catch (error) {
      console.error('Erreur chargement fidélité:', error)
      Alert.alert('Erreur', 'Impossible de charger les données de fidélité')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadLoyaltyData()
  }

  const handleAwardPress = (customer: Customer) => {
    setSelectedCustomer(customer)
    setPointsToAward('')
    setDescription('')
    setAwardModalVisible(true)
  }

  const handleAwardSubmit = async () => {
    if (!selectedCustomer || !pointsToAward || !description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    const points = parseInt(pointsToAward)
    if (isNaN(points) || points <= 0 || points > 1000) {
      Alert.alert('Erreur', 'Veuillez saisir un nombre de points valide (1-1000)')
      return
    }

    try {
      setSubmitting(true)

      await apiService.post('/merchants/loyalty/award', {
        user_id: selectedCustomer.id,
        points: points,
        earned_from: 'bonus',
        description: description.trim(),
      })

      Alert.alert('Succès', `${points} points attribués à ${selectedCustomer.name}`)
      setAwardModalVisible(false)
      setPointsToAward('')
      setDescription('')
      setSelectedCustomer(null)
      loadLoyaltyData()
    } catch (error: any) {
      console.error('Erreur attribution points:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'attribuer les points')
    } finally {
      setSubmitting(false)
    }
  }

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={[styles.customerCard, { backgroundColor: theme.colors.surface.light }]}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-circle" size={48} color={theme.colors.primary[500]} />
          <View style={styles.customerDetails}>
            <Text style={[styles.customerName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.customerEmail, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
          </View>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={[styles.pointsValue, { color: theme.colors.text }]}>
            {item.total_points}
          </Text>
          <Text style={[styles.pointsLabel, { color: theme.colors.textSecondary }]}>
            points
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.awardButton, { backgroundColor: theme.colors.primary[500] }]}
        onPress={() => handleAwardPress(item)}
      >
        <Ionicons name="gift-outline" size={18} color="white" />
        <Text style={styles.awardButtonText}>Attribuer des points</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Programme Fidélité</Text>
          <TouchableOpacity onPress={loadLoyaltyData}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.mainStat}>
              <Ionicons name="star" size={32} color="#F59E0B" />
              <Text style={styles.mainStatValue}>{stats.total_points_distributed}</Text>
              <Text style={styles.mainStatLabel}>Points distribués</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.monthly_points_distributed}</Text>
                <Text style={styles.statLabel}>Ce mois</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.customers_with_points}</Text>
                <Text style={styles.statLabel}>Clients fidèles</Text>
              </View>
            </View>

            {/* Top Customers */}
            {stats.top_customers && stats.top_customers.length > 0 && (
              <View style={styles.topCustomersContainer}>
                <Text style={styles.topCustomersTitle}>🏆 Top Clients Fidèles</Text>
                {stats.top_customers.map((customer, index) => (
                  <View key={customer.id} style={styles.topCustomerItem}>
                    <View style={styles.topCustomerRank}>
                      <Text style={styles.topCustomerRankText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.topCustomerName}>{customer.name}</Text>
                    <View style={styles.topCustomerPoints}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.topCustomerPointsText}>{customer.total_points}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Liste des clients */}
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="people-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucun client fidèle pour le moment
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Les clients qui effectuent des achats apparaîtront ici
            </Text>
          </View>
        }
      />

      {/* Modal Attribuer Points */}
      <Modal
        visible={awardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAwardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface.light }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Attribuer des points
              </Text>
              <TouchableOpacity onPress={() => setAwardModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <View style={styles.customerPreview}>
                <Ionicons name="person-circle" size={40} color={theme.colors.primary[500]} />
                <View style={styles.customerPreviewInfo}>
                  <Text style={[styles.customerName, { color: theme.colors.text }]}>
                    {selectedCustomer.name}
                  </Text>
                  <Text style={[styles.customerEmail, { color: theme.colors.textSecondary }]}>
                    Points actuels: {selectedCustomer.total_points}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Nombre de points (max 1000)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.neutral[200]
              }]}
              placeholder="Ex: 50"
              placeholderTextColor={theme.colors.textSecondary}
              value={pointsToAward}
              onChangeText={setPointsToAward}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: theme.colors.text, marginTop: 16 }]}>
              Description
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.neutral[200]
              }]}
              placeholder="Ex: Bonus client fidèle"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              maxLength={255}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAwardModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.colors.primary[500] }]}
                onPress={handleAwardSubmit}
                disabled={submitting || !pointsToAward || !description.trim()}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  {submitting ? 'Envoi...' : 'Attribuer'}
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
    marginBottom: 16,
  },
  mainStatValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  mainStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  topCustomersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  topCustomersTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  topCustomerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCustomerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topCustomerRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topCustomerName: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  topCustomerPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topCustomerPointsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  customerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 12,
  },
  pointsBadge: {
    alignItems: 'center',
    marginLeft: 12,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pointsLabel: {
    fontSize: 10,
  },
  awardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  awardButtonText: {
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
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
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
    maxHeight: '70%',
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
  customerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  customerPreviewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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

export default MerchantLoyaltyScreen
