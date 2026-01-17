import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { AppDispatch } from '../../store'
import { rateDelivery } from '../../store/slices/deliverySlice'

const DeliveryRatingScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const dispatch = useDispatch<AppDispatch>()

  const { deliveryId } = route.params || {}

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const positiveTags = [
    'Rapide',
    'Ponctuel',
    'Aimable',
    'Professionnel',
    'Soigné',
    'Communique bien',
  ]

  const negativeTags = [
    'En retard',
    'Impoli',
    'Colis abîmé',
    'Difficile à joindre',
    'Non professionnel',
  ]

  const toggleTag = (tag: string) => {
    haptics.lightTap()
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez donner une note au livreur')
      return
    }

    if (!deliveryId) {
      Alert.alert('Erreur', 'Livraison non trouvée')
      return
    }

    setLoading(true)
    haptics.mediumTap()

    try {
      // Combine comment with tags
      const fullComment = [
        ...selectedTags.map((tag) => `[${tag}]`),
        comment,
      ]
        .filter(Boolean)
        .join(' ')

      await dispatch(rateDelivery({
        deliveryId,
        rating,
        comment: fullComment || undefined,
      })).unwrap()

      haptics.success()
      Alert.alert(
        'Merci pour votre avis!',
        'Votre évaluation aide à améliorer notre service de livraison.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err: any) {
      haptics.error()
      Alert.alert('Erreur', err || "Impossible d'envoyer votre évaluation")
    }

    setLoading(false)
  }

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              haptics.lightTap()
              setRating(star)
            }}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? theme.colors.warning : theme.colors.neutral[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const getRatingLabel = () => {
    const labels: Record<number, string> = {
      1: 'Très mauvais',
      2: 'Mauvais',
      3: 'Moyen',
      4: 'Bien',
      5: 'Excellent',
    }
    return labels[rating] || 'Appuyez sur une étoile'
  }

  const tagsToShow = rating >= 4 ? positiveTags : rating > 0 ? negativeTags : []

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Évaluer la livraison
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rating section */}
        <View style={[styles.ratingSection, { backgroundColor: theme.colors.cardBackground }]}>
          <Ionicons
            name="bicycle"
            size={48}
            color={theme.colors.primary[500]}
            style={styles.deliveryIcon}
          />
          <Text style={[styles.ratingTitle, { color: theme.colors.text }]}>
            Comment s'est passée votre livraison?
          </Text>
          <Text style={[styles.ratingSubtitle, { color: theme.colors.textSecondary }]}>
            Votre avis nous aide à améliorer notre service
          </Text>

          {renderStars()}

          <Text
            style={[
              styles.ratingLabel,
              { color: rating > 0 ? theme.colors.primary[500] : theme.colors.textTertiary },
            ]}
          >
            {getRatingLabel()}
          </Text>
        </View>

        {/* Tags section */}
        {tagsToShow.length > 0 && (
          <View style={[styles.tagsSection, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.tagsTitle, { color: theme.colors.text }]}>
              {rating >= 4 ? "Qu'avez-vous apprécié?" : 'Que pouvons-nous améliorer?'}
            </Text>
            <View style={styles.tagsContainer}>
              {tagsToShow.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: selectedTags.includes(tag)
                        ? theme.colors.primary[500]
                        : theme.colors.background,
                      borderColor: selectedTags.includes(tag)
                        ? theme.colors.primary[500]
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color: selectedTags.includes(tag)
                          ? 'white'
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Comment section */}
        <View style={[styles.commentSection, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.commentTitle, { color: theme.colors.text }]}>
            Commentaire (optionnel)
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience avec le livreur..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.colors.primary[500] },
            (loading || rating === 0) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer mon avis</Text>
          )}
        </TouchableOpacity>

        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
            Passer cette étape
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ratingSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryIcon: {
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagsSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  commentSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  commentInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  skipButtonText: {
    fontSize: 14,
  },
})

export default DeliveryRatingScreen
