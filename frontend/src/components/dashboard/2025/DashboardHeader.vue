<template>
  <header
    class="dashboard-header relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-neutral-200/70 bg-surface-light/90 p-6 shadow-card transition-all duration-300 dark:border-neutral-700/60 dark:bg-surface-dark/80"
  >
    <div class="absolute inset-x-0 -top-1 h-2 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-blue opacity-80" />

    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          {{ eyebrow }}
        </p>
        <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 sm:text-3xl">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="subtitle" class="text-base text-neutral-600 dark:text-neutral-300">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <slot name="meta" />
      </div>
    </div>

    <div v-if="$slots.actions" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    eyebrow?: string
  }>(),
  {
    subtitle: undefined,
    eyebrow: undefined
  }
)
</script>

<style scoped>
.dashboard-header::before {
  @apply absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/5 via-primary-500/0 to-primary-500/10 opacity-80;
  content: '';
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 0;
}

.dashboard-header > * {
  position: relative;
  z-index: 10;
}
</style>
