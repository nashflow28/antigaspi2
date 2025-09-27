<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="textareaId"
      :class="labelClass"
    >
      {{ label }}
    </label>

    <div class="relative">
      <textarea
        :id="textareaId"
        :class="textareaClass"
        :value="modelValue"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedBy"
        :disabled="disabled"
        v-bind="otherAttrs"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />

      <span
        class="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary-500 transition-transform duration-200"
        :style="focusUnderlineStyle"
        aria-hidden="true"
      />
    </div>

    <p
      v-if="error"
      :id="`${textareaId}-error`"
      class="flex items-center gap-2 text-small text-accent-red"
    >
      <svg
        class="h-4 w-4"
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
      :id="`${textareaId}-helper`"
      class="text-caption text-neutral-500"
    >
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

type TextareaVariant = 'subtle' | 'filled' | 'transparent';
type TextareaSize = 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    variant?: TextareaVariant;
    size?: TextareaSize;
    label?: string;
    error?: string;
    helperText?: string;
    id?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    variant: 'subtle',
    size: 'md',
    label: undefined,
    error: undefined,
    helperText: undefined,
    id: undefined,
    disabled: false
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null): void;
  (event: 'focus', value: FocusEvent): void;
  (event: 'blur', value: FocusEvent): void;
  (event: 'input', value: Event): void;
}>()

const attrs = useAttrs()
const isFocused = ref(false)

const baseClasses =
  'flex w-full rounded-2xl border bg-white/95 px-4 py-3 text-body text-neutral-700 transition-all duration-200 ease-spring-out placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 resize-y'

const variantClasses: Record<TextareaVariant, string> = {
  subtle:
    'border-neutral-200 hover:border-primary-300 focus:border-primary-400 dark:border-neutral-700 dark:focus:border-primary-500',
  filled:
    'border-transparent bg-neutral-100 hover:bg-neutral-50 focus:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800',
  transparent:
    'border-primary-500/20 bg-primary-500/5 hover:border-primary-500/40 focus:bg-white dark:bg-primary-900/30 dark:border-primary-700/40'
}

const sizeClasses: Record<TextareaSize, string> = {
  md: 'min-h-[120px]',
  lg: 'min-h-[180px] text-body'
}

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const otherAttrs = computed(() => {
  const { class: _class, modelValue: _model, id: _id, disabled: _disabled, ...rest } = attrs
  return rest
})

const generatedId = useId()
const textareaId = computed(() => props.id ?? `textarea-${generatedId}`)

const textareaClass = computed(() => [
  baseClasses,
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.error ? 'border-accent-red focus-visible:ring-accent-red/60' : '',
  externalClass.value
])

const labelClass = computed(() => [
  'text-small font-medium text-neutral-600 transition-colors dark:text-neutral-200',
  isFocused.value && !props.error ? 'text-primary-600' : '',
  props.error ? 'text-accent-red' : ''
])

const describedBy = computed(() => {
  if (props.error) {
    return `${textareaId.value}-error`
  }

  if (props.helperText) {
    return `${textareaId.value}-helper`
  }

  return undefined
})

const focusUnderlineStyle = computed(() => ({
  transform: `scaleX(${isFocused.value ? 1 : 0})`,
  opacity: isFocused.value ? '1' : '0',
  transition: 'transform 0.25s ease, opacity 0.25s ease'
}))

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
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
