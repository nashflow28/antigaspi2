import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'

interface Props {
  navigation: any
}

const MerchantProductsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Recharger la liste à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      loadProducts()
    }, [])
  )

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log('📦 [MerchantProducts] Chargement des produits...')
      const response = await apiService.get('/products/merchant')
      console.log('📦 [MerchantProducts] Réponse API complète:', response)
      console.log('📦 [MerchantProducts] response.data:', response.data)
      console.log('📦 [MerchantProducts] Nombre de produits:', response.data?.length)
      // ✅ FIX: apiService.get retourne déjà {data: [...], pagination: {...}}
      // donc response.data contient directement l'array de produits
      setProducts(response.data || [])
      console.log('📦 [MerchantProducts] Produits définis dans le state:', response.data?.length)
    } catch (error: any) {
      console.error('❌ [MerchantProducts] Erreur chargement produits:', error)
      console.error('❌ [MerchantProducts] Error details:', error.response?.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadProducts()
  }

  const handleCreateProduct = () => {
    navigation.navigate('ProductForm', { mode: 'create' })
  }

  const handleEditProduct = (product: Product) => {
    navigation.navigate('ProductForm', { mode: 'edit', product })
  }

  const handleDeleteProduct = (productId: number) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [MerchantProducts] Suppression du produit:', productId)
              setLoading(true)
              await apiService.delete(`/products/${productId}`)
              console.log('✅ [MerchantProducts] Produit supprimé avec succès')

              // Recharger la liste
              await loadProducts()

              Alert.alert('Succès', 'Le produit a été supprimé')
            } catch (error: any) {
              console.error('❌ [MerchantProducts] Erreur suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer le produit')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: theme.colors.surface.light }]}>
      <TouchableOpacity
        style={styles.productContent}
        onPress={() => handleEditProduct(item)}
      >
        {/* Image */}
        {item.image_url ? (
          <Image
            source={{ uri: getImageUrl(item.image_url) }}
            style={styles.productImage}
          />
        ) : (
          <View style={[styles.productImage, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}

        {/* Infos */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
            {item.category?.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.colors.primary[500] }]}>
              {item.discounted_price} F CFA
            </Text>
            <Text style={[styles.productOriginalPrice, { color: theme.colors.textSecondary }]}>
              {item.original_price} F CFA
            </Text>
          </View>
          <View style={styles.stockRow}>
            <View style={[
              styles.stockBadge,
              {
                backgroundColor: item.quantity_available > 0
                  ? theme.withOpacity(theme.colors.semantic.success, 0.1)
                  : theme.withOpacity(theme.colors.semantic.error, 0.1)
              }
            ]}>
              <Text style={[
                styles.stockText,
                {
                  color: item.quantity_available > 0
                    ? theme.colors.semantic.success
                    : theme.colors.semantic.error
                }
              ]}>
                {item.quantity_available > 0 ? `Stock: ${item.quantity_available}` : 'Rupture'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}
            onPress={() => handleEditProduct(item)}
          >
            <Ionicons name="create" size={20} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.withOpacity(theme.colors.semantic.error, 0.1) }]}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <Ionicons name="trash" size={20} color={theme.colors.semantic.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantProducts}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Produits</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProduct}
            testID={TEST_IDS.addProductButton}
            accessibilityLabel="Ajouter un nouveau produit"
          >
            <Ionicons name="add-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des produits */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        testID={TEST_IDS.merchantProductsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucun produit
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Appuyez sur + pour ajouter votre premier produit
            </Text>
          </View>
        }
      />

      {/* Overlay de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  productCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
})

export default MerchantProductsScreen
