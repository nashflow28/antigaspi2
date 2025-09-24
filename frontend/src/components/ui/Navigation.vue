<template>
  <Motion
    tag="nav"
    role="navigation"
    :aria-label="ariaLabel"
    :initial="{ y: -40, opacity: 0 }"
    :enter="{ y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }"
    :class="navClasses"
  >
    <div class="pointer-events-none absolute inset-0 bg-neutral-950/10" aria-hidden="true" />
    <div class="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
      <a
        :href="brandHref"
        class="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-50/80"
      >
        <slot name="brand" :brand="brand">
          <span
            v-if="brand.logo"
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white"
          >
            <component :is="brand.logo" />
          </span>
          <span class="text-h3 font-semibold tracking-tight drop-shadow-sm">{{ brand.name }}</span>
        </slot>
      </a>

      <div class="hidden items-center gap-1 lg:flex" role="menubar">
        <template v-for="item in items" :key="item.label">
          <Motion
            tag="a"
            :href="item.href"
            role="menuitem"
            :initial="{ opacity: 0, y: -12 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 0.25 } }"
            :hovered="{ scale: 1.05 }"
            :tapped="{ scale: 0.96 }"
            :class="navigationItemClasses(item)"
            :aria-current="item.active ? 'page' : undefined"
            @click.prevent="emit('item-click', item)"
          >
            <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
            <Transition name="indicator">
              <span
                v-if="item.active"
                class="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-white/80"
              />
            </Transition>
          </Motion>
        </template>
      </div>

      <div class="hidden items-center gap-3 lg:flex">
        <ThemeToggle v-if="showThemeToggle" />
        <slot name="actions">
          <component v-if="actions" :is="actions" />
        </slot>
      </div>

      <div class="flex items-center gap-2 lg:hidden">
        <ThemeToggle v-if="showThemeToggle" />
        <Button
          variant="ghost"
          size="icon"
          :aria-expanded="isOpen"
          :aria-controls="menuId"
          aria-label="Ouvrir la navigation"
          aria-haspopup="true"
          data-testid="mobile-menu-button"
          type="button"
          @click="toggleMenu"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="isOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </div>
    </div>

    <Motion
      v-if="isOpen"
      :id="menuId"
      tag="div"
      role="menu"
      class="relative z-10 border-t border-white/10 bg-neutral-900 text-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-900 lg:hidden"
      :initial="{ opacity: 0, y: -12 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeInOut' } }"
      :leave="{ opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeInOut' } }"
      data-testid="mobile-menu"
    >
      <div class="space-y-2 px-4 py-4">
        <template v-for="item in items" :key="`mobile-${item.label}`">
          <Motion
            tag="a"
            :href="item.href"
            role="menuitem"
            :tapped="{ scale: 0.97 }"
            :class="mobileItemClasses(item)"
            :aria-current="item.active ? 'page' : undefined"
            @click.prevent="handleMobileItemClick(item)"
          >
            <component v-if="item.icon" :is="item.icon" class="h-5 w-5" />
            <span>{{ item.label }}</span>
          </Motion>
        </template>

        <div v-if="hasMobileActions" class="space-y-3 border-t border-white/10 pt-3">
          <slot name="mobile-actions">
            <slot name="actions" />
            <component v-if="!slots['mobile-actions'] && actions" :is="actions" />
          </slot>
        </div>
      </div>
    </Motion>
  </Motion>
</template>

<script setup lang="ts">
import { computed, ref, useId, useSlots } from 'vue'
import type { Component } from 'vue'
import { MotionComponent as Motion } from '@vueuse/motion'
import { useWindowScroll } from '@vueuse/core'
import Button from './Button.vue'
import ThemeToggle from './ThemeToggle.vue'

interface NavigationItem {
  label: string
  href: string
  icon?: Component
  active?: boolean
}

interface BrandDefinition {
  name: string
  href?: string
  logo?: Component
}

const props = withDefaults(
  defineProps<{
    brand?: BrandDefinition
    items?: NavigationItem[]
    actions?: Component | null
    showThemeToggle?: boolean
    ariaLabel?: string
    class?: string
  }>(),
  {
    brand: () => ({ name: 'Antigaspi', href: '#' }),
    items: () => [],
    actions: null,
    showThemeToggle: true,
    ariaLabel: 'Navigation principale',
    class: '',
  },
)

const emit = defineEmits<{
  (event: 'toggle', value: boolean): void
  (event: 'item-click', item: NavigationItem): void
}>()

const isOpen = ref(false)
const { y } = useWindowScroll()

const scrolled = computed(() => y.value > 12)

const navClasses = computed(() => {
  const classes = [
    'fixed inset-x-0 top-0 z-40 border-b border-primary-500/15 backdrop-blur-xl transition-all duration-300 ease-out',
    'relative overflow-hidden bg-nav-gradient text-white dark:bg-neutral-950',
    scrolled.value ? 'shadow-glow' : '',
    props.class,
  ]

  return classes.filter(Boolean).join(' ')
})

const navigationItemClasses = (item: NavigationItem) =>
  [
    'relative flex items-center gap-2 rounded-full px-4 py-2 text-small font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    item.active ? 'bg-white/15 text-white shadow-card' : 'text-white/80 hover:text-white hover:bg-white/10',
  ]
    .filter(Boolean)
    .join(' ')

const mobileItemClasses = (item: NavigationItem) =>
  [
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-body font-medium transition-colors',
    item.active ? 'bg-primary-500/20 text-primary-50' : 'text-neutral-100 hover:bg-primary-500/15',
  ]
    .filter(Boolean)
    .join(' ')

const brand = computed(() => props.brand)
const brandHref = computed(() => brand.value?.href ?? '#')

const slots = useSlots()
const menuId = useId()
const ariaLabel = computed(() => props.ariaLabel)

const hasMobileActions = computed(
  () => !!(slots['mobile-actions'] || slots.actions || props.actions),
)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}

const handleMobileItemClick = (item: NavigationItem) => {
  isOpen.value = false
  emit('item-click', item)
  emit('toggle', false)
}

const actions = computed(() => props.actions)
const items = computed(() => props.items)
const showThemeToggle = computed(() => props.showThemeToggle)
</script>

<style scoped>
.indicator-enter-active,
.indicator-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.indicator-enter-from,
.indicator-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
