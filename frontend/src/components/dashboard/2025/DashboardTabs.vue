<template>
  <div
    class="dashboard-tabs-2025 rounded-3xl border border-neutral-200/70 bg-surface-light/80 p-3 shadow-card backdrop-blur-xl dark:border-neutral-700/60 dark:bg-surface-dark/70"
  >
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="tab in normalizedTabs"
          :key="tab.key"
          :class="tabButtonClasses(tab)"
          :aria-pressed="isActive(tab)"
          :disabled="tab.disabled"
          class="group inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors duration-200"
          type="button"
          @click="selectTab(tab)"
        >
          <component
            :is="tab.icon"
            v-if="tab.icon"
            class="h-5 w-5"
          />
          <span>{{ tab.label }}</span>
          <span
            v-if="typeof tab.count === 'number'"
            :class="countBadgeClasses(tab)"
            class="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
      <p
        v-if="activeDescription"
        class="text-sm text-neutral-500 dark:text-neutral-400"
      >
        {{ activeDescription }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface DashboardTab {
  key: string
  label: string
  description?: string
  count?: number
  icon?: any
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    tabs: DashboardTab[]
    modelValue?: string
  }>(),
  {
    tabs: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [tab: DashboardTab]
}>()

const internalActive = ref('')

const normalizedTabs = computed(() => props.tabs ?? [])

watch(
  normalizedTabs,
  (tabs) => {
    if (!tabs.length) {
      internalActive.value = ''
      return
    }

    const current = props.modelValue ?? internalActive.value
    const fallback = tabs[0]?.key ?? ''
    const hasCurrent = current && tabs.some(tab => tab.key === current)
    internalActive.value = hasCurrent ? current : fallback
    if (!props.modelValue && fallback) {
      emit('update:modelValue', fallback)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.modelValue,
  (value) => {
    if (value && value !== internalActive.value) {
      internalActive.value = value
    }
  }
)

const isActive = (tab: DashboardTab) => internalActive.value === tab.key

const activeDescription = computed(() => {
  const current = normalizedTabs.value.find(tab => tab.key === internalActive.value)
  return current?.description
})

const tabButtonClasses = (tab: DashboardTab) => {
  const base = [
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light dark:focus-visible:ring-offset-surface-dark',
    tab.disabled && 'opacity-50 cursor-not-allowed'
  ]

  if (isActive(tab)) {
    base.push(
      'border-primary-400/50 bg-primary-500/10 text-primary-700 shadow-card dark:border-primary-500/40 dark:bg-primary-500/20 dark:text-primary-200'
    )
  } else {
    base.push(
      'border-transparent bg-surface-light/60 text-neutral-600 hover:border-primary-300/40 hover:bg-primary-500/5 hover:text-primary-600 dark:bg-surface-dark/60 dark:text-neutral-300 dark:hover:bg-primary-500/10 dark:hover:text-primary-200'
    )
  }

  return base.filter(Boolean).join(' ')
}

const countBadgeClasses = (tab: DashboardTab) => {
  if (isActive(tab)) {
    return 'bg-primary-500/20 text-primary-700 dark:text-primary-200'
  }
  return 'bg-neutral-200/80 text-neutral-600 dark:bg-neutral-700/70 dark:text-neutral-200'
}

const selectTab = (tab: DashboardTab) => {
  if (tab.disabled) {
    return
  }

  internalActive.value = tab.key
  emit('update:modelValue', tab.key)
  emit('change', tab)
}
</script>
