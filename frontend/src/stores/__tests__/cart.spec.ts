import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { notify } from '@/composables/useNotifications'
import type { Product } from '@/types'

vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(() => 'notification-id'),
    error: vi.fn(() => 'notification-id'),
    warning: vi.fn(() => 'notification-id'),
    info: vi.fn(() => 'notification-id')
  }
}))

const STORAGE_KEY = 'antigaspi_cart_items'

const buildProduct = (overrides: Record<string, unknown> = {}): Product => ({
  id: 1,
  name: 'Pain complet',
  original_price: 1000,
  discounted_price: 600,
  image_url: null,
  expiration_date: '2026-12-31',
  quantity_available: 5,
  merchant: { id: 7, business_name: 'Boulangerie Bio' },
  ...overrides
} as unknown as Product)

describe('useCartStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('état initial', () => {
    it('démarre avec un panier vide', () => {
      const store = useCartStore()

      expect(store.items).toEqual([])
      expect(store.itemsCount).toBe(0)
      expect(store.totalAmount).toBe(0)
      expect(store.totalSavings).toBe(0)
      expect(store.isEmpty).toBe(true)
      expect(store.isHydrated).toBe(true)
    })
  })

  describe('addItem', () => {
    it('ajoute un nouvel article avec une quantité par défaut de 1', () => {
      const store = useCartStore()

      const result = store.addItem({ id: 1, name: 'Croissant', price: 500 })

      expect(result.success).toBe(true)
      expect(store.items).toHaveLength(1)
      expect(store.items[0]).toMatchObject({
        id: 1,
        type: 'product',
        productId: 1,
        name: 'Croissant',
        price: 500,
        quantity: 1
      })
      expect(notify.success).toHaveBeenCalled()
    })

    it('fusionne les quantités pour un article existant chez le même marchand', () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 500, quantity: 2, merchantId: 7 })
      store.addItem({ id: 1, name: 'Croissant', price: 450, quantity: 3, merchantId: 7 })

      expect(store.items).toHaveLength(1)
      expect(store.items[0].quantity).toBe(5)
      // Le prix est mis à jour avec la dernière valeur connue
      expect(store.items[0].price).toBe(450)
    })

    it('distingue le même produit vendu par des marchands différents', () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 500, merchantId: 7 })
      store.addItem({ id: 1, name: 'Croissant', price: 400, merchantId: 8 })

      expect(store.items).toHaveLength(2)
    })

    it('rejette un article sans identifiant valide', () => {
      const store = useCartStore()

      const result = store.addItem({ id: 0, name: 'Invalide', price: 100 })

      expect(result).toEqual({ success: false, error: 'Article invalide' })
      expect(store.items).toHaveLength(0)
      expect(notify.error).toHaveBeenCalled()
    })

    it('remplace un nom vide par un libellé par défaut', () => {
      const store = useCartStore()

      store.addItem({ id: 2, name: '   ', price: 300 })

      expect(store.items[0].name).toBe('Produit anti-gaspi')
    })

    it('arrondit les quantités décimales à l\'entier inférieur', () => {
      const store = useCartStore()

      store.addItem({ id: 3, name: 'Baguette', price: 200, quantity: 2.9 })

      expect(store.items[0].quantity).toBe(2)
    })

    it('utilise une quantité de 1 pour une quantité négative ou nulle', () => {
      const store = useCartStore()

      store.addItem({ id: 4, name: 'Brioche', price: 800, quantity: -3 })

      expect(store.items[0].quantity).toBe(1)
    })

    it('n\'émet pas de notification en mode silencieux', () => {
      const store = useCartStore()

      store.addItem({ id: 5, name: 'Tarte', price: 1200, silent: true })

      expect(notify.success).not.toHaveBeenCalled()
    })
  })

  describe('calcul des totaux', () => {
    it('calcule le total et le nombre d\'articles', () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 500, quantity: 2 })
      store.addItem({ id: 2, name: 'Baguette', price: 250, quantity: 3 })

      expect(store.itemsCount).toBe(5)
      expect(store.totalQuantity).toBe(5)
      expect(store.totalAmount).toBe(500 * 2 + 250 * 3)
      expect(store.totalPrice).toBe(store.totalAmount)
      expect(store.isEmpty).toBe(false)
    })

    it('calcule les économies à partir du prix original', () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 600, originalPrice: 1000, quantity: 2 })

      expect(store.totalSavings).toBe((1000 - 600) * 2)
    })

    it('ignore les économies négatives quand le prix dépasse le prix original', () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 1200, originalPrice: 1000, quantity: 1 })

      expect(store.totalSavings).toBe(0)
    })
  })

  describe('addProduct', () => {
    it('mappe les champs du produit vers un article de panier', () => {
      const store = useCartStore()

      const result = store.addProduct(buildProduct(), 2)

      expect(result.success).toBe(true)
      expect(store.items[0]).toMatchObject({
        id: 1,
        type: 'product',
        productId: 1,
        name: 'Pain complet',
        price: 600,
        originalPrice: 1000,
        quantity: 2,
        merchantId: 7,
        merchantName: 'Boulangerie Bio',
        expiryDate: '2026-12-31',
        maxQuantity: 5
      })
    })

    it('utilise le prix original quand le prix réduit est absent', () => {
      const store = useCartStore()

      store.addProduct(buildProduct({ discounted_price: null }))

      expect(store.items[0].price).toBe(1000)
    })

    it('incrémente la quantité quand le produit est déjà dans le panier', () => {
      const store = useCartStore()

      store.addProduct(buildProduct(), 1)
      store.addProduct(buildProduct(), 2)

      expect(store.items).toHaveLength(1)
      expect(store.items[0].quantity).toBe(3)
    })
  })

  describe('updateQuantity', () => {
    it('met à jour la quantité d\'un article existant', () => {
      const store = useCartStore()
      store.addItem({ id: 1, name: 'Croissant', price: 500 })

      const result = store.updateQuantity(1, 4.6)

      expect(result.success).toBe(true)
      expect(store.items[0].quantity).toBe(4)
    })

    it('retire l\'article quand la quantité tombe à zéro', () => {
      const store = useCartStore()
      store.addItem({ id: 1, name: 'Croissant', price: 500 })

      const result = store.updateQuantity(1, 0)

      expect(result.success).toBe(true)
      expect(store.items).toHaveLength(0)
    })

    it('échoue pour un article introuvable', () => {
      const store = useCartStore()

      const result = store.updateQuantity(999, 2)

      expect(result).toEqual({ success: false, error: 'Article introuvable dans le panier' })
      expect(notify.error).toHaveBeenCalled()
    })
  })

  describe('removeItem / clearCart', () => {
    it('retire un article et notifie l\'utilisateur', () => {
      const store = useCartStore()
      store.addItem({ id: 1, name: 'Croissant', price: 500 })

      const result = store.removeItem(1)

      expect(result.success).toBe(true)
      expect(store.items).toHaveLength(0)
      expect(notify.info).toHaveBeenCalled()
    })

    it('échoue quand l\'article à retirer est introuvable', () => {
      const store = useCartStore()

      const result = store.removeItem(42)

      expect(result.success).toBe(false)
      expect(notify.error).toHaveBeenCalled()
    })

    it('vide entièrement le panier', () => {
      const store = useCartStore()
      store.addItem({ id: 1, name: 'Croissant', price: 500 })
      store.addItem({ id: 2, name: 'Baguette', price: 250 })

      const result = store.clearCart()

      expect(result.success).toBe(true)
      expect(store.items).toHaveLength(0)
      expect(store.isEmpty).toBe(true)
      expect(notify.info).toHaveBeenCalled()
    })

    it('vide le panier sans notification en mode silencieux', () => {
      const store = useCartStore()
      store.addItem({ id: 1, name: 'Croissant', price: 500, silent: true })
      vi.clearAllMocks()

      store.clearCart({ silent: true })

      expect(notify.info).not.toHaveBeenCalled()
    })
  })

  describe('persistance localStorage', () => {
    it('sauvegarde les articles après une mutation', async () => {
      const store = useCartStore()

      store.addItem({ id: 1, name: 'Croissant', price: 500, quantity: 2 })
      await nextTick()

      const raw = window.localStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()
      const saved = JSON.parse(raw as string)
      expect(saved).toHaveLength(1)
      expect(saved[0]).toMatchObject({ id: 1, quantity: 2, price: 500 })
    })

    it('réhydrate et normalise les articles legacy depuis le storage', () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([
        {
          id: 5,
          type: 'product',
          name: 'Ancien produit',
          price: '750',
          quantity: 0
        }
      ]))

      const store = useCartStore()

      expect(store.items).toHaveLength(1)
      expect(store.items[0].price).toBe(750)
      expect(store.items[0].quantity).toBe(1)
      // productId rétro-rempli pour les articles enregistrés avant le correctif
      expect(store.items[0].productId).toBe(5)
    })

    it('repart d\'un panier vide quand le storage est corrompu', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not-valid-json')

      const store = useCartStore()

      expect(store.items).toEqual([])
      expect(store.isHydrated).toBe(true)
      expect(notify.error).toHaveBeenCalled()
    })
  })
})
