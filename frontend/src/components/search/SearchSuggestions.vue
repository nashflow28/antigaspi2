<template>
  <section
    class="rounded-3xl border border-primary-100/80 bg-white/80 p-4 shadow-lg shadow-primary-100/50 backdrop-blur-sm"
    aria-labelledby="search-suggestions-heading"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p
          id="search-suggestions-heading"
          class="text-sm font-semibold text-primary-900"
        >
          Suggestions de recherche
        </p>
        <p class="text-xs text-primary-500">
          Basées sur vos recherches récentes et les tendances de la communauté.
        </p>
      </div>
      <Button
        v-if="showRefresh"
        size="sm"
        variant="ghost"
        :loading="loading"
        class="text-primary-600 hover:text-primary-800"
        @click="refresh"
      >
        <template #default>
          <RefreshCcw class="mr-2 h-4 w-4" />
          Actualiser
        </template>
      </Button>
    </div>

    <p
      v-if="errorMessage"
      class="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
      role="status"
    >
      {{ errorMessage }}
    </p>

    <div class="mt-4 space-y-6">
      <div v-if="filteredHistory.length" class="space-y-3">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-500">
          <Clock class="h-4 w-4" />
          Historique récent
        </div>
        <ul class="space-y-2">
          <TransitionGroup name="fade" tag="div" class="space-y-2">
            <li
              v-for="entry in filteredHistory"
              :key="entry.id"
              class="group flex items-center justify-between gap-3 rounded-2xl border border-primary-100 bg-white/90 px-3 py-2 text-sm text-primary-900 shadow-sm transition hover:border-primary-300 hover:bg-primary-50"
            >
              <button
                type="button"
                class="flex flex-1 items-center gap-2 text-left"
                @click="emitSelect(entry.query)"
              >
                <Clock class="h-4 w-4 text-primary-500" />
                <span class="truncate">{{ entry.query }}</span>
              </button>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium uppercase text-primary-400">×{{ entry.search_count }}</span>
                <button
                  type="button"
                  class="rounded-lg p-1 text-primary-400 transition hover:bg-primary-100 hover:text-primary-700"
                  :aria-label="`Supprimer la recherche '${entry.query}'`"
                  :disabled="deletingId === entry.id"
                  @click="handleDelete(entry)"
                >
                  <Trash2
                    class="h-4 w-4"
                    :class="deletingId === entry.id ? 'animate-spin-slow' : ''"
                  />
                </button>
              </div>
            </li>
          </TransitionGroup>
        </ul>
      </div>

      <div v-if="filteredPopular.length" class="space-y-3">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-500">
          <Sparkles class="h-4 w-4" />
          Tendances populaires
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="popular in filteredPopular"
            :key="popular.query"
            type="button"
            class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
            @click="emitSelect(popular.query)"
          >
            {{ popular.query }}
          </button>
        </div>
      </div>

      <div v-if="!loading && !hasSuggestions" class="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-6 text-center text-sm text-primary-500">
        Aucune suggestion pour le moment. Lancez une première recherche pour personnaliser cet espace.
      </div>
    </div>

    <div v-if="suggestionList.length" class="mt-6 border-t border-primary-100 pt-4">
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-500">
        Suggestions rapides
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="suggestion in suggestionList"
          :key="suggestion"
          type="button"
          class="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-800"
          @click="emitSelect(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Clock, RefreshCcw, Sparkles, Trash2 } from 'lucide-vue-next'

import Button from '@/components/ui/Button.vue'
import {
  deleteHistoryEntry,
  getSuggestions,
  type SearchSuggestionHistoryEntry,
  type SearchSuggestionPopularEntry,
  type SearchSuggestionsData
} from '@/services/searchService'

const props = withDefaults(
  defineProps<{
    query?: string
    historyLimit?: number
    popularLimit?: number
    autoFetch?: boolean
    showRefresh?: boolean
  }>(),
  {
    query: '',
    historyLimit: 6,
    popularLimit: 6,
    autoFetch: true,
    showRefresh: true
  }
)

const emit = defineEmits<{
  (event: 'select', value: string): void
  (event: 'deleted', value: number): void
  (event: 'error', value: string): void
  (event: 'update:loading', value: boolean): void
}>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const suggestions = ref<SearchSuggestionsData | null>(null)
const deletingId = ref<number | null>(null)

const normalizedQuery = computed(() => props.query.trim().toLowerCase())
const hasSuggestions = computed(() => suggestionList.value.length > 0)
const showRefresh = computed(() => props.showRefresh)

const filterEntries = <T extends { query: string }>(entries: T[]): T[] => {
  if (!normalizedQuery.value) {
    return entries
  }

  return entries.filter((entry) => entry.query.toLowerCase().includes(normalizedQuery.value))
}

const filteredHistory = computed<SearchSuggestionHistoryEntry[]>(() => {
  if (!suggestions.value) {
    return []
  }

  return filterEntries(suggestions.value.history)
})

const filteredPopular = computed<SearchSuggestionPopularEntry[]>(() => {
  if (!suggestions.value) {
    return []
  }

  return filterEntries(suggestions.value.popular)
})

const suggestionList = computed<string[]>(() => {
  if (!suggestions.value) {
    return []
  }

  const unique = new Map<string, string>()
  const append = (value: string) => {
    const normalized = value.toLowerCase()
    if (!unique.has(normalized)) {
      unique.set(normalized, value)
    }
  }

  filteredHistory.value.forEach((entry) => append(entry.query))
  filteredPopular.value.forEach((entry) => append(entry.query))

  return Array.from(unique.values())
})

const rebuildSuggestionSnapshot = () => {
  if (!suggestions.value) {
    return
  }

  const unique = new Map<string, string>()
  suggestions.value.history.forEach((entry) => {
    unique.set(entry.query.toLowerCase(), entry.query)
  })
  suggestions.value.popular.forEach((entry) => {
    const key = entry.query.toLowerCase()
    if (!unique.has(key)) {
      unique.set(key, entry.query)
    }
  })

  suggestions.value.suggestions = Array.from(unique.values())
}

const setSuggestions = (data: SearchSuggestionsData) => {
  suggestions.value = {
    ...data,
    suggestions: [...data.suggestions]
  }

  rebuildSuggestionSnapshot()
}

const fetchSuggestions = async () => {
  if (!props.autoFetch) {
    return
  }

  loading.value = true
  emit('update:loading', true)
  errorMessage.value = null

  try {
    const response = await getSuggestions({
      query: props.query,
      historyLimit: props.historyLimit,
      popularLimit: props.popularLimit
    })

    if (response?.data) {
      setSuggestions(response.data)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de charger les suggestions.'
    errorMessage.value = message
    emit('error', message)
  } finally {
    loading.value = false
    emit('update:loading', false)
  }
}

const debouncedFetch = useDebounceFn(fetchSuggestions, 300)

onMounted(() => {
  if (props.autoFetch) {
    void fetchSuggestions()
  }
})

watch(
  () => [props.historyLimit, props.popularLimit],
  () => {
    if (props.autoFetch) {
      debouncedFetch()
    }
  }
)

const emitSelect = (query: string) => {
  emit('select', query)
}

const handleDelete = async (entry: SearchSuggestionHistoryEntry) => {
  if (!entry?.id || deletingId.value === entry.id) {
    return
  }

  deletingId.value = entry.id

  try {
    await deleteHistoryEntry(entry.id)

    if (suggestions.value) {
      suggestions.value.history = suggestions.value.history.filter((item) => item.id !== entry.id)
      rebuildSuggestionSnapshot()
    }

    emit('deleted', entry.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de supprimer cette recherche.'
    errorMessage.value = message
    emit('error', message)
  } finally {
    deletingId.value = null
  }
}

const refresh = () => {
  if (!loading.value) {
    void fetchSuggestions()
  }
}

watch(
  () => props.query,
  () => {
    if (!props.autoFetch) {
      return
    }

    if (!suggestions.value) {
      debouncedFetch()
      return
    }

    const hasMatches = suggestionList.value.length > 0
    if (!hasMatches) {
      debouncedFetch()
    }
  }
)

watch(
  () => props.autoFetch,
  (autoFetch) => {
    if (autoFetch && !suggestions.value) {
      debouncedFetch()
    }
  }
)

watch(
  () => [suggestions.value?.history.length, suggestions.value?.popular.length],
  rebuildSuggestionSnapshot
)

const exposed = {
  refresh
}

defineExpose(exposed)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.animate-spin-slow {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
