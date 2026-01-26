<template>
  <div
    class="flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm shadow-sm"
    :class="variantClasses"
    role="alert"
    aria-live="polite"
  >
    <div v-if="$slots.icon" class="mt-0.5 text-current">
      <slot name="icon" />
    </div>

    <div class="flex-1 space-y-1">
      <p v-if="hasTitle" class="text-sm font-semibold">
        <slot name="title">{{ title }}</slot>
      </p>
      <p v-if="hasDescription" class="text-sm text-current/80">
        <slot name="description">{{ description }}</slot>
      </p>
      <div v-if="!hasDescription && $slots.default" class="text-sm text-current/80">
        <slot />
      </div>
    </div>

    <button
      v-if="showDismiss"
      type="button"
      class="ml-2 rounded-full border border-current/20 p-1 text-current/70 transition hover:text-current"
      aria-label="Fermer l'alerte"
      @click="emit('dismiss')"
    >
      <span class="sr-only">Fermer</span>
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface Props {
  variant?: AlertVariant
  title?: string
  description?: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: '',
  description: '',
  dismissible: false
})

const emit = defineEmits<{
  (event: 'dismiss'): void
}>()

const attrs = useAttrs()
const slots = useSlots()

const showDismiss = computed(() => props.dismissible || Boolean(attrs.onDismiss))

const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title))
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description))

const variantClasses = computed(() => {
  const variants: Record<AlertVariant, string> = {
    info: 'border-primary-200/70 bg-primary-50/80 text-primary-900 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-100',
    success: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100',
    warning: 'border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100',
    error: 'border-red-200/70 bg-red-50/80 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100'
  }

  return variants[props.variant]
})
</script>
