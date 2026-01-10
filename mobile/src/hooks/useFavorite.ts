import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { toggleFavorite, fetchFavoriteIds } from '../store/slices/favoritesSlice'
import { useAuthPrompt } from '../contexts/AuthPromptContext'

/**
 * Hook custom pour gerer les favoris
 * @param productId - ID du produit
 * @returns {isFavorite, toggleFavorite, loading}
 */
export const useFavorite = (productId: number) => {
  const dispatch = useAppDispatch()
  const { favoriteIds, loading } = useAppSelector((state) => state.favorites)
  const { requireAuth, isAuthenticated } = useAuthPrompt()

  // Use ref to prevent infinite loop when favoriteIds changes
  const hasFetchedRef = useRef(false)

  // Charger les IDs favoris au premier rendu si connecte et non charges
  useEffect(() => {
    if (!hasFetchedRef.current && isAuthenticated) {
      hasFetchedRef.current = true
      dispatch(fetchFavoriteIds())
    }
  }, [dispatch, isAuthenticated])

  const isFavorite = isAuthenticated && favoriteIds.includes(productId)

  const handleToggle = async () => {
    // Verifier l'authentification avant de toggle
    if (!requireAuth({ actionDescription: 'ajouter aux favoris' })) {
      return
    }

    try {
      await dispatch(toggleFavorite(productId)).unwrap()
    } catch (error) {
      // Error handled by Redux slice
    }
  }

  return {
    isFavorite,
    toggleFavorite: handleToggle,
    loading,
  }
}
