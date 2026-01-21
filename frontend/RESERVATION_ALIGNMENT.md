# Alignement du Processus de Réservation Frontend/Mobile

## 📋 Analyse comparative complète

**Date**: 2026-01-21
**Auteur**: Claude Code
**Objectif**: Aligner le processus de réservation du frontend web avec celui de l'application mobile pour une expérience utilisateur unifiée

---

## 🔍 Différences Majeures Identifiées

### 1. Architecture du Panier

| Aspect | Frontend Web | Mobile App |
|--------|-------------|------------|
| **Panier** | Séparé en 2 systèmes:<br>• CartStore = Surprise Baskets uniquement<br>• Réservations = API directe | Un seul système unifié:<br>• CartStore = Tous les produits<br>• Crée réservations depuis le panier |
| **Ajout produit** | 2 flows parallèles:<br>1. Réservation directe (1-click)<br>2. Wizard 4 étapes | Flow intégré:<br>1. Add to Cart<br>2. Checkout depuis Cart |
| **Stockage** | LocalStorage (`antigaspi_cart_items`) | Redux State + AsyncStorage |
| **Sync** | Manuel | Auto avec offline support |

### 2. Flow de Réservation

#### **Frontend Web (2 flows séparés)**

**Flow A: Réservation 1-Click** (ProductDetailView2025.vue)
```
Product Detail → "Réserver en 1 clic"
  → handleReservation()
  → API POST /reservations (paymentMethod: 'paystack' hardcoded)
  → Redirect /reservations
```

**Problèmes**:
- ❌ Payment method hardcodé
- ❌ Pas de récap avant confirmation
- ❌ Pas de choix utilisateur

**Flow B: Wizard 4 Étapes** (ProductReserveView2025.vue)
```
Product Detail → "Commencer la réservation"
  → /products/:id/reserve?quantity=X
  → Step 1: Quantité + Notes
  → Step 2: Date/heure + Instructions
  → Step 3: Choix paiement
  → Step 4: Confirmation + Conditions
  → API POST /reservations
  → Redirect /reservations
```

#### **Mobile App (Flow unifié)**

```
Product Detail → "Ajouter au panier"
  → dispatch(addCartItem())
  → Navigation → CartScreen
  → Review items + quantities
  → "Checkout" button
  → CartCheckoutModal:
      ├─ Pickup date/time
      ├─ Customer phone/email
      ├─ Payment method selection
      ├─ Wallet PIN (si applicable)
      └─ Terms & Conditions
  → "Confirmer" button
  → dispatch(createReservation())
  → Success Modal + Navigation → ReservationsScreen
```

**OU Flow Rapide:**
```
Product Detail → "Réserver maintenant"
  → ReservationModal:
      ├─ Quantity selection
      ├─ Payment method
      ├─ Phone confirmation
      └─ Conditions
  → dispatch(createReservation())
  → Success + Navigate
```

### 3. Méthodes de Paiement

#### **Frontend Web (ProductReserveView2025.vue)**
```typescript
paymentMethods = [
  'on_site',      // Paiement sur place
  'paystack',     // Carte bancaire
  'mobile_money', // Mobile Money (générique)
  'wallet'        // Portefeuille
]
```

#### **Mobile App (CartCheckoutModal.tsx)**
```typescript
paymentMethods = [
  'on_site',       // Cash
  'wallet',        // Wallet
  'flooz',         // Flooz (Moov Togo)
  'tmoney',        // T-Money (Togocom)
  'orange_money',  // Orange Money
  'mtn_momo',      // MTN Mobile Money
  'paystack'       // Carte bancaire
]
```

**Différence clé**: Le mobile propose des opérateurs spécifiques pour le Mobile Money, le web utilise une option générique.

### 4. Gestion d'État

#### **Frontend Web (Pinia)**
```typescript
// stores/reservations.ts
const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref<Reservation[]>([])
  const loading = ref(false)

  // Actions synchrones + async manual
  const createReservation = async (payload) => {
    const response = await apiService.createReservation(payload)
    reservations.value.unshift(response.data)
  }
})

// stores/cart.ts (séparé - surprise baskets only)
const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  // Pas de réservations ici
})
```

#### **Mobile App (Redux)**
```typescript
// store/slices/reservationsSlice.ts
export const createReservation = createAsyncThunk(
  'reservations/create',
  async (payload, { rejectWithValue }) => {
    const response = await apiService.createReservation(payload)
    return response
  }
)

// store/slices/cartSlice.ts (unifié)
export const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0
  },
  reducers: {
    addCartItem: (state, action) => {
      // Ajoute produit au panier
    },
    clearCart: (state) => {
      state.items = []
    }
  }
})

// Flow: Cart → Checkout → createReservation → clearCart
```

### 5. Interface Utilisateur

#### **Frontend Web**

**Page Produit (ProductDetailView2025.vue)**:
- 2 boutons Call-to-Action côte à côte
- Design moderne avec DS2025
- Desktop-first (responsive)

**Page Réservation (ProductReserveView2025.vue)**:
- Wizard multi-étapes avec progress indicator
- Formulaires longs et détaillés
- Navigation linéaire

**Page Panier (CartPage.vue)**:
- Ne montre QUE les surprise baskets
- Pas de produits individuels

#### **Mobile App**

**ProductDetailsScreen.tsx**:
- 1 bouton principal "Ajouter au panier"
- 1 bouton secondaire "Réserver maintenant"
- Mobile-first + Haptic feedback

**CartScreen.tsx**:
- Liste de TOUS les produits ajoutés
- Badge compteur synchronisé
- Bouton "Checkout" en bas (sticky)

**CartCheckoutModal.tsx**:
- Modal bottom sheet
- Form compact avec sections repliables
- Validation en temps réel

---

## 🎯 Plan d'Alignement Proposé

### Phase 1: Unifier le Panier (Priorité HAUTE)

**Objectif**: Permettre l'ajout de produits individuels au panier, pas seulement surprise baskets

**Actions**:
1. ✅ Étendre `CartStore` pour supporter les produits individuels
2. ✅ Modifier `ProductCard.vue` pour ajouter bouton "Ajouter au panier"
3. ✅ Mettre à jour `CartPage.vue` pour afficher produits + baskets
4. ✅ Créer un composant `CartItemCard.vue` (DS2025)

**Fichiers à modifier**:
- `frontend/src/stores/cart.ts`
- `frontend/src/views/CartPage.vue`
- `frontend/src/components/ui/2025/ProductCard.vue`

---

### Phase 2: Créer Checkout Modal (Priorité HAUTE)

**Objectif**: Ajouter un modal de confirmation avant création de réservation

**Actions**:
1. ✅ Créer `CartCheckoutModal.vue` (inspiré du mobile)
2. ✅ Formulaire compact avec sections:
   - Date/heure de retrait
   - Téléphone/email confirmation
   - Méthode de paiement
   - PIN wallet (si applicable)
   - Conditions générales
3. ✅ Bouton "Confirmer la réservation"
4. ✅ Success notification + redirect

**Nouveau fichier**:
- `frontend/src/components/modals/CartCheckoutModal.vue`

---

### Phase 3: Améliorer Méthodes de Paiement (Priorité MOYENNE)

**Objectif**: Ajouter les opérateurs Mobile Money spécifiques du Togo

**Actions**:
1. ✅ Ajouter options: `flooz`, `tmoney`, `orange_money`, `mtn_momo`
2. ✅ Icons personnalisées par opérateur
3. ✅ Validation numéro de téléphone par opérateur
4. ✅ Instructions spécifiques

**Fichiers à modifier**:
- `frontend/src/views/ProductReserveView2025.vue`
- `frontend/src/components/modals/CartCheckoutModal.vue`
- `frontend/src/types/index.ts` (ajouter types)

---

### Phase 4: Standardiser le Flow (Priorité MOYENNE)

**Objectif**: Remplacer les 2 flows actuels par un flow unique aligné avec mobile

**Nouveau flow**:
```
Product Detail
  └─ "Ajouter au panier" (principal)
      └─ CartStore.addProduct()
          └─ Badge +1
          └─ Toast notification

  └─ "Réserver maintenant" (secondaire - optionnel)
      └─ Ouvre CartCheckoutModal directement
          └─ Pre-fill avec quantité actuelle
```

**Actions**:
1. ✅ Retirer bouton "Réserver en 1 clic" (ou le transformer)
2. ✅ Transformer "Commencer la réservation" → "Ajouter au panier"
3. ✅ Ajouter badge panier dans header
4. ✅ Synchroniser compteur avec CartStore

**Fichiers à modifier**:
- `frontend/src/views/ProductDetailView2025.vue`
- `frontend/src/layouts/MainLayout.vue` (badge panier)

---

### Phase 5: Améliorer UX Réservations (Priorité BASSE)

**Objectif**: Ajouter features manquantes vs mobile

**Actions**:
1. ✅ Tabs filtres: Active / Completed / Cancelled
2. ✅ Pull-to-refresh
3. ✅ Skeleton loaders
4. ✅ Empty states améliorés
5. ✅ QR Code display
6. ✅ Reservation status badges

**Fichiers à modifier**:
- `frontend/src/views/ReservationsView.vue`
- `frontend/src/views/ReservationDetailView2025.vue`
- `frontend/src/components/reservation/ReservationCard.vue`

---

## 🔧 Modifications Techniques Détaillées

### 1. CartStore Unifié

**Avant (cart.ts - surprise baskets only)**:
```typescript
interface CartState {
  items: SurpriseBasketCartItem[]
}
```

**Après (cart.ts - tous produits)**:
```typescript
interface CartItem {
  id: string
  type: 'product' | 'surprise_basket'
  productId?: number
  basketId?: number
  name: string
  quantity: number
  price: number
  discountedPrice: number
  imageUrl: string
  merchantName: string
  expiryDate: string
}

interface CartState {
  items: CartItem[]
  itemsCount: number
  totalAmount: number
}

// Nouvelles actions
const addProduct = (product: Product, quantity: number) => {
  const cartItem: CartItem = {
    id: `product_${product.id}`,
    type: 'product',
    productId: product.id,
    name: product.name,
    quantity,
    price: product.original_price,
    discountedPrice: product.discounted_price,
    imageUrl: product.image_url,
    merchantName: product.merchant?.business_name,
    expiryDate: product.expiration_date
  }
  items.value.push(cartItem)
}
```

---

### 2. CartCheckoutModal Component

**Nouveau fichier: `components/modals/CartCheckoutModal.vue`**
```vue
<template>
  <Modal2025
    v-model="isOpen"
    title="Confirmer la réservation"
    size="lg"
  >
    <!-- Cart Items Summary -->
    <div class="space-y-4">
      <div
        v-for="item in cartItems"
        :key="item.id"
        class="flex gap-3"
      >
        <img :src="item.imageUrl" class="w-16 h-16 rounded" />
        <div class="flex-1">
          <p class="font-semibold">{{ item.name }}</p>
          <p class="text-sm text-gray-600">
            {{ item.quantity }}x {{ formatCurrency(item.discountedPrice) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pickup Date/Time -->
    <div class="space-y-3">
      <label>Date de retrait</label>
      <Input
        v-model="pickupDate"
        type="date"
        :min="minDate"
      />
      <Input
        v-model="pickupTime"
        type="time"
      />
    </div>

    <!-- Payment Method -->
    <div class="space-y-3">
      <label>Mode de paiement</label>
      <RadioGroup v-model="paymentMethod">
        <RadioOption value="on_site">
          <template #icon>💵</template>
          Paiement sur place
        </RadioOption>
        <RadioOption value="flooz">
          <template #icon>📱</template>
          Flooz (Moov)
        </RadioOption>
        <RadioOption value="tmoney">
          <template #icon>📱</template>
          T-Money (Togocom)
        </RadioOption>
        <RadioOption value="wallet">
          <template #icon>💰</template>
          Portefeuille (Solde: {{ formatCurrency(walletBalance) }})
        </RadioOption>
      </RadioGroup>
    </div>

    <!-- Phone (for mobile money) -->
    <div v-if="requiresPhone" class="space-y-3">
      <label>Numéro de téléphone</label>
      <PhoneInput
        v-model="customerPhone"
        :operator="paymentMethod"
      />
    </div>

    <!-- Wallet PIN -->
    <div v-if="paymentMethod === 'wallet'" class="space-y-3">
      <label>Code PIN</label>
      <PinInput
        v-model="walletPin"
        length="4"
      />
    </div>

    <!-- Terms -->
    <Checkbox v-model="acceptTerms">
      J'accepte les <a href="/terms">conditions générales</a>
    </Checkbox>

    <!-- Total -->
    <div class="border-t pt-4">
      <div class="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>{{ formatCurrency(totalAmount) }}</span>
      </div>
    </div>

    <!-- Actions -->
    <template #footer>
      <Button
        variant="outline"
        @click="close"
      >
        Annuler
      </Button>
      <Button
        variant="primary"
        :loading="loading"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        Confirmer la réservation
      </Button>
    </template>
  </Modal2025>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useReservationsStore } from '@/stores/reservations'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/currencyHelpers'

const emit = defineEmits<{
  'success': [reservationId: number]
  'close': []
}>()

const cartStore = useCartStore()
const reservationsStore = useReservationsStore()
const authStore = useAuthStore()

const isOpen = ref(true)
const loading = ref(false)
const pickupDate = ref('')
const pickupTime = ref('')
const paymentMethod = ref('on_site')
const customerPhone = ref(authStore.user?.phone || '')
const walletPin = ref('')
const acceptTerms = ref(false)

const cartItems = computed(() => cartStore.items)
const totalAmount = computed(() => cartStore.totalAmount)
const walletBalance = computed(() => authStore.user?.wallet_balance || 0)

const requiresPhone = computed(() =>
  ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(paymentMethod.value)
)

const canConfirm = computed(() =>
  pickupDate.value &&
  pickupTime.value &&
  acceptTerms.value &&
  (!requiresPhone.value || customerPhone.value) &&
  (paymentMethod.value !== 'wallet' || walletPin.value.length === 4)
)

const handleConfirm = async () => {
  loading.value = true
  try {
    // Create reservation from cart items
    for (const item of cartItems.value) {
      const payload = {
        productId: item.productId,
        quantity: item.quantity,
        paymentMethod: paymentMethod.value,
        customerPhone: customerPhone.value,
        customerEmail: authStore.user?.email,
        pickupDate: `${pickupDate.value} ${pickupTime.value}`,
        walletPin: walletPin.value || undefined
      }

      const result = await reservationsStore.createReservation(payload)

      if (!result.success) {
        throw new Error(result.error)
      }
    }

    // Clear cart after successful reservations
    cartStore.clearCart()

    emit('success', 0) // Pass first reservation ID
    close()
  } catch (error: any) {
    console.error('Reservation failed:', error)
  } finally {
    loading.value = false
  }
}

const close = () => {
  isOpen.value = false
  emit('close')
}
</script>
```

---

### 3. ProductCard avec Bouton Panier

**Modifier: `components/ui/2025/ProductCard.vue`**
```vue
<template>
  <Card class="product-card">
    <!-- ... existing content ... -->

    <!-- Actions -->
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        :left-icon="ShoppingCart"
        @click="handleAddToCart"
      >
        Ajouter
      </Button>
      <Button
        variant="primary"
        size="sm"
        full-width
        @click="handleViewDetails"
      >
        Voir détails
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { notify } from '@/composables/useNotifications'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  'view-details': [productId: number]
}>()

const cartStore = useCartStore()

const handleAddToCart = () => {
  cartStore.addProduct(props.product, 1)
  notify.success(
    `${props.product.name} ajouté au panier`,
    'Panier',
    { duration: 2000 }
  )
}

const handleViewDetails = () => {
  emit('view-details', props.product.id)
}
</script>
```

---

### 4. Header avec Badge Panier

**Modifier: `layouts/MainLayout.vue` (ou NavBar component)**
```vue
<template>
  <nav class="navbar">
    <!-- ... other nav items ... -->

    <router-link
      to="/cart"
      class="relative"
    >
      <ShoppingCart class="h-6 w-6" />
      <Badge
        v-if="cartItemsCount > 0"
        variant="primary"
        class="absolute -top-2 -right-2"
      >
        {{ cartItemsCount }}
      </Badge>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart } from 'lucide-vue-next'

const cartStore = useCartStore()
const cartItemsCount = computed(() => cartStore.itemsCount)
</script>
```

---

## 📊 Comparaison Avant/Après

### AVANT (État actuel)

```
┌─ Produit
│  ├─ "Réserver en 1 clic" → API direct (paystack hardcoded)
│  └─ "Commencer réservation" → Wizard 4 étapes
│
├─ Panier (surprise baskets only)
│  └─ Checkout séparé
│
└─ Réservations
   └─ Liste des réservations créées
```

**Problèmes**:
- ❌ 2 flows parallèles déroutants
- ❌ Panier non utilisé pour produits individuels
- ❌ Pas de récap en 1-click
- ❌ Payment method limité

---

### APRÈS (Aligné avec mobile)

```
┌─ Produit
│  ├─ "Ajouter au panier" (principal)
│  │   └─ CartStore.addProduct()
│  │       └─ Badge +1
│  │
│  └─ "Réserver maintenant" (optionnel)
│      └─ Ouvre CartCheckoutModal
│
├─ Panier (tous produits + baskets)
│  ├─ Review items
│  ├─ Ajuster quantités
│  ├─ Supprimer items
│  └─ "Checkout" → CartCheckoutModal
│      ├─ Date/heure
│      ├─ Paiement (flooz, tmoney, wallet, etc.)
│      ├─ Conditions
│      └─ Confirmer
│          └─ createReservation()
│              └─ clearCart()
│              └─ Navigate /reservations
│
└─ Réservations
   ├─ Tabs: Active / Completed / Cancelled
   ├─ Pull-to-refresh
   └─ Status badges
```

**Avantages**:
- ✅ Flow unique et clair
- ✅ Panier unifié
- ✅ Récap systématique avant confirmation
- ✅ Options paiement complètes
- ✅ UX cohérente mobile/web

---

## 🚀 Plan d'Implémentation

### Étape 1: CartStore Unifié (1-2h)
1. Étendre types `CartItem` avec `type: 'product' | 'basket'`
2. Ajouter `addProduct()` action
3. Mettre à jour `itemsCount` et `totalAmount` computed
4. Tester ajout/suppression/modification

### Étape 2: CartCheckoutModal (2-3h)
1. Créer composant modal
2. Formulaire pickup date/time
3. Sélection paiement avec opérateurs
4. Validation et soumission
5. Integration avec ReservationsStore

### Étape 3: ProductCard Update (30min)
1. Ajouter bouton "Ajouter au panier"
2. Emit events appropriés
3. Toast notifications

### Étape 4: CartPage Refactor (1-2h)
1. Afficher produits ET baskets
2. CartItemCard component
3. Bouton Checkout en sticky footer
4. Integration modal

### Étape 5: ProductDetail Simplify (1h)
1. Remplacer 2 boutons par 1 principal
2. Bouton secondaire optionnel
3. Badge panier dans header

### Étape 6: Payment Methods (1h)
1. Ajouter icons opérateurs
2. Validation numéro par opérateur
3. Instructions spécifiques

### Étape 7: ReservationsView Polish (1h)
1. Tabs filtres
2. Empty states
3. Skeleton loaders

**Total estimé: 8-11 heures**

---

## ✅ Checklist de Validation

- [ ] Produit peut être ajouté au panier
- [ ] Badge panier se met à jour
- [ ] CartPage affiche produits + baskets
- [ ] Checkout modal s'ouvre depuis CartPage
- [ ] Tous les champs du modal sont validés
- [ ] Options paiement incluent flooz, tmoney, etc.
- [ ] Numéro téléphone validé selon opérateur
- [ ] PIN wallet vérifié
- [ ] Conditions générales obligatoires
- [ ] Réservation créée avec succès
- [ ] Panier vidé après confirmation
- [ ] Notification de succès affichée
- [ ] Redirection vers /reservations
- [ ] Réservation visible dans la liste
- [ ] Status badges corrects
- [ ] Actions (annuler, voir détails) fonctionnelles

---

## 📝 Notes Importantes

1. **Backward Compatibility**: Le wizard 4 étapes peut être conservé comme option avancée (accessible via "Options avancées")

2. **Mobile Money Operators**: Les opérateurs spécifiques (flooz, tmoney) nécessitent une configuration backend correspondante. Vérifier que les endpoints supportent ces méthodes.

3. **Wallet Balance**: Afficher le solde wallet et bloquer si insuffisant.

4. **Offline Support**: Le web n'a pas de vrai offline mode comme le mobile. Utiliser localStorage pour persister le panier.

5. **Analytics**: Tracker les events:
   - `Product Added to Cart`
   - `Checkout Started`
   - `Payment Method Selected`
   - `Reservation Created`
   - `Cart Cleared`

---

## 🔗 Fichiers de Référence

### À Créer
- `frontend/src/components/modals/CartCheckoutModal.vue`
- `frontend/src/components/cart/CartItemCard.vue`

### À Modifier
- `frontend/src/stores/cart.ts` - Étendre pour produits
- `frontend/src/views/CartPage.vue` - Afficher tous items
- `frontend/src/views/ProductDetailView2025.vue` - Simplifier actions
- `frontend/src/components/ui/2025/ProductCard.vue` - Bouton panier
- `frontend/src/layouts/MainLayout.vue` - Badge panier
- `frontend/src/types/index.ts` - Types CartItem

### Référence Mobile
- `mobile/src/screens/main/CartScreen.tsx`
- `mobile/src/components/modals/CartCheckoutModal.tsx`
- `mobile/src/store/slices/cartSlice.ts`
- `mobile/src/store/slices/reservationsSlice.ts`

---

**Prochaine étape**: Implémenter Phase 1 (CartStore Unifié)
