import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
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
      component: () => import('@/views/ProductsView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/products/:id/reserve',
      name: 'product-reserve',
      component: () => import('@/views/ProductReserveView.vue'),
      meta: { requiresAuth: true, roles: ['consumer'] }
    },
    {
      path: '/merchants/map',
      name: 'merchants-map',
      component: () => import('@/views/MerchantsMapView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/views/ReviewsView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
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
      component: () => import('@/views/merchant/ProductEditView.vue'),
      meta: { requiresAuth: true, roles: ['merchant'] }
    },
    {
      path: '/merchant/reservations',
      name: 'merchant-reservations',
      component: () => import('@/views/merchant/ReservationsView.vue'),
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
      component: () => import('@/views/admin/DashboardView.vue'),
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (authStore.token && !authStore.user) {
    await authStore.initAuth()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
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
          next('/login')
      }
      return
    }
  }

  next()
})

export default router