# 🎯 OPTION 2 : Detox (E2E Natif React Native)

## Pourquoi Detox ?
- ✅ **Tests E2E natifs** sur émulateur/device réel
- ✅ **testIDs fonctionnent** nativement
- ✅ **Synchronisation automatique** avec React Native
- ✅ **Screenshots automatiques** en cas d'erreur
- ⚠️ Plus lent que React Testing Library
- ⚠️ Nécessite émulateur/simulateur

---

## Phase 1 : Installation (15 min)

### 1. Installer Detox CLI globalement
```bash
npm install -g detox-cli
```

### 2. Installer dépendances projet
```bash
cd mobile
npm install --save-dev detox jest
```

### 3. Configurer Detox

**Fichier:** `.detoxrc.js`

```javascript
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3a_API_34_extension_level_7_x86_64'
      }
    }
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
```

### 4. Configurer Jest pour E2E

**Fichier:** `e2e/jest.config.js`

```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

### 5. Setup Detox

**Fichier:** `e2e/setup.ts`

```typescript
import { device, by, element } from 'detox';

beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    permissions: { notifications: 'YES', location: 'always' }
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
```

---

## Phase 2 : Premier Test E2E (20 min)

### Test 1 : Consumer Reservation Flow

**Fichier:** `e2e/consumer-reservation.test.ts`

```typescript
import { device, by, element, expect as detoxExpect } from 'detox';
import { TEST_IDS } from '../src/utils/testIds';

describe('Consumer Reservation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete full reservation flow', async () => {
    // 1. Login rapide consumer
    await detoxExpect(element(by.id(TEST_IDS.loginScreen))).toBeVisible();
    await element(by.id(TEST_IDS.loginConsumerQuick)).tap();

    // 2. Attendre le chargement du home
    await detoxExpect(element(by.id(TEST_IDS.homeScreen))).toBeVisible();

    // 3. Click sur le premier produit
    await element(by.id(TEST_IDS.productCard(0))).tap();

    // 4. Vérifier l'écran de détails
    await detoxExpect(element(by.id(TEST_IDS.productDetailsScreen))).toBeVisible();

    // 5. Click sur le bouton Réserver
    await element(by.id(TEST_IDS.reserveButton)).tap();

    // 6. Attendre le modal de confirmation
    await detoxExpect(element(by.id(TEST_IDS.reservationModal))).toBeVisible();

    // 7. Confirmer la réservation
    await element(by.id(TEST_IDS.confirmButton)).tap();

    // 8. Vérifier le message de succès
    await detoxExpect(element(by.id(TEST_IDS.successModal))).toBeVisible();

    // 9. Naviguer vers les réservations
    await element(by.id(TEST_IDS.reservationsTab)).tap();

    // 10. Vérifier que la réservation apparaît
    await detoxExpect(element(by.id(TEST_IDS.reservationsScreen))).toBeVisible();
    await detoxExpect(element(by.id(TEST_IDS.reservationCard(0)))).toBeVisible();

    // 11. Screenshot pour vérification visuelle
    await device.takeScreenshot('consumer-reservation-success');
  });

  it('should cancel reservation', async () => {
    // Navigation vers réservations
    await element(by.id(TEST_IDS.reservationsTab)).tap();

    // Click sur annuler
    await element(by.id(TEST_IDS.cancelReservationButton(1))).tap();

    // Confirmer l'annulation (Alert natif)
    await element(by.text('Oui, annuler')).tap();

    // Vérifier le message de succès
    await detoxExpect(element(by.text(/annulée avec succès/i))).toBeVisible();
  });
});
```

### Test 2 : Merchant Product Creation Flow

**Fichier:** `e2e/merchant-product-creation.test.ts`

```typescript
import { device, by, element, expect as detoxExpect } from 'detox';
import { TEST_IDS } from '../src/utils/testIds';

describe('Merchant Product Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should create product successfully', async () => {
    // 1. Login merchant
    await element(by.id(TEST_IDS.loginMerchantQuick)).tap();

    // 2. Naviguer vers Produits
    await detoxExpect(element(by.id(TEST_IDS.merchantDashboard))).toBeVisible();
    await element(by.id(TEST_IDS.merchantProducts)).tap();

    // 3. Click sur ajouter produit
    await element(by.id(TEST_IDS.addProductButton)).tap();

    // 4. Vérifier le formulaire
    await detoxExpect(element(by.id(TEST_IDS.productFormScreen))).toBeVisible();

    // 5. Remplir le nom
    await element(by.id(TEST_IDS.productNameInput)).typeText('Pain complet bio');

    // 6. Remplir la description
    await element(by.id(TEST_IDS.productDescriptionInput)).typeText('Pain artisanal bio');

    // 7. Remplir le prix original
    await element(by.id(TEST_IDS.originalPriceInput)).typeText('1000');

    // 8. Remplir le prix réduit
    await element(by.id(TEST_IDS.discountedPriceInput)).typeText('500');

    // 9. Remplir la quantité
    await element(by.id(TEST_IDS.quantityInput)).typeText('10');

    // 10. Screenshot du formulaire rempli
    await device.takeScreenshot('product-form-filled');

    // 11. Soumettre
    await element(by.id(TEST_IDS.submitProductButton)).tap();

    // 12. Vérifier retour à la liste
    await detoxExpect(element(by.id(TEST_IDS.merchantProductsList))).toBeVisible();

    // 13. Vérifier que le produit apparaît
    await detoxExpect(element(by.text('Pain complet bio'))).toBeVisible();

    // 14. Screenshot final
    await device.takeScreenshot('product-created-success');
  });

  it('should show validation errors for invalid data', async () => {
    // Navigation vers formulaire
    await element(by.id(TEST_IDS.addProductButton)).tap();

    // Soumettre sans remplir
    await element(by.id(TEST_IDS.submitProductButton)).tap();

    // Vérifier les erreurs
    await detoxExpect(element(by.text(/nom du produit est requis/i))).toBeVisible();
  });
});
```

---

## Phase 3 : Build et Lancement (10 min)

### 1. Build l'APK de test
```bash
cd mobile
detox build --configuration android.emu.debug
```

### 2. Lancer les tests
```bash
detox test --configuration android.emu.debug
```

### 3. Lancer un test spécifique
```bash
detox test e2e/consumer-reservation.test.ts --configuration android.emu.debug
```

### 4. Mode debug
```bash
detox test --configuration android.emu.debug --loglevel trace
```

---

## Phase 4 : Scripts NPM (5 min)

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "e2e:build": "detox build --configuration android.emu.debug",
    "e2e:test": "detox test --configuration android.emu.debug",
    "e2e:test:release": "detox test --configuration android.emu.release",
    "e2e:clean": "detox clean-framework-cache && detox build-framework-cache"
  }
}
```

---

## Phase 5 : CI/CD avec Detox (15 min)

**Fichier:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  e2e-android:
    runs-on: macos-latest
    timeout-minutes: 60

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

    - name: Setup JDK
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '11'

    - name: Install Android SDK
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 34
        arch: x86_64
        profile: pixel_3a

    - name: Build Detox
      run: |
        cd mobile
        npm run e2e:build

    - name: Run E2E tests
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 34
        arch: x86_64
        profile: pixel_3a
        script: cd mobile && npm run e2e:test

    - name: Upload screenshots
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: detox-screenshots
        path: mobile/artifacts/**/*.png
```

---

## 📊 Avantages Detox

| Avantage | Description |
|----------|-------------|
| **testIDs natifs** | ✅ Fonctionne parfaitement |
| **Synchronisation** | ✅ Attend automatiquement les animations |
| **Screenshots** | ✅ Automatiques en cas d'échec |
| **Device réel** | ✅ Tests sur vrais devices possibles |
| **Debugging** | ✅ Excellent avec logs détaillés |

---

## ⚠️ Inconvénients Detox

- ⏱️ **Lent** : 30s-2min par test
- 💻 **Émulateur requis** : Pas de tests en local sans émulateur
- 🔧 **Setup complexe** : Plus de configuration que RTL

---

## 🎯 Cas d'Usage Idéaux

- **Tests E2E critiques** : Flows complets utilisateur
- **Tests de régression** : Validation avant release
- **Tests visuels** : Vérification UI/UX
- **Tests d'intégration** : Backend + Frontend

---

## ✅ Étapes Suivantes

1. ✅ Installer Detox CLI
2. ✅ Configurer `.detoxrc.js`
3. ✅ Build APK de test
4. ✅ Lancer premier test
5. ✅ Voir les testIDs fonctionner nativement !

**Temps estimé total : 1 heure pour setup + 2-3 heures pour tests complets**
