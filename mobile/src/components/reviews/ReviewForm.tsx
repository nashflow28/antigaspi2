import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useTheme } from '../../theme'
import StarRating from './StarRating'

interface ReviewFormProps {
  initialRating?: number
  initialTitle?: string
  initialComment?: string
  onSubmit: (data: { rating: number; title?: string; comment?: string }) => Promise<void>
  submitButtonText?: string
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  initialRating = 0,
  initialTitle = '',
  initialComment = '',
  onSubmit,
  submitButtonText = 'Publier l\'avis',
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const [rating, setRating] = useState(initialRating)
  const [title, setTitle] = useState(initialTitle)
  const [comment, setComment] = useState(initialComment)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

  const validate = (): boolean => {
    const newErrors: { rating?: string; comment?: string } = {}

    if (rating === 0) {
      newErrors.rating = 'Veuillez sélectionner une note'
    }

    if (comment.length > 1000) {
      newErrors.comment = 'Le commentaire ne peut pas dépasser 1000 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit({
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled = rating === 0 || loading

  return (
    <View style={styles.container}>
      {/* Rating */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Note <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.ratingContainer}>
          <StarRating
            rating={rating}
            size={32}
            interactive
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 ? 'Très mauvais' :
               rating === 2 ? 'Mauvais' :
               rating === 3 ? 'Moyen' :
               rating === 4 ? 'Bien' :
               'Excellent'}
            </Text>
          )}
        </View>
        {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.label}>Titre (facultatif)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Résumez votre expérience..."
          placeholderTextColor={theme.colors.textTertiary}
          maxLength={255}
        />
      </View>

      {/* Comment */}
      <View style={styles.section}>
        <Text style={styles.label}>Commentaire (facultatif)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Partagez votre expérience avec ce commerçant/produit..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          numberOfLines={6}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/1000 caractères</Text>
        {errors.comment && <Text style={styles.errorText}>{errors.comment}</Text>}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{submitButtonText}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.getTypography('body'),
      fontWeight: '600',
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.semantic.error,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    ratingText: {
      ...theme.getTypography('body'),
      color: theme.colors.primary[600],
      fontWeight: '600',
    },
    input: {
      ...theme.getTypography('body'),
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 120,
      paddingTop: theme.spacing.sm,
    },
    charCount: {
      ...theme.getTypography('caption'),
      color: theme.colors.textTertiary,
      textAlign: 'right',
      marginTop: 4,
    },
    errorText: {
      ...theme.getTypography('caption'),
      color: theme.colors.semantic.error,
      marginTop: 4,
    },
    submitButton: {
      backgroundColor: theme.colors.primary[600],
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      ...theme.shadows.md,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.neutral[300],
      opacity: 0.6,
    },
    submitButtonText: {
      ...theme.getTypography('body'),
      fontWeight: '600',
      color: '#FFFFFF',
    },
  })

export default ReviewForm
