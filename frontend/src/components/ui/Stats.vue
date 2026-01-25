<template>
  <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <template v-for="(stat, index) in stats" :key="stat.label">
      <Motion
        tag="div"
        class="rounded border border-primary-500/15 bg-white/90 p-6 shadow-lg backdrop-blur-md transition-all dark:bg-neutral-900/80"
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.08 } }"
      >
        <slot name="stat" :stat="stat" :index="index">
          <div class="flex items-center justify-start sm:justify-between">
            <span class="flex h-6 w-6 items-center justify-center rounded bg-primary-500/15 text-primary-900 dark:text-primary-200">
              <component :is="stat.icon" v-if="stat.icon" />
            </span>
            <span class="text-xs uppercase tracking-[0.18em] text-primary-500">Impact</span>
          </div>

          <div class="mt-4 flex items-baseline gap-2 text-h1 text-primary-900 dark:text-primary-100">
            <AnimatedCounter :value="stat.value" />
            <span v-if="stat.suffix" class="text-sm font-medium text-primary-500/80">{{ stat.suffix }}</span>
          </div>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-500">{{ stat.label }}</p>
        </slot>
      </Motion>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, onMounted, ref, watch, type Component } from 'vue'
import { MotionComponent as Motion } from '@vueuse/motion'
import { useTransition } from '@vueuse/core'

interface StatDefinition {
  icon?: Component
  value: number
  label: string
  suffix?: string
}

const props = defineProps<{
  stats: StatDefinition[]
}>()

const AnimatedCounter = defineComponent({
  name: 'AnimatedCounter',
  props: {
    value: {
      type: Number,
      required: true
    }
  },
  setup(counterProps) {
    const target = ref(0)
    const animated = useTransition(target, {
      duration: 1200,
      transition: (n: number) => 1 - (1 - n) * (1 - n)
    })

    const displayValue = computed(() => Math.floor(animated.value))
    const formatted = computed(() => displayValue.value.toLocaleString('fr-FR'))

    onMounted(() => {
      target.value = counterProps.value
    })

    watch(
      () => counterProps.value,
      (value) => {
        target.value = value
      }
    )

    return () => formatted.value
  }
})

const stats = computed(() => props.stats)
</script>
