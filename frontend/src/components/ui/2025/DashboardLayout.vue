<template>
  <BaseDashboardLayout v-bind="props">
    <template v-for="(_, slot) in $slots" #[slot]="slotProps">
      <slot :name="slot" v-bind="slotProps" />
    </template>
  </BaseDashboardLayout>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import BaseDashboardLayout from '../DashboardLayout.vue'

defineOptions({ inheritAttrs: false })

type NavigationEntry = {
  label: string
  href: string
  icon?: Component
  active?: boolean
  badge?: string
}

type MobileNavItem = {
  label: string
  href: string
  icon?: Component
  badge?: number
  activeRoutes?: string[]
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
  mobileNav?: MobileNavItem[]
  class?: string
}>()
</script>
