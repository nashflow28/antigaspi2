<template>
  <BasePageTransition v-bind="$attrs">
    <template v-for="(_, slot) in $slots" #[slot]="slotProps">
      <slot :name="slot" v-bind="slotProps" />
    </template>
  </BasePageTransition>
</template>

<script setup lang="ts">
import BasePageTransition from '../PageTransition.vue'

defineOptions({ inheritAttrs: false })
</script>
