<template>
  <header :class="wrapperClasses">
    <div class="sr-only focus-within:not-sr-only">
      <a
        v-if="skipToContentHref"
        :href="skipToContentHref"
        class="skip-link focus-2025"
      >
        Aller au contenu principal
      </a>
      <a
        :href="`#${navElementId}`"
        class="skip-link focus-2025"
      >
        Aller à la navigation
      </a>
    </div>

    <nav
      :id="navElementId"
      class="relative mx-auto w-full max-w-7xl overflow-hidden rounded-b-3xl border border-white/20 bg-white/85 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-all duration-500 ease-spring-out dark:border-dark-700/60 dark:bg-dark-900/80"
      role="navigation"
      :aria-label="ariaLabel"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
      >
        <div class="absolute inset-0 bg-nav-gradient opacity-70 dark:opacity-60" />
        <div class="absolute inset-x-0 bottom-[-60%] h-[120%] rounded-[50%] bg-white/40 blur-3xl dark:bg-primary-500/10" />
      </div>

      <div class="relative flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:gap-6">
        <div class="flex flex-1 items-center gap-3">
          <slot name="brand" :brand="brand">
            <component
              :is="brandComponent"
              v-bind="brandAttrs"
              class="group inline-flex items-center gap-3 rounded-full px-3 py-2 text-neutral-900 transition-all duration-300 ease-spring-out focus-2025 hover:-translate-y-0.5 hover:text-primary-900 dark:text-dark-50"
            >
              <div
                v-if="brand.logo"
                class="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-accent-blue/70 to-accent-blue text-white shadow-lg shadow-primary-500/30 transition-transform duration-500 group-hover:scale-105"
              >
                <component :is="brand.logo" class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="flex flex-col">
                <span class="text-base font-semibold tracking-tight text-neutral-900 dark:text-dark-50">{{ brand.name }}</span>
                <span
                  v-if="brand.tagline"
                  class="text-xs font-medium text-neutral-500 transition-colors duration-300 group-hover:text-neutral-700 dark:text-dark-300"
                >
                  {{ brand.tagline }}
                </span>
              </div>
            </component>
          </slot>
        </div>

        <div
          class="hidden flex-1 items-center justify-center gap-1 lg:flex"
          role="menubar"
          aria-label="Liens principaux"
        >
          <template v-if="hasPrimarySlot">
            <slot name="primary" :close-mobile="closeMobile" />
          </template>
          <template v-else>
            <component
              :is="linkComponent(link)"
              v-for="link in mainLinks"
              :key="linkKey(link)"
              v-bind="linkAttrs(link)"
              class="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:text-primary-900 dark:text-dark-100"
              role="menuitem"
              :aria-label="link.ariaLabel || link.label"
              :aria-current="link.active ? 'page' : undefined"
              @click="handleLinkClick(link, 'primary')"
            >
              <component
                :is="link.icon"
                v-if="link.icon"
                class="h-4 w-4 text-primary-500"
                aria-hidden="true"
              />
              <span>{{ link.label }}</span>
              <span
                v-if="link.badge"
                class="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-600"
              >
                {{ link.badge }}
              </span>
              <span
                v-if="link.active"
                class="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary-500/80"
                aria-hidden="true"
              />
            </component>
          </template>
        </div>

        <div class="hidden flex-1 items-center justify-end gap-3 lg:flex">
          <template v-if="hasSecondarySlot">
            <slot name="secondary" :close-mobile="closeMobile" />
          </template>
          <template v-else>
            <component
              :is="linkComponent(action)"
              v-for="action in secondaryLinks"
              :key="linkKey(action)"
              v-bind="linkAttrs(action)"
              class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-white/40 hover:text-primary-900 dark:text-dark-100 dark:hover:bg-dark-700/40"
              role="menuitem"
              :aria-label="action.ariaLabel || action.label"
              :aria-current="action.active ? 'page' : undefined"
              @click="handleLinkClick(action, 'secondary')"
            >
              <component
                :is="action.icon"
                v-if="action.icon"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span>{{ action.label }}</span>
            </component>
            <component
              v-if="authCta?.login"
              :is="linkComponent(authCta.login)"
              v-bind="linkAttrs(authCta.login)"
              class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:text-primary-900 dark:text-dark-100"
              role="menuitem"
              :aria-label="authCta.login.ariaLabel || authCta.login.label"
              @click="handleLinkClick(authCta.login, 'auth')"
            >
              <component
                :is="authCta.login.icon"
                v-if="authCta.login.icon"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span>{{ authCta.login.label }}</span>
            </component>
            <Button
              v-if="authCta?.primary"
              :variant="authCta.primary.variant ?? 'primary'"
              size="sm"
              class="shadow-lg shadow-primary-500/20"
              @click="handlePrimaryCta(authCta.primary)"
            >
              <component
                :is="authCta.primary.icon"
                v-if="authCta.primary.icon"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span>{{ authCta.primary.label }}</span>
            </Button>
          </template>
        </div>

        <div class="flex flex-1 items-center justify-end gap-2 lg:hidden">
          <slot name="utilities" :close-mobile="closeMobile" />
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/70 text-neutral-700 shadow-sm transition-all duration-300 ease-spring-out focus-2025 hover:-translate-y-0.5 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/80 dark:text-dark-100"
            :aria-expanded="isMobileOpen"
            :aria-controls="mobileMenuId"
            aria-label="Ouvrir le menu de navigation"
            @click="toggleMobile"
          >
            <span class="sr-only">Basculer le menu</span>
            <svg
              v-if="!isMobileOpen"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-300 ease-spring-out"
        enter-from-class="-translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-out"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="isMobileOpen"
          :id="mobileMenuId"
          class="border-t border-white/40 bg-white/90 px-4 pb-5 pt-4 shadow-inner dark:border-dark-700/60 dark:bg-dark-900/95 lg:hidden"
          role="dialog"
          aria-label="Menu mobile"
        >
          <div class="space-y-4">
            <div class="space-y-2" role="menubar" aria-label="Liens principaux">
              <template v-if="hasMobilePrimarySlot">
                <slot name="mobile-primary" :close-mobile="closeMobile" />
              </template>
              <template v-else>
                <component
                  :is="linkComponent(link)"
                  v-for="link in mainLinks"
                  :key="`mobile-${linkKey(link)}`"
                  v-bind="linkAttrs(link)"
                  class="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition-all duration-300 ease-spring-out focus-2025 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/70 dark:text-dark-50"
                  role="menuitem"
                  :aria-current="link.active ? 'page' : undefined"
                  :aria-label="link.ariaLabel || link.label"
                  @click="handleMobileSelection(link, 'primary')"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="link.icon"
                      v-if="link.icon"
                      class="h-4 w-4 text-primary-500"
                      aria-hidden="true"
                    />
                    <span>{{ link.label }}</span>
                  </div>
                  <span
                    v-if="link.badge"
                    class="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-600"
                  >
                    {{ link.badge }}
                  </span>
                </component>
              </template>
            </div>

            <div class="space-y-2" role="group" aria-label="Actions">
              <template v-if="hasMobileSecondarySlot">
                <slot name="mobile-secondary" :close-mobile="closeMobile" />
              </template>
              <template v-else>
                <component
                  :is="linkComponent(action)"
                  v-for="action in secondaryLinks"
                  :key="`mobile-action-${linkKey(action)}`"
                  v-bind="linkAttrs(action)"
                  class="flex items-center justify-between rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/70 dark:text-dark-50"
                  role="menuitem"
                  :aria-label="action.ariaLabel || action.label"
                  @click="handleMobileSelection(action, 'secondary')"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="action.icon"
                      v-if="action.icon"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{{ action.label }}</span>
                  </div>
                </component>

                <div v-if="authCta" class="flex flex-col gap-2">
                  <component
                    v-if="authCta.login"
                    :is="linkComponent(authCta.login)"
                    v-bind="linkAttrs(authCta.login)"
                    class="flex items-center justify-center rounded-full border border-primary-500/40 bg-primary-50/40 px-4 py-3 text-sm font-semibold text-primary-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-primary-100"
                    role="menuitem"
                    :aria-label="authCta.login.ariaLabel || authCta.login.label"
                    @click="handleMobileSelection(authCta.login, 'auth')"
                  >
                    <component
                      :is="authCta.login.icon"
                      v-if="authCta.login.icon"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{{ authCta.login.label }}</span>
                  </component>
                  <Button
                    v-if="authCta.primary"
                    :variant="authCta.primary.variant ?? 'primary'"
                    size="lg"
                    class="w-full"
                    @click="handleMobilePrimaryCta(authCta.primary)"
                  >
                    <component
                      :is="authCta.primary.icon"
                      v-if="authCta.primary.icon"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{{ authCta.primary.label }}</span>
                  </Button>
                </div>
              </template>
            </div>

            <div v-if="hasMobileFooterSlot" class="border-t border-white/60 pt-3 dark:border-dark-700/60">
              <slot name="mobile-footer" :close-mobile="closeMobile" />
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, useSlots, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useWindowScroll } from '@vueuse/core'
import Button from './Button.vue'

export interface NavigationLink {
  id?: string | number
  label: string
  to?: string
  href?: string
  ariaLabel?: string
  icon?: any
  badge?: string
  active?: boolean
  external?: boolean
}

export interface NavigationCta {
  label: string
  to?: string
  href?: string
  icon?: any
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'promo' | 'destructive'
  ariaLabel?: string
}

export interface NavigationBrand {
  name: string
  to?: string
  href?: string
  tagline?: string
  logo?: any
}

const props = withDefaults(
  defineProps<{
    brand?: NavigationBrand
    mainLinks?: NavigationLink[]
    secondaryLinks?: NavigationLink[]
    authCta?: { login?: NavigationLink; primary?: NavigationCta | null } | null
    ariaLabel?: string
    skipToContentId?: string | null
    navId?: string
    mobileOpen?: boolean
    defaultMobileOpen?: boolean
    sticky?: boolean
  }>(),
  {
    brand: () => ({ name: 'Antigaspi', to: '/' }),
    mainLinks: () => [],
    secondaryLinks: () => [],
    authCta: null,
    ariaLabel: 'Navigation principale',
    skipToContentId: 'main-content',
    navId: undefined,
    mobileOpen: undefined,
    defaultMobileOpen: false,
    sticky: true
  }
)

const emit = defineEmits<{
  'update:mobileOpen': [value: boolean]
  'toggle-mobile': [value: boolean]
  'link-click': [link: NavigationLink, section: 'primary' | 'secondary' | 'auth']
  'cta-click': [cta: NavigationCta]
}>()

const slots = useSlots()

const { y } = useWindowScroll()

const generatedId = useId()
const navElementId = computed(() => props.navId ?? `navigation-${generatedId}`)
const mobileMenuId = computed(() => `${navElementId.value}-mobile`)

const skipToContentHref = computed(() =>
  props.skipToContentId ? `#${props.skipToContentId}` : null
)

const brand = computed(() => props.brand ?? { name: 'Antigaspi', to: '/' })

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

const hasPrimarySlot = computed(() => Boolean(slots.primary))
const hasSecondarySlot = computed(() => Boolean(slots.secondary))
const hasMobilePrimarySlot = computed(() => Boolean(slots['mobile-primary']))
const hasMobileSecondarySlot = computed(() => Boolean(slots['mobile-secondary']))
const hasMobileFooterSlot = computed(() => Boolean(slots['mobile-footer']))

const wrapperClasses = computed(() => {
  const classes = [
    'z-[120] w-full',
    props.sticky ? 'sticky top-0' : 'relative',
    y.value > 12
      ? 'drop-shadow-[0_10px_35px_rgba(15,23,42,0.25)]'
      : 'drop-shadow-none'
  ]
  return classes.join(' ')
})

const internalMobileOpen = ref(props.defaultMobileOpen)

watch(
  () => props.mobileOpen,
  value => {
    if (value !== undefined) {
      internalMobileOpen.value = value
    }
  }
)

const isMobileOpen = computed({
  get: () => (props.mobileOpen === undefined ? internalMobileOpen.value : props.mobileOpen),
  set: value => {
    if (props.mobileOpen === undefined) {
      internalMobileOpen.value = value
    }
    emit('update:mobileOpen', value)
    emit('toggle-mobile', value)
  }
})

const linkComponent = (link: NavigationLink) => (link.to ? RouterLink : link.href ? 'a' : 'button')

const linkAttrs = (link: NavigationLink) => {
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
  return {
    type: 'button'
  }
}

const linkKey = (link: NavigationLink) => link.id ?? link.label

const closeMobile = () => {
  isMobileOpen.value = false
}

const handleLinkClick = (link: NavigationLink, section: 'primary' | 'secondary' | 'auth') => {
  emit('link-click', link, section)
}

const handlePrimaryCta = (cta: NavigationCta) => {
  emit('cta-click', cta)
}

const handleMobileSelection = (link: NavigationLink, section: 'primary' | 'secondary' | 'auth') => {
  emit('link-click', link, section)
  closeMobile()
}

const handleMobilePrimaryCta = (cta: NavigationCta) => {
  emit('cta-click', cta)
  closeMobile()
}

const toggleMobile = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobile()
  }
}

watch(
  () => isMobileOpen.value,
  value => {
    if (value) {
      window.addEventListener('keydown', handleEscape)
    } else {
      window.removeEventListener('keydown', handleEscape)
    }
  }
)

onMounted(() => {
  if (isMobileOpen.value) {
    window.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>
