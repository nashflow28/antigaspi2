<template>
  <div :class="wrapperClasses" v-bind="otherAttrs">
    <span aria-hidden="true" class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full';

const props = withDefaults(
  defineProps<{
    rounded?: SkeletonRadius;
  }>(),
  {
    rounded: 'md'
  }
)

const attrs = useAttrs()

const rounding: Record<SkeletonRadius, string> = {
  sm: 'rounded-lg',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  full: 'rounded-full'
}

const wrapperClasses = computed(() => [
  'relative overflow-hidden bg-neutral-200/70 dark:bg-neutral-800/60',
  rounding[props.rounded],
  (attrs.class as string | undefined) ?? ''
])

const otherAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})
</script>
