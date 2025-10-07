import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProduct } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  route: any
  navigation: any
}

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { productId } = route.params
  const { products, loading } = useSelector((state: RootState) => state.products)

  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      const existingProduct = products.find(p => p.id === productId)
      if (existingProduct) {
        console.log('Product found in store:', existingProduct)
        setProduct(existingProduct)
      } else {
        console.log('Fetching product from API:', productId)
        const result = await dispatch(fetchProduct(productId))
        if (fetchProduct.fulfilled.match(result)) {
          console.log('Product fetched successfully:', result.payload)
          setProduct(result.payload as Product)
        } else if (fetchProduct.rejected.match(result)) {
          console.error('Failed to fetch product:', result.error)
          Alert.alert('Erreur', 'Impossible de charger le produit')
          navigation.goBack()
        }
      }
    } catch (error: any) {
      console.error('Error loading product:', error)
      Alert.alert('Erreur', `Impossible de charger le produit: ${error.message || 'Erreur inconnue'}`)
      navigation.goBack()
    }
  }

  if (loading || !product) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    )
  }

  const discountedPrice = Math.round(parseFloat(product.discounted_price))
  const originalPrice = Math.round(parseFloat(product.original_price))

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du produit</Text>
        </View>

        {/* Image */}
        <Image
          source={{ uri: getImageUrl(product.image_url) }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />

        {/* Info */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>

          <Text style={styles.merchantName}>
            {product.merchant?.business_name || 'Marchand'} | {product.merchant?.city || 'Ville'}
          </Text>

          <Text style={styles.price}>{discountedPrice} F CFA</Text>
          <Text style={styles.originalPrice}>{originalPrice} F CFA</Text>

          <Text style={styles.quantity}>Quantité: {product.quantity_available}</Text>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          <Text style={styles.category}>
            Catégorie: {product.category?.name || 'Non catégorisé'}
          </Text>
        </View>
      </ScrollView>

      {/* Bouton Réserver */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reserveButton}
          disabled={product.quantity_available === 0}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.reserveButtonText}>
            {product.quantity_available === 0 ? 'Rupture de stock' : 'Réserver'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 16,
  },
  quantity: {
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reserveButton: {
    backgroundColor: '#DCB253',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ProductDetailsScreen
