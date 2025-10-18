# 🎯 Test Utils - Infrastructure Finalisée v2.0

## 📋 Résumé des Améliorations Finales

Suite aux retours utilisateur, l'infrastructure de tests a été **complètement finalisée** avec les améliorations suivantes:

### ✅ 1. Factories Corrigées (Types Complets)

#### `createTestMerchant()` - Retourne maintenant `Merchant` complet

```typescript
// ❌ AVANT (Partial)
export const createTestMerchant = (overrides?: Partial<Merchant>): Partial<Merchant> => ({
  id: 1,
  business_name: 'Boulangerie Martin',
  city: 'Lomé',
  ...overrides,
})

// ✅ APRÈS (Complet)
export const createTestMerchant = (overrides?: Partial<Merchant>): Merchant => ({
  id: 1,
  business_name: 'Boulangerie Martin',
  business_type: 'Boulangerie', // ✅ Ajouté
  city: 'Lomé',
  phone: '+228 90 00 00 00', // ✅ Ajouté
  is_verified: false, // ✅ Ajouté
  address: '123 Rue du Commerce', // ✅ Ajouté
  latitude: null,
  longitude: null,
  ...overrides,
})
```

#### `createTestProduct()` - Aligné avec le type Product

```typescript
// ❌ AVANT (Champ incorrect)
export const createTestProduct = (overrides?: Partial<Product>): Product => ({
  expiration_date: '2025-10-21',
  expiry_date: '2025-10-21', // ❌ N'existe pas dans le type Product
  image_url: null, // ❌ null par défaut
  // ...
})

// ✅ APRÈS (Type aligné)
export const createTestProduct = (overrides?: Partial<Product>): Product => ({
  expiration_date: '2025-10-21', // ✅ Uniquement expiration_date
  // expiry_date supprimé
  image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff', // ✅ URL par défaut
  is_active: true, // ✅ Ajouté
  // ...
})
```

---

### ✅ 2. Store Flexible (Mode Complet vs Minimal)

#### Option `minimal` pour accélérer les tests

```typescript
// ✅ AVANT (Format simplifié - toujours supporté)
const store = createTestStore({
  auth: { user: createTestUser(), /* ... */ },
})

// ✅ APRÈS (Nouveau format avec options)
const store = createTestStore({
  preloadedState: {
    auth: { user: createTestUser(), /* ... */ },
  },
  minimal: true, // ✅ Crée un store avec uniquement le reducer auth
})
```

**Cas d'usage du mode minimal:**
- Tests unitaires isolés ne nécessitant qu'un seul slice
- Tests de performance nécessitant un store léger
- Tests de composants très simples

**Mode par défaut (complet):**
- Tous les reducers inclus (auth, products, reservations, merchants, favorites, reviews)
- Recommandé pour les tests d'intégration

---

### ✅ 3. Alias de Chemin `@test-utils`

#### Imports propres et cohérents

```typescript
// ❌ AVANT (Chemins relatifs longs)
import { render, createTestStore } from '../../test-utils/test-utils'
import { createTestUser, createTestProduct } from '../../test-utils/factories'

// ✅ APRÈS (Alias propre)
import { render, createTestStore, createTestUser, createTestProduct } from '@test-utils'
```

**Configuration `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@test-utils": ["src/test-utils"],
      "@test-utils/*": ["src/test-utils/*"]
    }
  }
}
```

---

### ✅ 4. Point d'Entrée Centralisé (`index.ts`)

#### Tous les exports regroupés

```typescript
// src/test-utils/index.ts
export { render, renderWithProviders, createTestStore } from './test-utils'
export { createTestUser, createTestProduct, createTestCategory, createTestMerchant, createTestReservation } from './factories'
export { fireEvent, waitFor, within, screen, act, cleanup } from '@testing-library/react-native'
```

**Avantage:**
- Import unique depuis `@test-utils`
- Plus besoin d'importer depuis `@testing-library/react-native` directement
- Cohérence dans tous les tests

---

## 🚀 Exemples d'Utilisation Finalisés

### Exemple 1: Test Simple (Mode Complet)

```typescript
import { render, createTestStore, createTestUser, fireEvent, waitFor } from '@test-utils'
import ProfileScreen from './ProfileScreen'

describe('ProfileScreen', () => {
  it('affiche le nom de l\'utilisateur', () => {
    const store = createTestStore({
      auth: {
        user: createTestUser({ first_name: 'Jean', last_name: 'Dupont' }),
        token: 'token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })

    const { getByText } = render(<ProfileScreen />, { store })

    expect(getByText('Jean Dupont')).toBeTruthy()
  })
})
```

### Exemple 2: Test Minimal (Accéléré)

```typescript
import { render, createTestStore, createTestUser } from '@test-utils'
import AuthButton from './AuthButton'

describe('AuthButton', () => {
  it('affiche le bouton de connexion pour utilisateurs non connectés', () => {
    // Store minimal: uniquement auth
    const store = createTestStore({
      preloadedState: {
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
      },
      minimal: true, // ⚡ Store ultra-léger
    })

    const { getByText } = render(<AuthButton />, { store })

    expect(getByText('Se connecter')).toBeTruthy()
  })
})
```

### Exemple 3: Test avec Surcharge de Données

```typescript
import { render, createTestStore, createTestProduct, createTestMerchant, fireEvent } from '@test-utils'
import ProductCard from './ProductCard'

describe('ProductCard', () => {
  it('affiche le badge "Vérifié" pour les merchants vérifiés', () => {
    const product = createTestProduct({
      name: 'Pain bio',
      discounted_price: '150',
      merchant: createTestMerchant({
        business_name: 'Bio Mart',
        is_verified: true, // ✅ Surcharge uniquement ce champ
      }),
    })

    const store = createTestStore({
      products: {
        products: [product],
        categories: [],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: false,
      },
    })

    const { getByText } = render(<ProductCard product={product} />, { store })

    expect(getByText('✓ Vérifié')).toBeTruthy()
  })
})
```

---

## 📊 Comparaison Finale: Avant vs Après

### Imports

| Critère | Avant | Après |
|---------|-------|-------|
| **Lignes d'imports** | 8-10 lignes | 1-2 lignes |
| **Chemins relatifs** | `../../test-utils/...` | `@test-utils` |
| **Imports multiples** | test-utils + testing-library | Un seul import |

### Configuration du Store

| Critère | Avant | Après |
|---------|-------|-------|
| **Reducers listés** | Manuellement à chaque fois | Automatique (mode complet) |
| **Store minimal** | ❌ Non supporté | ✅ Option `minimal` |
| **Ligne de config** | ~15 lignes | ~5 lignes |

### Types des Factories

| Factory | Avant | Après |
|---------|-------|-------|
| **createTestMerchant** | `Partial<Merchant>` | `Merchant` (complet) |
| **createTestProduct** | Champ `expiry_date` erroné | `expiration_date` correct |
| **image_url** | `null` par défaut | URL Unsplash par défaut |

---

## 🛠️ Configuration Requise

### 1. TypeScript Config

Assurez-vous que `tsconfig.json` contient:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@test-utils": ["src/test-utils"],
      "@test-utils/*": ["src/test-utils/*"]
    }
  }
}
```

### 2. Jest Config

Aucun changement nécessaire dans `jest.config.js`. Les alias TypeScript sont automatiquement résolus par `ts-jest` ou `babel-jest`.

---

## 📝 Bonnes Pratiques Finales

### ✅ À Faire

```typescript
// 1. Importer depuis @test-utils
import { render, createTestStore, createTestUser } from '@test-utils'

// 2. Utiliser les factories avec surcharges minimales
const user = createTestUser({ role: 'merchant' })

// 3. Mode minimal pour tests unitaires isolés
const store = createTestStore({ preloadedState: { auth: {...} }, minimal: true })

// 4. Surcharger uniquement les champs nécessaires
const product = createTestProduct({ name: 'Pain bio', discounted_price: '200' })
```

### ❌ À Éviter

```typescript
// 1. Imports relatifs longs
import { render } from '../../test-utils/test-utils'

// 2. Création manuelle d'objets de test
const user = { id: 1, email: 'test@test.com', role: 'consumer' } // ❌ Types incomplets

// 3. Duplication de configuration de store
const store = configureStore({ reducer: { auth: authReducer } }) // ❌ Utiliser createTestStore

// 4. Import direct de testing-library
import { fireEvent } from '@testing-library/react-native' // ❌ Importer depuis @test-utils
```

---

## 🎯 Checklist de Migration Finale

Pour migrer un test existant vers la nouvelle infrastructure:

- [ ] Remplacer les imports relatifs par `@test-utils`
- [ ] Utiliser `createTestStore()` au lieu de `configureStore()`
- [ ] Remplacer les objets User manuels par `createTestUser()`
- [ ] Remplacer les objets Product manuels par `createTestProduct()`
- [ ] Remplacer les objets Merchant manuels par `createTestMerchant()`
- [ ] Utiliser `render()` depuis `@test-utils` (inclut automatiquement les providers)
- [ ] Vérifier que tous les tests passent: `npm test -- <nom-du-fichier>`

---

## 🎁 Fichiers de l'Infrastructure

```
mobile/
├── src/
│   └── test-utils/
│       ├── index.ts              # ✅ Point d'entrée centralisé
│       ├── test-utils.tsx        # ✅ Helpers de rendu + store flexible
│       └── factories.ts          # ✅ Factories avec types complets
├── tsconfig.json                 # ✅ Alias @test-utils configuré
├── TEST_MIGRATION_GUIDE.md       # Guide de migration étape par étape
├── TEST_INFRASTRUCTURE_IMPROVEMENTS.md # Analyse d'impact
└── TEST_UTILS_FINAL.md           # 👈 Ce document
```

---

## 🚀 Prochaines Étapes

### Court Terme (Cette Semaine)
1. ✅ Factories corrigées avec types complets
2. ✅ Store flexible avec option `minimal`
3. ✅ Alias de chemin `@test-utils` configuré
4. ✅ Point d'entrée centralisé créé
5. ⏳ Migrer les 3 tests restants avec les nouvelles améliorations

### Moyen Terme (2-3 Semaines)
1. Créer des factories supplémentaires (Review, Payment, etc.)
2. Ajouter des helpers de setup (setupAuthenticatedUser, setupMerchantStore)
3. Documenter les patterns de tests avancés

### Long Terme (1-2 Mois)
1. Audit complet de la couverture de tests
2. Éliminer les tests dupliqués
3. Augmenter la couverture des flows critiques

---

## 📞 Support

Pour toute question sur l'infrastructure de tests:
- Consulter `TEST_MIGRATION_GUIDE.md` pour les exemples détaillés
- Consulter `TEST_INFRASTRUCTURE_IMPROVEMENTS.md` pour l'analyse d'impact
- Consulter ce document pour la référence complète v2.0

---

**Version**: 2.0 (Finalisée)
**Dernière mise à jour**: 18 Octobre 2025
**Status**: ✅ Production Ready
