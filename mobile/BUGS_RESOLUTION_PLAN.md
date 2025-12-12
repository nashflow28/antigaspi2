# Plan de Résolution des Bugs Non-Critiques

## Rapport Bug-Hunter - Bugs MEDIUM et LOW

**Date:** 2025-12-12
**Total bugs:** 27 (18 MEDIUM + 9 LOW)
**Estimation effort:** 4-6 heures de travail

---

## PHASE 1: Sécurité & Performance (Priorité Haute)

### 1.1 Console.log en Production (BUG-H-011)
**Sévérité:** HIGH → MEDIUM (reclassé car impact UX limité)
**Fichiers:** 31 fichiers, 201 occurrences
**Effort:** 30 min

**Actions:**
```bash
# Fichiers principaux à nettoyer:
- mobile/src/screens/main/*.tsx (HomeScreen, ProductDetailsScreen, etc.)
- mobile/src/store/slices/*.ts
- mobile/src/services/*.ts
- mobile/src/navigation/*.tsx
```

**Solution:**
1. Créer un utilitaire `logger.ts`:
```typescript
// mobile/src/utils/logger.ts
const isDev = __DEV__

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Toujours afficher les erreurs
  debug: (...args: any[]) => isDev && console.debug(...args),
}
```

2. Remplacer tous les `console.log` par `logger.log`
3. Conserver `console.error` pour les erreurs critiques

---

### 1.2 Hardcoded API Timeout (BUG-M-002)
**Sévérité:** MEDIUM
**Fichier:** `mobile/src/services/api.ts:146`
**Effort:** 15 min

**Problème actuel:**
```typescript
timeout: 10000, // Hardcodé
```

**Solution:**
```typescript
// mobile/src/config/api.config.ts
export const API_CONFIG = {
  TIMEOUT: {
    DEFAULT: 15000,      // 15s pour l'Afrique de l'Ouest
    UPLOAD: 60000,       // 60s pour upload fichiers
    SEARCH: 10000,       // 10s pour recherches
    AUTH: 20000,         // 20s pour authentification
  }
}

// Usage dans api.ts
this.api = axios.create({
  baseURL: this.baseURL,
  timeout: API_CONFIG.TIMEOUT.DEFAULT,
})
```

---

### 1.3 AsyncStorage pour Données Sensibles (BUG-C-006)
**Sévérité:** CRITICAL → MEDIUM (si déjà HTTPS)
**Fichier:** `mobile/src/services/api.ts`
**Effort:** 45 min

**Migration vers expo-secure-store:**
```typescript
// mobile/src/services/secureStorage.ts
import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token)
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token')
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token')
  },

  async setUserData(data: object): Promise<void> {
    await SecureStore.setItemAsync('user_data', JSON.stringify(data))
  },

  async getUserData(): Promise<object | null> {
    const data = await SecureStore.getItemAsync('user_data')
    return data ? JSON.parse(data) : null
  }
}
```

---

## PHASE 2: Qualité du Code (Priorité Moyenne)

### 2.1 Magic Numbers Non Documentés (BUG-M-001)
**Sévérité:** MEDIUM
**Fichiers:** CartScreen.tsx, HomeScreen.tsx, etc.
**Effort:** 20 min

**Créer fichier de constantes:**
```typescript
// mobile/src/constants/business.ts
export const PICKUP_OFFSET_DAYS = {
  SUPERMARKET: 2,    // Produits frais avec +48h de conservation
  RESTAURANT: 1,     // Plats préparés péremption rapide
  BAKERY: 1,         // Boulangerie - vente jour même
  DEFAULT: 1,
}

export const PRODUCT_LIMITS = {
  MAX_QUANTITY_PER_ORDER: 10,
  MIN_PRICE_XOF: 100,
  MAX_PRICE_XOF: 100000,
  DISCOUNT_THRESHOLD_PERCENT: 20,
}

export const UI_CONSTANTS = {
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION_MS: 200,
  TOAST_DURATION_MS: 3000,
}
```

---

### 2.2 Deep Equality Check Inefficace (BUG-M-003)
**Sévérité:** MEDIUM
**Fichier:** `mobile/src/hooks/usePersistedForm.ts:130`
**Effort:** 15 min

**Problème:**
```typescript
return JSON.stringify(formData) !== JSON.stringify(initialValues)
```

**Solution:**
```typescript
// Installer lodash: npm install lodash @types/lodash
import isEqual from 'lodash/isEqual'

// Remplacer par:
return !isEqual(formData, initialValues)
```

---

### 2.3 Prix en String vs Number Incohérent (BUG-M-004)
**Sévérité:** MEDIUM
**Fichiers:** Slices Redux + Composants
**Effort:** 45 min

**Solution - Normaliser dans les slices:**
```typescript
// mobile/src/store/slices/productsSlice.ts
// Dans les reducers, normaliser les prix:

const normalizeProduct = (product: any): Product => ({
  ...product,
  original_price: Number(product.original_price) || 0,
  discounted_price: Number(product.discounted_price) || 0,
})

// Dans fetchProducts.fulfilled:
state.products = action.payload.map(normalizeProduct)
```

---

### 2.4 Date Parsing Sans Timezone (BUG-M-005)
**Sévérité:** MEDIUM
**Fichiers:** HomeScreen.tsx, ProductDetailsScreen.tsx
**Effort:** 30 min

**Solution avec date-fns:**
```typescript
// mobile/src/utils/dateHelpers.ts
import { parseISO, differenceInDays, startOfDay } from 'date-fns'

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const expiry = parseISO(expirationDate)
  const today = startOfDay(new Date())
  return differenceInDays(expiry, today)
}

export const isExpired = (expirationDate: string): boolean => {
  return getDaysUntilExpiration(expirationDate) < 0
}

export const isExpiringSoon = (expirationDate: string, days: number = 3): boolean => {
  const remaining = getDaysUntilExpiration(expirationDate)
  return remaining >= 0 && remaining <= days
}
```

---

## PHASE 3: UX & Accessibilité (Priorité Moyenne-Basse)

### 3.1 Accessibility Labels Manquants (BUG-H-010)
**Sévérité:** HIGH → MEDIUM
**Fichiers:** Tous les composants TouchableOpacity
**Effort:** 1h 30min

**Checklist par écran:**

| Écran | Boutons à labelliser |
|-------|---------------------|
| HomeScreen | Refresh, Cart, Category chips, Product cards |
| ProductDetailsScreen | Back, Favorite, Add to cart, Reserve |
| CartScreen | Quantity +/-, Remove, Checkout |
| ReservationsScreen | Cancel, Details |
| ProfileScreen | Edit, Logout |

**Template:**
```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Ajouter au panier"
  accessibilityHint="Ajoute ce produit à votre panier"
  onPress={handleAddToCart}
>
```

---

### 3.2 Loading States Granulaires (BUG-M-008)
**Sévérité:** MEDIUM
**Effort:** 45 min

**Améliorer les skeletons par section:**
```tsx
// Skeleton spécifique pour chaque section
<View>
  {loadingProducts ? <ProductCardSkeleton count={4} /> : renderProducts()}
  {loadingCategories ? <CategorySkeleton /> : renderCategories()}
</View>
```

---

### 3.3 Images Sans Placeholder (BUG-M-013)
**Sévérité:** MEDIUM
**Effort:** 20 min

**Solution avec expo-image:**
```tsx
<Image
  source={{ uri: imageUrl }}
  placeholder={require('../assets/placeholder.png')}
  placeholderContentFit="cover"
  transition={200}
  style={styles.image}
/>
```

---

## PHASE 4: Code Cleanup (Priorité Basse)

### 4.1 Emoji Hardcodés (BUG-L-001)
**Sévérité:** LOW
**Fichiers:** HomeScreen.tsx, ProductsScreen.tsx
**Effort:** 30 min

**Remplacer par icônes vectorielles:**
```typescript
// mobile/src/constants/categoryIcons.ts
import { Ionicons } from '@expo/vector-icons'

export const CATEGORY_ICONS: Record<string, string> = {
  boulangerie: 'restaurant-outline',
  fruits: 'nutrition-outline',
  legumes: 'leaf-outline',
  viande: 'fish-outline',
  epicerie: 'basket-outline',
  default: 'pricetag-outline',
}

export const getCategoryIcon = (categoryName: string): string => {
  const name = categoryName.toLowerCase()
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(key)) return icon
  }
  return CATEGORY_ICONS.default
}
```

---

### 4.2 Variables Nommées Mixtes FR/EN (BUG-L-002)
**Sévérité:** LOW
**Effort:** 1h (progressif)

**Convention à adopter:**
- Variables: anglais (`isLoading`, `handleSubmit`)
- Textes UI: français (`"Ajouter au panier"`)
- Commentaires: français pour logique métier, anglais pour technique

---

### 4.3 Magic Strings Navigation (BUG-L-003)
**Sévérité:** LOW
**Effort:** 30 min

**Centraliser les routes:**
```typescript
// mobile/src/navigation/routes.ts
export const ROUTES = {
  // Main
  HOME: 'Home',
  PRODUCTS: 'Products',
  PRODUCT_DETAILS: 'ProductDetails',

  // Orders
  CART: 'Cart',
  RESERVATIONS: 'Reservations',
  RESERVATION_DETAILS: 'ReservationDetails',

  // Profile
  PROFILE: 'Profile',
  PROFILE_EDIT: 'ProfileEdit',

  // Merchant
  MERCHANT_DASHBOARD: 'MerchantDashboard',
  PRODUCT_FORM: 'ProductForm',
} as const

// Usage:
navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId })
```

---

### 4.4 TODO/FIXME Non Trackés (BUG-L-004)
**Sévérité:** LOW
**Effort:** 15 min

**Audit et nettoyage:**
```bash
# Trouver tous les TODO/FIXME
grep -r "TODO\|FIXME" mobile/src --include="*.ts" --include="*.tsx"
```

---

## PHASE 5: Tests (Priorité Variable)

### 5.1 Unit Tests Manquants (BUG-L-005)
**Sévérité:** LOW → MEDIUM
**Effort:** 2-4h (progressif)

**Fichiers prioritaires à tester:**
1. `mobile/src/utils/currencyHelpers.ts`
2. `mobile/src/utils/dateHelpers.ts`
3. `mobile/src/services/locationService.ts`
4. `mobile/src/store/slices/*.ts` (reducers)

---

## Résumé du Plan

| Phase | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| 1 | Sécurité & Performance | 1h 30min | Haute |
| 2 | Qualité du Code | 1h 50min | Moyenne |
| 3 | UX & Accessibilité | 2h 35min | Moyenne-Basse |
| 4 | Code Cleanup | 2h 15min | Basse |
| 5 | Tests | 2-4h | Variable |

**Total estimé:** 8-12 heures de travail

---

## Ordre d'Exécution Recommandé

### Sprint 1 (Immédiat - 2h)
1. ✅ Console.log en production (30 min)
2. ✅ API Timeout configurable (15 min)
3. ✅ Magic numbers documentés (20 min)
4. ✅ Deep equality fix (15 min)
5. ✅ Prix String → Number (45 min)

### Sprint 2 (Cette semaine - 3h)
6. SecureStore migration (45 min)
7. Date parsing avec date-fns (30 min)
8. Accessibility labels principaux (1h)
9. Routes centralisées (30 min)

### Sprint 3 (Semaine prochaine - 3h)
10. Accessibility labels complets (30 min restants)
11. Loading states granulaires (45 min)
12. Images placeholders (20 min)
13. Category icons vectoriels (30 min)
14. Nettoyage TODO/FIXME (15 min)

### Sprint 4 (Long terme - 4h+)
15. Tests unitaires utilitaires
16. Convention nommage FR/EN
17. Documentation JSDoc

---

## Validation Post-Correction

```bash
# Après chaque sprint:
cd mobile

# 1. Vérifier TypeScript
npx tsc --noEmit

# 2. Vérifier build
npx expo export --platform android --no-minify

# 3. Lancer tests existants
npm test

# 4. Commit
git add -A
git commit -m "fix(mobile): Sprint X - Bug fixes [description]"
```
