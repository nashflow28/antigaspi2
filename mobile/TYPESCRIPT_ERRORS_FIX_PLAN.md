# Plan de Résolution des Erreurs TypeScript - Tests Mobile

## Résumé des Erreurs

| Catégorie | Fichiers | Erreurs | Priorité |
|-----------|----------|---------|----------|
| E2E Detox | 4 fichiers | ~10 | P3 (basse) |
| authSlice.integration.test | 1 fichier | ~40 | P1 (haute) |
| cartSlice.integration.test | 1 fichier | ~40 | P1 (haute) |
| reservationsSlice.integration.test | 1 fichier | ~60 | P1 (haute) |
| test-utils/store.ts | 1 fichier | 1 | P2 (moyenne) |

**Total: ~151 erreurs dans 8 fichiers**

---

## Phase 1: Tests E2E Detox (10 erreurs)

### Problème
```typescript
// e2e/tests/auth.test.ts
error TS2307: Cannot find module 'detox'
error TS2304: Cannot find name 'waitFor'
```

### Cause
- La dépendance `detox` n'est pas installée
- Les types Detox ne sont pas disponibles

### Solution
**Option A: Installer Detox (si E2E tests nécessaires)**
```bash
npm install --save-dev detox @types/detox
```

**Option B: Exclure les tests E2E du TypeScript check (recommandé)**
```json
// tsconfig.json - ajouter dans "exclude"
{
  "exclude": [
    "node_modules",
    "e2e/**/*"
  ]
}
```

### Fichiers concernés
- `e2e/tests/auth.test.ts`
- `e2e/tests/cart.test.ts`
- `e2e/tests/merchant.test.ts`
- `e2e/tests/reservations.test.ts`

---

## Phase 2: authSlice.integration.test.ts (~40 erreurs)

### Problème 2.1: Export AuthState manquant
```typescript
// Ligne 16
error TS2614: Module '"../authSlice"' has no exported member 'AuthState'
```

### Solution 2.1
```typescript
// Dans authSlice.ts - ajouter l'export
export type { AuthState }
// OU
export interface AuthState { ... }
```

---

### Problème 2.2: Mock User incomplet (manque `updated_at`)
```typescript
// Lignes 100, 162, 177, 194, 267, 312, 346, 356, 394, 417, 433
error TS2741: Property 'updated_at' is missing in type
```

### Solution 2.2
Créer un helper mock dans le fichier de test:
```typescript
// En haut du fichier test
const createMockUser = (overrides = {}) => ({
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean@test.com',
  phone: '+22890123456',
  role: 'consumer' as const,
  city: 'Lomé',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',  // <-- Ajouter
  ...overrides
})

// Utilisation
mockApiService.login.mockResolvedValue({
  success: true,
  data: { token: 'token', user: createMockUser() }
})
```

---

### Problème 2.3: AsyncThunkAction non assignable à UnknownAction
```typescript
// Lignes 109, 125, 142, 165, 180, 196, 203, 218, 226, 240, etc.
error TS2345: AsyncThunkAction not assignable to UnknownAction
```

### Solution 2.3
Typer correctement le store dans les tests:
```typescript
// Avant
const store = configureStore({ reducer: { auth: authReducer } })
store.dispatch(loginUser(credentials))  // ❌ Erreur

// Après - Option A: Cast du dispatch
const store = configureStore({ reducer: { auth: authReducer } })
const dispatch = store.dispatch as AppDispatch
dispatch(loginUser(credentials))  // ✅

// Après - Option B: Typer le store
type TestStore = ReturnType<typeof configureStore<{ auth: AuthState }>>
const store: TestStore = configureStore({ reducer: { auth: authReducer } })
await store.dispatch(loginUser(credentials))  // ✅
```

---

### Problème 2.4: RegisterData manque `password_confirmation`
```typescript
// Lignes 270, 287, 299
error TS2345: Property 'password_confirmation' is missing
```

### Solution 2.4
```typescript
// Avant
const registerData = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@test.com',
  password: 'password123',
  phone: '+22890123456',
  role: 'consumer',
  city: 'Lomé'
}

// Après
const registerData = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@test.com',
  password: 'password123',
  password_confirmation: 'password123',  // <-- Ajouter
  phone: '+22890123456',
  role: 'consumer',
  city: 'Lomé'
}
```

---

## Phase 3: cartSlice.integration.test.ts (~40 erreurs)

### Problème 3.1: Export CartState manquant
```typescript
// Ligne 16
error TS2614: Module '"../cartSlice"' has no exported member 'CartState'
```

### Solution 3.1
```typescript
// Dans cartSlice.ts - ajouter l'export
export type { CartState }
```

---

### Problème 3.2: Mock Cart incomplet
```typescript
// Lignes multiples
error TS2739: Type missing properties 'total_amount', 'items_count'
```

### Solution 3.2
```typescript
// Créer un helper mock
const createMockCart = (overrides = {}) => ({
  id: 1,
  user_id: 1,
  items: [],
  total_items: 0,
  total_price: 0,
  total_amount: 0,       // <-- Ajouter
  items_count: 0,        // <-- Ajouter
  ...overrides
})
```

---

### Problème 3.3: CartItemPayload utilise `product_id` au lieu de `productId`
```typescript
// Lignes 150, 161, 180
error TS2561: 'product_id' does not exist, did you mean 'productId'?
```

### Solution 3.3
```typescript
// Avant
dispatch(addToCart({ product_id: 1, quantity: 2 }))

// Après
dispatch(addToCart({ productId: 1, quantity: 2 }))
```

---

### Problème 3.4: AsyncThunkAction (même que Phase 2)

### Solution 3.4
Même solution que Phase 2.3 - typer le dispatch.

---

## Phase 4: reservationsSlice.integration.test.ts (~60 erreurs)

### Problème 4.1: Export ReservationsState manquant
```typescript
// Ligne 18
error TS2614: Module has no exported member 'ReservationsState'
```

### Solution 4.1
```typescript
// Dans reservationsSlice.ts
export type { ReservationsState }
```

---

### Problème 4.2: Mocks incomplets

Vérifier et compléter tous les mocks de Reservation, Product, Merchant avec les champs requis.

### Solution 4.2
Créer des factories de mock:
```typescript
const createMockMerchant = (overrides = {}) => ({
  id: 1,
  business_name: 'Test Shop',
  business_type: 'restaurant',
  city: 'Lomé',
  is_verified: true,
  ...overrides
})

const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  description: 'Description',
  original_price: 1000,
  discounted_price: 800,
  quantity_available: 10,
  expiration_date: '2024-12-31',
  discount_percentage: 20,
  savings: 200,
  days_until_expiration: 30,
  merchant: createMockMerchant(),
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

const createMockReservation = (overrides = {}) => ({
  id: 1,
  reservation_code: 'RES-001',
  status: 'pending',
  quantity: 1,
  total_price: 800,
  payment_method: 'on_site',
  payment_status: 'pending',
  product: createMockProduct(),
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})
```

---

### Problème 4.3: AsyncThunkAction (même que Phase 2)

### Solution 4.3
Même solution - typer le dispatch.

---

## Phase 5: test-utils/store.ts (1 erreur)

### Problème
```typescript
// Ligne 93
error TS2322: Type Reducer<...> is not assignable to Reducer<...>
```

### Cause
Le reducer combiné n'a pas la bonne signature avec les nouveaux slices ajoutés (delivery, driver).

### Solution
```typescript
// Vérifier que tous les reducers sont importés et ajoutés
import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import deliveryReducer from '../slices/deliverySlice'
import driverReducer from '../slices/driverSlice'
// ... autres reducers

const rootReducer = combineReducers({
  auth: authReducer,
  delivery: deliveryReducer,
  driver: driverReducer,
  // ... tous les autres
})

// S'assurer que le type RootState est cohérent
export type RootState = ReturnType<typeof rootReducer>
```

---

## Ordre d'Exécution Recommandé

### Étape 1: Configuration (5 min)
- [ ] Exclure e2e/ du tsconfig.json

### Étape 2: Exports manquants (10 min)
- [ ] Exporter `AuthState` depuis authSlice.ts
- [ ] Exporter `CartState` depuis cartSlice.ts
- [ ] Exporter `ReservationsState` depuis reservationsSlice.ts

### Étape 3: Créer helpers de mock (20 min)
- [ ] `createMockUser()` dans authSlice.integration.test.ts
- [ ] `createMockCart()` dans cartSlice.integration.test.ts
- [ ] `createMockReservation()` dans reservationsSlice.integration.test.ts

### Étape 4: Corriger les payloads (15 min)
- [ ] Ajouter `password_confirmation` aux tests register
- [ ] Changer `product_id` → `productId` dans cart tests
- [ ] Compléter les champs manquants (updated_at, total_amount, etc.)

### Étape 5: Typer les dispatches (15 min)
- [ ] Créer type `TestAppDispatch` dans chaque fichier test
- [ ] Remplacer `store.dispatch(...)` par dispatch typé

### Étape 6: Fix test-utils/store.ts (10 min)
- [ ] Vérifier import de tous les reducers
- [ ] Corriger la signature du combineReducers

### Étape 7: Vérification finale (5 min)
```bash
npx tsc --noEmit
```

---

## Temps Estimé Total: ~1h20

| Phase | Temps |
|-------|-------|
| Phase 1 (E2E) | 5 min |
| Phase 2 (auth) | 25 min |
| Phase 3 (cart) | 20 min |
| Phase 4 (reservations) | 20 min |
| Phase 5 (store) | 10 min |
| **Total** | **~1h20** |

---

## Commandes de Vérification

```bash
# Vérifier erreurs TypeScript
cd mobile && npx tsc --noEmit

# Compter erreurs restantes
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Lancer les tests après fix
npm test -- --testPathPattern="integration"
```
