# 🧪 Test Utils - Guide Rapide

Infrastructure de tests centralisée pour React Native.

## 🚀 Usage Rapide

```typescript
import { render, createTestStore, createTestUser, createTestProduct, fireEvent, waitFor } from '@test-utils'
```

**Un seul import** pour tout l'écosystème de test !

---

## 📦 Exports Disponibles

### Helpers de Rendu

- `render(component, { store })` - Rend un composant avec Redux + ThemeProvider automatiques
- `renderWithProviders()` - Alias de `render()`
- `createTestStore(options)` - Crée un store Redux (complet ou minimal)

### Factories de Données

- `createTestUser(overrides?)` - User complet
- `createTestProduct(overrides?)` - Product complet
- `createTestCategory(overrides?)` - Category complète
- `createTestMerchant(overrides?)` - Merchant complet
- `createTestReservation(overrides?)` - Reservation complète

### Testing Library Re-exports

- `fireEvent` - Déclencher des événements
- `waitFor` - Attendre des conditions
- `within` - Chercher dans un sous-arbre
- `screen` - Queries globales
- `act` - Wrapper pour updates synchrones
- `cleanup` - Nettoyage après tests

---

## 💡 Exemples

### Test Simple

```typescript
import { render, createTestStore, createTestUser } from '@test-utils'

it('affiche le nom utilisateur', () => {
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
```

### Store Minimal (⚡ Accéléré)

```typescript
import { render, createTestStore } from '@test-utils'

it('test unitaire rapide', () => {
  const store = createTestStore({
    preloadedState: {
      auth: { /* ... */ },
    },
    minimal: true, // ⚡ Uniquement le reducer auth
  })

  const { getByText } = render(<AuthButton />, { store })

  expect(getByText('Se connecter')).toBeTruthy()
})
```

### Surcharge de Données

```typescript
import { createTestProduct, createTestMerchant } from '@test-utils'

const product = createTestProduct({
  name: 'Pain bio',
  discounted_price: '200',
  merchant: createTestMerchant({
    business_name: 'Bio Mart',
    is_verified: true, // ✅ Surcharge uniquement ce champ
  }),
})
```

---

## ⚙️ Options de Configuration

### `createTestStore(options)`

**Format 1: Simplifié (Recommandé)**
```typescript
createTestStore({
  auth: { /* ... */ },
  products: { /* ... */ },
})
```

**Format 2: Avec Options**
```typescript
createTestStore({
  preloadedState: {
    auth: { /* ... */ },
  },
  minimal: true, // Store léger avec uniquement les reducers spécifiés
})
```

---

## 📚 Documentation Complète

- **`TEST_UTILS_FINAL.md`** - Documentation v2.0 complète
- **`TEST_MIGRATION_GUIDE.md`** - Guide de migration étape par étape
- **`TEST_INFRASTRUCTURE_IMPROVEMENTS.md`** - Analyse d'impact
- **`INFRASTRUCTURE_TESTS_RECAP.md`** - Récapitulatif de l'infrastructure

---

## ✅ Validation

```bash
# Tester l'infrastructure elle-même
npm test -- test-utils.test.tsx

# Résultat attendu: 11/11 tests passent
```

---

## 🎯 Règles d'Or

1. **Toujours importer depuis `@test-utils`** (jamais de chemins relatifs)
2. **Utiliser les factories** au lieu de créer des objets manuellement
3. **Surcharger uniquement les champs nécessaires** dans les factories
4. **Mode minimal pour tests unitaires** isolés (accélération)
5. **Mode complet (par défaut) pour tests d'intégration**

---

## ❌ Anti-Patterns

### À Éviter

```typescript
// ❌ Imports relatifs
import { render } from '../../test-utils/test-utils'

// ❌ Objets de test manuels
const user = { id: 1, email: 'test@test.com' } // Types incomplets

// ❌ Configuration manuelle du store
const store = configureStore({ reducer: { auth: authReducer } })

// ❌ Wrappers manuels
render(<Provider><ThemeProvider><Component /></ThemeProvider></Provider>)
```

### À Faire

```typescript
// ✅ Alias propre
import { render, createTestUser, createTestStore } from '@test-utils'

// ✅ Factories avec types complets
const user = createTestUser({ role: 'consumer' })

// ✅ Store centralisé
const store = createTestStore({ auth: { user, /* ... */ } })

// ✅ Providers automatiques
render(<Component />, { store })
```

---

**Version:** 2.0
**Status:** ✅ Production Ready (11/11 tests passent)
**Support:** Consulter la documentation complète dans `mobile/TEST_UTILS_FINAL.md`
