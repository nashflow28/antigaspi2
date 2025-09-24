<template>
  <footer class="mt-24 bg-primary-700 text-neutral-50">
    <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
      <Motion
        tag="div"
        :initial="{ opacity: 0, y: 12 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 0.5 } }"
        class="space-y-1"
      >
        <slot name="brand" :year="currentYear">
          <p class="text-h3 font-semibold tracking-tight">{{ brandName }}</p>
          <p class="text-small text-neutral-100/80">© {{ currentYear }} — {{ tagline }}</p>
        </slot>
      </Motion>

      <div class="flex items-center gap-4 text-neutral-100/80">
        <slot name="socials" :networks="networks">
          <template v-for="network in networks" :key="network.name">
            <Motion
              tag="a"
              :href="network.href"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/20"
              :hovered="{ scale: 1.08 }"
              :tapped="{ scale: 0.95 }"
              :aria-label="`Ouvrir ${network.name}`"
            >
              <component
                v-if="network.icon"
                :is="network.icon"
                class="h-5 w-5"
                aria-hidden="true"
              />
              <span v-else class="sr-only">{{ network.name }}</span>
            </Motion>
          </template>
        </slot>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, h } from 'vue'
import { MotionComponent as Motion } from '@vueuse/motion'

interface SocialNetwork {
  name: string
  href: string
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    brandName?: string
    tagline?: string
    networks?: SocialNetwork[]
  }>(),
  {
    brandName: 'Antigaspi',
    tagline: 'Ensemble, réduisons le gaspillage alimentaire.',
    networks: () => [
      { name: 'twitter', href: '#' },
      { name: 'github', href: '#' },
      { name: 'linkedin', href: '#' },
    ],
  },
)

const currentYear = new Date().getFullYear()

const networks = computed(() =>
  props.networks.map((network) => {
    if (network.icon) {
      return network
    }

    return {
      ...network,
      icon: {
        render() {
          return h(
            'svg',
            {
              class: 'h-5 w-5',
              fill: 'currentColor',
              viewBox: '0 0 24 24',
              'aria-hidden': 'true',
            },
            [
              h('path', { d: 'M0 0h24v24H0z', fill: 'none' }),
              h('path', {
                d: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.189 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996A4.107 4.107 0 0016.616 4c-2.266 0-4.103 1.835-4.103 4.102 0 .322.036.636.106.937-3.41-.171-6.437-1.804-8.463-4.287a4.07 4.07 0 00-.556 2.064 4.102 4.102 0 001.826 3.417 4.072 4.072 0 01-1.859-.513v.052c0 2.044 1.454 3.748 3.387 4.137a4.11 4.11 0 01-1.852.07c.522 1.63 2.038 2.818 3.833 2.853A8.233 8.233 0 012 18.408a11.616 11.616 0 006.29 1.84',
              }),
            ],
          )
        },
      } as unknown as Component,
    }
  }),
)

const brandName = computed(() => props.brandName)
const tagline = computed(() => props.tagline)
</script>
