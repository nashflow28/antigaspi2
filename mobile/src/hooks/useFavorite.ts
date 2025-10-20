import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { toggleFavorite, fetchFavoriteIds } from '../store/slices/favoritesSlice'

/**
 * Hook custom pour gérer les favoris
 * @param productId - ID du produit
 * @returns {isFavorite, toggleFavorite, loading}
 */
export const useFavorite = (productId: number) => {
  const dispatch = useAppDispatch()
  const { favoriteIds, loading } = useAppSelector((state) => state.favorites)

  // Charger les IDs favoris au premier rendu si vide
  useEffect(() => {
    if (favoriteIds.length === 0) {
      dispatch(fetchFavoriteIds())
    }
  }, [dispatch, favoriteIds.length])

  const isFavorite = favoriteIds.includes(productId)

  const handleToggle = async () => {
    try {
      await dispatch(toggleFavorite(productId)).unwrap()
    } catch (error) {
      console.error('Erreur toggle favori:', error)
    }
  }

  return {
    isFavorite,
    toggleFavorite: handleToggle,
    loading,
  }
}
