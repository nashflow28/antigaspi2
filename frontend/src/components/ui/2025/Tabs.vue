<template>
  <div class="tabs-2025">
    <!-- Tab List -->
    <div class="flex border-b border-neutral-200" role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key || index"
        :class="getTabClasses(tab, index)"
        :aria-selected="activeTab === (tab.key || index)"
        role="tab"
        @click="selectTab(tab.key || index)"
      >
        <component
          :is="tab.icon"
          v-if="tab.icon"
          :size="16"
          class="mr-2"
        />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="mt-4">
      <div
        v-for="(tab, index) in tabs"
        v-show="activeTab === (tab.key || index)"
        :key="tab.key || index"
        role="tabpanel"
      >
        <slot
          :name="'panel-' + (tab.key || index)"
          :tab="tab"
          :index="index"
        >
          <div v-html="tab.content" />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Types
export interface Tab {
  key?: string | number
  label: string
  content?: string
  icon?: any
  disabled?: boolean
}

// Props
interface Props {
  tabs: Tab[]
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'tab-change': [tab: Tab, index: number]
}>()

// State
const activeTab = ref(props.modelValue || props.tabs[0]?.key || 0)

// Methods
const getTabClasses = (tab: Tab, index: number) => {
  const isActive = activeTab.value === (tab.key || index)

  return [
    'flex items-center px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
    isActive
      ? 'border-primary-600 text-primary'
      : 'border-transparent text-body hover:text-heading hover:border-neutral-300',
    tab.disabled && 'cursor-not-allowed opacity-50'
  ].filter(Boolean).join(' ')
}

const selectTab = (key: string | number) => {
  const tab = props.tabs.find(t => (t.key || props.tabs.indexOf(t)) === key)
  if (tab?.disabled) return

  activeTab.value = key
  emit('update:modelValue', key)

  const index = props.tabs.findIndex(t => (t.key || props.tabs.indexOf(t)) === key)
  emit('tab-change', tab!, index)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    activeTab.value = newValue
  }
})
</script>
