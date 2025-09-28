<template>
  <Card :variant="variant" class="h-full">
    <template v-if="hasHeader" #header>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <h3 v-if="title" class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ description }}
          </p>
        </div>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <slot name="header-actions" />
        </div>
      </div>
      <div v-if="$slots.filters" class="mt-4">
        <slot name="filters" />
      </div>
    </template>

    <div
      class="overflow-hidden rounded-2xl border border-neutral-200/60 bg-surface-light/70 shadow-card dark:border-neutral-700/50 dark:bg-surface-dark/60"
    >
      <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead v-if="!hideHeader" class="bg-surface-muted/60 dark:bg-surface-dark/80">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="['px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400', alignClass(column.align)]"
              :style="column.width ? { width: column.width } : undefined"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200/60 dark:divide-neutral-700/40">
          <tr v-if="loading" class="h-24">
            <td :colspan="columns.length" class="p-6">
              <Loading
                size="sm"
                variant="primary"
                :text="loadingText"
                centered
              />
            </td>
          </tr>

          <tr
            v-for="(row, rowIndex) in rows"
            :key="rowKey(row, rowIndex)"
            class="transition-colors duration-200 hover:bg-primary-500/5 dark:hover:bg-primary-500/10"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['px-4 py-4 text-sm text-neutral-700 dark:text-neutral-200', alignClass(column.align)]"
            >
              <slot
                v-if="hasCellSlot(column.key)"
                :name="cellSlotName(column.key)"
                :row="row"
                :column="column"
                :value="row[column.key]"
                :index="rowIndex"
              />
              <template v-else>
                {{ row[column.key] }}
              </template>
            </td>
          </tr>

          <tr v-if="!loading && rows.length === 0">
            <td :colspan="columns.length" class="py-12 text-center">
              <div class="space-y-2">
                <p class="text-base font-semibold text-neutral-700 dark:text-neutral-200">
                  {{ emptyTitle }}
                </p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ emptyDescription }}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="$slots.footer" class="mt-4">
      <slot name="footer" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Card } from '@/components/ui/2025'
import Loading from '@/components/ui/2025/Loading.vue'

export type DataTableColumnAlign = 'left' | 'center' | 'right'

export interface DataTableColumn {
  key: string
  title: string
  align?: DataTableColumnAlign
  width?: string | number
}

const slots = useSlots()

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    columns: DataTableColumn[]
    rows: Record<string, any>[]
    hideHeader?: boolean
    emptyTitle?: string
    emptyDescription?: string
    loading?: boolean
    loadingText?: string
    variant?: 'default' | 'glass' | 'gradient' | 'bordered' | 'elevated'
  }>(),
  {
    rows: () => [],
    emptyTitle: 'Aucun élément',
    emptyDescription: 'Ajoutez un premier élément pour démarrer',
    hideHeader: false,
    loading: false,
    loadingText: 'Chargement en cours...',
    variant: 'glass'
  }
)

const hasHeader = computed(
  () => Boolean(props.title || props.description || slots['header-actions'] || slots.filters)
)

const hasCellSlot = (key: string) => Boolean(slots[cellSlotName(key)])
const cellSlotName = (key: string) => `cell-${key}`
const rowKey = (row: Record<string, any>, index: number) => row.id ?? `${props.title ?? 'row'}-${index}`

const alignClass = (align: DataTableColumnAlign | undefined) => {
  const map: Record<DataTableColumnAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }
  return align ? map[align] : map.left
}
</script>
