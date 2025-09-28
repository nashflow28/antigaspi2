<template>
  <div class="table-wrapper-2025 rounded-2xl border border-neutral-200/70 bg-surface-light shadow-card transition-all duration-300 dark:border-neutral-700/60 dark:bg-surface-dark">
    <!-- Table Header -->
    <div v-if="title" class="border-b border-neutral-200/70 px-4 py-4 dark:border-neutral-700/60">
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ title }}</h3>
      <p v-if="description" class="text-sm text-neutral-600 dark:text-neutral-300">{{ description }}</p>e
    </div>

    <!-- Table Container -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <!-- Table Head -->
        <thead v-if="!hideHeader" class="border-b border-neutral-200/70 bg-surface-muted/60 dark:border-neutral-700/60 dark:bg-surface-dark/80">
          <tr>
            <th
              v-for="(column, index) in columns"
              :key="column.key || index"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-neutral-200/70 dark:divide-neutral-700/60">
          <tr
            v-for="(row, rowIndex) in data"
            :key="rowIndex"
            class="transition-colors duration-200 hover:bg-primary-500/5 dark:hover:bg-primary-500/10"
          >
            <td
              v-for="(column, colIndex) in columns"
              :key="column.key || colIndex"
              class="whitespace-nowrap px-4 py-4 text-sm text-neutral-700 dark:text-neutral-200"
            >
              <slot
                :name="'cell(' + column.key + ')'"
                :row="row"
                :column="column"
                :value="row[column.key]"
                :index="rowIndex"
              >
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="data.length === 0">
            <td :colspan="columns.length" class="py-10 text-left sm:py-12 sm:text-center lg:py-16">
              <div class="text-neutral-500 dark:text-neutral-400">
                <p class="text-base font-medium text-neutral-700 dark:text-neutral-200">{{ emptyText }}</p>
                <p class="text-sm">{{ emptyDescription }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// Types
export interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

// Props
interface Props {
  data: Record<string, any>[]
  columns: TableColumn[]
  title?: string
  description?: string
  hideHeader?: boolean
  emptyText?: string
  emptyDescription?: string
}

withDefaults(defineProps<Props>(), {
  hideHeader: false,
  emptyText: 'Aucune donnée',
  emptyDescription: 'Aucun élément à afficher pour le moment'
})
</script>
