<template>
  <div :class="wrapperClasses">
    <!-- Icon or Image -->
    <div v-if="!hideIcon" :class="iconWrapperClasses">
      <slot name="icon">
        <component
          :is="icon"
          v-if="icon"
          :size="iconSize"
          :class="iconClasses"
        />
        <img
          v-else-if="image"
          :src="image"
          :alt="imageAlt"
          :class="imageClasses"
        >
        <div v-else :class="defaultIconClasses">
          <svg
            class="w-full h-full text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9.7 9.3a2 2 0 01-2.8 0L4 5"
            />
          </svg>
        </div>
      </slot>
    </div>

    <!-- Content -->
    <div :class="contentClasses">
      <!-- Title -->
      <h3 v-if="title" :class="titleClasses">
        <slot name="title">{{ title }}</slot>
      </h3>

      <!-- Description -->
      <p v-if="description" :class="descriptionClasses">
        <slot name="description">{{ description }}</slot>
      </p>

      <!-- Actions -->
      <div v-if="$slots.actions || primaryAction || secondaryAction" :class="actionsClasses">
        <slot name="actions">
          <Button
            v-if="primaryAction"
            :variant="(primaryAction.variant as ButtonVariant) || 'primary'"
            :size="(primaryAction.size as ButtonSize) || 'md'"
            :loading="primaryAction.loading"
            @click="primaryAction.onClick"
          >
            <component
              :is="primaryAction.icon"
              v-if="primaryAction.icon"
              :size="16"
              class="mr-2"
            />
            {{ primaryAction.text }}
          </Button>

          <Button
            v-if="secondaryAction"
            :variant="(secondaryAction.variant as ButtonVariant) || 'outline'"
            :size="(secondaryAction.size as ButtonSize) || 'md'"
            :loading="secondaryAction.loading"
            @click="secondaryAction.onClick"
          >
            <component
              :is="secondaryAction.icon"
              v-if="secondaryAction.icon"
              :size="16"
              class="mr-2"
            />
            {{ secondaryAction.text }}
          </Button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button, { type ButtonVariant, type ButtonSize } from './Button.vue'

// Types
export interface EmptyStateAction {
  text: string
  variant?: string
  size?: string
  icon?: any
  loading?: boolean
  onClick: () => void
}

export type EmptyStateSize = 'sm' | 'md' | 'lg'
export type EmptyStateVariant = 'default' | 'minimal' | 'illustration'

// Props
interface Props {
  title?: string
  description?: string
  icon?: any
  image?: string
  imageAlt?: string
  size?: EmptyStateSize
  variant?: EmptyStateVariant
  hideIcon?: boolean
  centered?: boolean
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  hideIcon: false,
  centered: true,
  imageAlt: 'Empty state illustration'
})

// Computed
const wrapperClasses = computed(() => [
  'empty-state-2025',
  'flex flex-col',
  props.centered ? 'items-center text-center' : 'items-start text-left',
  sizeClasses.value.wrapper
].filter(Boolean).join(' '))

const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      wrapper: 'py-8 px-4 space-y-3',
      icon: 48,
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      wrapper: 'py-12 px-6 space-y-4',
      icon: 64,
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      wrapper: 'py-16 px-8 space-y-6',
      icon: 80,
      title: 'text-xl',
      description: 'text-lg'
    }
  }
  return sizes[props.size]
})

const iconSize = computed(() => sizeClasses.value.icon)

const iconWrapperClasses = computed(() => [
  'flex-shrink-0',
  props.variant === 'illustration' && 'mb-2'
].filter(Boolean).join(' '))

const iconClasses = computed(() => [
  'text-placeholder',
  props.variant === 'minimal' && 'text-neutral-300'
].filter(Boolean).join(' '))

const imageClasses = computed(() => [
  'max-w-full h-auto max-h-20'
].join(' '))

const defaultIconClasses = computed(() => [
  'flex items-center justify-center',
  'rounded-full bg-neutral-100',
  'w-16 h-16'
].join(' '))

const contentClasses = computed(() => [
  'flex-1 max-w-md',
  props.centered ? 'text-center' : 'text-left'
].join(' '))

const titleClasses = computed(() => [
  'font-semibold text-heading',
  sizeClasses.value.title
].join(' '))

const descriptionClasses = computed(() => [
  'text-body leading-relaxed',
  sizeClasses.value.description
].join(' '))

const actionsClasses = computed(() => [
  'flex gap-3',
  props.centered ? 'justify-center' : 'justify-start',
  props.size === 'sm' ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'
].join(' '))
</script>

<style scoped>
.empty-state-2025 {
  /* Custom empty state styles for 2025 design system */
}
</style>
