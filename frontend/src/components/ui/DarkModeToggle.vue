<template>
  <button
    class="relative inline-flex items-center justify-center p-2 rounded transition-all duration-300 ease-out-expo group focus-2025"
    :class="[
      isDark
        ? 'bg-dark-800/80 text-dark-200 border border-dark-600 hover:bg-dark-700'
        : 'bg-white/80 text-gray-800 border border-gray-200 hover:bg-gray-50'
    ]"
    :aria-label="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
    @click="toggleDarkMode"
  >
    <!-- Sun Icon -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out-expo"
      enter-from-class="opacity-0 scale-0 rotate-180"
      enter-to-class="opacity-100 scale-100 rotate-0"
      leave-active-class="transition-all duration-300 ease-out-expo"
      leave-from-class="opacity-100 scale-100 rotate-0"
      leave-to-class="opacity-0 scale-0 rotate-180"
    >
      <Sun
        v-show="!isDark"
        class="h-4 w-4 text-amber-500 group-hover:transition-transform duration-300"
      />
    </Transition>

    <!-- Moon Icon -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out-expo"
      enter-from-class="opacity-0 scale-0 rotate-180"
      enter-to-class="opacity-100 scale-100 rotate-0"
      leave-active-class="transition-all duration-300 ease-out-expo"
      leave-from-class="opacity-100 scale-100 rotate-0"
      leave-to-class="opacity-0 scale-0 rotate-180"
    >
      <Moon
        v-show="isDark"
        class="h-4 w-4 text-indigo-400 group-hover:transition-transform duration-300"
      />
    </Transition>

    <!-- Hover glow effect -->
    <div
      class="relative sm:absolute inset-0 rounded opacity-0 group-hover:transition-opacity duration-300 pointer-events-none"
      :class="[
        isDark
          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20'
          : 'bg-gradient-to-r from-amber-400/20 to-orange-400/20'
      ]"
    />
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

// State
const isDark = ref(false)

// Check for saved theme or default to light mode
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = systemPrefersDark
  }

  updateTheme()
}

// Update theme
const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Toggle dark mode
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  updateTheme()

  // Add a subtle haptic feedback if available
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

// Watch for system theme changes
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  if (!localStorage.getItem('theme')) {
    isDark.value = e.matches
    updateTheme()
  }
}

// Lifecycle
onMounted(() => {
  initializeTheme()
  mediaQuery.addEventListener('change', handleSystemThemeChange)
})

// Cleanup
onUnmounted(() => {
  mediaQuery.removeEventListener('change', handleSystemThemeChange)
})

// Watch for changes
watch(isDark, updateTheme)
</script>

<style scoped>
/* Custom transition for smooth icon rotation */
.v-enter-active,
.v-leave-active {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
