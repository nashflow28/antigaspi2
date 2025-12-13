/**
 * Pagination Component for Admin Screens
 *
 * A reusable pagination component that displays page navigation controls
 * with page numbers, prev/next buttons, and item count information.
 */

import React, { useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography } from '../2025'

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items across all pages */
  totalItems: number
  /** Number of items per page */
  itemsPerPage: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Whether data is loading */
  loading?: boolean
  /** Whether to show item count info */
  showItemCount?: boolean
  /** Maximum number of page buttons to show */
  maxPageButtons?: number
  /** Test ID for testing */
  testID?: string
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
  showItemCount = true,
  maxPageButtons = 5,
  testID,
}) => {
  const theme = useTheme()

  // Calculate visible page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= maxPageButtons) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Calculate range around current page
      const halfRange = Math.floor((maxPageButtons - 2) / 2)
      let startPage = Math.max(2, currentPage - halfRange)
      let endPage = Math.min(totalPages - 1, currentPage + halfRange)

      // Adjust if we're near the start or end
      if (currentPage <= halfRange + 1) {
        endPage = maxPageButtons - 1
      }
      if (currentPage >= totalPages - halfRange) {
        startPage = totalPages - maxPageButtons + 2
      }

      // Always show first page
      pages.push(1)

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('ellipsis')
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }, [currentPage, totalPages, maxPageButtons])

  // Calculate item range for display
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Don't render if only one page or no items
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return showItemCount && totalItems > 0 ? (
      <View style={[styles.container, styles.infoOnly]} testID={testID}>
        <Typography variant="caption" color="secondary">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </Typography>
      </View>
    ) : null
  }

  const canGoPrevious = currentPage > 1 && !loading
  const canGoNext = currentPage < totalPages && !loading

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface.light }]}
      testID={testID}
    >
      {/* Item count info */}
      {showItemCount && (
        <View style={styles.infoContainer}>
          <Typography variant="caption" color="secondary">
            {startItem}-{endItem} sur {totalItems}
          </Typography>
        </View>
      )}

      {/* Pagination controls */}
      <View style={styles.controlsContainer}>
        {/* Previous button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: theme.colors.surface.muted },
            !canGoPrevious && styles.navButtonDisabled,
          ]}
          onPress={() => canGoPrevious && onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          activeOpacity={0.7}
          accessibilityLabel="Page précédente"
          accessibilityRole="button"
          testID={`${testID}-prev`}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrevious ? theme.colors.text : theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Page numbers */}
        <View style={styles.pageNumbersContainer}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary[500]}
              style={styles.loader}
            />
          ) : (
            pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <View
                    key={`ellipsis-${index}`}
                    style={styles.ellipsis}
                  >
                    <Typography variant="caption" color="secondary">
                      ...
                    </Typography>
                  </View>
                )
              }

              const isActive = page === currentPage

              return (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.pageButton,
                    isActive && {
                      backgroundColor: theme.colors.primary[500],
                    },
                    !isActive && {
                      backgroundColor: theme.colors.surface.muted,
                    },
                  ]}
                  onPress={() => !isActive && onPageChange(page)}
                  disabled={isActive || loading}
                  activeOpacity={0.7}
                  accessibilityLabel={`Page ${page}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  testID={`${testID}-page-${page}`}
                >
                  <Typography
                    variant="caption"
                    weight={isActive ? 'bold' : 'regular'}
                    style={{ color: isActive ? '#FFFFFF' : theme.colors.text }}
                  >
                    {page}
                  </Typography>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: theme.colors.surface.muted },
            !canGoNext && styles.navButtonDisabled,
          ]}
          onPress={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          activeOpacity={0.7}
          accessibilityLabel="Page suivante"
          accessibilityRole="button"
          testID={`${testID}-next`}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? theme.colors.text : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  infoOnly: {
    justifyContent: 'center',
    paddingVertical: 8,
  },
  infoContainer: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 8,
  },
  pageButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ellipsis: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginHorizontal: 16,
  },
})

export default Pagination
