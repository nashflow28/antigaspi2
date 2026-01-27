<template>
  <nav
    v-if="isMobile"
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/70 bg-white/90 backdrop-blur-lg dark:border-neutral-700/70 dark:bg-neutral-900/90"
  >
    <div class="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
      <router-link
        v-for="item in items"
        :key="item.href"
        :to="item.href"
        :class="[
          'relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
          isActive(item)
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        ]"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <span class="relative">
          <component
            :is="item.icon"
            v-if="item.icon"
            :class="[
              'h-6 w-6 transition-transform',
              isActive(item) ? 'scale-110' : ''
            ]"
          />
          <span
            v-if="item.badge && item.badge > 0"
            class="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </span>
        <span :class="isActive(item) ? 'font-semibold' : ''">
          {{ item.label }}
        </span>
        <span
          v-if="isActive(item)"
          class="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary-500"
        />
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

interface NavItem {
  label: string
  href: string
  icon?: Component
  badge?: number
  activeRoutes?: string[]
}

const props = defineProps<{
  items: NavItem[]
  breakpoint?: 'sm' | 'md' | 'lg'
}>()

const route = useRoute()
const breakpoints = useBreakpoints(breakpointsTailwind)

const isMobile = computed(() => {
  const bp = props.breakpoint || 'lg'
  return breakpoints.smaller(bp).value
})

const isActive = (item: NavItem) => {
  if (item.activeRoutes?.length) {
    return item.activeRoutes.some(name => route.name === name)
  }
  return route.path === item.href || route.path.startsWith(item.href + '/')
}
</script>
