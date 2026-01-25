import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChartBarIcon,
  CalendarDaysIcon,
  SparklesIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  UsersIcon,
  GiftIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  MapIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

type Role = 'consumer' | 'merchant' | 'admin' | 'driver'

type NavigationConfig = {
  label: string
  href: string
  icon?: Component
  routes: string[]
  badge?: string
}

type BrandConfig = {
  name: string
  logo?: Component
}

const navigationByRole: Record<Role, NavigationConfig[]> = {
  consumer: [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: ChartBarIcon,
      routes: ['dashboard']
    },
    {
      label: 'Mes réservations',
      href: '/reservations',
      icon: CalendarDaysIcon,
      routes: ['reservations', 'reservation-detail']
    },
    {
      label: 'Mes livraisons',
      href: '/deliveries/history',
      icon: TruckIcon,
      routes: ['delivery-history', 'delivery-tracking', 'delivery-request', 'delivery-rating']
    },
    {
      label: 'Mon portefeuille',
      href: '/wallet',
      icon: BanknotesIcon,
      routes: ['wallet']
    },
    {
      label: 'Programme fidélité',
      href: '/loyalty',
      icon: SparklesIcon,
      routes: ['consumer-loyalty']
    }
  ],
  merchant: [
    {
      label: 'Vue d’ensemble',
      href: '/merchant/dashboard',
      icon: ChartBarIcon,
      routes: ['merchant-dashboard']
    },
    {
      label: 'Analytics avancées',
      href: '/merchant/analytics',
      icon: SparklesIcon,
      routes: ['merchant-analytics']
    },
    {
      label: 'Produits',
      href: '/merchant/products',
      icon: Squares2X2Icon,
      routes: ['merchant-products', 'merchant-product-create', 'merchant-product-edit']
    },
    {
      label: 'Réservations',
      href: '/merchant/reservations',
      icon: ClipboardDocumentCheckIcon,
      routes: ['merchant-reservations']
    },
    {
      label: 'Paiements & Portefeuille',
      href: '/merchant/payments',
      icon: BanknotesIcon,
      routes: ['merchant-payments']
    },
    {
      label: 'Avis clients',
      href: '/merchant/reviews/dashboard',
      icon: ChatBubbleLeftRightIcon,
      routes: ['merchant-reviews-dashboard', 'merchant-reviews']
    },
    {
      label: 'Paniers surprise',
      href: '/merchant/surprise-baskets',
      icon: GiftIcon,
      routes: ['merchant-surprise-baskets']
    },
    {
      label: 'Fidélité',
      href: '/merchant/loyalty',
      icon: SparklesIcon,
      routes: ['merchant-loyalty']
    }
  ],
  admin: [
    {
      label: 'Vue d’ensemble',
      href: '/admin/dashboard',
      icon: ChartBarIcon,
      routes: ['admin-dashboard']
    },
    {
      label: 'Utilisateurs',
      href: '/admin/users',
      icon: UsersIcon,
      routes: ['admin-users']
    },
    {
      label: 'Commerçants',
      href: '/admin/merchants',
      icon: BuildingStorefrontIcon,
      routes: ['admin-merchants']
    },
    {
      label: 'Catégories',
      href: '/admin/categories',
      icon: Squares2X2Icon,
      routes: ['admin-categories']
    },
    {
      label: 'Avis',
      href: '/admin/reviews',
      icon: ChatBubbleLeftRightIcon,
      routes: ['admin-reviews']
    }
  ],
  driver: [
    {
      label: 'Tableau de bord',
      href: '/driver/dashboard',
      icon: ChartBarIcon,
      routes: ['driver-dashboard']
    },
    {
      label: 'Livraisons disponibles',
      href: '/driver/deliveries/available',
      icon: MapIcon,
      routes: ['driver-deliveries-available']
    },
    {
      label: 'Livraison en cours',
      href: '/driver/deliveries/active',
      icon: TruckIcon,
      routes: ['driver-deliveries-active']
    },
    {
      label: 'Historique',
      href: '/driver/history',
      icon: ClipboardDocumentCheckIcon,
      routes: ['driver-history']
    },
    {
      label: 'Gains',
      href: '/driver/earnings',
      icon: BanknotesIcon,
      routes: ['driver-earnings']
    },
    {
      label: 'Profil',
      href: '/driver/profile',
      icon: UserCircleIcon,
      routes: ['driver-profile', 'driver-profile-edit']
    }
  ]
}

const brandByRole: Record<Role, BrandConfig> = {
  consumer: {
    name: 'Espace Client',
    logo: ChartBarIcon
  },
  merchant: {
    name: 'Espace Commerçant',
    logo: BuildingStorefrontIcon
  },
  admin: {
    name: 'Console Admin',
    logo: ShieldCheckIcon
  },
  driver: {
    name: 'Espace Livreur',
    logo: TruckIcon
  }
}

const formatUserName = (user: User | null) => {
  if (!user) {
    return 'Invité'
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email
}

export const useDashboardLayout = (role: Role) => {
  const route = useRoute()
  const authStore = useAuthStore()

  const sidebar = computed(() => {
    const currentRouteName = route.name?.toString() ?? ''

    return {
      brand: brandByRole[role],
      navigation: navigationByRole[role].map((entry) => ({
        label: entry.label,
        href: entry.href,
        icon: entry.icon,
        badge: entry.badge,
        active: entry.routes.includes(currentRouteName)
      })),
      footer: null
    }
  })

  const header = computed(() => {
    const user = authStore.user
    const name = formatUserName(user)

    return {
      user: {
        name,
        email: user?.email ?? 'contact@antigaspi.com'
      }
    }
  })

  return {
    sidebar,
    header
  }
}
