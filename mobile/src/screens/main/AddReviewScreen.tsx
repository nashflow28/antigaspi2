import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch } from '../../store/hooks'
import { createReview, updateReview, fetchReviews } from '../../store/slices/reviewsSlice'
import { useToast } from '../../contexts/ToastContext'
import ReviewForm from '../../components/reviews/ReviewForm'
import { Typography } from '../../components/2025'
import { Review } from '../../types'

interface AddReviewScreenProps {
  route: any
  navigation: any
}

const AddReviewScreen: React.FC<AddReviewScreenProps> = ({ route, navigation }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()

  // Params: mode création OU édition
  const { merchantId, productId, merchantName, editReview } = route.params as {
    merchantId: number
    productId?: number
    merchantName?: string
    editReview?: Review  // Si présent = mode édition
  }

  const isEditMode = !!editReview

  const handleSubmit = async (data: { rating: number; title?: string; comment?: string }) => {
    try {
      if (isEditMode && editReview) {
        // Mode édition
        await dispatch(updateReview({
          reviewId: editReview.id,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
        })).unwrap()
        showSuccess('Avis modifié avec succès! ✏️')
      } else {
        // Mode création
        await dispatch(createReview({ merchantId, productId, ...data })).unwrap()
        showSuccess('Avis publié avec succès! 🎉')
      }

      // Refresh reviews list
      dispatch(fetchReviews({ merchantId }))

      // Navigate back
      navigation.goBack()
    } catch (error: any) {
      // L'erreur peut être une string (rejectWithValue) ou un objet Error
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || (isEditMode ? 'Erreur lors de la modification' : 'Erreur lors de la publication')

      // Message personnalisé si avis déjà existant (status 409)
      if (errorMessage.includes('déjà') || errorMessage.includes('already')) {
        showError('Vous avez déjà donné un avis sur ce produit. Vous pouvez le modifier depuis la liste des avis.')
      } else {
        showError(errorMessage)
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold" style={{ flex: 1 }}>
          {isEditMode ? 'Modifier mon avis' : 'Donner votre avis'}
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {merchantName && (
          <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.xl }}>
            {isEditMode ? 'Modification de votre avis sur' : 'sur'} {merchantName}
          </Typography>
        )}

        <ReviewForm
          onSubmit={handleSubmit}
          initialRating={editReview?.rating}
          initialTitle={editReview?.title ?? undefined}
          initialComment={editReview?.comment ?? undefined}
          submitButtonText={isEditMode ? 'Enregistrer les modifications' : 'Publier l\'avis'}
        />
      </ScrollView>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: theme.spacing.sm,
    },
    content: {
      padding: theme.spacing.lg,
    },
  })

export default AddReviewScreen
