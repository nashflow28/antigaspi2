<template>
  <div :class="wrapperClasses">
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
        :is="leftIcon"
        v-if="leftIcon"
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
        v-bind="inputAttrs"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      >

      <!-- Right Icon / Clear Button -->
      <div v-if="rightIcon || (clearable && model)" class="flex items-center">
        <button
          v-if="clearable && model"
          type="button"
          :class="clearButtonClasses"
          @click="clearInput"
        >
          <X :size="16" />
        </button>

        <button
          v-if="rightIcon"
          type="button"
          class="flex items-center justify-center"
          @click="emit('click:right-icon')"
        >
          <component
            :is="rightIcon"
            :class="iconClasses"
          />
        </button>
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
defineOptions({ inheritAttrs: false })

import { computed, ref, useAttrs } from 'vue'
import { X } from 'lucide-vue-next'

// Types
export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'outline' | 'filled'

// Props
interface Props {
  modelValue?: string | number
  modelModifiers?: Record<string, boolean>
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
  inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  inputClass: '',
  modelModifiers: () => ({})
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  keydown: [event: KeyboardEvent]
  clear: []
  'click:right-icon': []
}>()

// Refs
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Computed
const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { class: _class, id: _id, ...rest } = attrs
  return rest
})

const wrapperClasses = computed(() => {
  const attrClass = attrs.class

  if (!attrClass) {
    return 'input-wrapper'
  }

  if (typeof attrClass === 'string') {
    return ['input-wrapper', attrClass].join(' ')
  }

  if (Array.isArray(attrClass)) {
    return ['input-wrapper', ...attrClass].filter(Boolean).join(' ')
  }

  if (typeof attrClass === 'object') {
    return [
      'input-wrapper',
      ...Object.entries(attrClass)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)
    ].join(' ')
  }

  return 'input-wrapper'
})

const inputId = computed(() => {
  return (attrs.id as string | undefined) || `input-${Math.random().toString(36).substr(2, 9)}`
})

const model = computed({
  get: () => props.modelValue ?? '',
  set: (value) => {
    let nextValue: string | number = value

    if (props.modelModifiers?.number) {
      if (nextValue === '') {
        nextValue = ''
      } else {
        const parsedValue = typeof nextValue === 'number' ? nextValue : Number(nextValue)
        nextValue = Number.isNaN(parsedValue) ? (value as string | number) : parsedValue
      }
    }

    emit('update:modelValue', nextValue)
  }
})

const containerClasses = computed(() => {
  const baseClasses = [
    // Base container styles
    'relative flex items-center',
    'border border-neutral-300 dark:border-neutral-700',
    'bg-surface-light dark:bg-surface-dark',
    'transition-all duration-200 ease-spring-out',

    // Size classes
    sizeContainerClasses.value,

    // Variant classes
    variantContainerClasses.value,

    // State classes
    props.error && 'border-accent-red ring-1 ring-accent-red/20',
    isFocused.value && !props.error && 'border-primary-500 ring-1 ring-primary-400/30',
    props.disabled && 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const inputClasses = computed(() => {
  const baseClasses = [
    // Base input styles
    'flex-1 bg-transparent',
    'text-neutral-900 dark:text-neutral-50',
    'placeholder-neutral-400 dark:placeholder-neutral-500',
    'focus:outline-none',
    'disabled:cursor-not-allowed disabled:text-neutral-500 dark:disabled:text-neutral-500',

    // Size classes
    sizeInputClasses.value,

    // Padding adjustments for icons
    props.leftIcon && 'pl-0',
    (props.rightIcon || props.clearable) && 'pr-0',
    props.inputClass
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const sizeContainerClasses = computed(() => {
  const sizes = {
    sm: 'h-10 px-md rounded-lg',
    md: 'h-11 px-lg rounded-xl',
    lg: 'h-12 px-xl rounded-xl'
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
    default: 'hover:border-neutral-400 dark:hover:border-neutral-500',
    outline: 'bg-transparent dark:bg-transparent border-2 hover:border-primary-400 dark:hover:border-primary-500',
    filled: 'bg-neutral-100 dark:bg-neutral-800 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
  }
  return variants[props.variant]
})

const labelClasses = computed(() => [
  'block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1',
  props.disabled && 'text-neutral-500 dark:text-neutral-500'
].filter(Boolean).join(' '))

const iconClasses = computed(() => [
  'text-neutral-400 dark:text-neutral-500 flex-shrink-0',
  props.size === 'sm' && 'mx-sm',
  props.size === 'md' && 'mx-sm',
  props.size === 'lg' && 'mx-md'
].filter(Boolean).join(' '))

const clearButtonClasses = computed(() => [
  'text-neutral-400 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-neutral-100',
  'rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700',
  'transition-colors flex-shrink-0',
  'mr-1'
].join(' '))

const helpTextClasses = computed(() => [
  'mt-1 text-sm text-neutral-500 dark:text-neutral-400'
].join(' '))

const errorTextClasses = computed(() => [
  'mt-1 text-sm text-accent-red'
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
