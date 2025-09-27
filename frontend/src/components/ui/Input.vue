<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="inputId"
      :class="labelClass"
    >
      <span>{{ label }}</span>
      <span
        v-if="helperText && !error"
        class="text-caption text-placeholder"
      >
        {{ helperText }}
      </span>
    </label>

    <div class="relative">
      <span
        v-if="normalizedLeftIcon"
        class="pointer-events-none relative sm:absolute left-4 top-1/2 -translate-y-1/2 text-placeholder"
      >
        <component :is="normalizedLeftIcon" />
      </span>

      <input
        :id="inputId"
        :type="type"
        :class="inputClass"
        :value="modelValue"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedBy"
        :disabled="disabled"
        v-bind="otherAttrs"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      >

      <span
        v-if="normalizedRightIcon"
        class="pointer-events-none relative sm:absolute right-4 top-1/2 -translate-y-1/2 text-placeholder"
      >
        <component :is="normalizedRightIcon" />
      </span>

      <span
        class="pointer-events-none relative sm:absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary-500 transition-transform duration-200"
        :style="focusUnderlineStyle"
        aria-hidden="true"
      />
    </div>

    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="flex items-center gap-2 text-small text-accent-red"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-4a1 1 0 100 2 1 1 0 000-2zm-.75-7.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z"
          clip-rule="evenodd"
        />
      </svg>
      {{ error }}
    </p>
    <p
      v-else-if="helperText"
      :id="`${inputId}-helper`"
      class="text-caption text-muted"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, toRaw, useAttrs, useId } from 'vue'
import type { Component, VNode } from 'vue'

defineOptions({ inheritAttrs: false })

type InputVariant = 'subtle' | 'filled' | 'transparent';
type InputSize = 'sm' | 'md' | 'lg';
type IconProp = Component | VNode | string | null;

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    variant?: InputVariant;
    size?: InputSize;
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: IconProp;
    rightIcon?: IconProp;
    id?: string;
    type?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    variant: 'subtle',
    size: 'md',
    label: undefined,
    error: undefined,
    helperText: undefined,
    leftIcon: null,
    rightIcon: null,
    id: undefined,
    type: 'text',
    disabled: false
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void;
  (event: 'focus', value: FocusEvent): void;
  (event: 'blur', value: FocusEvent): void;
  (event: 'input', value: Event): void;
}>()

const attrs = useAttrs()
const isFocused = ref(false)

const baseClasses =
  'flex w-full rounded-2xl border bg-white/95 px-4 py-3 text-body text-body-emphasis placeholder:text-placeholder transition-all duration-200 ease-spring-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-placeholder dark:focus-visible:ring-offset-neutral-900'

const variantClasses: Record<InputVariant, string> = {
  subtle:
    'border-neutral-200 hover:border-primary-300 focus:border-primary-400 focus:bg-white dark:border-neutral-700 dark:focus:border-primary-500',
  filled:
    'border-transparent bg-neutral-100 hover:bg-neutral-100 focus:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800',
  transparent:
    'border-primary-500/20 bg-primary-500/5 hover:border-primary-500/40 focus:bg-white dark:bg-primary-900/30 dark:border-primary-700/40'
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-11 text-small',
  md: 'h-12',
  lg: 'h-14 text-h4'
}

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const otherAttrs = computed(() => {
  const { class: _class, modelValue: _model, type: _type, id: _id, disabled: _disabled, ...rest } = attrs
  return rest
})

const generatedId = useId()
const inputId = computed(() => props.id ?? `input-${generatedId}`)

const inputClass = computed(() => [
  baseClasses,
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.leftIcon ? 'pl-12' : '',
  props.rightIcon ? 'pr-12' : '',
  props.error ? 'border-accent-red focus-visible:ring-accent-red/60' : '',
  externalClass.value
])

const normalizeIcon = (icon: IconProp) => {
  if (!icon) {
    return null
  }

  if (typeof icon === 'object') {
    return markRaw(toRaw(icon))
  }

  return icon
}

const normalizedLeftIcon = computed(() => normalizeIcon(props.leftIcon))
const normalizedRightIcon = computed(() => normalizeIcon(props.rightIcon))

const labelClass = computed(() => [
  'flex items-center justify-between text-small font-medium text-body transition-colors dark:text-neutral-200',
  isFocused.value && !props.error ? 'text-primary' : '',
  props.error ? 'text-accent-red' : ''
])

const describedBy = computed(() => {
  if (props.error) {
    return `${inputId.value}-error`
  }

  if (props.helperText) {
    return `${inputId.value}-helper`
  }

  return undefined
})

const focusUnderlineStyle = computed(() => ({
  transform: `scaleX(${isFocused.value ? 1 : 0})`,
  opacity: isFocused.value ? '1' : '0',
  transition: 'transform 0.25s ease, opacity 0.25s ease'
}))

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const onFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}
</script>
