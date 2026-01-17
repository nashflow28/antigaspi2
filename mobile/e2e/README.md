# Tests E2E Antigaspi Mobile

Ce dossier contient les tests end-to-end pour l'application mobile Antigaspi.

## Architecture de Tests à 3 Niveaux

### 1. Tests Unitaires/Intégration (Jest)
**Rapidité:** ⚡⚡⚡ (< 1 min pour tous)
**Fiabilité:** 95%

```bash
# Tous les tests
npm test

# Tests d'intégration Redux uniquement
npm run test:integration
```

**Fichiers:**
- `src/store/slices/__tests__/*Slice.integration.test.ts` - Tests Redux
- Vérifient les changements d'état, pas juste le rendu UI

### 2. Tests E2E Maestro (YAML)
**Rapidité:** ⚡⚡ (2-5 min)
**Fiabilité:** 80%

```bash
# Smoke test rapide
npm run test:e2e:smoke

# Tests par rôle
npm run test:e2e:consumer
npm run test:e2e:merchant
npm run test:e2e:auth

# Tous les flows
npm run test:e2e

# Mode studio (interactive)
npm run test:e2e:watch
```

**Prérequis:**
- Maestro CLI installé: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Émulateur Android ou appareil connecté
- App installée sur l'appareil

### 3. Tests E2E Detox (Gray-box)
**Rapidité:** ⚡ (5-15 min)
**Fiabilité:** 95%

```bash
# Build l'app pour tests
npm run test:detox:build:android

# Lancer les tests
npm run test:detox

# Sur appareil attaché
npm run test:detox:android

# iOS (macOS uniquement)
npm run test:detox:build:ios
npm run test:detox:ios
```

**Prérequis:**
- Detox CLI: `npm install -g detox-cli`
- Android SDK configuré
- Émulateur ou appareil

## Structure des Fichiers

```
e2e/
├── config/
│   └── maestro.yaml          # Config Maestro
├── flows/                     # Flows Maestro (YAML)
│   ├── auth/
│   │   ├── login-consumer.yaml
│   │   ├── login-merchant.yaml
│   │   └── logout.yaml
│   ├── consumer/
│   │   ├── browse-products.yaml
│   │   ├── create-reservation.yaml
│   │   ├── cancel-reservation.yaml
│   │   ├── cart-checkout.yaml
│   │   └── add-to-favorites.yaml
│   ├── merchant/
│   │   ├── manage-products.yaml
│   │   ├── manage-reservations.yaml
│   │   └── dashboard-stats.yaml
│   └── smoke-test.yaml       # Smoke test complet
├── tests/                     # Tests Detox (TypeScript)
│   ├── auth.test.ts
│   ├── reservations.test.ts
│   ├── cart.test.ts
│   └── merchant.test.ts
├── jest.config.js            # Config Jest pour Detox
└── README.md
```

## Comptes de Test

| Rôle | Email | Password |
|------|-------|----------|
| Consumer | jean.dupont@email.com | password |
| Merchant | boulangerie.martin@email.com | password |
| Admin | admin@antigaspi.com | password |

## Quand Utiliser Chaque Type

### Tests Unitaires/Intégration
- ✅ CI/CD - À chaque commit
- ✅ Développement local - Rapide feedback
- ✅ Vérifier la logique Redux
- ❌ Ne détecte pas les bugs UI

### Tests Maestro
- ✅ Smoke tests avant release
- ✅ Validation des flows utilisateur
- ✅ Facile à écrire et maintenir
- ❌ Moins fiable sur CI (dépend de l'UI)

### Tests Detox
- ✅ Tests de régression complets
- ✅ Gray-box - Accès aux internals
- ✅ Plus fiable que Maestro
- ❌ Plus lent à configurer
- ❌ Build séparé requis

## Bonnes Pratiques

1. **Toujours tester l'état, pas le rendu**
   - ❌ `expect(getByText('Annuler')).toBeTruthy()` (vérifie juste le rendu)
   - ✅ `expect(state.reservations[0].status).toBe('cancelled')` (vérifie l'effet)

2. **Tester les scénarios d'erreur**
   - Stock insuffisant
   - Network error
   - Token expiré

3. **Nommer clairement les tests**
   - `should cancel a pending reservation`
   - `should show error for invalid credentials`

4. **Utiliser des données de test réalistes**
   - Utiliser les vrais comptes de test
   - Tester avec des produits existants

## Troubleshooting

### Maestro ne trouve pas l'app
```bash
# Vérifier que l'app est installée
adb shell pm list packages | grep antigaspi
```

### Detox build échoue
```bash
# Nettoyer et rebuild
cd android && ./gradlew clean
npm run test:detox:build:android
```

### Tests flaky
- Augmenter les timeouts
- Ajouter des `waitFor` explicites
- Utiliser `optional: true` pour les éléments dynamiques
