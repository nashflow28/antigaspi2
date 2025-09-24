<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="ariaLabel"
    class="relative"
    @click="handleToggle"
  >
    <Motion
      tag="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      class="h-5 w-5"
      :animate="{ rotate: isDark ? 180 : 0 }"
      :transition="{ duration: 0.4, ease: 'easeInOut' }"
    >
      <template v-if="isDark">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3a9 9 0 0 0 9 9c0 4.97-4.03 9-9 9a9 9 0 0 1 0-18z" />
      </template>
      <template v-else>
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.02 5.66l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
        />
      </template>
    </Motion>
  </Button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { MotionComponent as Motion } from '@vueuse/motion'
import { storeToRefs } from 'pinia'
import Button from './Button.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

onMounted(() => {
  themeStore.hydrate()
})

const ariaLabel = computed(() => (isDark.value ? 'Activer le thème clair' : 'Activer le thème sombre'))

const handleToggle = () => {
  themeStore.toggleTheme()

  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(35)
  }
}
</script>
