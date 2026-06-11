/**
 * OnboardingScreen - First-time user tutorial
 * Shows 3 slides explaining GÊLADAL features
 */

import React, { useRef, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ViewToken,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { createLogger } from '../../utils/logger'

const log = createLogger('Onboarding')

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const STORAGE_KEY = 'antigaspi_onboarding_completed'

interface OnboardingSlide {
  id: string
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  category: string
  points: {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    content: string
  }[]
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'sparkles',
    category: 'Profil',
    title: 'Personnalisez votre expérience',
    description: 'Indiquez votre ville, vos préférences alimentaires et les créneaux de récupération qui vous conviennent.',
    points: [
      {
        icon: 'heart',
        title: 'Choisissez vos catégories favorites',
        content: 'Boulangerie, fruits & légumes, traiteur... sélectionnez ce qui vous fait envie.',
      },
      {
        icon: 'location',
        title: 'Activez les alertes locales',
        content: 'Recevez des notifications quand un panier est disponible près de vous.',
      },
    ],
  },
  {
    id: '2',
    icon: 'bag-handle',
    category: 'Réservation',
    title: 'Réservez en quelques clics',
    description: 'Découvrez les paniers surprise de vos commerçants préférés et finalisez votre réservation.',
    points: [
      {
        icon: 'shield-checkmark',
        title: 'Consultez la fiche détaillée',
        content: 'Contenu estimé, heure de récupération, avis des clients.',
      },
      {
        icon: 'wallet',
        title: 'Paiement flexible',
        content: 'Portefeuille GÊLADAL, mobile money ou paiement sur place.',
      },
    ],
  },
  {
    id: '3',
    icon: 'notifications',
    category: 'Engagement',
    title: 'Restez informé en temps réel',
    description: 'Activez les notifications pour être alerté des paniers disponibles et des nouveautés.',
    points: [
      {
        icon: 'heart',
        title: 'Suivez vos commerçants favoris',
        content: 'Ajoutez-les à vos favoris pour recevoir leurs actualités en priorité.',
      },
      {
        icon: 'time',
        title: 'Rappels automatiques',
        content: 'Nous vous avertissons avant la fin de vos créneaux de retrait.',
      },
    ],
  },
]

interface Props {
  navigation: any
  onComplete: () => void
}

const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })
    }
  }

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true')
    } catch (error) {
      log.error('Failed to save onboarding status:', error)
    }
    onComplete()
  }

  const skipOnboarding = async () => {
    await completeOnboarding()
  }

  const isLastSlide = currentIndex === slides.length - 1

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideContent}>
        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${theme.colors.primary[500]}15` },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={16}
            color={theme.colors.primary[500]}
            style={{ marginRight: 6 }}
          />
          <Typography
            variant="caption"
            weight="semibold"
            style={{ color: theme.colors.primary[600] }}
          >
            {item.category}
          </Typography>
        </View>

        {/* Title */}
        <Typography
          variant="h2"
          weight="bold"
          style={[styles.slideTitle, { color: theme.colors.text }]}
        >
          {item.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body"
          color="secondary"
          style={styles.slideDescription}
        >
          {item.description}
        </Typography>

        {/* Points */}
        <View style={styles.pointsContainer}>
          {item.points.map((point, idx) => (
            <View
              key={idx}
              style={[
                styles.pointCard,
                {
                  backgroundColor: theme.colors.surface.light,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.pointIcon,
                  { backgroundColor: `${theme.colors.primary[500]}15` },
                ]}
              >
                <Ionicons
                  name={point.icon}
                  size={18}
                  color={theme.colors.primary[500]}
                />
              </View>
              <View style={styles.pointText}>
                <Typography variant="body" weight="semibold">
                  {point.title}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {point.content}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <BrandLogo color={theme.colors.primary[500]} style={{ fontSize: 32 }} />

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Typography variant="caption" color="secondary">
            {currentIndex + 1} / {slides.length}
          </Typography>
          <View style={styles.progressDots}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === currentIndex
                        ? theme.colors.primary[500]
                        : theme.colors.border,
                    width: idx === currentIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Skip Button */}
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Typography variant="body" style={{ color: theme.colors.primary[500] }}>
            Passer
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={styles.flatList}
      />

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.footerButtons}>
          {currentIndex > 0 ? (
            <Button
              variant="secondary"
              size="lg"
              onPress={goToPrevious}
              style={{ flex: 1, marginRight: 12 }}
            >
              Précédent
            </Button>
          ) : (
            <View style={{ flex: 1, marginRight: 12 }} />
          )}

          <Button
            variant="primary"
            size="lg"
            onPress={isLastSlide ? completeOnboarding : goToNext}
            style={{ flex: 1 }}
          >
            {isLastSlide ? 'Commencer' : 'Suivant'}
          </Button>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: `${theme.colors.primary[500]}10` },
          ]}
        >
          <Ionicons
            name="bulb"
            size={20}
            color={theme.colors.primary[500]}
            style={{ marginRight: 8 }}
          />
          <Typography variant="caption" color="secondary" style={{ flex: 1 }}>
            Chaque panier réservé vous fait économiser et réduit le gaspillage alimentaire !
          </Typography>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    padding: 8,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  slideTitle: {
    marginBottom: 12,
  },
  slideDescription: {
    marginBottom: 24,
    lineHeight: 24,
  },
  pointsContainer: {
    gap: 12,
  },
  pointCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointText: {
    flex: 1,
    gap: 4,
  },
  footer: {
    paddingTop: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
})

export default OnboardingScreen
