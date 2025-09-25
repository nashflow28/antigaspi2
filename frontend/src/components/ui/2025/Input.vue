<template>
  <div class="input-wrapper">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input Container -->
    <div :class="containerClasses">
      <!-- Left Icon -->
      <component
        v-if="leftIcon"
        :is="leftIcon"
        :class="iconClasses"
      />

      <!-- Input Element -->
      <input
        :id="inputId"
        ref="inputRef"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />

      <!-- Right Icon / Clear Button -->
      <div v-if="rightIcon || (clearable && model)" class="flex items-center">
        <button
          v-if="clearable && model"
          @click="clearInput"
          type="button"
          :class="clearButtonClasses"
        >
          <X :size="16" />
        </button>

        <component
          v-if="rightIcon"
          :is="rightIcon"
          :class="iconClasses"
        />
      </div>
    </div>

    <!-- Help Text -->
    <p v-if="helpText && !error" :class="helpTextClasses">
      {{ helpText }}
    </p>

    <!-- Error Message -->
    <p v-if="error" :class="errorTextClasses">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { X } from 'lucide-vue-next'

// Types
export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'outline' | 'filled'

// Props
interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  placeholder?: string
  helpText?: string
  error?: string
  size?: InputSize
  variant?: InputVariant
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  leftIcon?: any
  rightIcon?: any
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  keydown: [event: KeyboardEvent]
  clear: []
}>()

// Refs
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Computed
const inputId = computed(() => {
  const attrs = useAttrs()
  return attrs.id || `input-${Math.random().toString(36).substr(2, 9)}`
})

const model = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value)
})

const containerClasses = computed(() => {
  const baseClasses = [
    // Base container styles
    'relative flex items-center',
    'border border-neutral-300',
    'transition-all duration-200',

    // Size classes
    sizeContainerClasses.value,

    // Variant classes
    variantContainerClasses.value,

    // State classes
    props.error && 'border-red-500 ring-1 ring-red-500/20',
    isFocused.value && !props.error && 'border-primary-500 ring-1 ring-primary-500/20',
    props.disabled && 'bg-neutral-50 border-neutral-200 cursor-not-allowed'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const inputClasses = computed(() => {
  const baseClasses = [
    // Base input styles
    'flex-1 bg-transparent',
    'text-neutral-900 placeholder-neutral-400',
    'focus:outline-none',
    'disabled:cursor-not-allowed disabled:text-neutral-500',

    // Size classes
    sizeInputClasses.value,

    // Padding adjustments for icons
    props.leftIcon && 'pl-0',
    (props.rightIcon || props.clearable) && 'pr-0'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const sizeContainerClasses = computed(() => {
  const sizes = {
    sm: 'h-9 px-3 rounded-md',
    md: 'h-10 px-3 rounded-lg',
    lg: 'h-12 px-4 rounded-lg'
  }
  return sizes[props.size]
})

const sizeInputClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

const variantContainerClasses = computed(() => {
  const variants = {
    default: 'bg-white hover:border-neutral-400',
    outline: 'bg-transparent border-2 hover:border-neutral-400',
    filled: 'bg-neutral-50 border-transparent hover:bg-neutral-100'
  }
  return variants[props.variant]
})

const labelClasses = computed(() => [
  'block text-sm font-medium text-neutral-700 mb-1',
  props.disabled && 'text-neutral-500'
].filter(Boolean).join(' '))

const iconClasses = computed(() => [
  'text-neutral-400 flex-shrink-0',
  props.size === 'sm' && 'mx-2',
  props.size === 'md' && 'mx-2',
  props.size === 'lg' && 'mx-3'
].filter(Boolean).join(' '))

const clearButtonClasses = computed(() => [
  'text-neutral-400 hover:text-neutral-600',
  'rounded-full p-1 hover:bg-neutral-100',
  'transition-colors flex-shrink-0',
  'mr-1'
].join(' '))

const helpTextClasses = computed(() => [
  'mt-1 text-sm text-neutral-500'
].join(' '))

const errorTextClasses = computed(() => [
  'mt-1 text-sm text-red-600'
].join(' '))

// Methods
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleInput = (event: Event) => {
  emit('input', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

// Expose methods
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
})
</script>