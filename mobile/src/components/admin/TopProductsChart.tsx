import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../../theme'
import { Typography, Card, Badge } from '../2025'

interface ProductData {
  product_id: number
  product_name: string
  total_sold: number
  revenue?: number
}

interface TopProductsChartProps {
  data: ProductData[]
  title?: string
  limit?: number
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  title = 'Top produits vendus',
  limit = 5,
}) => {
  const theme = useTheme()

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" color="secondary">
          Aucune donnée de vente disponible
        </Typography>
      </View>
    )
  }

  // Take top N products
  const topProducts = data.slice(0, limit)
  const maxSold = Math.max(...topProducts.map(p => p.total_sold))

  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="h4" weight="semibold" style={styles.title}>
          {title}
        </Typography>
      )}

      <View style={styles.productList}>
        {topProducts.map((product, index) => {
          const progressWidth = maxSold > 0 ? (product.total_sold / maxSold) * 100 : 0

          return (
            <View key={product.product_id} style={styles.productItem}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Badge
                    variant={index === 0 ? 'success' : index === 1 ? 'warning' : 'info'}
                    size="sm"
                  >
                    #{index + 1}
                  </Badge>
                  <Typography
                    variant="body"
                    weight="medium"
                    numberOfLines={1}
                    style={styles.productName}
                  >
                    {product.product_name}
                  </Typography>
                </View>
                <Typography variant="body" weight="semibold">
                  {product.total_sold}
                </Typography>
              </View>

              <View style={[styles.progressBackground, { backgroundColor: theme.colors.neutral[200] }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progressWidth}%`,
                      backgroundColor:
                        index === 0
                          ? theme.colors.success
                          : index === 1
                          ? theme.colors.warning
                          : theme.colors.primary[500],
                    },
                  ]}
                />
              </View>

              {product.revenue !== undefined && (
                <Typography variant="caption" color="secondary" style={styles.revenueText}>
                  {product.revenue.toLocaleString()} XOF de revenus
                </Typography>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  productList: {
    gap: 16,
  },
  productItem: {
    gap: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  productName: {
    flex: 1,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  revenueText: {
    marginTop: 2,
  },
})

export default TopProductsChart
