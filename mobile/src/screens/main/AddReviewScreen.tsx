import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '../../theme'
import { useAppDispatch } from '../../store/hooks'
import { createReview, fetchReviews } from '../../store/slices/reviewsSlice'
import { useToast } from '../../contexts/ToastContext'
import ReviewForm from '../../components/reviews/ReviewForm'
import { Typography } from '../../components/2025'

interface AddReviewScreenProps {
  route: any
  navigation: any
}

const AddReviewScreen: React.FC<AddReviewScreenProps> = ({ route, navigation }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const dispatch = useAppDispatch()
  const { showSuccess, showError } = useToast()

  const { merchantId, productId, merchantName } = route.params

  const handleSubmit = async (data: { rating: number; title?: string; comment?: string }) => {
    try {
      await dispatch(createReview({ merchantId, productId, ...data })).unwrap()
      showSuccess('Avis publié avec succès! 🎉')
      
      // Refresh reviews list
      dispatch(fetchReviews({ merchantId }))
      
      // Navigate back
      navigation.goBack()
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la publication')
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
          Donner votre avis
        </Typography>
        {merchantName && (
          <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.xl }}>
            sur {merchantName}
          </Typography>
        )}

        <ReviewForm onSubmit={handleSubmit} />
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
    content: {
      padding: theme.spacing.lg,
    },
  })

export default AddReviewScreen
