<template>
  <Card class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-responsive-lg font-semibold text-neutral-900">Filtres</h2>
      <button
        type="button"
        class="text-responsive-sm text-primary-600 hover:text-primary-700"
        :disabled="!hasActiveFilters"
        @click="handleReset"
      >
        Réinitialiser
      </button>
    </div>

    <div class="grid grid-cols-1 gap-5">
      <div>
        <label class="label-2025">Catégorie</label>
        <select
          class="select-2025"
          :value="modelValue.categoryId ?? ''"
          @change="onCategoryChange($event.target as HTMLSelectElement)"
        >
          <option value="">Toutes les catégories</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label class="label-2025">Prix min</label>
          <select
            class="select-2025"
            :value="modelValue.minPrice ?? ''"
            @change="onMinPriceChange($event.target as HTMLSelectElement)"
          >
            <option value="">Aucun</option>
            <option v-for="price in priceSteps" :key="`min-${price}`" :value="price">
              {{ formatPrice(price) }}
            </option>
          </select>
        </div>
        <div>
          <label class="label-2025">Prix max</label>
          <select
            class="select-2025"
            :value="modelValue.maxPrice ?? ''"
            @change="onMaxPriceChange($event.target as HTMLSelectElement)"
          >
            <option value="">Tous</option>
            <option v-for="price in priceSteps" :key="`max-${price}`" :value="price">
              {{ formatPrice(price) }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/currency'
import Card from '@/components/ui/2025/Card.vue'

export interface SurpriseBasketFilterModel {
  categoryId?: number | null
  minPrice?: number | null
  maxPrice?: number | null
}

interface Props {
  modelValue: SurpriseBasketFilterModel
  categories?: Array<{ id: number; name: string }>
  priceSteps?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  priceSteps: () => [500, 1000, 2000, 5000, 10000]
})

const emit = defineEmits<{
  'update:modelValue': [value: SurpriseBasketFilterModel]
  reset: []
}>()

const hasActiveFilters = computed(() => {
  return Boolean(props.modelValue.categoryId || props.modelValue.minPrice || props.modelValue.maxPrice)
})

const updateModel = (patch: Partial<SurpriseBasketFilterModel>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch
  })
}

const onCategoryChange = (target: HTMLSelectElement) => {
  updateModel({ categoryId: target.value ? Number(target.value) : null })
}

const onMinPriceChange = (target: HTMLSelectElement) => {
  updateModel({ minPrice: target.value ? Number(target.value) : null })
}

const onMaxPriceChange = (target: HTMLSelectElement) => {
  updateModel({ maxPrice: target.value ? Number(target.value) : null })
}

const handleReset = () => {
  emit('update:modelValue', { categoryId: null, minPrice: null, maxPrice: null })
  emit('reset')
}
</script>
