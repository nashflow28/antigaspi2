<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="buttonClass"
    v-bind="otherAttrs"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
  >
    <span
      v-if="loading"
      class="mr-2 inline-flex"
      aria-hidden="true"
    >
      <svg
        class="h-4 w-4 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        role="presentation"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V2.5A9.5 9.5 0 002.5 12H4zm2 5.3A7.96 7.96 0 014 12H2.5A9.5 9.5 0 0011 21.5v-2.2a8.03 8.03 0 01-5-1.96z"
        />
      </svg>
    </span>

    <span v-if="normalizedLeftIcon && !loading" class="flex-shrink-0 text-current">
      <component :is="normalizedLeftIcon" />
    </span>

    <span class="truncate font-medium">
      <slot />
    </span>

    <span v-if="normalizedRightIcon" class="flex-shrink-0 text-current">
      <component :is="normalizedRightIcon" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, markRaw, toRaw, useAttrs, type Component, type VNode } from 'vue'

defineOptions({ inheritAttrs: false })

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'promo' | 'destructive';
type ButtonSize = 'sm' | 'default' | 'lg' | 'xl' | 'icon';
type IconProp = Component | VNode | string | null;

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    leftIcon?: IconProp;
    rightIcon?: IconProp;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'primary',
    size: 'default',
    loading: false,
    disabled: false,
    leftIcon: null,
    rightIcon: null,
    type: 'button'
  }
)

const emit = defineEmits<{
  (event: 'click', value: MouseEvent): void;
  (event: 'focus', value: FocusEvent): void;
  (event: 'blur', value: FocusEvent): void;
}>()

const attrs = useAttrs()

const baseClasses =
  'group inline-flex items-center justify-center gap-2 rounded font-medium tracking-tight transition-all duration-300 ease-spring-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden isolate select-none will-change-transform'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-xl hover:shadow-lg hover:brightness-[1.05] focus-visible:ring-primary-300',
  secondary:
    'bg-white text-primary-900 border border-primary-200 shadow-lg hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-800 dark:bg-neutral-900 dark:text-neutral-50 dark:border-primary-500/40 dark:hover:bg-primary-700/10',
  ghost:
    'bg-transparent text-primary-600 dark:text-primary-200 hover:text-primary-800 hover:bg-primary-200/20 dark:hover:text-white dark:hover:bg-primary-800/30',
  outline:
    'border border-primary-400 text-primary-900 bg-transparent hover:bg-primary-200/20 hover:text-primary-900 dark:text-primary-200 dark:border-primary-300/60 dark:hover:bg-primary-800/40',
  promo:
    'bg-orange-500 text-neutral-900 shadow-lg hover:shadow-xl hover:brightness-[1.03]',
  destructive:
    'bg-red-600 text-white shadow-lg hover:bg-red-600/90 focus-visible:ring-accent-red/40'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded',
  default: 'px-xl py-2.5 text-neutral-700',
  lg: 'px-4 py-3 text-h4',
  xl: 'px-7 py-3.5 text-lg',
  icon: 'p-2.5 rounded'
}

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const otherAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const isDisabled = computed(() => props.disabled || props.loading)

const buttonClass = computed(() => [
  baseClasses,
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.loading ? 'cursor-wait' : '',
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

const onClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    event.stopImmediatePropagation?.()
    return
  }
  emit('click', event)
}

const onFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}

</script>
