import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  route: any
}

const ProductDetailsScreen: React.FC<Props> = ({ route }) => {
  const { productId } = route.params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détail du Produit</Text>
      <Text style={styles.subtitle}>ID: {productId}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
})

export default ProductDetailsScreen