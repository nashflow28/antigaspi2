<template>
  <Transition
    :name="transitionName"
    :mode="mode"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAnimations } from '@/composables/useAnimations'

interface Props {
  name?: string
  mode?: 'out-in' | 'in-out' | 'default'
  duration?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: 'page',
  mode: 'out-in',
  duration: 400,
  disabled: false
})

const emit = defineEmits<{
  beforeEnter: [el: Element]
  enter: [el: Element]
  afterEnter: [el: Element]
  beforeLeave: [el: Element]
  leave: [el: Element]
  afterLeave: [el: Element]
}>()

const route = useRoute()
const { prefersReducedMotion } = useAnimations()

// Détecter la direction de navigation basée sur la profondeur de route
const getTransitionDirection = () => {
  const currentDepth = route.path.split('/').length
  const previousDepth = ref(currentDepth)

  if (currentDepth > previousDepth.value) {
    previousDepth.value = currentDepth
    return 'forward'
  } else if (currentDepth < previousDepth.value) {
    previousDepth.value = currentDepth
    return 'backward'
  }
  previousDepth.value = currentDepth
  return 'same'
}

const transitionName = computed(() => {
  if (props.disabled || prefersReducedMotion.value) {
    return 'no-transition'
  }

  const direction = getTransitionDirection()

  switch (direction) {
    case 'forward':
      return 'page-slide-left'
    case 'backward':
      return 'page-slide-right'
    default:
      return 'page-fade'
  }
})

// Event handlers
const onBeforeEnter = (el: Element) => {
  emit('beforeEnter', el)
}

const onEnter = (el: Element) => {
  emit('enter', el)
}

const onAfterEnter = (el: Element) => {
  emit('afterEnter', el)
}

const onBeforeLeave = (el: Element) => {
  emit('beforeLeave', el)
}

const onLeave = (el: Element) => {
  emit('leave', el)
}

const onAfterLeave = (el: Element) => {
  emit('afterLeave', el)
}
</script>

<style scoped>
/* Transition par défaut - Fade */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Transition slide left (navigation forward) */
.page-slide-left-enter-active,
.page-slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-left-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.page-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* Transition slide right (navigation backward) */
.page-slide-right-enter-active,
.page-slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.page-slide-right-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* Transition scale pour les modals */
.page-scale-enter-active,
.page-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.page-scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* No transition pour accessibilité */
.no-transition-enter-active,
.no-transition-leave-active {
  transition: none !important;
}

.no-transition-enter-from,
.no-transition-leave-to {
  opacity: 1 !important;
  transform: none !important;
}

/* Optimisation pour mobile */
@media (max-width: 768px) {
  .page-slide-left-enter-from,
  .page-slide-left-leave-to,
  .page-slide-right-enter-from,
  .page-slide-right-leave-to {
    transform: translateX(50px);
  }
}
</style>
