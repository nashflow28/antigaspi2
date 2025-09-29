<template>
  <button
    :id="id"
    type="button"
    :aria-label="computedLabel"
    :data-theme="currentTheme"
    :class="buttonClasses"
    @click="handleToggle"
  >
    <span class="sr-only">{{ computedLabel }}</span>

    <span aria-hidden="true" class="relative flex items-center justify-center">
      <Transition name="theme-toggle-icon" mode="out-in">
        <Sun
          v-if="!isDark"
          key="sun"
          class="h-5 w-5 text-primary-500 drop-shadow-[0_4px_12px_rgba(59,130,246,0.35)]"
        />
        <Moon
          v-else
          key="moon"
          class="h-5 w-5 text-primary-200 drop-shadow-[0_4px_12px_rgba(125,211,252,0.45)]"
        />
      </Transition>
    </span>

    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 opacity-0 transition-opacity duration-300 ease-spring-out group-hover:opacity-25 motion-reduce:transition-none"
    />
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Sun, Moon } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

export type ThemeMode = 'light' | 'dark'

interface Props {
  /**
   * Identifier attribute for the button element
   */
  id?: string
  /**
   * Accessible label displayed when the light theme is active
   */
  lightLabel?: string
  /**
   * Accessible label displayed when the dark theme is active
   */
  darkLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  lightLabel: 'Activer le thème sombre',
  darkLabel: 'Activer le thème clair'
})

const emit = defineEmits<{
  (e: 'update:theme', value: ThemeMode): void
  (e: 'toggle', value: ThemeMode): void
}>()

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

const currentTheme = computed<ThemeMode>(() => (isDark.value ? 'dark' : 'light'))

const computedLabel = computed(() => (isDark.value ? props.darkLabel : props.lightLabel))

const buttonClasses = computed(() => {
  const base = [
    'theme-toggle group relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border',
    'transition-all duration-300 ease-spring-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
    'hover:-translate-y-0.5 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none'
  ]

  const themeSpecific = isDark.value
    ? 'border-primary-400/40 bg-surface-dark/90 text-primary-100 focus-visible:ring-offset-surface-dark hover:bg-primary-500/15'
    : 'border-primary-500/40 bg-surface-light/95 text-primary-600 focus-visible:ring-offset-surface-light hover:bg-primary-500/10'

  return [...base, themeSpecific].join(' ')
})

onMounted(() => {
  themeStore.hydrate()
})

watch(
  currentTheme,
  (value) => {
    emit('update:theme', value)
  },
  { immediate: true }
)

const handleToggle = () => {
  themeStore.toggleTheme()
  emit('toggle', currentTheme.value)

  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(35)
  }
}
</script>

<style scoped>
.theme-toggle-icon-enter-active,
.theme-toggle-icon-leave-active {
  transition: opacity 240ms ease, transform 240ms ease;
}

.theme-toggle-icon-enter-from,
.theme-toggle-icon-leave-to {
  opacity: 0;
  transform: scale(0.7) rotate(-25deg);
}

.theme-toggle-icon-enter-to,
.theme-toggle-icon-leave-from {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle-icon-enter-active,
  .theme-toggle-icon-leave-active {
    transition-duration: 0.001ms;
    transition-timing-function: linear;
  }

  .theme-toggle-icon-enter-from,
  .theme-toggle-icon-leave-to {
    transform: none;
  }
}
</style>
