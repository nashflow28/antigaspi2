import { useEffect, useRef } from 'react'
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

  // 🐛 FIX: Use ref to prevent infinite loop when favoriteIds changes
  const hasFetchedRef = useRef(false)

  // Charger les IDs favoris au premier rendu si vide
  useEffect(() => {
    if (!hasFetchedRef.current && favoriteIds.length === 0) {
      hasFetchedRef.current = true
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
