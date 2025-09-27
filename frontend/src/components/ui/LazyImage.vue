<template>
  <div :class="containerClass" class="lazy-image-container">
    <img
      ref="imageRef"
      :data-src="optimizedSrc"
      :src="placeholder"
      :alt="alt"
      :class="imageClass"
      :srcset="srcSet"
      :sizes="sizes"
      class="lazy-image transition-opacity duration-300"
      loading="lazy"
    >

    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm"
    >
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        <span class="text-sm text-gray-600">{{ loadingText }}</span>
      </div>
    </div>

    <!-- Error overlay -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-red-50/80 backdrop-blur-sm"
    >
      <div class="text-center text-red-600">
        <X class="w-8 h-8 mx-auto mb-2" />
        <span class="text-sm">{{ errorText }}</span>
      </div>
    </div>

    <!-- Success overlay (fade out) -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-500"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSuccessOverlay"
        class="absolute inset-0 flex items-center justify-center bg-green-50/80 backdrop-blur-sm"
      >
        <div class="flex items-center space-x-2 text-green-600">
          <Check class="w-5 h-5" />
          <span class="text-sm">Chargé</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { useLazyImage, optimizeImageUrl, generateSrcSet, generatePlaceholder } from '@/composables/useLazyLoading'

interface Props {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  sizes?: string
  containerClass?: string
  imageClass?: string
  loadingText?: string
  errorText?: string
  showSuccessOverlay?: boolean
  placeholderColor?: string
  responsiveSizes?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  quality: 80,
  sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  containerClass: 'relative overflow-hidden',
  imageClass: 'w-full h-full object-cover',
  loadingText: 'Chargement...',
  errorText: 'Erreur de chargement',
  showSuccessOverlay: false,
  placeholderColor: '#f3f4f6',
  responsiveSizes: () => [320, 640, 768, 1024, 1280]
})

const { imageRef, isLoaded, isLoading, hasError } = useLazyImage({
  loadingClass: 'lazy-loading opacity-50',
  loadedClass: 'lazy-loaded opacity-100',
  errorClass: 'lazy-error opacity-25'
})

const showSuccessOverlay = ref(false)

// Image optimisée
const optimizedSrc = computed(() => {
  return optimizeImageUrl(props.src, props.width, props.height, props.quality)
})

// Srcset responsive
const srcSet = computed(() => {
  if (!props.src) return ''
  return generateSrcSet(props.src, props.responsiveSizes)
})

// Placeholder généré
const placeholder = computed(() => {
  return generatePlaceholder(
    props.width || 300,
    props.height || 200,
    props.placeholderColor,
    '#9ca3af',
    'Image'
  )
})

// Watcher pour afficher brièvement le succès
watch(isLoaded, (loaded) => {
  if (loaded && props.showSuccessOverlay) {
    showSuccessOverlay.value = true
    setTimeout(() => {
      showSuccessOverlay.value = false
    }, 1000)
  }
})
</script>

<style scoped>
.lazy-image {
  transition: opacity 0.3s ease;
}

.lazy-loading {
  opacity: 0.5;
  filter: blur(2px);
}

.lazy-loaded {
  opacity: 1;
  filter: none;
}

.lazy-error {
  opacity: 0.25;
  filter: grayscale(100%);
}
</style>
