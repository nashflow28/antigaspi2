import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Onboarding routes
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/onboarding/OnboardingFlow.vue'),
      meta: {
        requiresAuth: false,
        hideForAuth: false,
        showOnboarding: false // Ne pas montrer l'onboarding dans l'onboarding
      }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView2025.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false, hideForAuth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false, hideForAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/ProductsView2025.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('@/views/DiscoverView.vue'),
      meta: {
        requiresAuth: false,
        title: 'Découvrir les commerçants',
        breadcrumb: ['Accueil', 'Découvrir']
      }
    },
    {
      path: '/surprise-baskets',
      name: 'surprise-baskets',
      component: () => import('@/views/consumer/SurpriseBasketsView.vue'),
      meta: {
        requiresAuth: false,
        title: 'Paniers surprise',
        breadcrumb: ['Accueil', 'Paniers surprise']
      }
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetailView2025.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/views/CartPage.vue'),
      meta: {
        requiresAuth: false,
        title: 'Mon Panier',
        breadcrumb: ['Accueil', 'Panier']
      }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['consumer'],
        title: 'Finaliser la commande',
        breadcrumb: ['Panier', 'Commande']
      }
    },
    {
      path: '/products/:id/reserve',
      name: 'product-reserve',
      component: () => import('@/views/ProductReserveView2025.vue'),
      meta: { requiresAuth: true, roles: ['consumer'] }
    },
    {
      path: '/surprise-baskets/:id/reserve',
      name: 'surprise-basket-reserve',
      component: () => import('@/views/consumer/SurpriseBasketDetailView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['consumer'],
        title: 'Réserver un panier surprise',
        breadcrumb: ['Paniers surprise', 'Réservation']
      }
    },
    {
      path: '/merchants/map',
      name: 'merchants-map',
      component: () => import('@/views/MerchantsMapView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/merchants/:id',
      name: 'merchant-detail',
      component: () => import('@/views/MerchantDetailView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/views/ReviewsView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reviews/public',
      name: 'public-reviews',
      component: () => import('@/views/PublicReviewsView.vue'),
      meta: {
        requiresAuth: false,
        title: 'Avis de la communauté',
        breadcrumb: ['Accueil', 'Avis']
      }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Mes Favoris',
        breadcrumb: ['Accueil', 'Favoris']
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView2025.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('@/views/ProfileEditView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/NotificationsCenterView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications/inbox',
      name: 'notifications-inbox',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications/settings',
      name: 'notifications-settings',
      component: () => import('@/views/NotificationSettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reservations',
      name: 'reservations',
      component: () => import('@/views/ReservationsView.vue'),
      meta: { requiresAuth: true, roles: ['consumer'] }
    },
    {
      path: '/reservations/:id',
      name: 'reservation-detail',
      component: () => import('@/views/ReservationDetailView2025.vue'),
      meta: { requiresAuth: true, roles: ['consumer'] }
    },
    {
      path: '/loyalty',
      name: 'consumer-loyalty',
      component: () => import('@/views/consumer/LoyaltyDashboard.vue'),
      meta: { requiresAuth: true, roles: ['consumer'] }
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('@/views/WalletDashboard.vue'),
      meta: {
        requiresAuth: true,
        roles: ['consumer'],
        title: 'Portefeuille électronique',
        breadcrumb: ['Accueil', 'Portefeuille']
      }
    },
    {
      path: '/messaging',
      name: 'messaging',
      component: () => import('@/views/consumer/MessagingView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['consumer'],
        title: 'Messagerie commerçant',
        breadcrumb: ['Accueil', 'Messagerie']
      }
    },
    {
      path: '/messaging/conversations/:id',
      name: 'conversation-detail',
      component: () => import('@/views/consumer/MessagingView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['consumer'],
        title: 'Conversation commerçant',
        breadcrumb: ['Accueil', 'Messagerie', 'Conversation']
      }
    },
    {
      path: '/merchant',
      name: 'merchant',
      redirect: '/merchant/dashboard'
    },
    {
      path: '/merchant/dashboard',
      name: 'merchant-dashboard',
      component: () => import('@/views/merchant/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/analytics',
      name: 'merchant-analytics',
      component: () => import('@/views/merchant/AnalyticsView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/products',
      name: 'merchant-products',
      component: () => import('@/views/merchant/ProductsView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/opening-hours',
      name: 'merchant-opening-hours',
      component: () => import('@/views/OpeningHoursView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/products/create',
      name: 'merchant-product-create',
      component: () => import('@/views/merchant/ProductCreateView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/products/:id/edit',
      name: 'merchant-product-edit',
      component: () => import('@/views/merchant/ProductEditView2025.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/reservations',
      name: 'merchant-reservations',
      component: () => import('@/views/merchant/ReservationsView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/payments',
      name: 'merchant-payments',
      component: () => import('@/views/merchant/PaymentsView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['merchant'],
        title: 'Paiements & Portefeuille',
        breadcrumb: ['Espace commerçant', 'Paiements']
      }
    },
    {
      path: '/merchant/reviews/dashboard',
      name: 'merchant-reviews-dashboard',
      component: () => import('@/views/merchant/ReviewsDashboard.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/reviews',
      name: 'merchant-reviews',
      component: () => import('@/views/merchant/ReviewsList.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/surprise-baskets',
      name: 'merchant-surprise-baskets',
      component: () => import('@/views/merchant/SurpriseBasketsView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/loyalty',
      name: 'merchant-loyalty',
      component: () => import('@/views/merchant/LoyaltyManagement.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/admin',
      name: 'admin',
      redirect: '/admin/dashboard'
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/DashboardView2025.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/merchants',
      name: 'admin-merchants',
      component: () => import('@/views/admin/MerchantsView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('@/views/admin/CategoriesView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/reviews',
      name: 'admin-reviews',
      component: () => import('@/views/admin/ReviewModeration.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('@/views/admin/ProductsView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/payments',
      name: 'admin-payments',
      component: () => import('@/views/admin/PaymentDashboardView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('@/views/admin/SystemSettingsView.vue'),
      meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/gaspiz-demo',
      name: 'gaspiz-demo',
      component: () => import('@/views/GaspizInspiredHome.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/topbar-test',
      name: 'topbar-test',
      component: () => import('@/views/TopBarTestView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView2025.vue')
    },
    {
      path: '/products/:productId/reviews/add',
      name: 'ReviewAdd',
      component: () => import('@/views/ReviewAddView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  console.log('[Router Guard] Navigating to:', to.path, 'from:', _from.path)
  const authStore = useAuthStore()
  const onboardingStore = useOnboardingStore()

  console.log('[Router Guard] authStore.token:', !!authStore.token)
  console.log('[Router Guard] authStore.user:', authStore.user)
  console.log('[Router Guard] authStore.isAuthenticated:', authStore.isAuthenticated)

  // Initialize stores if not already done
  if (authStore.token && !authStore.user) {
    console.log('[Router Guard] Token exists but no user, initializing auth...')
    await authStore.initAuth()
  }

  // Initialize onboarding store
  onboardingStore.init()

  // Check if user should see onboarding
  const shouldShowOnboarding = onboardingStore.shouldShowOnboarding
  const isOnboardingRoute = to.name === 'onboarding'

  // TEMPORARILY DISABLED - Redirect to onboarding if needed (except for certain routes)
  // if (shouldShowOnboarding && !isOnboardingRoute && !skipOnboardingForRoute) {
  //   // Store the intended destination for after onboarding
  //   if (to.path !== '/') {
  //     sessionStorage.setItem('onboarding-redirect', to.fullPath)
  //   }
  //   next('/onboarding')
  //   return
  // }

  // If trying to access onboarding but already completed, redirect to home
  if (isOnboardingRoute && !shouldShowOnboarding) {
    next('/')
    return
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('[Router Guard] Route requires auth but user not authenticated, redirecting to login')
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Hide auth pages for authenticated users
  if (to.meta.hideForAuth && authStore.isAuthenticated) {
    console.log('[Router Guard] Auth page accessed by authenticated user, redirecting to dashboard')
    // Redirect to appropriate dashboard based on role
    if (authStore.user) {
      switch (authStore.user.role) {
        case 'admin':
          console.log('[Router Guard] Redirecting admin to /admin/dashboard')
          next('/admin/dashboard')
          break
        case 'merchant':
          console.log('[Router Guard] Redirecting merchant to /merchant/dashboard')
          next('/merchant/dashboard')
          break
        case 'consumer':
        default:
          console.log('[Router Guard] Redirecting consumer to /dashboard')
          next('/dashboard')
      }
    } else {
      next('/dashboard')
    }
    return
  }

  // Check role-based access
  if (to.meta.roles && authStore.user) {
    const userRole = authStore.user.role
    const allowedRoles = to.meta.roles as string[]

    console.log('[Router Guard] Checking role-based access - User role:', userRole, 'Allowed:', allowedRoles)

    if (!allowedRoles.includes(userRole)) {
      console.log('[Router Guard] User role not allowed for this route, redirecting')
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'admin':
          next('/admin/dashboard')
          break
        case 'merchant':
          next('/merchant/dashboard')
          break
        case 'consumer':
          next('/dashboard')
          break
        default:
          next({ name: 'login', query: { redirect: to.fullPath } })
      }
      return
    }
  }

  console.log('[Router Guard] All checks passed, proceeding to route')
  next()
})

export default router
