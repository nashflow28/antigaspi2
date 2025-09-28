<template>
  <div ref="dropdownRef" class="dropdown-2025 relative inline-block">
    <!-- Trigger -->
    <div @click="toggle" @keydown="handleTriggerKeydown">
      <slot name="trigger" :is-open="isOpen" :toggle="toggle">
        <Button
          :variant="triggerVariant"
          :size="triggerSize"
          :class="triggerClasses"
        >
          {{ triggerText }}
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isOpen && 'rotate-180']"
          />
        </Button>
      </slot>
    </div>

    <!-- Dropdown Menu -->
    <Transition
      name="dropdown"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="isOpen"
        :class="menuClasses"
        :style="menuStyle"
        role="menu"
        :aria-orientation="'vertical'"
        @keydown="handleMenuKeydown"
      >
        <!-- Menu Items -->
        <div :class="itemsClasses">
          <slot :close="close" :is-open="isOpen">
            <!-- Default menu items -->
            <DropdownItem
              v-for="(item, index) in items"
              :key="item.key || index"
              :item="item"
              @click="handleItemClick(item)"
            />
          </slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import Button, { type ButtonVariant, type ButtonSize } from './Button.vue'

// Types
export interface DropdownItem {
  key?: string
  label: string
  value?: any
  icon?: any
  disabled?: boolean
  separator?: boolean
  danger?: boolean
  href?: string
  to?: string | object
  onClick?: () => void
}

export type DropdownPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'left-start'
  | 'right-start'

export type DropdownSize = 'sm' | 'md' | 'lg'
export type DropdownVariant = 'default' | 'minimal'

// Props
interface Props {
  items?: DropdownItem[]
  placement?: DropdownPlacement
  size?: DropdownSize
  variant?: DropdownVariant
  triggerText?: string
  triggerVariant?: string
  triggerSize?: string
  closeOnClick?: boolean
  disabled?: boolean
  offset?: number
  minWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  placement: 'bottom-start',
  size: 'md',
  variant: 'default',
  triggerText: 'Options',
  triggerVariant: 'outline',
  triggerSize: 'md',
  closeOnClick: true,
  disabled: false,
  offset: 8,
  minWidth: 200
})

// Emits
const emit = defineEmits<{
  'item-click': [item: DropdownItem]
  'open': []
  'close': []
}>()

// Refs
const dropdownRef = ref<HTMLElement>()
const isOpen = ref(false)

// Computed
const triggerClasses = computed(() => [
  props.disabled && 'cursor-not-allowed opacity-50'
].filter(Boolean).join(' '))

const menuClasses = computed(() => [
  'absolute z-50',
  'bg-white rounded shadow-lg',
  'border border-neutral-200',
  'py-xs',
  placementClasses.value,
  variantClasses.value
].filter(Boolean).join(' '))

const placementClasses = computed(() => {
  const placements = {
    'bottom-start': 'top-full left-0',
    'bottom-end': 'top-full right-0',
    'top-start': 'bottom-full left-0',
    'top-end': 'bottom-full right-0',
    'left-start': 'top-0 right-full',
    'right-start': 'top-0 left-full'
  }
  return placements[props.placement]
})

const variantClasses = computed(() => {
  const variants = {
    default: 'backdrop-blur-sm',
    minimal: 'shadow-sm border-neutral-100'
  }
  return variants[props.variant]
})

const itemsClasses = computed(() => [
  'max-h-9xl overflow-y-auto'
].join(' '))

const menuStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.minWidth) {
    style.minWidth = `${props.minWidth}px`
  }

  // Offset from trigger
  if (props.placement.startsWith('bottom')) {
    style.marginTop = `${props.offset}px`
  } else if (props.placement.startsWith('top')) {
    style.marginBottom = `${props.offset}px`
  } else if (props.placement.startsWith('left')) {
    style.marginRight = `${props.offset}px`
  } else if (props.placement.startsWith('right')) {
    style.marginLeft = `${props.offset}px`
  }

  return style
})

// Methods
const toggle = () => {
  if (props.disabled) return

  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

const open = () => {
  isOpen.value = true
  emit('open')
  nextTick(() => {
    focusFirstItem()
  })
}

const close = () => {
  isOpen.value = false
  emit('close')
}

const handleItemClick = (item: DropdownItem) => {
  if (item.disabled) return

  emit('item-click', item)

  if (item.onClick) {
    item.onClick()
  }

  if (props.closeOnClick) {
    close()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    open()
  }
}

const handleMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    navigateItems(event.key === 'ArrowDown' ? 1 : -1)
  }
}

const focusFirstItem = () => {
  const firstItem = dropdownRef.value?.querySelector('[role="menuitem"]:not([disabled])') as HTMLElement
  firstItem?.focus()
}

const navigateItems = (direction: number) => {
  const items = Array.from(dropdownRef.value?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])
  const currentIndex = items.indexOf(document.activeElement as Element)
  let nextIndex = currentIndex + direction

  if (nextIndex < 0) nextIndex = items.length - 1
  if (nextIndex >= items.length) nextIndex = 0

  ;(items[nextIndex] as HTMLElement)?.focus()
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

// Watchers
watch(isOpen, (open) => {
  if (open) {
    document.body.style.pointerEvents = 'auto'
  }
})

// Transition hooks
const onEnter = () => {
  // Animation enter
}

const onLeave = () => {
  // Animation leave
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
