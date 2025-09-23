<template>
  <div class="mobile-layout min-h-screen bg-gaspiz-cream relative">
    <!-- Skip navigation pour l'accessibilité -->
    <a
      href="#main-content"
      class="skip-link"
    >
      Aller au contenu principal
    </a>

    <!-- SimpleTopBar - Version sans CSS problématique -->
    <SimpleTopBar
      :page-title="pageTitle"
      :subtitle="subtitle"
      :show-search="showSearch"
      :cart-items-count="cartItemsCount"
      :notifications-count="notificationsCount"
      :is-authenticated="isAuthenticated"
      :user-name="userName"
      :user-email="userEmail"
      :user-avatar="userAvatar"
      @search-click="$emit('searchClick')"
      @notifications-click="$emit('notificationsClick')"
      @cart-click="$emit('cartClick')"
      @login-click="$emit('loginClick')"
      @logout="$emit('logout')"
    />

    <!-- Main content area -->
    <main
      id="main-content"
      class="main-content pt-16 pb-24 min-h-screen"
      :class="{
        'px-4': !fullWidth,
        'max-w-md mx-auto': !fullWidth && centered
      }"
      role="main"
    >
      <div
        v-if="showPageHeader"
        class="page-header py-6"
      >
        <h1
          v-if="mainTitle"
          class="text-2xl font-bold text-gray-900 mb-2"
        >
          {{ mainTitle }}
        </h1>
        <p
          v-if="mainSubtitle"
          class="text-gray-600"
        >
          {{ mainSubtitle }}
        </p>
      </div>

      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center justify-center py-12"
        aria-live="polite"
        aria-label="Chargement en cours"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="loading-spinner"></div>
          <p class="text-gray-500 text-sm">{{ loadingText }}</p>
        </div>
      </div>

      <!-- Content slot -->
      <div
        v-else
        class="content-wrapper"
        :class="contentClasses"
      >
        <slot />
      </div>

      <!-- Empty state -->
      <div
        v-if="showEmptyState && !loading"
        class="empty-state flex flex-col items-center justify-center py-12 text-center"
      >
        <div class="empty-icon w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <component
            :is="emptyStateIcon"
            :size="32"
            class="text-gray-400"
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ emptyStateTitle }}
        </h3>
        <p class="text-gray-500 mb-6 max-w-xs">
          {{ emptyStateDescription }}
        </p>
        <button
          v-if="emptyStateAction"
          @click="$emit('emptyStateAction')"
          class="btn btn-primary"
        >
          {{ emptyStateActionText }}
        </button>
      </div>
    </main>

    <!-- BottomNavigation -->
    <BottomNavigation
      :favorites-count="favoritesCount"
      @nav-click="handleNavClick"
    />

    <!-- Floating Action Button (FAB) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-0 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-0 translate-y-4"
    >
      <button
        v-if="showFab && fabAction"
        @click="$emit('fabClick')"
        class="fab fixed bottom-28 right-4 z-30 w-14 h-14 bg-gradient-to-r from-primary to-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
        :aria-label="fabLabel"
      >
        <component
          :is="fabIcon"
          :size="24"
        />
      </button>
    </Transition>

    <!-- Toast notifications -->
    <Teleport to="body">
      <div
        v-if="toast.show"
        class="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-2 scale-95"
        >
          <div
            v-if="toast.show"
            class="toast bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 p-4 flex items-center gap-3"
            :class="toastClasses"
            role="alert"
            :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          >
            <div class="toast-icon">
              <component
                :is="toastIcon"
                :size="20"
              />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">{{ toast.message }}</p>
            </div>
            <button
              @click="hideToast"
              class="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer la notification"
            >
              <X :size="16" />
            </button>
          </div>
        </Transition>
      </div>
    </Teleport>

    <!-- Scroll to top button -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-0"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-0"
    >
      <button
        v-if="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-28 left-4 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center active:scale-95"
        aria-label="Retour en haut"
      >
        <ChevronUp :size="20" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  X,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Plus,
  Search,
  Package
} from 'lucide-vue-next'
import SimpleTopBar from '@/components/ui/SimpleTopBar.vue'
import BottomNavigation from '@/components/ui/BottomNavigation.vue'

// Props
interface Props {
  pageTitle?: string
  subtitle?: string
  mainTitle?: string
  mainSubtitle?: string
  showSearch?: boolean
  showPageHeader?: boolean
  fullWidth?: boolean
  centered?: boolean
  cartItemsCount?: number
  notificationsCount?: number
  favoritesCount?: number
  isAuthenticated?: boolean
  userName?: string
  userEmail?: string
  userAvatar?: string
  loading?: boolean
  loadingText?: string
  showEmptyState?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: any
  emptyStateAction?: boolean
  emptyStateActionText?: string
  showFab?: boolean
  fabIcon?: any
  fabLabel?: string
  fabAction?: boolean
  contentClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: 'Antigaspi',
  subtitle: '',
  mainTitle: '',
  mainSubtitle: '',
  showSearch: true,
  showPageHeader: false,
  fullWidth: false,
  centered: true,
  cartItemsCount: 0,
  notificationsCount: 0,
  favoritesCount: 0,
  isAuthenticated: false,
  userName: '',
  userEmail: '',
  userAvatar: '',
  loading: false,
  loadingText: 'Chargement...',
  showEmptyState: false,
  emptyStateTitle: 'Aucun contenu',
  emptyStateDescription: 'Il n\'y a rien à afficher pour le moment.',
  emptyStateIcon: Package,
  emptyStateAction: false,
  emptyStateActionText: 'Actualiser',
  showFab: false,
  fabIcon: Plus,
  fabLabel: 'Ajouter',
  fabAction: false,
  contentClasses: ''
})

// Composables
const route = useRoute()

// Reactive state
const showScrollTop = ref(false)
const toast = ref({
  show: false,
  type: 'info' as 'success' | 'error' | 'warning' | 'info',
  message: ''
})

// Computed
const toastIcon = computed(() => {
  switch (toast.value.type) {
    case 'success': return CheckCircle
    case 'error': return AlertCircle
    case 'warning': return AlertTriangle
    default: return Info
  }
})

const toastClasses = computed(() => {
  switch (toast.value.type) {
    case 'success': return 'border-green-200 text-green-800'
    case 'error': return 'border-red-200 text-red-800'
    case 'warning': return 'border-yellow-200 text-yellow-800'
    default: return 'border-blue-200 text-blue-800'
  }
})

// Emits
const emit = defineEmits<{
  searchClick: []
  notificationsClick: []
  cartClick: []
  logout: []
  emptyStateAction: []
  fabClick: []
  navClick: [section: string]
}>()

// Methods
const handleNavClick = (section: string) => {
  emit('navClick', section)
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  toast.value = {
    show: true,
    type,
    message
  }

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideToast()
  }, 5000)
}

const hideToast = () => {
  toast.value.show = false
}

// Scroll handling
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Expose methods
defineExpose({
  showToast,
  hideToast,
  scrollToTop
})
</script>

<style scoped>
/* Layout principal */
.mobile-layout {
  background-color: hsl(var(--gaspiz-cream));
}

/* Safe areas pour les appareils avec encoche - Enhanced */
.main-content {
  padding-top: max(4rem, calc(4rem + env(safe-area-inset-top)));
  padding-bottom: max(6rem, calc(6rem + env(safe-area-inset-bottom)));
  padding-left: max(0px, env(safe-area-inset-left));
  padding-right: max(0px, env(safe-area-inset-right));
  /* Optimisation viewport mobile */
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

/* Page header */
.page-header {
  @apply border-b border-gray-200/50 mb-6 pb-6;
}

/* Loading spinner */
.loading-spinner {
  @apply w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin;
}

/* FAB styles */
.fab {
  @apply drop-shadow-lg;
}

.fab:hover {
  @apply scale-105;
}

.fab:active {
  @apply scale-95;
}

/* Toast styles */
.toast {
  @apply animate-in;
}

/* Empty state */
.empty-state {
  min-height: 300px;
}

/* Content wrapper */
.content-wrapper {
  @apply space-y-4;
}

/* Mobile-first responsive adjustments */
@media (max-width: 320px) {
  .main-content {
    @apply px-2;
  }

  .toast {
    @apply mx-2 max-w-none;
  }

  .fab {
    @apply w-12 h-12 bottom-24 right-2;
  }
}

@media (max-width: 375px) {
  .mobile-layout {
    font-size: 14px;
  }

  .page-header {
    @apply py-4 mb-4;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    @apply space-y-3;
  }

  .empty-state {
    min-height: 250px;
    @apply py-8;
  }
}

/* Landscape mobile optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .main-content {
    padding-top: max(3rem, calc(3rem + env(safe-area-inset-top)));
    padding-bottom: max(4rem, calc(4rem + env(safe-area-inset-bottom)));
  }

  .page-header {
    @apply py-2 mb-3;
  }

  .fab {
    @apply bottom-20;
  }
}

/* Accessibilité */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-medium;
}

/* Mode sombre optimisé mobile */
@media (prefers-color-scheme: dark) {
  .mobile-layout {
    @apply bg-gray-900;
    /* Améliorer le contraste pour mobile */
    color-scheme: dark;
  }

  .page-header {
    @apply border-gray-800;
  }

  .empty-icon {
    @apply bg-gray-800;
  }

  .toast {
    @apply bg-gray-800/95 border-gray-700 text-gray-100;
  }

  .main-content {
    @apply text-gray-100;
  }

  .fab {
    @apply shadow-2xl;
  }
}

/* Mode haut contraste pour accessibilité mobile */
@media (prefers-contrast: high) {
  .mobile-layout {
    --tw-bg-opacity: 1;
  }

  .toast {
    @apply border-2 border-gray-900;
  }

  .fab {
    @apply border-2 border-white;
  }
}

/* Préférences de mouvement réduit */
@media (prefers-reduced-motion: reduce) {
  .main-content {
    scroll-behavior: auto;
  }

  .fab,
  .toast,
  .loading-spinner {
    animation: none !important;
    transition: none !important;
  }

  .page-transition-enter-active,
  .page-transition-leave-active {
    transition: none !important;
  }
}

/* Réduction du mouvement */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    @apply animate-none;
  }

  * {
    @apply transition-none;
  }

  .fab:hover,
  .fab:active {
    @apply scale-100;
  }
}

/* Optimisation des performances mobiles */
.main-content {
  contain: layout style;
  /* GPU acceleration pour scroll fluide */
  transform: translateZ(0);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.content-wrapper {
  transform: translateZ(0);
  will-change: scroll-position;
  /* Optimisation rendu mobile */
  contain: layout style paint;
}

/* Touch optimizations */
.mobile-layout {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Scroll snap pour navigation fluide */
.main-content {
  scroll-snap-type: y proximity;
}

.page-header,
.content-wrapper > * {
  scroll-snap-align: start;
}

/* Performance pour animations */
.fab,
.toast,
.loading-spinner {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* Optimisation images pour mobile */
.mobile-layout img {
  content-visibility: auto;
  contain-intrinsic-size: 300px 200px;
}

/* Réduction de la complexité visuelle sur petits écrans */
@media (max-width: 360px) {
  .shadow-lg {
    @apply shadow-md;
  }

  .backdrop-blur-md {
    @apply backdrop-blur-sm;
  }

  .rounded-2xl {
    @apply rounded-xl;
  }
}
</style>