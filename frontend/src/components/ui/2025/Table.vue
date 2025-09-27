<template>
  <div class="table-wrapper-2025 bg-white rounded-lg shadow-sm border border-neutral-200">
    <!-- Table Header -->
    <div v-if="title" class="px-6 py-4 border-b border-neutral-200">
      <h3 class="text-lg font-semibold text-neutral-900">{{ title }}</h3>
      <p v-if="description" class="text-sm text-neutral-600">{{ description }}</p>
    </div>

    <!-- Table Container -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <!-- Table Head -->
        <thead v-if="!hideHeader" class="bg-neutral-50/50 border-b border-neutral-200">
          <tr>
            <th
              v-for="(column, index) in columns"
              :key="column.key || index"
              class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-neutral-200">
          <tr
            v-for="(row, rowIndex) in data"
            :key="rowIndex"
            class="hover:bg-neutral-50"
          >
            <td
              v-for="(column, colIndex) in columns"
              :key="column.key || colIndex"
              class="px-6 py-4 whitespace-nowrap"
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
            <td :colspan="columns.length" class="text-center py-12">
              <div class="text-neutral-500">
                <p class="text-base font-medium">{{ emptyText }}</p>
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
