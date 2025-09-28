<template>
  <article :class="cardClass" v-bind="otherAttrs">
    <div v-if="$slots.header" class="flex flex-col gap-2.5 pb-lg">
      <slot name="header" />
    </div>

    <div class="flex-1">
      <slot />
    </div>

    <div
      v-if="$slots.footer"
      class="mt-4 border-t border-gray-200/70 pt-4 dark:border-gray-700/70"
    >
      <slot name="footer" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type CardVariant = 'default' | 'glass' | 'highlight' | 'muted';
type CardHover = 'none' | 'lift' | 'glow' | 'subtle';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: CardVariant;
    hover?: CardHover;
    padding?: CardPadding;
  }>(),
  {
    variant: 'default',
    hover: 'lift',
    padding: 'md'
  }
)

const attrs = useAttrs()

const baseClasses =
  'relative flex flex-col rounded border shadow-lg transition-all duration-300 ease-spring-out bg-gray-100/95 dark:bg-gray-900/80 border-gray-200/70 dark:border-gray-800/80 backdrop-blur-xl overflow-hidden'

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-gray-100/95 dark:bg-gray-900/80',
  glass:
    'bg-blue-200/15 dark:bg-gray-900/60 border-blue-400/20 before:absolute before:inset-0 before:bg-emerald-glass before:opacity-90 before:-z-10',
  highlight: 'bg-blue-500/10 border-blue-400/30 dark:bg-blue-800/20 dark:border-blue-600/40',
  muted: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800'
}

const hoverClasses: Record<CardHover, string> = {
  none: '',
  lift: 'hover:-translate-y-1 hover:shadow-xl',
  glow: 'hover:shadow-xl hover:border-blue-500/40',
  subtle: 'hover:-translate-y-0.5 hover:bg-blue-100/20'
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-12'
}

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const otherAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const cardClass = computed(() => [
  baseClasses,
  variantClasses[props.variant],
  hoverClasses[props.hover],
  paddingClasses[props.padding],
  externalClass.value
])
</script>
