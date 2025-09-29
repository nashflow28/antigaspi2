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
      path: '/merchant/products',
      name: 'merchant-products',
      component: () => import('@/views/merchant/ProductsView.vue'),
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
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const onboardingStore = useOnboardingStore()

  // Initialize stores if not already done
  if (authStore.token && !authStore.user) {
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
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Hide auth pages for authenticated users
  if (to.meta.hideForAuth && authStore.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (authStore.user) {
      switch (authStore.user.role) {
        case 'admin':
          next('/admin/dashboard')
          break
        case 'merchant':
          next('/merchant/dashboard')
          break
        case 'consumer':
        default:
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

    if (!allowedRoles.includes(userRole)) {
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

  next()
})

export default router
