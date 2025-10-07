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
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  navigation: any
}

const MerchantProductsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const [products, setProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/products/merchant')
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Erreur chargement produits:', error)
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
              await apiService.delete(`/products/${productId}`)
              loadProducts()
            } catch (error) {
              console.error('Erreur suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer le produit')
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
          <Text style={[styles.productName, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
          <Text style={[styles.productCategory, { color: theme.colors.text.secondary }]}>
            {item.category?.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.colors.primary[500] }]}>
              {item.discounted_price} F CFA
            </Text>
            <Text style={[styles.productOriginalPrice, { color: theme.colors.text.secondary }]}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Produits</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProduct}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              Aucun produit
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
              Appuyez sur + pour ajouter votre premier produit
            </Text>
          </View>
        }
      />
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
})

export default MerchantProductsScreen
