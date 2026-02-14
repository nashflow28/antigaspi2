# Guide développeur Mobile (Expo / React Native)

## Stack & versions
- Expo 54 / React Native 0.81
- React 19
- Redux Toolkit
- React Navigation v7
- TypeScript 5.9

## Structure principale (`mobile/src`)
- `screens/` : écrans (main/consumer, merchant, admin, driver, auth).
- `navigation/` : navigateurs rôle‑based.
- `store/` : Redux slices (auth, cart, products, wallet, etc.).
- `services/` : appels API, offline, notifications, paiement.
- `theme/` + `components/2025/` : Design System 2025.
- `hooks/` : useTheme, useHaptics, useAlert, etc.

## Navigation (rôle‑based)
- `MainNavigator` : choisit le navigateur selon `user.role`.
- Navigators dédiés : `ConsumerNavigator`, `MerchantNavigator`, `AdminNavigator`, `DriverNavigator`.

## Auth & sécurité
- Auth par téléphone + OTP + PIN.
- Token stocké via `expo-secure-store` (secureStorage).

## Notifications
- `expo-notifications` + Firebase (Android).
- Préférences utilisateur via API `/notifications/*`.

## Offline & performance
- Cache local via `services/offlineService`.
- Timeout réseau adapté à l’Afrique de l’Ouest (`src/config/api.config.ts`).

## Commandes
```bash
cd mobile
npm install
npx expo start

# Qualité
npm run lint
npm run type-check
npm test
npm run test:coverage
```

## Points d’attention
- La configuration API est dans `app.json` (`expo.extra.apiUrl`).
- Les tests E2E (Maestro/Detox) existent mais demandent des environnements dédiés.

## Fichiers utiles
- `mobile/app.json`
- `mobile/src/navigation/MainNavigator.tsx`
- `mobile/src/theme/useTheme.ts`
- `mobile/src/services/api.ts`
