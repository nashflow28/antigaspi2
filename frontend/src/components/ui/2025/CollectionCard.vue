<template>
  <button
    type="button"
    class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-white shadow-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02] dark:from-surface-dark dark:to-neutral-900"
    :class="[
      aspectRatio === 'square' ? 'aspect-square' : 'aspect-[4/3]',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <!-- Background Image/Gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-br transition-opacity duration-300 group-hover:opacity-90"
      :style="{ backgroundImage: gradient }"
    />

    <!-- Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

    <!-- Icon -->
    <div class="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm dark:bg-neutral-900/90">
      <component :is="icon" class="h-6 w-6" :class="iconColor" />
    </div>

    <!-- Content -->
    <div class="absolute bottom-0 left-0 right-0 p-5">
      <div class="space-y-2">
        <!-- Badge -->
        <Badge
          v-if="badge"
          variant="soft"
          size="sm"
          rounded
          class="bg-white/90 text-neutral-900 backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-50"
        >
          {{ badge }}
        </Badge>

        <!-- Title -->
        <h3 class="text-xl font-semibold text-white drop-shadow-lg">
          {{ title }}
        </h3>

        <!-- Description -->
        <p v-if="description" class="text-sm text-white/90 drop-shadow-md">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Hover Arrow -->
    <div class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 transition-all duration-300 group-hover:opacity-100 dark:bg-neutral-900/90">
      <ArrowRight class="h-5 w-5 text-neutral-900 dark:text-neutral-50" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import Badge from './Badge.vue'
import type { Component } from 'vue'

interface Props {
  title: string
  description?: string
  icon: Component
  iconColor?: string
  gradient?: string
  badge?: string
  aspectRatio?: 'square' | 'landscape'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'text-primary-600',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  aspectRatio: 'landscape',
  disabled: false
})

defineEmits<{
  click: []
}>()
</script>
