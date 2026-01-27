<template>
  <footer
    class="border-t border-primary-200/30 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-neutral-50 dark:border-dark-700/60 dark:from-dark-900 dark:via-dark-900 dark:to-dark-950"
  >
    <div
      class="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"
    >
      <div class="space-y-3">
        <slot name="brand" :brand="brand" :year="currentYear">
          <component
            :is="brandComponent"
            v-bind="brandAttrs"
            class="group inline-flex items-center gap-3 transition-all duration-300 focus-2025 hover:opacity-90"
          >
            <div
              v-if="brand.logo"
              class="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
            >
              <component
                :is="brand.logo"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-semibold tracking-tight text-white">
                {{ brand.name }}
              </span>
              <span
                v-if="brand.tagline"
                class="text-sm font-medium text-white/70"
              >
                {{ brand.tagline }}
              </span>
            </div>
          </component>
        </slot>

        <p class="text-sm text-white/60">
          &copy; {{ currentYear }} {{ brandName }} &mdash; {{ tagline }}
        </p>
      </div>

      <div class="flex flex-col items-start gap-4 sm:items-end">
        <div v-if="quickLinks.length > 0" class="flex flex-wrap gap-4">
          <component
            :is="linkComponent(link)"
            v-for="link in quickLinks"
            :key="linkKey(link)"
            v-bind="linkAttrs(link)"
            class="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white focus-2025"
            @click="handleLinkClick(link)"
          >
            {{ link.label }}
          </component>
        </div>

        <div class="flex items-center gap-3">
          <slot name="socials" :networks="networks">
            <a
              v-for="network in resolvedNetworks"
              :key="network.name"
              :href="network.href"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white focus-2025"
              :aria-label="`Ouvrir ${network.name}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <component
                :is="network.icon"
                v-if="network.icon"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span v-else class="sr-only">{{ network.name }}</span>
            </a>
          </slot>
        </div>
      </div>
    </div>

    <div
      v-if="$slots.bottom"
      class="border-t border-white/10 bg-black/10"
    >
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <slot name="bottom" />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { RouterLink } from 'vue-router'

export interface FooterLink {
  id?: string | number
  label: string
  to?: string
  href?: string
  external?: boolean
}

export interface FooterBrand {
  name: string
  to?: string
  href?: string
  tagline?: string
  logo?: Component
}

export interface SocialNetwork {
  name: string
  href: string
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    brand?: FooterBrand
    brandName?: string
    tagline?: string
    quickLinks?: FooterLink[]
    networks?: SocialNetwork[]
  }>(),
  {
    brand: () => ({ name: 'GÊLADAL', to: '/' }),
    brandName: 'GÊLADAL',
    tagline: 'Ensemble, réduisons le gaspillage alimentaire.',
    quickLinks: () => [],
    networks: () => [
      { name: 'Twitter', href: '#' },
      { name: 'GitHub', href: '#' },
      { name: 'LinkedIn', href: '#' }
    ]
  }
)

const emit = defineEmits<{
  'link-click': [link: FooterLink]
}>()

const currentYear = new Date().getFullYear()

const brand = computed(() => props.brand)

const brandComponent = computed(() =>
  brand.value.to ? RouterLink : brand.value.href ? 'a' : 'div'
)

const brandAttrs = computed(() => {
  if (brand.value.to) {
    return { to: brand.value.to }
  }
  if (brand.value.href) {
    return {
      href: brand.value.href,
      target: '_blank',
      rel: 'noopener'
    }
  }
  return {}
})

const linkComponent = (link: FooterLink) =>
  link.to ? RouterLink : link.href ? 'a' : 'span'

const linkAttrs = (link: FooterLink) => {
  if (link.to) {
    return { to: link.to }
  }
  if (link.href) {
    return {
      href: link.href,
      target: link.external ? '_blank' : undefined,
      rel: link.external ? 'noopener noreferrer' : undefined
    }
  }
  return {}
}

const linkKey = (link: FooterLink) => link.id ?? link.label

const handleLinkClick = (link: FooterLink) => {
  emit('link-click', link)
}

// Generate default icons for networks without icons
const resolvedNetworks = computed(() =>
  props.networks.map((network) => {
    if (network.icon) {
      return network
    }

    // Default Twitter icon for demonstration
    return {
      ...network,
      icon: {
        render() {
          const iconPaths: Record<string, string> = {
            twitter:
              'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996A4.107 4.107 0 0016.616 4c-2.266 0-4.103 1.835-4.103 4.102 0 .322.036.636.106.937-3.41-.171-6.437-1.804-8.463-4.287a4.07 4.07 0 00-.556 2.064 4.102 4.102 0 001.826 3.417 4.072 4.072 0 01-1.859-.513v.052c0 2.044 1.454 3.748 3.387 4.137a4.11 4.11 0 01-1.852.07c.522 1.63 2.038 2.818 3.833 2.853A8.233 8.233 0 012 18.408a11.616 11.616 0 006.29 1.84',
            github:
              'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
            linkedin:
              'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
            facebook:
              'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
            instagram:
              'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z'
          }

          const pathData =
            iconPaths[network.name.toLowerCase()] || iconPaths.twitter

          return h(
            'svg',
            {
              class: 'h-4 w-4',
              fill: 'currentColor',
              viewBox: '0 0 24 24',
              'aria-hidden': 'true'
            },
            [h('path', { d: pathData })]
          )
        }
      } as unknown as Component
    }
  })
)
</script>
