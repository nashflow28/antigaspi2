<template>
  <div class="space-y-1">
    <label class="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :class="[
          'h-4 w-4 rounded border transition-colors',
          'focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer',
          hasError
            ? 'border-red-500 text-red-600'
            : 'border-neutral-300 text-primary-600'
        ]"
        @change="handleChange"
      >
      <span
        v-if="label || $slots.default"
        :class="[
          'text-sm',
          disabled ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'
        ]"
      >
        <slot>{{ label }}</slot>
      </span>
    </label>
    <p v-if="errorMessage" class="text-sm text-red-600">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
  error?: string | boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  error: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const hasError = computed(() => !!props.error)
const errorMessage = computed(() => typeof props.error === 'string' ? props.error : '')

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>
