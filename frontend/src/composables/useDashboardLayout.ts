import { computed } from 'vue'
import type { Component } from 'vue'
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
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

type Role = 'consumer' | 'merchant' | 'admin'

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
