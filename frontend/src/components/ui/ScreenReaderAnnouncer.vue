<template>
  <div
    ref="announcerRef"
    class="sr-only"
    :aria-live="priority"
    :aria-atomic="atomic"
    :aria-relevant="relevant"
    role="status"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
  message?: string
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  clearDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  priority: 'polite',
  atomic: true,
  relevant: 'all',
  clearDelay: 5000
})

const announcerRef = ref<HTMLElement>()
const currentMessage = ref('')

// Gérer les changements de message
watch(
  () => props.message,
  (newMessage) => {
    if (newMessage && newMessage !== currentMessage.value) {
      // Effacer le message précédent d'abord
      currentMessage.value = ''

      // Petit délai pour s'assurer que le lecteur d'écran détecte le changement
      setTimeout(() => {
        currentMessage.value = newMessage

        // Auto-clear après le délai spécifié
        if (props.clearDelay > 0) {
          setTimeout(() => {
            currentMessage.value = ''
          }, props.clearDelay)
        }
      }, 50)
    }
  },
  { immediate: true }
)

// Méthode pour annoncer un message manuellement
const announce = (text: string, urgency: 'polite' | 'assertive' = 'polite') => {
  if (announcerRef.value) {
    announcerRef.value.setAttribute('aria-live', urgency)
    currentMessage.value = ''

    setTimeout(() => {
      currentMessage.value = text
    }, 50)
  }
}

// Exposer la méthode announce
defineExpose({
  announce
})
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>