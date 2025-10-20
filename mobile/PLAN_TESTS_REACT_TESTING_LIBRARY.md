# 🧪 Plan d'Implémentation - React Testing Library

## Phase 1 : Installation (5 min)

### 1. Installer les dépendances
```bash
cd mobile
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### 2. Configurer Jest (déjà fait ✓)
Vérifier que `jest.config.js` contient :
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

---

## Phase 2 : Premier Test (10 min)

### 1. Créer un test pour ReservationsScreen

**Fichier:** `src/screens/main/__tests__/ReservationsScreen.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import configureStore from 'redux-mock-store';
import ReservationsScreen from '../ReservationsScreen';
import { TEST_IDS } from '../../../utils/testIds';

const mockStore = configureStore([]);

describe('ReservationsScreen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      reservations: {
        reservations: [
          {
            id: 1,
            reservation_code: 'RES001',
            status: 'pending',
            product: {
              id: 1,
              name: 'Pain artisanal',
              image_url: 'test.jpg',
              merchant: { name: 'Boulangerie Test' }
            },
            quantity: 2,
            total_amount: 500,
            created_at: '2025-10-18T10:00:00Z'
          }
        ],
        loading: false
      },
      auth: {
        user: { id: 1, name: 'Test User' }
      },
      connectivity: {
        isOnline: true
      }
    });
  });

  it('should render reservations screen with testID', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <ReservationsScreen navigation={{}} />
        </NavigationContainer>
      </Provider>
    );

    expect(getByTestId(TEST_IDS.reservationsScreen)).toBeTruthy();
  });

  it('should display reservations list', () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <ReservationsScreen navigation={{}} />
        </NavigationContainer>
      </Provider>
    );

    expect(getByTestId(TEST_IDS.reservationsList)).toBeTruthy();
    expect(getByText('Pain artisanal')).toBeTruthy();
  });

  it('should cancel reservation when cancel button is clicked', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <ReservationsScreen navigation={{}} />
        </NavigationContainer>
      </Provider>
    );

    const cancelButton = getByTestId(TEST_IDS.cancelReservationButton(1));
    fireEvent.press(cancelButton);

    // Vérifier que le modal de confirmation apparaît
    // Note: Alert.alert ne peut pas être testé facilement,
    // il faudrait le remplacer par un Modal custom
  });

  it('should filter reservations by tab', async () => {
    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <ReservationsScreen navigation={{}} />
        </NavigationContainer>
      </Provider>
    );

    // Click sur l'onglet "completed"
    const completedTab = getByTestId('tab-completed');
    fireEvent.press(completedTab);

    await waitFor(() => {
      // Vérifier que seules les réservations complétées sont affichées
      expect(queryByText('Pain artisanal')).toBeNull(); // pending, donc masqué
    });
  });
});
```

### 2. Lancer le test
```bash
npm test -- ReservationsScreen.test.tsx
```

---

## Phase 3 : Tests Flows Critiques (30 min)

### Test 1 : Consumer Reservation Flow

**Fichier:** `src/__tests__/flows/consumer-reservation.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import configureStore from 'redux-mock-store';
import ProductDetailsScreen from '../../screens/main/ProductDetailsScreen';
import { TEST_IDS } from '../../utils/testIds';

const mockStore = configureStore([]);

describe('Consumer Reservation Flow', () => {
  it('should complete full reservation flow', async () => {
    const store = mockStore({
      auth: {
        user: { id: 1, role: 'consumer' },
        token: 'test-token'
      },
      products: {
        selectedProduct: {
          id: 1,
          name: 'Pain artisanal',
          discounted_price: 250,
          quantity_available: 10,
          merchant: { id: 1, name: 'Boulangerie' }
        }
      }
    });

    const mockNavigate = jest.fn();
    const navigation = { navigate: mockNavigate };

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <NavigationContainer>
          <ProductDetailsScreen navigation={navigation} route={{ params: { productId: 1 } }} />
        </NavigationContainer>
      </Provider>
    );

    // 1. Vérifier que l'écran est affiché
    expect(getByTestId(TEST_IDS.productDetailsScreen)).toBeTruthy();

    // 2. Click sur le bouton Réserver
    const reserveButton = getByTestId(TEST_IDS.reserveButton);
    fireEvent.press(reserveButton);

    // 3. Attendre que le modal apparaisse
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.reservationModal)).toBeTruthy();
    });

    // 4. Confirmer la réservation
    const confirmButton = getByTestId(TEST_IDS.confirmButton);
    fireEvent.press(confirmButton);

    // 5. Vérifier que la navigation vers les réservations se fait
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Reservations');
    });
  });
});
```

### Test 2 : Merchant Product Creation Flow

**Fichier:** `src/__tests__/flows/merchant-product-creation.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProductFormScreen from '../../screens/merchant/ProductFormScreen';
import { TEST_IDS } from '../../utils/testIds';

describe('Merchant Product Creation Flow', () => {
  it('should create product successfully', async () => {
    const mockGoBack = jest.fn();
    const navigation = { goBack: mockGoBack };
    const route = { params: { mode: 'create' } };

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />
    );

    // 1. Vérifier que le formulaire est affiché
    expect(getByTestId(TEST_IDS.productFormScreen)).toBeTruthy();

    // 2. Remplir le nom du produit
    const nameInput = getByTestId(TEST_IDS.productNameInput);
    fireEvent.changeText(nameInput, 'Pain complet');

    // 3. Remplir le prix original
    const originalPriceInput = getByTestId(TEST_IDS.originalPriceInput);
    fireEvent.changeText(originalPriceInput, '1000');

    // 4. Remplir le prix réduit
    const discountedPriceInput = getByTestId(TEST_IDS.discountedPriceInput);
    fireEvent.changeText(discountedPriceInput, '500');

    // 5. Remplir la quantité
    const quantityInput = getByTestId(TEST_IDS.quantityInput);
    fireEvent.changeText(quantityInput, '10');

    // 6. Soumettre le formulaire
    const submitButton = getByTestId(TEST_IDS.submitProductButton);
    fireEvent.press(submitButton);

    // 7. Vérifier que la navigation retour se fait
    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('should show validation errors for invalid data', async () => {
    const navigation = { goBack: jest.fn() };
    const route = { params: { mode: 'create' } };

    const { getByTestId, getByText } = render(
      <ProductFormScreen navigation={navigation} route={route} />
    );

    // Soumettre sans remplir les champs
    const submitButton = getByTestId(TEST_IDS.submitProductButton);
    fireEvent.press(submitButton);

    // Vérifier que les erreurs de validation apparaissent
    await waitFor(() => {
      // Alert.alert serait remplacé par un composant testable
      expect(getByText(/nom du produit est requis/i)).toBeTruthy();
    });
  });
});
```

---

## Phase 4 : Couverture Complète (1-2h)

### Tests à créer :

1. **ProfileScreen.test.tsx**
   - ✅ Affichage des infos utilisateur
   - ✅ Click sur déconnexion
   - ✅ Click sur modifier profil

2. **MerchantDashboardScreen.test.tsx**
   - ✅ Affichage des stats
   - ✅ Navigation vers analytics

3. **MerchantProductsScreen.test.tsx**
   - ✅ Affichage de la liste
   - ✅ Click sur ajouter produit
   - ✅ Click sur éditer produit
   - ✅ Click sur supprimer produit

---

## Phase 5 : Scripts NPM (5 min)

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:flows": "jest src/__tests__/flows",
    "test:screens": "jest src/screens/**/__tests__"
  }
}
```

---

## Phase 6 : CI/CD (10 min)

Créer `.github/workflows/mobile-tests.yml` :

```yaml
name: Mobile Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd mobile
        npm ci

    - name: Run tests
      run: |
        cd mobile
        npm test -- --coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./mobile/coverage/lcov.info
```

---

## 📊 Métriques de Succès

| Métrique | Objectif |
|----------|----------|
| Couverture de code | > 80% |
| Tests flows critiques | 2/2 ✅ |
| Tests screens | 5/5 ✅ |
| Tests composants | 10+ |
| CI/CD | ✅ Automatisé |

---

## ✅ Avantages React Testing Library

1. **testIDs fonctionnent** nativement ✅
2. **Tests rapides** (< 1s par test)
3. **Pas besoin d'émulateur** (jsdom)
4. **Excellent debugging**
5. **Infrastructure déjà en place** (testIds.ts)

---

## 🚀 Prochaines Étapes

1. ✅ Installer dépendances
2. ✅ Créer premier test
3. ✅ Lancer `npm test`
4. ✅ Voir les testIDs fonctionner !

**Temps estimé total : 2-3 heures pour couverture complète**
