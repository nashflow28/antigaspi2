# Plan de Correction des Tests Jest Mobile

## Résumé de la Situation Actuelle

**Tests réussis:** 691/778 (89%)
**Tests échoués:** 76
**Suites échouées:** 3

### Fichiers avec tests échoués:
| Fichier | Tests Échoués | Cause Principale |
|---------|---------------|------------------|
| AdminAnalyticsScreen.test.tsx | 37 | Providers manquants |
| AdminBroadcastScreen.test.tsx | 15 | Providers manquants |
| MerchantSurpriseBasketsScreen.test.tsx | 24 | Providers manquants |

---

## Diagnostic Détaillé

### Problème Commun: Providers Manquants

Les trois fichiers de tests utilisent `render()` sans wrapper de providers. Les composants échouent car ils dépendent de:

1. **SafeAreaProvider** - Pour les insets et dimensions d'écran
2. **Provider (Redux)** - Pour le store Redux (auth, reservations, etc.)
3. **ThemeProvider** - Pour le hook `useTheme()`
4. **ToastProvider** - Pour les notifications toast
5. **AlertProvider** - Pour les alertes contextuelles

### Erreurs Typiques Observées

```
Unable to find element with testID: admin-analytics-screen
Timed out waiting for getByTestId(TEST_IDS.adminAnalytics)
```

Ces erreurs indiquent que le composant ne se rend pas correctement à cause des providers manquants.

---

## Plan de Correction

### Phase 1: AdminAnalyticsScreen.test.tsx (37 tests)

#### Modifications Nécessaires

```typescript
// 1. Ajouter les imports
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../store/slices/authSlice'
import { ThemeProvider } from '../../theme'
import { ToastProvider } from '../../contexts/ToastContext'
import { AlertProvider } from '../../contexts/AlertContext'

// 2. Créer le store de test
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: { id: 1, role: 'admin', email: 'admin@test.com' },
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    },
  },
})

// 3. Créer le wrapper
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
}

const renderWithProviders = (ui: React.ReactElement) => {
  const store = createTestStore()
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>
              {ui}
            </AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

// 4. Remplacer tous les render() par renderWithProviders()
// Exemple:
// AVANT: render(<AdminAnalyticsScreen navigation={mockNavigation} />)
// APRÈS: renderWithProviders(<AdminAnalyticsScreen navigation={mockNavigation} />)
```

#### Tests à Vérifier Spécifiquement
- Tests avec `waitFor()` qui timeout
- Tests d'interaction avec les boutons de période
- Tests de changement d'onglet (Revenus, Géographie, Commerçants)

---

### Phase 2: AdminBroadcastScreen.test.tsx (15 tests)

#### Modifications Nécessaires

Même pattern que AdminAnalyticsScreen:

```typescript
// Mêmes imports et wrapper que Phase 1

const renderWithProviders = (ui: React.ReactElement) => {
  const store = createTestStore()
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>
              {ui}
            </AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}
```

#### Points d'Attention
- Tester la validation du formulaire (titre, message)
- Tester la sélection des canaux (database, mail, sms, push)
- Tester l'envoi avec confirmation Alert.alert

---

### Phase 3: MerchantSurpriseBasketsScreen.test.tsx (24 tests)

#### Modifications Nécessaires

```typescript
// 1. Imports identiques

// 2. Store avec preloadedState merchant
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: 1,
        role: 'merchant',
        email: 'merchant@test.com',
        merchant_id: 1
      },
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    },
  },
})

// 3. Même wrapper renderWithProviders()
```

#### Points d'Attention
- Tests CRUD (Create, Read, Update, Delete)
- Tests de filtrage (Tous, Actifs, Inactifs)
- Tests de validation du formulaire de création
- Tests de toggle de statut (activer/désactiver)

---

## Alternative: Utilisation de test-utils.tsx

Au lieu de créer des wrappers dans chaque fichier, on peut utiliser le wrapper centralisé déjà présent dans `test-utils.tsx`:

```typescript
// Dans les fichiers de test:
import { render, createTestStore } from '@test-utils'

// Le render de @test-utils inclut déjà tous les providers
const { getByTestId } = render(
  <AdminAnalyticsScreen navigation={mockNavigation} />,
  {
    store: createTestStore({
      auth: { user: { role: 'admin' }, isAuthenticated: true }
    })
  }
)
```

### Avantages
- Code DRY (Don't Repeat Yourself)
- Maintenance centralisée
- Cohérence entre tous les tests

---

## Ordre de Priorité

1. **MerchantSurpriseBasketsScreen.test.tsx** (24 tests)
   - Impact utilisateur direct (fonctionnalité merchant)
   - Tests CRUD importants

2. **AdminBroadcastScreen.test.tsx** (15 tests)
   - Fonctionnalité admin critique
   - Moins de tests = correction plus rapide

3. **AdminAnalyticsScreen.test.tsx** (37 tests)
   - Le plus de tests
   - Moins critique pour le MVP

---

## Temps Estimé

| Phase | Fichier | Temps Estimé |
|-------|---------|--------------|
| 1 | AdminAnalyticsScreen.test.tsx | 15-20 min |
| 2 | AdminBroadcastScreen.test.tsx | 10-15 min |
| 3 | MerchantSurpriseBasketsScreen.test.tsx | 15-20 min |
| **Total** | | **40-55 min** |

---

## Checklist de Validation

Après correction de chaque fichier:

- [ ] `npm test -- --testPathPattern="AdminAnalyticsScreen"` passe
- [ ] `npm test -- --testPathPattern="AdminBroadcastScreen"` passe
- [ ] `npm test -- --testPathPattern="MerchantSurpriseBasketsScreen"` passe
- [ ] `npm test` passe à 100% (778/778 tests)
- [ ] Pas de warnings ou erreurs dans la console

---

## Notes Techniques Supplémentaires

### Mocks Déjà Configurés (jest.setup.js)
- `expo-location` - Complet avec toutes les méthodes
- `@react-native-async-storage/async-storage` - Complet
- `expo-image-picker` - Complet
- Theme mock - `../../__mocks__/themeMock`

### Patterns à Éviter
- ❌ `button.props.disabled` - Utiliser `accessibilityState.disabled` ou vérifier les appels API
- ❌ `getByText()` pour vérifier l'absence - Utiliser `queryByText().toBeNull()`
- ❌ Tests dépendant de l'ordre de rendu MapView markers

### Patterns Recommandés
- ✅ `waitFor()` pour les opérations async
- ✅ `fireEvent.press()` pour les interactions
- ✅ Mock des réponses API avant chaque test
- ✅ `jest.clearAllMocks()` dans `beforeEach`

---

## Commandes Utiles

```bash
# Exécuter tous les tests
npm test

# Exécuter un fichier spécifique
npm test -- --testPathPattern="AdminAnalyticsScreen"

# Exécuter avec verbose
npm test -- --verbose

# Exécuter avec coverage
npm test -- --coverage

# Watcher mode pour développement
npm test -- --watch
```

---

*Document créé le: $(date)*
*Dernière mise à jour: Session de correction Jest*
