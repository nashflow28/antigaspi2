<template>
  <div :class="wrapperClasses">
    <Motion
      v-if="sidebarOpen && isMobile"
      tag="div"
      class="fixed inset-0 z-40 bg-neutral-950/45 backdrop-blur-sm lg:hidden"
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
        <div class="flex items-center gap-3 border-b border-neutral-200/70 px-6 py-6 dark:border-neutral-800/80">
          <slot name="sidebar-brand" :brand="sidebar.brand">
            <div
              v-if="sidebar.brand.logo"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-700 dark:text-primary-200"
            >
              <component :is="sidebar.brand.logo" />
            </div>
            <h1 class="text-h3 font-semibold text-primary-800 dark:text-primary-200">{{ sidebar.brand.name }}</h1>
          </slot>
        </div>

        <nav class="flex-1 space-y-2 px-4 py-6">
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
                <span class="flex h-5 w-5 items-center justify-center text-current">
                  <component :is="item.icon" v-if="item.icon" />
                </span>
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="rounded-full bg-primary-500/20 px-4 py-3 text-caption font-semibold text-primary-700 dark:text-primary-100"
                >
                  {{ item.badge }}
                </span>
              </slot>
            </Motion>
          </template>
        </nav>

        <div v-if="hasSidebarFooter" class="border-t border-neutral-200/70 p-4 dark:border-neutral-800">
          <slot name="sidebar-footer">
            <component :is="sidebar.footer" v-if="sidebar.footer" />
          </slot>
        </div>
      </div>
    </Motion>

    <div class="lg:ml-72">
      <Motion
        tag="header"
        class="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/80 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/80"
        :initial="{ y: -20, opacity: 0 }"
        :enter="{ y: 0, opacity: 1, transition: { duration: 0.4 } }"
      >
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between gap-4">
            <button
              type="button"
              class="rounded-2xl p-2 text-primary-700 transition-colors hover:bg-primary-200/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
              aria-label="Ouvrir le menu"
              @click="openSidebar"
            >
              <svg
                class="h-10 w-10"
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

            <div class="flex flex-1 items-center justify-end gap-3">
              <slot name="header-notifications">
                <component :is="header.notifications" v-if="header.notifications" class="hidden sm:block" />
              </slot>
              <slot name="header-actions">
                <component :is="header.actions" v-if="header.actions" class="hidden items-center gap-2 sm:flex" />
              </slot>
              <slot name="header-user" :user="header.user">
                <div class="flex items-center gap-3 rounded-2xl bg-primary-500/10 px-4 py-3 text-left text-primary-800 transition-colors hover:bg-primary-500/15 dark:bg-primary-500/10 dark:text-primary-100">
                  <img
                    v-if="header.user.avatar"
                    :src="header.user.avatar"
                    :alt="header.user.name"
                    class="h-9 w-9 rounded-full object-cover"
                  >
                  <span v-else class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white">
                    {{ header.user.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="hidden sm:block">
                    <p class="text-small font-semibold">{{ header.user.name }}</p>
                    <p class="text-caption text-primary-700/80 dark:text-primary-100/70">{{ header.user.email }}</p>
                  </div>
                </div>
              </slot>
            </div>
          </div>
        </div>
      </Motion>

      <Motion
        tag="main"
        class="flex-1 px-4 py-6 sm:px-6 lg:px-8"
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }"
      >
        <slot />
      </Motion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import type { Component } from 'vue'
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
    'min-h-screen bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-50',
    props.class ?? ''
  ]
    .filter(Boolean)
    .join(' ')
)

const asideClasses = computed(() =>
  [
    'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-primary-500/10 bg-white/95 shadow-card dark:border-neutral-800 dark:bg-neutral-900/95',
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
    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-small font-medium transition-all duration-200',
    item.active
      ? 'bg-primary-500/10 text-primary-700 shadow-inner dark:text-primary-100'
      : 'text-neutral-500 hover:bg-primary-200/20 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-100'
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
