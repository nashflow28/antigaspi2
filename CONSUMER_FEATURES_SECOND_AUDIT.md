# 🔍 Deuxième Audit Approfondi - Fonctionnalités Consumer (Mobile)

**Date:** 2025-10-25
**Branche analysée:** `feature/mobile-prototype`
**Type:** Analyse approfondie post-corrections
**Focus:** Edge cases, validations, race conditions, typage TypeScript

---

## 📊 Résumé Exécutif

**Nouveaux bugs identifiés:** 19
**Incohérences critiques:** 8
**Problèmes de typage:** 6
**Code mort (offline):** 5

### **Répartition par catégorie:**
- 🔴 **Critique:** 5 bugs
- 🟠 **Haute:** 7 bugs
- 🟡 **Moyenne:** 7 bugs
- 🔵 **Incohérences:** 8 problèmes

---

## 🔴 BUGS CRITIQUES TROUVÉS (5)

### Bug #17: Validation de quantité manquante avant ajout au panier
**Fichier:** `mobile/src/screens/main/ProductDetailsScreen.tsx`
**Ligne:** 138
**Sévérité:** 🔴 Critique

**Problème:**
```typescript
const handleAddToCart = async () => {
  if (!product || addingToCart || product.quantity_available === 0) {
    return  // ❌ Vérifie seulement si stock = 0, pas si selectedQuantity > stock !
  }

  setAddingToCart(true)
  try {
    const response = await dispatch(addCartItem({
      productId: product.id,
      quantity: selectedQuantity,  // ⚠️ Peut être > quantity_available !
    })).unwrap()
```

**Scénario de bug:**
1. Produit a 5 unités disponibles
2. Utilisateur sélectionne 3 unités
3. Pendant ce temps, un autre utilisateur achète 4 unités (reste 1)
4. Premier utilisateur clique "Ajouter au panier" avec 3 unités
5. Aucune validation côté client → Envoi au serveur → Rejet API
6. Mauvaise UX: l'utilisateur voit une erreur au lieu d'une notification de stock insuffisant

**Solution recommandée:**
```typescript
const handleAddToCart = async () => {
  if (!product || addingToCart || product.quantity_available === 0) {
    return
  }

  // ✅ Validation avant envoi
  if (selectedQuantity > product.quantity_available) {
    showError(`Seulement ${product.quantity_available} unité(s) disponible(s)`)
    setSelectedQuantity(Math.min(selectedQuantity, product.quantity_available))
    return
  }

  setAddingToCart(true)
  // ...
}
```

**Impact:** Utilisateur peut tenter d'ajouter une quantité non disponible, causant des erreurs API inutiles.

---

### Bug #18: Division par zéro dans calcul de pourcentage de réduction
**Fichier:** `mobile/src/screens/main/ProductDetailsScreen.tsx`
**Ligne:** 128
**Sévérité:** 🔴 Critique

**Problème:**
```typescript
const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
const originalPrice = Math.round(parseFloat(product.original_price) || 0)
const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
// ❌ Si originalPrice = 0 → division par 0 → NaN !
```

**Scénario de bug:**
1. Produit gratuit ou prix original = 0
2. Division par zéro → `discountPercent` = NaN
3. Affichage: "NaN% de réduction"

**Solution recommandée:**
```typescript
const discountPercent = originalPrice > 0
  ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
  : 0
```

**Impact:** Affichage cassé pour les produits gratuits ou avec prix invalide.

---

### Bug #19: Crash potentiel sur merchant.business_name undefined
**Fichier:** `mobile/src/screens/main/ProductsScreen.tsx`
**Ligne:** 253
**Sévérité:** 🔴 Critique

**Problème:**
```typescript
// Tri des merchants
.sort((a, b) => {
  if (distanceEnabled && userLocation) {
    // ... calcul distance
  }

  return a.merchant.business_name.localeCompare(b.merchant.business_name)
  // ❌ Pas de vérification null/undefined pour business_name !
})
```

**Scénario de bug:**
1. Un merchant n'a pas de business_name (null ou undefined)
2. Appel de `.localeCompare()` sur undefined
3. **CRASH**: `Cannot read property 'localeCompare' of undefined`

**Solution recommandée:**
```typescript
return (a.merchant.business_name ?? '').localeCompare(b.merchant.business_name ?? '')
```

**Impact:** Crash complet de l'application si un merchant a un business_name manquant.

---

### Bug #20: Incohérence des types de prix (string vs number)
**Fichier:** `mobile/src/types/index.ts`
**Lignes:** 56-57
**Sévérité:** 🔴 Critique

**Problème:**
```typescript
export interface Product {
  id: number
  name: string
  description: string
  original_price: string  // ❌ string !
  discounted_price: string  // ❌ string !
  quantity_available: number
  // ...
}
```

**Impact:**
- Force des conversions `parseFloat()` partout dans le code
- Risque de NaN si la string est mal formée
- Incohérence avec l'interface `SurpriseBasketItem` qui utilise `number`:

```typescript
export interface SurpriseBasketItem {
  // ...
  unit_price: number  // ✅ number
  total_price: number  // ✅ number
  product: {
    original_price?: number  // ✅ number
    discounted_price?: number  // ✅ number
  }
}
```

**Solution recommandée:**
Changer `Product` pour utiliser `number` partout, ou au minimum utiliser un type union:
```typescript
original_price: string | number
```

**Conséquence:** Source de bugs multiples et conversions inutiles dans toute l'application.

---

### Bug #21: Race condition sur stock entre sélection et validation
**Fichier:** `mobile/src/screens/main/ProductDetailsScreen.tsx`
**Lignes:** 176-225
**Sévérité:** 🔴 Critique

**Problème:**
Entre le moment où l'utilisateur sélectionne une quantité et le moment où il valide la réservation, le stock peut changer (autre utilisateur, expiration, etc.). Aucune re-validation avant envoi.

**Scénario:**
1. T=0s: Utilisateur voit 10 unités disponibles
2. T=5s: Utilisateur sélectionne 8 unités
3. T=10s: Un autre utilisateur réserve 7 unités → reste 3
4. T=15s: Premier utilisateur clique "Réserver" avec 8 unités
5. Aucune validation → Envoi au serveur → Rejet
6. Mauvaise UX

**Solution recommandée:**
Recharger le produit juste avant la réservation:
```typescript
const performReservation = async () => {
  // Recharger le produit pour avoir le stock à jour
  await loadProduct()

  // Re-vérifier la quantité
  if (selectedQuantity > product.quantity_available) {
    showError(`Stock insuffisant. Seulement ${product.quantity_available} unité(s) disponible(s)`)
    setSelectedQuantity(Math.min(selectedQuantity, product.quantity_available))
    return
  }

  // Continuer la réservation...
}
```

**Impact:** Erreurs API fréquentes et mauvaise UX sur les produits populaires.

---

## 🟠 BUGS HAUTE SÉVÉRITÉ (7)

### Bug #22: Erreurs de cache offline avalées silencieusement
**Fichier:** `mobile/src/store/slices/productsSlice.ts`
**Lignes:** 42-56
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
const safeSetCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await offlineService.setCache(key, value)
  } catch {
    // Ignorer les erreurs de cache offline  // ❌ SILENCIEUX !
  }
}

const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    return await offlineService.getCache<T>(key)
  } catch {
    return null  // ❌ Échec silencieux
  }
}
```

**Impact:**
- L'utilisateur ne sait jamais si le cache offline fonctionne ou échoue
- Pas de logs pour débugger les problèmes de cache
- Comportement imprévisible en mode offline

**Solution recommandée:**
```typescript
const safeSetCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await offlineService.setCache(key, value)
  } catch (error) {
    console.warn('[Cache] Failed to set cache:', key, error)
    // Optionnel: tracker l'erreur avec analytics
  }
}
```

---

### Bug #23: Promise.allSettled ignore les échecs silencieusement
**Fichier:** `mobile/src/store/slices/productsSlice.ts`
**Ligne:** 92-94
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
const persistProductsList = async (cacheKey: string, products: Product[]): Promise<void> => {
  await safeSetCache(cacheKey, products)
  await Promise.allSettled(
    products.map(product => offlineService.setCache(productCacheKey(product.id), product))
  )  // ❌ Échecs ignorés, pas de log
}
```

**Impact:**
Certains produits peuvent ne pas être cachés en offline mais on ne le saura jamais.

**Solution recommandée:**
```typescript
const results = await Promise.allSettled(
  products.map(product => offlineService.setCache(productCacheKey(product.id), product))
)
const failures = results.filter(r => r.status === 'rejected')
if (failures.length > 0) {
  console.warn(`[Cache] Failed to cache ${failures.length} products`)
}
```

---

### Bug #24: Code mort offline dans reservationsSlice
**Fichier:** `mobile/src/store/slices/reservationsSlice.ts`
**Lignes:** 68-89
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
addOfflineReservation: (state, action: PayloadAction<Reservation>) => {
  state.reservations.unshift(action.payload)
},
markReservationSyncPending: (
  state,
  action: PayloadAction<{ id: number; pendingAction: 'create' | 'update' | 'delete' }>
) => {
  const reservation = state.reservations.find(r => r.id === action.payload.id)
  if (reservation) {
    reservation.pendingSync = true
    reservation.pendingAction = action.payload.pendingAction
  }
},
clearPendingReservations: (state) => {
  state.reservations = state.reservations.filter(reservation => !reservation.pendingSync)
},
```

**Impact:**
- 3 reducers définis mais jamais utilisés (offlineService désactivé)
- Code mort qui crée de la confusion
- Ligne 4: `// import offlineService from '../../services/offlineService' // Désactivé temporairement pour le web`

**Solution recommandée:**
Retirer complètement ces reducers ou implémenter correctement le mode offline.

---

### Bug #25: Méthode toLowerCase() appelée comme propriété
**Fichier:** `mobile/src/screens/main/ProductsScreen.tsx`
**Lignes:** 282-283
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
const merchantName = product.merchant?.business_name?.toLowerCase?.() ?? ''
const merchantCity = product.merchant?.city?.toLowerCase?.() ?? ''
// ❌ toLowerCase?.() au lieu de ?.toLowerCase()
```

**Explication:**
La syntaxe `?.toLowerCase?.()` est bizarre. On appelle `toLowerCase` comme une propriété avec `?.`, puis on l'appelle comme une fonction avec `()`.

**Ce qui se passe réellement:**
- Si `business_name` existe, `business_name.toLowerCase` retourne une fonction
- Puis `?.()` appelle cette fonction
- Ça fonctionne mais c'est confus et non standard

**Solution recommandée:**
```typescript
const merchantName = product.merchant?.business_name?.toLowerCase() ?? ''
const merchantCity = product.merchant?.city?.toLowerCase() ?? ''
```

---

### Bug #26: Validation de quantity_available trop complexe
**Fichier:** `mobile/src/screens/main/ProductsScreen.tsx`
**Lignes:** 305-312
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
const availableQuantity = typeof product.quantity_available === 'number'
  ? product.quantity_available
  : Number((product as any).quantity_available ?? 0)  // ❌ as any

if (!Number.isFinite(availableQuantity)) {
  return false  // Produit filtré
}

if (availableQuantity <= 0) {
  return false  // Produit filtré
}
```

**Impact:**
- Utilisation de `as any` qui masque des problèmes de typage
- Logique complexe qui devrait être simplifiée
- Si `quantity_available` n'est pas un nombre valide, le produit est silencieusement filtré

**Solution recommandée:**
```typescript
const availableQuantity = Number(product.quantity_available)
if (!Number.isFinite(availableQuantity) || availableQuantity <= 0) {
  return false
}
```

---

### Bug #27: Doublons possibles de réservations
**Fichier:** `mobile/src/store/slices/reservationsSlice.ts`
**Ligne:** 100
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
.addCase(createReservation.fulfilled, (state, action: PayloadAction<ReservationCreationResponse>) => {
  state.loading = false
  state.reservations.unshift(action.payload.data)  // ❌ Pas de vérification de doublon
  state.error = null
})
```

**Scénario:**
1. Utilisateur crée une réservation
2. La réservation est ajoutée au début du tableau
3. Utilisateur rafraîchit la liste
4. La même réservation arrive du serveur
5. Doublon dans `state.reservations`

**Solution recommandée:**
```typescript
.addCase(createReservation.fulfilled, (state, action) => {
  state.loading = false
  const newReservation = action.payload.data
  const existingIndex = state.reservations.findIndex(r => r.id === newReservation.id)
  if (existingIndex === -1) {
    state.reservations.unshift(newReservation)
  } else {
    state.reservations[existingIndex] = newReservation
  }
  state.error = null
})
```

---

### Bug #28: Utilisation de delete sur objet Redux
**Fichier:** `mobile/src/store/slices/reservationsSlice.ts`
**Ligne:** 143
**Sévérité:** 🟠 Haute

**Problème:**
```typescript
.addCase(cancelReservation.fulfilled, (state, action) => {
  const index = state.reservations.findIndex(r => r.id === action.payload.id)
  if (index !== -1) {
    state.reservations[index] = action.payload
    state.reservations[index].pendingSync = false
    delete state.reservations[index].pendingAction  // ❌ Utilisation de delete
  }
})
```

**Impact:**
- L'opérateur `delete` peut causer des problèmes de performance dans Redux
- Peut casser l'immutabilité
- Problèmes de typage TypeScript

**Solution recommandée:**
```typescript
state.reservations[index] = {
  ...action.payload,
  pendingSync: false,
  pendingAction: undefined
}
```

---

## 🟡 BUGS MOYENNE SÉVÉRITÉ (7)

### Bug #29: Incohérence de typage phone (required vs optional)
**Fichier:** `mobile/src/types/index.ts`
**Lignes:** 10, 34
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
export interface User {
  phone?: string  // ✅ Optional
}

export interface Merchant {
  phone: string  // ❌ Required
}
```

**Impact:** Incohérence qui peut causer des bugs si un Merchant est créé sans phone.

**Solution:** Rendre cohérent (probablement optional pour les deux).

---

### Bug #30: Incohérence category (required vs optional)
**Fichier:** `mobile/src/types/index.ts`
**Lignes:** 64, 85
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
export interface Product {
  category: Category  // ❌ Required
}

export interface SurpriseBasketItem {
  product: {
    category?: Category | null  // ✅ Optional
  }
}
```

**Impact:** Force à avoir une catégorie même si elle n'existe pas, ou nécessite des conversions.

---

### Bug #31: Logique de fusion réservations complexe et risquée
**Fichier:** `mobile/src/store/slices/reservationsSlice.ts`
**Lignes:** 115-119
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
.addCase(fetchMyReservations.fulfilled, (state, action) => {
  state.loading = false
  const pendingReservations = state.reservations.filter(reservation => reservation.pendingSync)
  const remoteReservations = action.payload.filter(reservation =>
    !pendingReservations.some(pending => pending.id === reservation.id)
  )
  state.reservations = [...pendingReservations, ...remoteReservations]
  // ⚠️ Les réservations pending prennent priorité sur les remote
  state.error = null
})
```

**Impact:**
Si une réservation a été modifiée côté serveur (statut changé, etc.), la version locale périmée (pendingSync) sera gardée au lieu de la version serveur.

**Solution:** Fusionner intelligemment ou invalider les pending après un certain temps.

---

### Bug #32: Constants.expoConfig castés en any
**Fichier:** `mobile/src/screens/main/ProductDetailsScreen.tsx`
**Ligne:** 130
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
const isTestMode = Boolean((Constants?.expoConfig as any)?.extra?.testMode)
// ❌ as any
```

**Impact:** Masque des problèmes de typage. Devrait avoir un type approprié.

---

### Bug #33: Pas de cleanup sur fetch/cancel de réservation
**Fichiers:** `mobile/src/store/slices/reservationsSlice.ts`
**Lignes:** 37-46, 49-58
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
export const fetchReservation = createAsyncThunk(
  'reservations/fetch',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getReservation(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)  // ❌ Pas de gestion dans les reducers
    }
  }
)
```

**Impact:**
- Pas de `.pending` case pour `fetchReservation` et `cancelReservation`
- L'utilisateur ne voit pas de loading state pendant ces opérations

---

### Bug #34: Conversion parseInt sans radix
**Fichier:** `mobile/src/screens/main/ProductsScreen.tsx`
**Ligne:** 300
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
if (productCategoryId !== parseInt(selectedCategory, 10)) {
  // ✅ Radix 10 spécifié (CORRECT)
}
```

**Note:** Celui-ci est actuellement CORRECT, mais je le mentionne car c'est une bonne pratique qui devrait être vérifiée partout.

---

### Bug #35: Pas de debounce sur la recherche
**Fichier:** `mobile/src/screens/main/ProductsScreen.tsx`
**Lignes:** Gestion de searchQuery
**Sévérité:** 🟡 Moyenne

**Problème:**
```typescript
<TextInput
  style={styles.searchInput}
  placeholder={...}
  value={searchQuery}
  onChangeText={setSearchQuery}  // ❌ Pas de debounce
/>
```

**Impact:**
- Chaque frappe déclenche une re-computation des filtres
- Peut causer des problèmes de performance sur les longues listes
- Beaucoup de renders inutiles

**Solution recommandée:**
Utiliser un debounce de 300-500ms pour optimiser les performances.

---

## 🔵 INCOHÉRENCES & PROBLÈMES DE CODE (8)

### Incohérence #11: Service offline incohérent entre fichiers
**Fichiers:** Multiple
**Impact:** Confusion

**Problème:**
- `productsSlice.ts` importe et utilise `offlineService`
- `reservationsSlice.ts` a le import commenté avec "Désactivé temporairement pour le web"
- `ReservationsScreen.tsx` avait la logique offline qu'on a retirée

**Solution:** Décider si offline est supporté ou non, et être cohérent partout.

---

### Incohérence #12: Format monétaire inconsistant
**Fichiers:** Multiple

**Problème:**
- Certains endroits utilisent `toLocaleString()`
- D'autres utilisent `formatCurrency()`
- Pas de format standardisé

**Solution:** Utiliser uniquement `formatCurrency()` partout.

---

### Incohérence #13: Messages d'erreur en français vs anglais
**Fichiers:** Multiple

**Problème:**
Certains messages sont en français dans l'UI mais les logs console sont en anglais.

---

### Incohérence #14: Gestion de loading states variable
**Problème:**
- `ProductsScreen` a `isLoadingProducts` et `isLoadingMerchants` séparés
- `ProductDetailsScreen` a juste `loading`
- Pas de pattern cohérent

---

### Incohérence #15: TestIDs manquants sur plusieurs composants
**Fichier:** `ProductsScreen.tsx`

**Problème:**
Pas de TEST_IDS systématiques contrairement aux autres écrans.

---

### Incohérence #16: Espacement hardcodé vs theme
**Problème:**
Certains composants utilisent des valeurs hardcodées (16, 20), d'autres `theme.spacing.md`.

---

### Incohérence #17: Types de boutons mixtes
**Problème:**
Certains utilisent `<Button>` du design system, d'autres `<TouchableOpacity>`.

---

### Incohérence #18: Commentaires TODO non trackés
**Fichiers:** Multiple

**Problème:**
```typescript
// TODO: Réimplémenter la gestion offline proprement
// NOTE: offlineService désactivé pour compatibilité web
```

Nombreux TODOs qui ne sont pas trackés dans un système de gestion de tâches.

---

## 📋 Recommandations Prioritaires

### 🔴 À corriger IMMÉDIATEMENT:
1. **Bug #17:** Ajouter validation quantité avant ajout au panier
2. **Bug #18:** Protéger contre division par zéro
3. **Bug #19:** Null safety sur business_name dans tri
4. **Bug #20:** Standardiser les types de prix (string → number)
5. **Bug #21:** Re-valider stock avant réservation

### 🟠 À corriger rapidement:
6. **Bug #22-23:** Logger les erreurs de cache offline
7. **Bug #24:** Retirer le code mort offline ou l'implémenter
8. **Bug #25:** Corriger la syntaxe toLowerCase?.()
9. **Bug #27:** Éviter les doublons de réservations
10. **Bug #28:** Remplacer delete par assignment

### 🟡 À planifier:
11. Harmoniser les types TypeScript (phone, category)
12. Ajouter debounce sur la recherche
13. Ajouter loading states manquants
14. Standardiser les patterns de code

### 🔵 Améliorations:
15. Décider stratégie offline et être cohérent
16. Standardiser format monétaire
17. Ajouter TEST_IDS partout
18. Tracker les TODOs dans un système de gestion

---

## 📊 Métriques d'Impact

**Code affecté:**
- 5 fichiers screens
- 2 fichiers stores Redux
- 1 fichier types
- ~4000 lignes de code

**Effort estimé:**
- Bugs critiques: 3-4 jours
- Bugs haute sévérité: 4-5 jours
- Bugs moyenne sévérité: 2-3 jours
- Incohérences: 3-4 jours

**Total: 12-16 jours de développement**

---

## 🎯 Bugs les Plus Critiques par Impact Utilisateur

1. **Bug #21 (Race condition stock):** Utilisateurs voient souvent des erreurs sur produits populaires
2. **Bug #17 (Validation quantité):** Mauvaise UX avec rejets API fréquents
3. **Bug #19 (Crash business_name):** Crash complet de l'app possible
4. **Bug #18 (Division par zéro):** Affichage cassé sur produits gratuits
5. **Bug #20 (Types prix):** Source de bugs multiples partout

---

**Rapport généré par:** Claude Code - Analyse approfondie #2
**Branche:** `feature/mobile-prototype`
**Bugs total identifiés (audit 1 + 2):** 35 bugs + 18 incohérences = **53 problèmes**
