<template>
  <BaseSkeleton v-bind="mergedProps" />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import BaseSkeleton from '../Skeleton.vue'

defineOptions({ inheritAttrs: false })

type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full'

const props = withDefaults(
  defineProps<{
    rounded?: SkeletonRadius
  }>(),
  {
    rounded: 'md'
  }
)

const attrs = useAttrs()
const mergedProps = computed(() => ({ ...attrs, ...props }))
</script>
