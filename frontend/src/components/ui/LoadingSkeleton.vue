<template>
  <div
    :class="skeletonClasses"
    :style="skeletonStyles"
    role="status"
    :aria-label="ariaLabel"
  >
    <slot v-if="!loading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  loading?: boolean
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'button' | 'image'
  width?: string | number
  height?: string | number
  lines?: number
  rounded?: boolean
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none'
  baseColor?: string
  highlightColor?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: true,
  variant: 'rectangular',
  lines: 1,
  rounded: false,
  animation: 'shimmer',
  baseColor: '#f3f4f6',
  highlightColor: '#e5e7eb',
  ariaLabel: 'Loading content...'
})

const skeletonClasses = computed(() => {
  const classes = ['skeleton-loader']

  if (props.loading) {
    classes.push('skeleton-loading')

    // Animation classes
    if (props.animation !== 'none') {
      classes.push(`skeleton-${props.animation}`)
    }

    // Variant classes
    switch (props.variant) {
      case 'text':
        classes.push('skeleton-text')
        break
      case 'circular':
        classes.push('skeleton-circular')
        break
      case 'card':
        classes.push('skeleton-card')
        break
      case 'avatar':
        classes.push('skeleton-avatar')
        break
      case 'button':
        classes.push('skeleton-button')
        break
      case 'image':
        classes.push('skeleton-image')
        break
      default:
        classes.push('skeleton-rectangular')
    }

    // Rounded corners
    if (props.rounded) {
      classes.push('skeleton-rounded')
    }
  }

  return classes
})

const skeletonStyles = computed(() => {
  if (!props.loading) return {}

  const styles: Record<string, any> = {
    '--skeleton-base-color': props.baseColor,
    '--skeleton-highlight-color': props.highlightColor
  }

  // Width and height
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  return styles
})
</script>

<style scoped>
.skeleton-loader {
  --skeleton-base-color: #f3f4f6;
  --skeleton-highlight-color: #e5e7eb;
}

.skeleton-loading {
  background-color: var(--skeleton-base-color);
  color: transparent;
  pointer-events: none;
  user-select: none;
}

/* Animations */
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.skeleton-wave {
  background: linear-gradient(
    90deg,
    var(--skeleton-base-color) 0%,
    var(--skeleton-highlight-color) 50%,
    var(--skeleton-base-color) 100%
  );
  background-size: 200px 100%;
  animation: skeleton-wave 1.6s linear infinite;
}

@keyframes skeleton-wave {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    -45deg,
    var(--skeleton-base-color) 40%,
    var(--skeleton-highlight-color) 50%,
    var(--skeleton-base-color) 60%
  );
  background-size: 300% 300%;
  animation: skeleton-shimmer 2s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Variants */
.skeleton-text {
  height: 1em;
  border-radius: 4px;
  margin: 0.25em 0;
}

.skeleton-circular {
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.skeleton-rectangular {
  border-radius: 4px;
  min-height: 20px;
}

.skeleton-card {
  border-radius: 12px;
  min-height: 120px;
  padding: 16px;
}

.skeleton-avatar {
  border-radius: 50%;
  width: 48px;
  height: 48px;
}

.skeleton-button {
  border-radius: 8px;
  height: 40px;
  min-width: 80px;
}

.skeleton-image {
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 16/9;
  background-size: cover;
  background-position: center;
}

.skeleton-rounded {
  border-radius: 12px !important;
}

/* Responsive */
@media (max-width: 640px) {
  .skeleton-card {
    min-height: 100px;
    padding: 12px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .skeleton-pulse,
  .skeleton-wave,
  .skeleton-shimmer {
    animation: none !important;
  }

  .skeleton-loading {
    background-color: var(--skeleton-highlight-color);
  }
}
</style>