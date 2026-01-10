<template>
  <div :class="wrapperClasses">
    <Motion
      v-if="sidebarOpen && isMobile"
      tag="div"
      class="fixed inset-0 z-40 bg-gray-50-dark/45 backdrop-blur-sm lg:hidden sm:block"
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 0.2 } }"
      :leave="{ opacity: 0, transition: { duration: 0.2 } }"
      @click="closeSidebar"
    />

    <Motion
      tag="aside"
      :initial="initialSidebarState"
      :animate="sidebarMotion"
      :transition="{ duration: 0.3, ease: 'easeInOut' }"
      :class="asideClasses"
    >
      <div class="flex h-full flex-col">
        <div class="flex items-center gap-3 border-b border-gray-200/70 px-4 py-6 dark:border-gray-800/80">
          <slot name="sidebar-brand" :brand="sidebar.brand">
            <div
              v-if="sidebar.brand.logo"
              class="flex h-8 w-8 items-center justify-center rounded bg-blue-500/15 text-blue-900 dark:text-blue-200"
            >
              <component :is="sidebar.brand.logo" />
            </div>
            <h1 class="text-lg font-semibold text-blue-800 dark:text-blue-200">{{ sidebar.brand.name }}</h1>
          </slot>
        </div>

        <nav class="flex-1 space-y-4 px-3 py-6">
          <template v-for="(item, index) in sidebar.navigation" :key="item.label">
            <Motion
              tag="a"
              :href="item.href"
              :initial="{ opacity: 0, x: -24 }"
              :enter="{ opacity: 1, x: 0, transition: { duration: 0.3, delay: index * 0.05 } }"
              :hovered="{ x: 4 }"
              :class="navigationItemClasses(item)"
            >
              <slot name="sidebar-item" :item="item" :index="index">
                <span class="flex h-4 w-4 items-center justify-center text-current">
                  <component :is="item.icon" v-if="item.icon" />
                </span>
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="rounded-full bg-blue-500/20 px-3 py-3 text-xs font-semibold text-blue-900 dark:text-blue-100"
                >
                  {{ item.badge }}
                </span>
              </slot>
            </Motion>
          </template>
        </nav>

        <div v-if="hasSidebarFooter" class="border-t border-gray-200/70 p-4 dark:border-gray-800">
          <slot name="sidebar-footer">
            <component :is="sidebar.footer" v-if="sidebar.footer" />
          </slot>
        </div>
      </div>
    </Motion>

    <div class="lg:ml-72">
      <Motion
        tag="header"
        class="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80"
        :initial="{ y: -20, opacity: 0 }"
        :enter="{ y: 0, opacity: 1, transition: { duration: 0.4 } }"
      >
        <div class="px-3 sm:px-4 lg:px-6">
          <div class="flex h-10 items-center justify-start sm:justify-between gap-3">
            <button
              type="button"
              class="rounded p-2 text-blue-900 transition-colors hover:bg-blue-200/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden sm:block"
              aria-label="Ouvrir le menu"
              @click="openSidebar"
            >
              <svg
                class="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div class="flex flex-1 items-center justify-center sm:justify-end gap-3">
              <slot name="header-notifications">
                <component :is="header.notifications" v-if="header.notifications" class="hidden sm:block sm:block" />
              </slot>
              <slot name="header-actions">
                <component :is="header.actions" v-if="header.actions" class="hidden sm:block items-center gap-2 sm:flex" />
              </slot>
              <slot name="header-user" :user="header.user">
                <div class="flex items-center gap-3 rounded bg-blue-500/10 px-3 py-3 text-left text-blue-800 transition-colors hover:bg-blue-500/15 dark:bg-blue-500/10 dark:text-blue-100">
                  <img
                    v-if="header.user.avatar"
                    :src="header.user.avatar"
                    :alt="header.user.name"
                    class="h-10 w-9 rounded-full object-cover"
                  >
                  <span v-else class="flex h-10 w-9 items-center justify-center rounded-full bg-blue-500 text-white">
                    {{ header.user.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="hidden sm:block sm:block">
                    <p class="text-sm font-semibold">{{ header.user.name }}</p>
                    <p class="text-xs text-blue-900/80 dark:text-blue-100/70">{{ header.user.email }}</p>
                  </div>
                </div>
              </slot>
            </div>
          </div>
        </div>
      </Motion>

      <Motion
        tag="main"
        class="flex-1 px-3 py-6 sm:px-4 lg:px-6"
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }"
      >
        <slot />
      </Motion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch, type Component } from 'vue'
import { MotionComponent as Motion } from '@vueuse/motion'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

type NavigationEntry = {
  label: string
  href: string
  icon?: Component
  active?: boolean
  badge?: string
}

type SidebarDefinition = {
  brand: {
    name: string
    logo?: Component
  }
  navigation: NavigationEntry[]
  footer?: Component | null
}

type HeaderDefinition = {
  user: {
    name: string
    email: string
    avatar?: string
  }
  notifications?: Component | null
  actions?: Component | null
}

const props = defineProps<{
  sidebar: SidebarDefinition
  header: HeaderDefinition
  class?: string
}>()

const sidebarOpen = ref(false)

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')

watch(
  isMobile,
  (mobile) => {
    if (!mobile) {
      sidebarOpen.value = false
    }
  },
  { immediate: true }
)

const wrapperClasses = computed(() =>
  [
    'min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-50',
    props.class ?? ''
  ]
    .filter(Boolean)
    .join(' ')
)

const asideClasses = computed(() =>
  [
    'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-blue-500/10 bg-white/95 shadow-lg dark:border-gray-800 dark:bg-gray-900/95',
    'transition-transform duration-300 ease-in-out lg:translate-x-0'
  ].join(' ')
)

const sidebarMotion = computed(() => {
  if (isMobile.value) {
    return { x: sidebarOpen.value ? 0 : -288 }
  }

  return { x: 0 }
})

const initialSidebarState = computed(() => (isMobile.value ? { x: -288 } : { x: 0 }))

const navigationItemClasses = (item: NavigationEntry) =>
  [
    'group flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition-all duration-200',
    item.active
      ? 'bg-blue-500/10 text-blue-900 shadow-inner dark:text-blue-100'
      : 'text-gray-500 hover:bg-blue-200/20 hover:text-blue-900 dark:text-gray-500 dark:hover:text-blue-100'
  ]
    .filter(Boolean)
    .join(' ')

const openSidebar = () => {
  sidebarOpen.value = true
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const slots = useSlots()

const hasSidebarFooter = computed(
  () => !!(slots['sidebar-footer'] || props.sidebar.footer)
)
</script>
