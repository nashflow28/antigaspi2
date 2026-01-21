# Progression de l'Alignement Réservation Frontend/Mobile

**Date**: 2026-01-21
**Status**: En cours - Phase 1 complétée

---

## ✅ Modifications Complétées

### 1. CartStore Étendu (stores/cart.ts)

**Modifications apportées**:
- ✅ Ajout du champ `type: 'product' | 'surprise_basket'` à `CartItem`
- ✅ Ajout de `productId` et `basketId` pour différencier les types
- ✅ Ajout de `expiryDate` (date d'expiration)
- ✅ Ajout de `maxQuantity` (quantité disponible)
- ✅ Mise à jour de `addProduct()` pour:
  - Vérifier si le produit existe déjà dans le panier
  - Incrémenter la quantité si existant
  - Ajouter les nouveaux champs (type, productId, expiryDate, maxQuantity)
  - Notifications améliorées

**Code modifié**:
```typescript
export interface CartItem {
  id: number
  type: 'product' | 'surprise_basket'
  productId?: number
  basketId?: number
  name: string
  price: number
  originalPrice?: number | null
  quantity: number
  imageUrl?: string | null
  merchantId?: number | null
  merchantName?: string | null
  expiryDate?: string | null
  maxQuantity?: number | null
}

const addProduct = (product: Product, quantity = 1, options: { silent?: boolean } = {}) => {
  // Vérifier si le produit existe déjà
  const existing = items.value.find(item =>
    item.type === 'product' && item.productId === product.id
  )

  if (existing) {
    existing.quantity += quantity
    // ...notification
    return { success: true }
  }

  // Ajouter nouveau produit avec tous les champs
  items.value.push({
    id: product.id,
    type: 'product',
    productId: product.id,
    name: product.name,
    price: resolvePrice(product.discounted_price ?? product.original_price),
    originalPrice: resolvePrice(product.original_price),
    quantity,
    imageUrl: product.image_url ?? null,
    merchantId: product.merchant?.id ?? null,
    merchantName: product.merchant?.business_name ?? null,
    expiryDate: product.expiration_date ?? null,
    maxQuantity: product.quantity_available ?? null
  })

  return { success: true }
}
```

**Impact**:
- ✅ Le panier peut maintenant distinguer produits individuels et surprise baskets
- ✅ Toutes les infos nécessaires pour créer une réservation sont stockées
- ✅ La quantité max disponible est trackée
- ✅ Backward compatible avec l'existant

---

## 🚧 Prochaines Étapes Prioritaires

### Phase 2: CartCheckoutModal (CRITIQUE - 2-3h)

**Objectif**: Créer le modal de confirmation de réservation

**Fichier à créer**: `frontend/src/components/modals/CartCheckoutModal.vue`

**Fonctionnalités**:
1. **Récapitulatif des items**
   - Liste des produits du panier
   - Images, noms, quantités, prix
   - Total avec économies

2. **Informations de retrait**
   - Date de retrait (date picker)
   - Heure de retrait (time picker)
   - Instructions spéciales (textarea)

3. **Coordonnées**
   - Téléphone (pré-rempli, modifiable)
   - Email (pré-rempli, modifiable)

4. **Mode de paiement**
   - `on_site` - Paiement sur place
   - `flooz` - Flooz (Moov Togo)
   - `tmoney` - T-Money (Togocom)
   - `orange_money` - Orange Money
   - `mtn_momo` - MTN Mobile Money
   - `wallet` - Portefeuille Antigaspi
   - `paystack` - Carte bancaire

5. **Validation spécifique**
   - Si mobile money: valider format numéro selon opérateur
   - Si wallet: demander PIN 4 chiffres + vérifier solde suffisant
   - Si paystack: redirection vers page paiement

6. **Conditions générales**
   - Checkbox obligatoire
   - Lien vers CGV

7. **Actions**
   - Bouton "Annuler"
   - Bouton "Confirmer" (disabled si validation échoue)

**Structure du composant**:
```vue
<template>
  <Modal2025
    v-model="isOpen"
    title="Confirmer votre réservation"
    size="xl"
  >
    <!-- Cart Summary -->
    <section class="space-y-3">
      <h3>Récapitulatif ({{ itemsCount }} articles)</h3>
      <CartItemSummary
        v-for="item in items"
        :key="item.id"
        :item="item"
      />
      <div class="border-t pt-3">
        <div class="flex justify-between">
          <span>Total</span>
          <strong>{{ formatCurrency(totalAmount) }}</strong>
        </div>
        <div v-if="totalSavings > 0" class="text-sm text-green-600">
          Économies: {{ formatCurrency(totalSavings) }}
        </div>
      </div>
    </section>

    <!-- Pickup Info -->
    <section class="space-y-3">
      <h3>Informations de retrait</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Date</label>
          <Input
            v-model="pickupDate"
            type="date"
            :min="minDate"
            :max="maxDate"
          />
        </div>
        <div>
          <label>Heure</label>
          <Input
            v-model="pickupTime"
            type="time"
          />
        </div>
      </div>
      <div>
        <label>Instructions (optionnel)</label>
        <textarea
          v-model="specialInstructions"
          rows="2"
          class="w-full rounded border p-2"
        />
      </div>
    </section>

    <!-- Contact Info -->
    <section class="space-y-3">
      <h3>Coordonnées</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label>Téléphone</label>
          <Input
            v-model="customerPhone"
            type="tel"
          />
        </div>
        <div>
          <label>Email</label>
          <Input
            v-model="customerEmail"
            type="email"
          />
        </div>
      </div>
    </section>

    <!-- Payment Method -->
    <section class="space-y-3">
      <h3>Mode de paiement</h3>
      <RadioGroup v-model="paymentMethod">
        <RadioOption value="on_site">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💵</span>
            <div>
              <div class="font-semibold">Paiement sur place</div>
              <div class="text-sm text-gray-600">
                Réglez directement au retrait
              </div>
            </div>
          </div>
        </RadioOption>

        <RadioOption value="flooz">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📱</span>
            <div>
              <div class="font-semibold">Flooz (Moov Togo)</div>
              <div class="text-sm text-gray-600">
                Paiement mobile money
              </div>
            </div>
          </div>
        </RadioOption>

        <RadioOption value="tmoney">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📱</span>
            <div>
              <div class="font-semibold">T-Money (Togocom)</div>
              <div class="text-sm text-gray-600">
                Paiement mobile money
              </div>
            </div>
          </div>
        </RadioOption>

        <RadioOption value="wallet">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💰</span>
            <div>
              <div class="font-semibold">Portefeuille Antigaspi</div>
              <div class="text-sm text-gray-600">
                Solde: {{ formatCurrency(walletBalance) }}
              </div>
            </div>
          </div>
        </RadioOption>
      </RadioGroup>

      <!-- Mobile Money Phone -->
      <div v-if="requiresMobileMoneyPhone" class="mt-3">
        <label>Numéro {{ paymentMethod }}</label>
        <Input
          v-model="mobileMoneyPhone"
          type="tel"
          placeholder="90 XX XX XX"
          :error="mobileMoneyPhoneError"
        />
      </div>

      <!-- Wallet PIN -->
      <div v-if="paymentMethod === 'wallet'" class="mt-3">
        <label>Code PIN</label>
        <PinInput
          v-model="walletPin"
          length="4"
          :error="walletPinError"
        />
        <div v-if="walletBalance < totalAmount" class="text-sm text-red-600 mt-1">
          ⚠️ Solde insuffisant
        </div>
      </div>
    </section>

    <!-- Terms -->
    <section>
      <Checkbox v-model="acceptTerms">
        J'accepte les
        <a href="/terms" target="_blank" class="text-primary-600 underline">
          conditions générales de vente
        </a>
      </Checkbox>
    </section>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-3 justify-end">
        <Button
          variant="ghost"
          @click="close"
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          size="lg"
          :loading="loading"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          Confirmer la réservation
        </Button>
      </div>
    </template>
  </Modal2025>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useReservationsStore } from '@/stores/reservations'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import { formatCurrency } from '@/utils/currencyHelpers'
import Modal2025 from '@/components/ui/2025/Modal.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Checkbox from '@/components/ui/2025/Checkbox.vue'
import RadioGroup from '@/components/ui/2025/RadioGroup.vue'
import RadioOption from '@/components/ui/2025/RadioOption.vue'
import PinInput from '@/components/ui/2025/PinInput.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const router = useRouter()
const cartStore = useCartStore()
const reservationsStore = useReservationsStore()
const authStore = useAuthStore()

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const pickupDate = ref('')
const pickupTime = ref('')
const specialInstructions = ref('')
const paymentMethod = ref<'on_site' | 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo' | 'wallet' | 'paystack'>('on_site')
const customerPhone = ref(authStore.user?.phone || '')
const customerEmail = ref(authStore.user?.email || '')
const mobileMoneyPhone = ref('')
const walletPin = ref('')
const acceptTerms = ref(false)

// Errors
const mobileMoneyPhoneError = ref('')
const walletPinError = ref('')

// Computed
const items = computed(() => cartStore.items)
const itemsCount = computed(() => cartStore.itemsCount)
const totalAmount = computed(() => cartStore.totalAmount)
const totalSavings = computed(() => cartStore.totalSavings)
const walletBalance = computed(() => authStore.user?.wallet_balance || 0)

const requiresMobileMoneyPhone = computed(() =>
  ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(paymentMethod.value)
)

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  // Max 7 jours dans le futur
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  return maxDate.toISOString().split('T')[0]
})

const canConfirm = computed(() => {
  if (!pickupDate.value || !pickupTime.value) return false
  if (!acceptTerms.value) return false
  if (!customerPhone.value || !customerEmail.value) return false

  if (requiresMobileMoneyPhone.value) {
    if (!mobileMoneyPhone.value) return false
    if (mobileMoneyPhoneError.value) return false
  }

  if (paymentMethod.value === 'wallet') {
    if (walletPin.value.length !== 4) return false
    if (walletBalance.value < totalAmount.value) return false
    if (walletPinError.value) return false
  }

  return true
})

// Validation
watch(mobileMoneyPhone, (value) => {
  if (!requiresMobileMoneyPhone.value) return

  // Validation basique numéro Togo (8 chiffres)
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length !== 8) {
    mobileMoneyPhoneError.value = 'Le numéro doit contenir 8 chiffres'
  } else {
    mobileMoneyPhoneError.value = ''
  }
})

watch(walletPin, (value) => {
  if (paymentMethod.value !== 'wallet') return

  if (value.length > 0 && value.length !== 4) {
    walletPinError.value = 'Le PIN doit contenir 4 chiffres'
  } else {
    walletPinError.value = ''
  }
})

// Actions
const handleConfirm = async () => {
  loading.value = true

  try {
    // Créer une réservation pour chaque item du panier
    const results = []

    for (const item of items.value) {
      if (item.type !== 'product' || !item.productId) continue

      const payload = {
        productId: item.productId,
        quantity: item.quantity,
        paymentMethod: paymentMethod.value,
        customerPhone: requiresMobileMoneyPhone.value ? mobileMoneyPhone.value : customerPhone.value,
        customerEmail: customerEmail.value,
        pickupDate: `${pickupDate.value} ${pickupTime.value}`,
        notes: specialInstructions.value || undefined,
        walletPin: paymentMethod.value === 'wallet' ? walletPin.value : undefined
      }

      const result = await reservationsStore.createReservation(payload)

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création de la réservation')
      }

      results.push(result)
    }

    // Vider le panier après succès
    cartStore.clearCart({ silent: true })

    // Notification de succès
    notify.success(
      `${results.length} réservation${results.length > 1 ? 's' : ''} créée${results.length > 1 ? 's' : ''} avec succès`,
      'Réservations',
      { duration: 3000 }
    )

    // Fermer le modal
    close()

    // Rediriger vers la page des réservations
    router.push('/reservations')

    emit('success')
  } catch (error: any) {
    console.error('Checkout error:', error)
    notify.error(
      error.message || 'Une erreur est survenue lors de la confirmation',
      'Erreur'
    )
  } finally {
    loading.value = false
  }
}

const close = () => {
  isOpen.value = false
}
</script>
```

---

### Phase 3: ProductCard Update (30min)

**Fichier à modifier**: `frontend/src/components/ui/2025/ProductCard.vue`

**Changements**:
1. Ajouter bouton "Ajouter au panier" avec icon `ShoppingCart`
2. Garder bouton "Voir détails" comme principal CTA
3. Emit event `@add-to-cart` avec productId
4. Parent component gère l'ajout via `cartStore.addProduct()`

---

### Phase 4: CartPage Refactor (1-2h)

**Fichier à modifier**: `frontend/src/views/CartPage.vue`

**Changements**:
1. Afficher TOUS les items (produits + baskets)
2. Créer composant `CartItemCard.vue` pour affichage unifié
3. Actions par item: modifier quantité, supprimer
4. Sticky footer avec:
   - Total amount + savings
   - Bouton "Checkout" qui ouvre CartCheckoutModal
5. Empty state si panier vide

---

### Phase 5: Header Badge (15min)

**Fichier à modifier**: Layout header (MainLayout.vue ou NavBar.vue)

**Changements**:
1. Ajouter icon `ShoppingCart` avec lien vers `/cart`
2. Badge avec `cartStore.itemsCount`
3. Animation pulse si items ajoutés récemment

---

### Phase 6: ProductDetailView Simplify (30min)

**Fichier à modifier**: `frontend/src/views/ProductDetailView2025.vue`

**Changements**:
1. **Option A (Recommandé)**: Remplacer 2 boutons par:
   - "Ajouter au panier" (principal)
   - "Réserver maintenant" (secondaire, ouvre modal direct)

2. **Option B (Conservateur)**: Garder les 2 flows mais améliorer:
   - "Réserver en 1 clic" → Ouvre CartCheckoutModal avec produit pré-ajouté
   - "Commencer réservation" → Reste wizard 4 étapes

---

## 📊 Impact Estimé

### Avant
- ❌ Panier utilisé uniquement pour surprise baskets
- ❌ Réservation produit = flow direct sans panier
- ❌ 2 flows parallèles confus
- ❌ Payment method limité

### Après
- ✅ Panier unifié (produits + baskets)
- ✅ Flow cohérent: Panier → Checkout → Réservation
- ✅ Récapitulatif systématique avant confirmation
- ✅ Options paiement complètes (flooz, tmoney, wallet, etc.)
- ✅ UX alignée avec mobile

---

## 🧪 Tests à Effectuer

### CartStore
- [ ] Ajouter un produit au panier
- [ ] Ajouter le même produit (incrémente quantité)
- [ ] Modifier quantité
- [ ] Supprimer item
- [ ] Vider panier
- [ ] Persistance localStorage

### CartCheckoutModal
- [ ] Ouvre avec items du panier
- [ ] Affiche récapitulatif correct
- [ ] Validation date/heure
- [ ] Validation téléphone (mobile money)
- [ ] Validation PIN wallet
- [ ] Vérification solde wallet
- [ ] Conditions obligatoires
- [ ] Création réservations OK
- [ ] Panier vidé après succès
- [ ] Redirection vers /reservations

### Integration
- [ ] ProductCard → Add to cart → Badge +1
- [ ] CartPage affiche tous items
- [ ] CartPage → Checkout → Modal ouvre
- [ ] Checkout → Confirm → Réservations créées
- [ ] Header badge synchronisé

---

## 📝 Notes de Développement

### Dépendances Manquantes
Composants DS2025 à créer si n'existent pas:
- `RadioGroup.vue`
- `RadioOption.vue`
- `PinInput.vue`

### API Backend
Vérifier que les endpoints supportent:
- `paymentMethod: 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo'`
- Validation numéro selon opérateur

### Analytics
Tracker events:
- `cart_product_added`
- `cart_checkout_started`
- `payment_method_selected`
- `reservation_created_from_cart`
- `cart_abandoned`

---

## 🚀 Commandes Git

### Commit actuel
```bash
git add frontend/src/stores/cart.ts frontend/RESERVATION_ALIGNMENT.md frontend/RESERVATION_PROGRESS.md
git commit -m "feat(frontend): Extend CartStore for unified cart (products + baskets)"
```

### Prochains commits
```bash
# Après création CartCheckoutModal
git add frontend/src/components/modals/CartCheckoutModal.vue
git commit -m "feat(frontend): Create CartCheckoutModal for reservation confirmation"

# Après update ProductCard
git add frontend/src/components/ui/2025/ProductCard.vue
git commit -m "feat(frontend): Add cart button to ProductCard"

# Etc.
```

---

**Dernière mise à jour**: 2026-01-21 15:30
**Progression globale**: 30% (Phase 1 complétée)
**Temps estimé restant**: 6-8 heures
