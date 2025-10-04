import React, { useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Card, Badge, Typography, Heading3, BodyText, SmallText, CaptionText } from '../../components/2025'
import { getImageUrl } from '../../utils/imageHelpers'
import { getCategoryEmoji } from '../../utils/categoryEmojis'

interface Props {
  navigation: any
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { products, categories, loading } = useSelector((state: RootState) => state.products)
  const theme = useTheme()

  const [refreshing, setRefreshing] = React.useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchProducts({ per_page: 10 })),
        dispatch(fetchCategories()),
      ])
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données')
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const featuredProducts = products.slice(0, 5)
  const totalSavings = products.reduce((sum, product) => sum + product.savings, 0)

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Heading3 color="inverse">
              {getGreeting()}, {user?.first_name}! 👋
            </Heading3>
            <SmallText color="inverse" style={{ opacity: 0.9, marginTop: theme.spacing.xs }}>
              Découvrez les meilleures offres du jour
            </SmallText>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <Typography variant="h2">{products.length}</Typography>
            <CaptionText color="secondary" align="center" style={{ marginBottom: theme.spacing.sm }}>
              Produits disponibles
            </CaptionText>
            <Ionicons name="bag-outline" size={24} color={theme.colors.primary[500]} />
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <Typography variant="h2">{Math.round(totalSavings).toLocaleString()}</Typography>
            <CaptionText color="secondary" align="center" style={{ marginBottom: theme.spacing.sm }}>
              F CFA économisés
            </CaptionText>
            <Ionicons name="trending-down-outline" size={24} color={theme.colors.accent.orange} />
          </Card>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Heading3 style={{ marginBottom: theme.spacing.md }}>Catégories populaires</Heading3>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Products', { categoryId: category.id })}
              >
                <View style={styles.categoryIcon}>
                  <Typography style={styles.categoryEmoji}>
                    {getCategoryEmoji(String(category.name ?? category.id))}
                  </Typography>
                </View>
                <CaptionText align="center" weight="medium">{category.name}</CaptionText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heading3>Offres du moment</Heading3>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <SmallText color="primary" weight="semibold">Voir tout</SmallText>
            </TouchableOpacity>
          </View>

          {featuredProducts.map((product) => (
            <Card
              key={product.id}
              variant="elevated"
              pressable
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
              style={styles.productCard}
            >
              <View style={styles.productLayout}>
                <Image
                  source={{ uri: getImageUrl(product.image_url) }}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={200}
                />

                <View style={styles.productInfo}>
                  <BodyText weight="semibold">{product.name}</BodyText>
                  <SmallText color="secondary" style={{ marginBottom: theme.spacing.sm }}>
                    {product.merchant.business_name}
                  </SmallText>

                  <View style={styles.priceContainer}>
                    <BodyText color="primary" weight="bold">
                      {Math.round(parseFloat(product.discounted_price)).toLocaleString()} F CFA
                    </BodyText>
                    <SmallText color="tertiary" style={{ textDecorationLine: 'line-through', marginRight: theme.spacing.sm }}>
                      {Math.round(parseFloat(product.original_price)).toLocaleString()} F CFA
                    </SmallText>
                    <Badge variant="warning" size="sm">
                      -{product.discount_percentage}%
                    </Badge>
                  </View>

                  <View style={styles.productFooter}>
                    <CaptionText color="error">
                      Expire dans {product.days_until_expiration} jour(s)
                    </CaptionText>
                    <CaptionText color="secondary">Stock: {product.quantity_available}</CaptionText>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Heading3 style={{ marginBottom: theme.spacing.md }}>Actions rapides</Heading3>
          <View style={styles.quickActions}>
            <Card
              variant="elevated"
              pressable
              onPress={() => navigation.navigate('Reservations')}
              style={styles.quickAction}
            >
              <Ionicons name="bookmark-outline" size={24} color={theme.colors.primary[500]} />
              <SmallText align="center" weight="medium" style={{ marginTop: theme.spacing.sm }}>
                Mes réservations
              </SmallText>
            </Card>

            <Card
              variant="elevated"
              pressable
              onPress={() => navigation.navigate('Products')}
              style={styles.quickAction}
            >
              <Ionicons name="search-outline" size={24} color={theme.colors.primary[500]} />
              <SmallText align="center" weight="medium" style={{ marginTop: theme.spacing.sm }}>
                Rechercher
              </SmallText>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoriesScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  productCard: {
    marginBottom: theme.spacing.md,
  },
  productLayout: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing.md,
  },
  productEmoji: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
})

export default HomeScreen