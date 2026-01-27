import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChartBarIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  CalendarDaysIcon,
  SparklesIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  UsersIcon,
  Cog6ToothIcon,
  GiftIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  MapIcon,
  UserCircleIcon,
  InboxIcon,
  BellIcon
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
      label: 'Accueil',
      href: '/dashboard',
      icon: HomeIcon,
      routes: ['dashboard']
    },
    {
      label: 'Découvrir',
      href: '/discover',
      icon: MagnifyingGlassIcon,
      routes: ['discover']
    },
    {
      label: 'Favoris',
      href: '/favorites',
      icon: HeartIcon,
      routes: ['favorites']
    },
    {
      label: 'Mes réservations',
      href: '/reservations',
      icon: CalendarDaysIcon,
      routes: ['reservations', 'reservation-detail']
    },
    {
      label: 'Mon compte',
      href: '/profile',
      icon: UserCircleIcon,
      routes: ['profile', 'profile-edit']
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
      label: 'Messagerie',
      href: '/merchant/messaging',
      icon: InboxIcon,
      routes: ['merchant-messaging', 'merchant-messaging-conversation']
    },
    {
      label: 'Notifications',
      href: '/merchant/notifications',
      icon: BellIcon,
      routes: ['merchant-notifications']
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
    },
    {
      label: 'Mon compte',
      href: '/merchant/profile',
      icon: UserCircleIcon,
      routes: ['merchant-profile', 'merchant-profile-edit']
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
      label: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      routes: ['admin-analytics']
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
    },
    {
      label: 'Paramètres',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      routes: ['admin-settings']
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

// Mobile bottom navigation configuration (5 main tabs per role, like mobile app)
const mobileNavByRole: Record<Role, NavigationConfig[]> = {
  consumer: [
    { label: 'Accueil', href: '/dashboard', icon: HomeIcon, routes: ['dashboard'] },
    { label: 'Découvrir', href: '/discover', icon: MagnifyingGlassIcon, routes: ['discover'] },
    { label: 'Favoris', href: '/favorites', icon: HeartIcon, routes: ['favorites'] },
    { label: 'Commandes', href: '/reservations', icon: CalendarDaysIcon, routes: ['reservations', 'reservation-detail'] },
    { label: 'Compte', href: '/profile', icon: UserCircleIcon, routes: ['profile', 'profile-edit', 'wallet', 'consumer-loyalty'] }
  ],
  merchant: [
    { label: 'Accueil', href: '/merchant/dashboard', icon: HomeIcon, routes: ['merchant-dashboard'] },
    { label: 'Produits', href: '/merchant/products', icon: Squares2X2Icon, routes: ['merchant-products', 'merchant-product-create', 'merchant-product-edit'] },
    { label: 'Commandes', href: '/merchant/reservations', icon: ClipboardDocumentCheckIcon, routes: ['merchant-reservations'] },
    { label: 'Fidélité', href: '/merchant/loyalty', icon: SparklesIcon, routes: ['merchant-loyalty'] },
    { label: 'Compte', href: '/merchant/profile', icon: UserCircleIcon, routes: ['merchant-profile', 'merchant-profile-edit'] }
  ],
  admin: [
    { label: 'Accueil', href: '/admin/dashboard', icon: HomeIcon, routes: ['admin-dashboard'] },
    { label: 'Utilisateurs', href: '/admin/users', icon: UsersIcon, routes: ['admin-users'] },
    { label: 'Commerçants', href: '/admin/merchants', icon: BuildingStorefrontIcon, routes: ['admin-merchants'] },
    { label: 'Avis', href: '/admin/reviews', icon: ChatBubbleLeftRightIcon, routes: ['admin-reviews'] },
    { label: 'Plus', href: '/admin/plus', icon: Cog6ToothIcon, routes: ['admin-plus', 'admin-settings', 'admin-categories'] }
  ],
  driver: [
    { label: 'Accueil', href: '/driver/dashboard', icon: HomeIcon, routes: ['driver-dashboard'] },
    { label: 'Carte', href: '/driver/map', icon: MapIcon, routes: ['driver-map'] },
    { label: 'Livraisons', href: '/driver/deliveries/available', icon: TruckIcon, routes: ['driver-deliveries-available', 'driver-deliveries-active'] },
    { label: 'Historique', href: '/driver/history', icon: ClipboardDocumentCheckIcon, routes: ['driver-history'] },
    { label: 'Compte', href: '/driver/profile', icon: UserCircleIcon, routes: ['driver-profile', 'driver-earnings'] }
  ]
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

  // Mobile bottom navigation (5 tabs like mobile app)
  const mobileNav = computed(() => {
    return mobileNavByRole[role].map((entry) => ({
      label: entry.label,
      href: entry.href,
      icon: entry.icon,
      activeRoutes: entry.routes
    }))
  })

  return {
    sidebar,
    header,
    mobileNav
  }
}
