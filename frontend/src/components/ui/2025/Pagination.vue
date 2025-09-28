<template>
  <div :class="wrapperClasses">
    <!-- Information -->
    <div v-if="showInfo" class="flex-1">
      <p class="text-sm text-neutral-600">
        Affichage {{ startItem }} à {{ endItem }} sur {{ total }} résultats
      </p>
    </div>

    <!-- Pagination Navigation -->
    <nav :class="navClasses" aria-label="Pagination">
      <!-- Previous Button -->
      <Button
        :variant="currentPage === 1 ? 'ghost' : 'outline'"
        :size="size"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft :size="iconSize" />
        <span v-if="!compact">Précédent</span>
      </Button>

      <!-- Page Numbers -->
      <div v-if="!compact" class="flex items-center space-y-4 sm:space-x-2">
        <!-- First Page -->
        <Button
          v-if="showFirstLast && currentPage > 3"
          variant="ghost"
          :size="size"
          @click="goToPage(1)"
        >
          1
        </Button>

        <!-- First Ellipsis -->
        <span v-if="showFirstLast && currentPage > 4" class="px-3 text-neutral-500">
          ...
        </span>

        <!-- Page Numbers Around Current -->
        <Button
          v-for="page in visiblePages"
          :key="page"
          :variant="page === currentPage ? 'primary' : 'ghost'"
          :size="size"
          @click="goToPage(page)"
        >
          {{ page }}
        </Button>

        <!-- Last Ellipsis -->
        <span v-if="showFirstLast && currentPage < totalPages - 3" class="px-3 text-neutral-500">
          ...
        </span>

        <!-- Last Page -->
        <Button
          v-if="showFirstLast && currentPage < totalPages - 2"
          variant="ghost"
          :size="size"
          @click="goToPage(totalPages)"
        >
          {{ totalPages }}
        </Button>
      </div>

      <!-- Compact Page Info -->
      <div v-if="compact" class="flex items-center space-y-4 sm:space-x-2">
        <span class="text-sm text-neutral-600">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
      </div>

      <!-- Next Button -->
      <Button
        :variant="currentPage === totalPages ? 'ghost' : 'outline'"
        :size="size"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        <span v-if="!compact">Suivant</span>
        <ChevronRight :size="iconSize" />
      </Button>
    </nav>

    <!-- Page Size Selector -->
    <div v-if="showPageSize" class="flex items-center space-y-4 sm:space-x-2">
      <label for="page-size" class="text-sm text-neutral-600">
        Éléments par page:
      </label>
      <Select
        id="page-size"
        :model-value="pageSize"
        size="sm"
        @update:model-value="(value: string | number) => changePageSize(Number(value))"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </Select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Button from './Button.vue'
import Select from './Select.vue'

// Types
export type PaginationSize = 'sm' | 'md' | 'lg'

// Props
interface Props {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  size?: PaginationSize
  compact?: boolean
  showInfo?: boolean
  showPageSize?: boolean
  showFirstLast?: boolean
  maxVisible?: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  compact: false,
  showInfo: true,
  showPageSize: false,
  showFirstLast: true,
  maxVisible: 5,
  pageSizeOptions: () => [10, 20, 50, 100]
})

// Emits
const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [size: number]
}>()

// Computed
const wrapperClasses = computed(() => [
  'flex items-center justify-between',
  props.compact ? 'space-x-4' : 'space-x-6'
].join(' '))

const navClasses = computed(() => [
  'flex items-center',
  props.compact ? 'space-x-2' : 'space-x-4'
].join(' '))

const iconSize = computed(() => {
  const sizes = {
    sm: 16,
    md: 18,
    lg: 20
  }
  return sizes[props.size]
})

const startItem = computed(() => {
  return Math.min((props.currentPage - 1) * props.pageSize + 1, props.total)
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.total)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = props.maxVisible
  const current = props.currentPage
  const total = props.totalPages

  if (total <= maxVisible) {
    // Show all pages if total is less than maxVisible
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Calculate range around current page
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, current - half)
    const end = Math.min(total, start + maxVisible - 1)

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

// Methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const changePageSize = (newSize: number) => {
  emit('page-size-change', newSize)
}
</script>
