<template>
  <Card :variant="variant" class="h-full" data-testid="stat-card">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {{ title }}
        </p>
        <p :class="['text-2xl font-semibold', accentConfig.valueColor]">
          <slot name="value">{{ value }}</slot>
        </p>
        <p v-if="description" class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ description }}
        </p>
        <div
          v-if="trend"
          :class="['flex items-center gap-2 text-xs font-medium', trendConfig.textColor]"
        >
          <component
            :is="trend.icon"
            v-if="trend.icon"
            class="h-4 w-4"
          />
          <span>{{ trend.value }}</span>
          <span class="font-normal">{{ trend.label }}</span>
        </div>
        <slot />
      </div>
      <div
        v-if="icon"
        :class="['flex h-12 w-12 items-center justify-center rounded-xl', accentConfig.iconWrapper, iconWrapper]"
      >
        <component
          :is="icon"
          class="h-6 w-6"
          :class="accentConfig.iconColor"
        />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Card, type CardVariant } from '@/components/ui/2025'

type TrendTone = 'positive' | 'neutral' | 'negative'

interface TrendMeta {
  value: string
  label: string
  icon?: Component
  tone?: TrendTone
}

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    description?: string
    icon?: Component
    iconWrapper?: string
    accent?: 'primary' | 'info' | 'success' | 'warning' | 'neutral'
    variant?: CardVariant
    trend?: TrendMeta | null
  }>(),
  {
    accent: 'primary',
    variant: 'glass',
    trend: null,
    description: undefined,
    iconWrapper: ''
  }
)

const accentConfig = computed(() => {
  const accents = {
    primary: {
      valueColor: 'text-primary-600 dark:text-primary-300',
      iconWrapper: 'bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-primary-500/20',
      iconColor: 'text-primary-600 dark:text-primary-300'
    },
    info: {
      valueColor: 'text-accent-blue dark:text-accent-blue/80',
      iconWrapper: 'bg-gradient-to-br from-accent-blue/10 to-accent-blue/20',
      iconColor: 'text-accent-blue'
    },
    success: {
      valueColor: 'text-primary-600 dark:text-primary-400',
      iconWrapper: 'bg-gradient-to-br from-primary-500/10 to-primary-500/25',
      iconColor: 'text-primary-500'
    },
    warning: {
      valueColor: 'text-accent-orange dark:text-accent-orange/90',
      iconWrapper: 'bg-gradient-to-br from-accent-orange/10 to-accent-orange/25',
      iconColor: 'text-accent-orange'
    },
    neutral: {
      valueColor: 'text-neutral-900 dark:text-neutral-100',
      iconWrapper: 'bg-neutral-100 dark:bg-neutral-800/80',
      iconColor: 'text-neutral-600 dark:text-neutral-200'
    }
  } as const

  return accents[props.accent] ?? accents.primary
})

const trendConfig = computed(() => {
  if (!props.trend) {
    return { textColor: 'text-neutral-500 dark:text-neutral-400' }
  }

  const tones: Record<TrendTone, string> = {
    positive: 'text-primary-600 dark:text-primary-400',
    neutral: 'text-neutral-500 dark:text-neutral-400',
    negative: 'text-accent-red dark:text-accent-red/90'
  }

  const tone = props.trend.tone ?? 'neutral'
  return { textColor: tones[tone] }
})
</script>
