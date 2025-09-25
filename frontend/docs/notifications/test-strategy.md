# Test Strategy Notifications v2

## Objectifs

1. Garantir que `NotificationContainer.vue` relaie correctement les erreurs Pinia et évite les doublons.
2. Vérifier que `NotificationSystem.vue` gère les interactions utilisateur (action/close) et la pile globale.
3. Couvrir les règles du composable `useNotifications` : timers, callbacks, stacking, idempotence.
4. Atteindre ≥ 80 % de couverture sur le module notifications (composants + composable + store).

## Périmètre

| Module | Type de test | Objectifs |
| --- | --- | --- |
| `NotificationContainer.vue` | Intégration (Pinia + UI) | Watchers store → toasts, gestion `notificationIds`, callbacks `clearError`/`fetchProducts`. |
| `NotificationSystem.vue` | UI + composable | Rendu des toasts, action button, fermeture manuelle, accessibilité. |
| `useNotifications.ts` | Unitaire | Ajout/suppression, auto-close, progress, helpers `success/error/warning/info`. |
| `stores/notification.ts` | Unitaire | Fetch, mark-as-read, préférences (déjà couvert). |
| `useNetworkError.ts` | À surveiller (tests e2e ultérieurs) | Events online/offline, `withRetry`. Hors scope immédiat. |

## Plan de test

### 1. Intégration (`tests/integration/notifications.integration.spec.ts`)

- Monte `NotificationContainer` + `NotificationSystem` avec Pinia réelle.
- Simule des erreurs sur `auth`, `products`, `reservations` → attend 3 toasts stackés.
- Clique sur l'action « Réessayer » → vérifie appel `fetchProducts` + `clearError`.
- Ferme un toast → vérifie reset `notificationIds` + `clearError` associé.
- Vérifie qu'une nouvelle erreur remplace l'ancienne (pas de doublon).

### 2. Unitaire (`tests/unit/useNotifications.spec.ts`)

- `addNotification` génère des IDs uniques & ajoute `progress` par défaut.
- Auto-close : timer déclenche `removeNotification` après `duration` et appelle `onClose`.
- `autoClose: false` → la notification reste en pile après `duration`.
- `removeNotification` est idempotent (`onClose` une seule fois, timers nettoyés).
- `clearAll` purge la pile, annule les timers, déclenche tous les `onClose`.
- Helpers `success/error/warning/info` héritent des options personnalisées (ex. `error` force `autoClose: false`).

### 3. Couverture & surveillance

| KPI | Seuil | Méthode |
| --- | --- | --- |
| Couverture statements/composants notifications | ≥ 80 % | `vitest --coverage` (optionnel via `vitest.config` local). |
| Couverture branches `useNotifications` | ≥ 75 % | Tests auto-close + helpers. |
| Temps d'exécution suite notif | ≤ 5 s | Observé via `vitest run`. |

## Mocks & fixtures

- **Pinia** : `createPinia()` + `setActivePinia()` pour l'intégration.
- **localStorage** : mock global (`beforeAll`) pour `authStore`.
- **API store products** : `vi.spyOn(productsStore, 'fetchProducts').mockResolvedValue(...)`.
- **Timers** : `vi.useFakeTimers()` pour auto-close.

## Commandes

```bash
cd frontend
npm run test:unit
```

> ℹ️ Ajouter `--runInBand` si vous exécutez la suite sur CI lente.
