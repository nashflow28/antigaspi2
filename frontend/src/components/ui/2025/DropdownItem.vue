<template>
  <component
    :is="componentTag"
    :href="item.href"
    :to="item.to"
    :class="itemClasses"
    :disabled="item.disabled"
    role="menuitem"
    :tabindex="item.disabled ? -1 : 0"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Separator -->
    <div v-if="item.separator" class="my-1 border-t border-neutral-200" />

    <!-- Regular Item -->
    <template v-else>
      <!-- Icon -->
      <component
        :is="item.icon"
        v-if="item.icon"
        :size="16"
        :class="iconClasses"
      />

      <!-- Label -->
      <span :class="labelClasses">{{ item.label }}</span>

      <!-- Badge or additional content -->
      <slot name="extra" :item="item" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownItem } from './Dropdown.vue'

// Props
interface Props {
  item: DropdownItem
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  click: [item: DropdownItem]
}>()

// Computed
const componentTag = computed(() => {
  if (props.item.separator) return 'div'
  if (props.item.href) return 'a'
  if (props.item.to) return 'router-link'
  return 'button'
})

const itemClasses = computed(() => {
  if (props.item.separator) {
    return 'block'
  }

  return [
    'flex items-center w-full px-4 py-2 text-sm text-left',
    'transition-colors duration-150',
    'focus:outline-none focus:bg-neutral-100',

    // States
    props.item.disabled ? [
      'text-neutral-400 cursor-not-allowed'
    ] : [
      'text-neutral-700 hover:bg-neutral-100',
      props.item.danger ? 'hover:bg-red-50 hover:text-red-600' : ''
    ],

    // Danger variant
    props.item.danger && 'text-red-600'
  ].flat().filter(Boolean).join(' ')
})

const iconClasses = computed(() => [
  'mr-3 flex-shrink-0',
  props.item.disabled ? 'text-neutral-400' : 'text-neutral-500',
  props.item.danger && !props.item.disabled && 'text-red-500'
].filter(Boolean).join(' '))

const labelClasses = computed(() => [
  'flex-1'
].join(' '))

// Methods
const handleClick = () => {
  if (!props.item.disabled && !props.item.separator) {
    emit('click', props.item)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>
