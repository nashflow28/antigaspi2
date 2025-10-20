import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Review } from '../../types'
import StarRating from './StarRating'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: number) => void
  isOwn?: boolean
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit, onDelete, isOwn = false }) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'avis',
      'Voulez-vous vraiment supprimer cet avis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete && onDelete(review.id),
        },
      ]
    )
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={theme.colors.neutral[500]} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{review.user.name}</Text>
            <Text style={styles.timeAgo}>{review.time_ago}</Text>
          </View>
        </View>

        {isOwn && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(review)} style={styles.actionButton}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.semantic.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} size={18} />
        {review.is_verified_purchase && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.semantic.success} />
            <Text style={styles.verifiedText}>Achat vérifié</Text>
          </View>
        )}
      </View>

      {/* Title */}
      {review.title && <Text style={styles.title}>{review.title}</Text>}

      {/* Comment */}
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}

      {/* Product */}
      {review.product && (
        <View style={styles.productInfo}>
          <Ionicons name="pricetag-outline" size={14} color={theme.colors.neutral[500]} />
          <Text style={styles.productName}>{review.product.name}</Text>
        </View>
      )}

      {/* Merchant Response */}
      {review.merchant_response && (
        <View style={styles.merchantResponse}>
          <View style={styles.responseHeader}>
            <Ionicons name="storefront" size={14} color={theme.colors.primary[600]} />
            <Text style={styles.responseLabel}>Réponse du commerçant</Text>
          </View>
          <Text style={styles.responseText}>{review.merchant_response}</Text>
        </View>
      )}
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.neutral[100],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      ...theme.getTypography('body'),
      fontWeight: '600',
      color: theme.colors.text,
    },
    timeAgo: {
      ...theme.getTypography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.semantic.success + '10',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
      gap: 4,
    },
    verifiedText: {
      ...theme.getTypography('caption'),
      color: theme.colors.semantic.success,
      fontSize: 11,
      fontWeight: '600',
    },
    title: {
      ...theme.getTypography('h4'),
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    comment: {
      ...theme.getTypography('body'),
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: theme.spacing.sm,
    },
    productInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: theme.spacing.xs,
    },
    productName: {
      ...theme.getTypography('caption'),
      color: theme.colors.neutral[600],
      fontStyle: 'italic',
    },
    merchantResponse: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.primary[50] || theme.colors.neutral[50],
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary[500],
      borderRadius: theme.radius.sm,
    },
    responseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: theme.spacing.xs,
    },
    responseLabel: {
      ...theme.getTypography('caption'),
      fontWeight: '600',
      color: theme.colors.primary[700],
    },
    responseText: {
      ...theme.getTypography('small'),
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  })

export default ReviewCard
