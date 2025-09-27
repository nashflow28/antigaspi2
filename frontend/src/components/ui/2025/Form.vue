<template>
  <form
    :class="formClasses"
    @submit="handleSubmit"
    @reset="handleReset"
  >
    <!-- Form Header -->
    <div v-if="title || description || $slots.header" :class="headerClasses">
      <slot name="header">
        <h2 v-if="title" :class="titleClasses">{{ title }}</h2>
        <p v-if="description" :class="descriptionClasses">{{ description }}</p>
      </slot>
    </div>

    <!-- Form Content -->
    <div :class="contentClasses">
      <slot :errors="errors" :loading="loading" />
    </div>

    <!-- Form Footer -->
    <div v-if="$slots.footer || showDefaultActions" :class="footerClasses">
      <slot name="footer" :loading="loading" :errors="errors">
        <!-- Default Actions -->
        <div v-if="showDefaultActions" class="flex items-center justify-end space-x-3">
          <Button
            v-if="showCancelButton"
            type="button"
            variant="outline"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </Button>

          <Button
            type="submit"
            variant="primary"
            :loading="loading"
            :disabled="loading || !isValid"
          >
            {{ submitText }}
          </Button>
        </div>
      </slot>
    </div>

    <!-- Global Form Errors -->
    <div v-if="globalError" :class="globalErrorClasses">
      <p>{{ globalError }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue'

// Types
export type FormSize = 'sm' | 'md' | 'lg'
export type FormVariant = 'default' | 'contained' | 'minimal'

// Props
interface Props {
  title?: string
  description?: string
  size?: FormSize
  variant?: FormVariant
  loading?: boolean
  errors?: Record<string, string>
  globalError?: string
  showDefaultActions?: boolean
  showCancelButton?: boolean
  submitText?: string
  cancelText?: string
  isValid?: boolean
  spacing?: 'compact' | 'normal' | 'relaxed'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  loading: false,
  errors: () => ({}),
  showDefaultActions: true,
  showCancelButton: false,
  submitText: 'Enregistrer',
  cancelText: 'Annuler',
  isValid: true,
  spacing: 'normal'
})

// Emits
const emit = defineEmits<{
  submit: [event: Event]
  reset: [event: Event]
  cancel: []
}>()

// Computed
const formClasses = computed(() => [
  'form-2025',
  variantClasses.value,
  sizeClasses.value.wrapper
].filter(Boolean).join(' '))

const variantClasses = computed(() => {
  const variants = {
    default: '',
    contained: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
    minimal: 'bg-transparent'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      wrapper: 'max-w-md',
      padding: 'p-4',
      spacing: 'space-y-4'
    },
    md: {
      wrapper: 'max-w-lg',
      padding: 'p-6',
      spacing: 'space-y-6'
    },
    lg: {
      wrapper: 'max-w-2xl',
      padding: 'p-8',
      spacing: 'space-y-8'
    }
  }
  return sizes[props.size]
})

const spacingClasses = computed(() => {
  const spacing = {
    compact: 'space-y-3',
    normal: 'space-y-4',
    relaxed: 'space-y-6'
  }
  return spacing[props.spacing]
})

const headerClasses = computed(() => [
  props.variant === 'contained' && 'border-b border-neutral-200 pb-4 mb-6'
].filter(Boolean).join(' '))

const titleClasses = computed(() => [
  'text-xl font-semibold text-neutral-900 mb-2'
].join(' '))

const descriptionClasses = computed(() => [
  'text-sm text-neutral-600'
].join(' '))

const contentClasses = computed(() => [
  spacingClasses.value
].join(' '))

const footerClasses = computed(() => [
  'pt-6',
  props.variant === 'contained' && 'border-t border-neutral-200 mt-6'
].filter(Boolean).join(' '))

const globalErrorClasses = computed(() => [
  'mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600'
].join(' '))

// Methods
const handleSubmit = (event: Event) => {
  event.preventDefault()
  if (!props.loading && props.isValid) {
    emit('submit', event)
  }
}

const handleReset = (event: Event) => {
  emit('reset', event)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.form-2025 {
  /* Custom form styles for 2025 design system */
}
</style>
