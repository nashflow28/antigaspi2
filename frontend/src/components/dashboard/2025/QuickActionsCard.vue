<template>
  <Card :variant="variant">
    <template #header>
      <div class="flex items-center justify-between text-neutral-900 dark:text-neutral-100">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <slot name="header" />
      </div>
    </template>

    <div class="space-y-3">
      <Button
        v-for="action in actions"
        :key="action.id ?? action.label"
        :variant="action.variant ?? (action.to ? 'secondary' : 'ghost')"
        size="sm"
        :tag="action.to ? 'router-link' : 'button'"
        :to="action.to"
        class="w-full justify-between text-left"
        @click="() => handleAction(action)"
      >
        <div class="flex items-center gap-3">
          <div
            v-if="action.icon"
            :class="['flex h-9 w-9 items-center justify-center rounded-lg', iconTone(action)]"
          >
            <component :is="action.icon" class="h-4 w-4" />
          </div>
          <div>
            <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ action.label }}
            </p>
            <p v-if="action.description" class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ action.description }}
            </p>
          </div>
        </div>
        <slot name="indicator" :action="action">
          <ArrowRight class="h-4 w-4 text-primary-500" />
        </slot>
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { Card, Button } from '@/components/ui/2025'
import type { CardVariant, ButtonVariant } from '@/components/ui/2025'
import { ArrowRight } from 'lucide-vue-next'

interface QuickAction {
  id?: string | number
  label: string
  description?: string
  to?: string | Record<string, any>
  icon?: Component
  tone?: 'primary' | 'success' | 'warning' | 'neutral'
  variant?: ButtonVariant
  handler?: () => void
}

withDefaults(
  defineProps<{
    title: string
    actions: QuickAction[]
    variant?: CardVariant
  }>(),
  {
    variant: 'glass'
  }
)

const emit = defineEmits<{
  action: [QuickAction]
}>()

const toneMap: Record<NonNullable<QuickAction['tone']>, string> = {
  primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-300',
  success: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  warning: 'bg-accent-orange/15 text-accent-orange',
  neutral: 'bg-neutral-200/60 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-200'
}

const iconTone = (action: QuickAction) => {
  if (action.icon) {
    const tone = action.tone ?? 'primary'
    return toneMap[tone]
  }
  return ''
}

const handleAction = (action: QuickAction) => {
  action.handler?.()
  emit('action', action)
}
</script>
