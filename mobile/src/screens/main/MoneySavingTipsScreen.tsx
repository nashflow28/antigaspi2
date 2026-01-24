import React, { useState, useMemo } from 'react'
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Card, Typography, Badge } from '../../components/2025'

interface SavingTip {
  id: number
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  category: 'app' | 'daily' | 'food' | 'budget'
  savings: string
  details: string[]
}

const categoryLabels: Record<string, string> = {
  app: 'Antigaspi',
  daily: 'Quotidien',
  food: 'Alimentation',
  budget: 'Budget'
}

const savingTips: SavingTip[] = [
  {
    id: 1,
    title: 'Profitez des paniers surprises',
    description: 'Les paniers groupes offrent des reductions importantes sur les invendus de qualite.',
    icon: 'gift',
    category: 'app',
    savings: '30-50%',
    details: [
      'Reservez des paniers surprises pour maximiser vos economies',
      'Les paniers contiennent des produits varies de qualite',
      'Plus le panier est grand, plus les economies sont importantes',
      'Consultez les paniers disponibles chaque jour'
    ]
  },
  {
    id: 2,
    title: 'Reservez aux heures creuses',
    description: 'Les commercants proposent souvent de meilleures offres en fin de journee.',
    icon: 'time',
    category: 'app',
    savings: '10-20%',
    details: [
      'Les produits proches de la date limite sont moins chers',
      'Consultez l\'app en fin d\'apres-midi pour les meilleures offres',
      'Les commercants preferent vendre que jeter',
      'Activez les notifications pour etre alerte des nouvelles offres'
    ]
  },
  {
    id: 3,
    title: 'Cumulez vos points de fidelite',
    description: 'Chaque achat vous rapporte des points echangeables contre des reductions.',
    icon: 'star',
    category: 'app',
    savings: '5-15%',
    details: [
      'Gagnez des points a chaque reservation',
      'Les avis laisses rapportent des points bonus',
      'Parrainez vos amis pour gagner encore plus',
      'Echangez vos points contre des reductions'
    ]
  },
  {
    id: 4,
    title: 'Planifiez vos repas',
    description: 'Etablissez un menu hebdomadaire pour eviter les achats impulsifs.',
    icon: 'calendar',
    category: 'food',
    savings: '20-30%',
    details: [
      'Faites une liste de courses et respectez-la',
      'Preparez vos repas a l\'avance (meal prep)',
      'Achetez uniquement ce dont vous avez besoin',
      'Utilisez les restes pour creer de nouveaux plats'
    ]
  },
  {
    id: 5,
    title: 'Achetez local et de saison',
    description: 'Les produits locaux sont souvent moins chers et plus frais.',
    icon: 'leaf',
    category: 'food',
    savings: '15-25%',
    details: [
      'Privilegiez les marches locaux',
      'Les fruits et legumes de saison coutent moins cher',
      'Soutenez les producteurs locaux',
      'Moins de transport = prix plus bas'
    ]
  },
  {
    id: 6,
    title: 'Conservez correctement vos aliments',
    description: 'Une bonne conservation evite le gaspillage et les achats superflus.',
    icon: 'snow',
    category: 'food',
    savings: '10-20%',
    details: [
      'Rangez les aliments par date de peremption',
      'Utilisez des contenants hermetiques',
      'Congelez les surplus avant qu\'ils ne periment',
      'Verifiez regulierement votre refrigerateur'
    ]
  },
  {
    id: 7,
    title: 'Etablissez un budget mensuel',
    description: 'Definissez une limite de depenses alimentaires et tenez-vous-y.',
    icon: 'wallet',
    category: 'budget',
    savings: '15-25%',
    details: [
      'Calculez vos depenses alimentaires actuelles',
      'Fixez un objectif realiste de reduction',
      'Suivez vos depenses chaque semaine',
      'Ajustez votre budget selon vos besoins'
    ]
  },
  {
    id: 8,
    title: 'Comparez les prix',
    description: 'Prenez le temps de comparer avant d\'acheter.',
    icon: 'search',
    category: 'daily',
    savings: '10-15%',
    details: [
      'Utilisez Antigaspi pour trouver les meilleures offres',
      'Ne vous fiez pas aux promotions trompeuses',
      'Calculez le prix au kilo pour comparer',
      'Les grandes quantites ne sont pas toujours avantageuses'
    ]
  },
  {
    id: 9,
    title: 'Cuisinez a la maison',
    description: 'Preparer ses repas coute beaucoup moins cher que manger dehors.',
    icon: 'restaurant',
    category: 'daily',
    savings: '40-60%',
    details: [
      'Un repas maison coute 3 a 5 fois moins cher',
      'Apprenez des recettes simples et rapides',
      'Emportez votre dejeuner au travail',
      'Reservez les restaurants pour les occasions speciales'
    ]
  },
  {
    id: 10,
    title: 'Evitez le gaspillage d\'eau et d\'energie',
    description: 'Reduisez vos factures en adoptant des gestes simples.',
    icon: 'flash',
    category: 'daily',
    savings: '10-20%',
    details: [
      'Eteignez les lumieres inutiles',
      'Debranchez les appareils en veille',
      'Preferez les douches aux bains',
      'Utilisez l\'eau de cuisson pour arroser les plantes'
    ]
  },
  {
    id: 11,
    title: 'Rechargez votre portefeuille',
    description: 'Utilisez le portefeuille Antigaspi pour des paiements rapides et des bonus.',
    icon: 'card',
    category: 'app',
    savings: '5-10%',
    details: [
      'Les paiements via portefeuille sont plus rapides',
      'Certains commercants offrent des bonus sur les recharges',
      'Gerez facilement votre budget alimentaire',
      'Historique complet de vos transactions'
    ]
  },
  {
    id: 12,
    title: 'Partagez avec vos voisins',
    description: 'Achetez en groupe pour beneficier de meilleurs prix.',
    icon: 'people',
    category: 'daily',
    savings: '15-25%',
    details: [
      'Organisez des achats groupes avec vos voisins',
      'Partagez les excedents pour eviter le gaspillage',
      'Echangez des recettes et astuces',
      'Creez une communaute d\'entraide'
    ]
  }
]

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screenHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 20,
      paddingHorizontal: 20
    },
    backButton: {
      padding: 8
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background
    },
    introSection: {
      marginBottom: theme.spacing.lg
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.md
    },
    statItem: {
      alignItems: 'center'
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.xl,
      borderWidth: 1
    },
    tipCard: {
      marginBottom: theme.spacing.md
    },
    tipHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start'
    },
    tipIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md
    },
    tipContent: {
      flex: 1
    },
    tipMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs
    },
    expandedContent: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm
    },
    detailBullet: {
      marginRight: theme.spacing.sm,
      marginTop: 2
    }
  })

const MoneySavingTipsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const styles = useMemo(() => createStyles(theme), [theme])
  const [expandedTip, setExpandedTip] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTips = useMemo(() => {
    if (!selectedCategory) return savingTips
    return savingTips.filter(tip => tip.category === selectedCategory)
  }, [selectedCategory])

  const categories = ['app', 'food', 'daily', 'budget']

  const totalPotentialSavings = useMemo(() => {
    // Calcul simplifie: moyenne des economies potentielles
    return '20-40%'
  }, [])

  const toggleTip = (tipId: number) => {
    setExpandedTip(expandedTip === tipId ? null : tipId)
  }

  const getBadgeVariant = (category: string): 'primary' | 'info' | 'success' | 'warning' => {
    const variants: Record<string, 'primary' | 'info' | 'success' | 'warning'> = {
      app: 'primary',
      daily: 'info',
      food: 'success',
      budget: 'warning'
    }
    return variants[category] || 'primary'
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header avec bouton retour */}
      <View style={[styles.screenHeader, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          Astuces Economies
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <Card variant="elevated" style={styles.introSection}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={[
                styles.tipIconContainer,
                { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.15), marginBottom: theme.spacing.md }
              ]}
            >
              <Ionicons name="trending-down" size={28} color={theme.colors.semantic.success} />
            </View>
            <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
              Economisez jusqu'a {totalPotentialSavings}
            </Typography>
            <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
              Decouvrez nos meilleures astuces pour reduire vos depenses alimentaires
            </Typography>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography variant="h3" weight="bold" color="primary">
                {savingTips.length}
              </Typography>
              <Typography variant="caption" color="secondary">
                Astuces
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="h3" weight="bold" color="success">
                4
              </Typography>
              <Typography variant="caption" color="secondary">
                Categories
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="h3" weight="bold" color="warning">
                XOF
              </Typography>
              <Typography variant="caption" color="secondary">
                A economiser
              </Typography>
            </View>
          </View>
        </Card>

        {/* Filtres par categorie */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: !selectedCategory ? theme.colors.primary[500] : 'transparent',
                borderColor: theme.colors.primary[500]
              }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Typography
              variant="caption"
              weight="medium"
              style={{ color: !selectedCategory ? 'white' : theme.colors.primary[500] }}
            >
              Toutes
            </Typography>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedCategory === category ? theme.colors.primary[500] : 'transparent',
                  borderColor: theme.colors.primary[500]
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: selectedCategory === category ? 'white' : theme.colors.primary[500] }}
              >
                {categoryLabels[category]}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Liste des astuces */}
        {filteredTips.map(tip => (
          <Card
            key={tip.id}
            variant="elevated"
            pressable
            onPress={() => toggleTip(tip.id)}
            style={styles.tipCard}
          >
            <View style={styles.tipHeader}>
              <View
                style={[
                  styles.tipIconContainer,
                  { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15) }
                ]}
              >
                <Ionicons name={tip.icon} size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.tipContent}>
                <Typography variant="body" weight="semibold">
                  {tip.title}
                </Typography>
                <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
                  {tip.description}
                </Typography>
                <View style={styles.tipMeta}>
                  <Badge variant={getBadgeVariant(tip.category)} size="sm">
                    {categoryLabels[tip.category]}
                  </Badge>
                  <Badge variant="success" size="sm">
                    -{tip.savings}
                  </Badge>
                </View>
              </View>
              <Ionicons
                name={expandedTip === tip.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.neutral[400]}
              />
            </View>

            {expandedTip === tip.id && (
              <View style={[styles.expandedContent, { borderTopColor: theme.colors.divider }]}>
                <Typography variant="caption" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
                  Conseils detailles :
                </Typography>
                {tip.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={theme.colors.semantic.success}
                      style={styles.detailBullet}
                    />
                    <Typography variant="caption" color="secondary" style={{ flex: 1 }}>
                      {detail}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}

        {/* Message de fin */}
        <Card variant="flat" style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
          <Ionicons name="bulb" size={32} color={theme.colors.semantic.warning} />
          <Typography variant="body" weight="medium" style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
            Adoptez ces habitudes progressivement
          </Typography>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: theme.spacing.xs }}>
            Commencez par 2-3 astuces et ajoutez-en d'autres au fil du temps pour des economies durables.
          </Typography>
        </Card>
      </ScrollView>
    </View>
  )
}

export default MoneySavingTipsScreen
