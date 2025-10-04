<template>
  <div class="flex items-center gap-2 max-w-full shrink-0">
    <span
      v-if="showEmoji"
      class="hidden md:block text-2xl shrink-0"
      aria-hidden="true"
    >
      {{ emoji }}
    </span>
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="alt"
      class="w-24 max-w-full h-auto shrink-0"
    />
    <span
      class="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 leading-tight whitespace-nowrap"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    emoji?: string
    logoSrc?: string
    alt?: string
    showEmoji?: boolean
  }>(),
  {
    label: 'Antigaspi',
    emoji: '🥬',
    alt: 'Logo Antigaspi',
    showEmoji: true,
  }
)

const { label, emoji, logoSrc, alt, showEmoji } = props
</script>
