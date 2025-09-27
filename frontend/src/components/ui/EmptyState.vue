<template>
  <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary-500/30 bg-primary-500/5 p-6 sm:p-8 lg:p-12 text-left sm:text-center shadow-card">
    <Transition name="empty-state-fade" appear>
      <div key="content" class="flex flex-col items-center gap-4">
        <div class="text-display-sm">
          <slot name="icon">
            <component :is="icon" v-if="isIconComponent" aria-hidden="true" />
            <span v-else aria-hidden="true">{{ icon }}</span>
          </slot>
        </div>
        <h3 class="text-h2 font-semibold text-primary-emphasis">
          {{ title }}
        </h3>
        <p class="max-w-full sm:max-w-xl text-body text-muted">
          {{ description }}
        </p>
        <Button v-if="actionLabel" variant="primary" @click="handleAction">
          {{ actionLabel }}
        </Button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, type Component, type VNode } from 'vue'
import Button from './Button.vue'

type EmptyStateIcon = string | number | Component | VNode | null;

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    actionLabel?: string;
    icon?: EmptyStateIcon;
    onAction?: () => void;
  }>(),
  {
    icon: '🌱'
  }
)

const emit = defineEmits<{
  (event: 'action'): void;
  (event: 'onAction'): void;
}>()

const handleAction = () => {
  props.onAction?.()
  emit('action')
  emit('onAction')
}

const { title, description, actionLabel, icon } = toRefs(props)

const isIconComponent = computed(() => typeof icon.value === 'object' && icon.value !== null)
</script>

<style scoped>
.empty-state-fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.empty-state-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.empty-state-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
