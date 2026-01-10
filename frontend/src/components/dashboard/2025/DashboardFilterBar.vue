<template>
  <form
    class="flex flex-col gap-3 rounded-2xl border border-neutral-200/60 bg-surface-light/80 p-4 shadow-card dark:border-neutral-700/50 dark:bg-surface-dark/70"
    @submit.prevent="handleSubmit"
  >
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Input
        :model-value="search"
        :placeholder="placeholder"
        size="lg"
        class="flex-1"
        :left-icon="MagnifyingGlassIcon"
        clearable
        @update:model-value="(value) => emit('update:search', value as string)"
      />

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          v-for="filter in normalizedFilters"
          :key="filter.id"
          class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <Label v-if="filter.label" :for="`filter-${filter.id}`" class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {{ filter.label }}
          </Label>
          <Select
            :id="`filter-${filter.id}`"
            :model-value="filter.value ?? ''"
            size="sm"
            class="min-w-[160px]"
            @update:model-value="(value) => onFilterChange(filter.id, value as string)"
          >
            <option
              v-for="option in filter.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </Select>
        </div>

        <slot name="actions" />
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { Input, Select, Label } from '@/components/ui/2025'

type FilterOption = {
  label: string
  value: string
}

type DashboardFilter = {
  id: string
  label?: string
  value?: string
  options: FilterOption[]
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    search: string
    filters?: DashboardFilter[]
    placeholder?: string
  }>(),
  {
    filters: () => [],
    placeholder: 'Rechercher...'
  }
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [filters: DashboardFilter[]]
  'filter-change': [payload: { id: string; value: string }]
  search: [value: string]
}>()

const normalizedFilters = computed(() => props.filters ?? [])

const onFilterChange = (id: string, value: string) => {
  const updatedFilters = normalizedFilters.value.map((filter) =>
    filter.id === id ? { ...filter, value } : filter
  )
  emit('update:filters', updatedFilters)
  emit('filter-change', { id, value })
}

const handleSubmit = () => {
  emit('search', props.search)
}

export type { DashboardFilter }
</script>
