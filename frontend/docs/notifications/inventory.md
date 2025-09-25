# Inventaire Notifications — Watchers & Tests existants

## Watchers / abonnements Pinia → Notifications

| Watcher / Source | Store Pinia | Déclencheur | Notification émise | Callbacks associés | Notes |
| --- | --- | --- | --- | --- | --- |
| `watch(() => authStore.error)` (NotificationContainer) | `useAuthStore` | `error` non nul (auth) | `notify.error(message, "Erreur d'authentification")` | `onClose` → `authStore.clearError()` + reset id | Suppression immédiate si `error` repasse à `null`. |
| `watch(() => productsStore.error)` (NotificationContainer) | `useProductsStore` | `error` non nul (catalogue produits) | `notify.error(message, 'Chargement des produits', action "Réessayer")` | `onAction` → `productsStore.clearError()` + `productsStore.fetchProducts()` ; `onClose` → `productsStore.clearError()` | Gestion d'un toast unique par source via `notificationIds`. |
| `watch(() => reservationsStore.error)` (NotificationContainer) | `useReservationsStore` | `error` non nul (réservations) | `notify.error(message, 'Réservations')` | `onClose` → `reservationsStore.clearError()` | Idempotence assurée par `clearNotification(source)`. |
| `window.addEventListener('online')` (`useNetworkError`) | `useNotifications` global | Passage offline → online | `notify.success('Connexion rétablie', 'En ligne')` | `replayPendingRequests()` | Rejoue les requêtes en attente via `withRetry`. |
| `window.addEventListener('offline')` (`useNetworkError`) | `useNotifications` global | Perte de connexion | `notify.warning('Connexion interrompue…', 'Hors ligne')` | — | Maintient l'état `isOnline`. |
| `withRetry` (`useNetworkError`) | `pendingRequests` interne | Retentatives réseau | `notify.warning(...)`, `notify.error(...)`, `notify.success(...)` selon scénario | — | Timers progressifs + backoff. |
| Stores `setError` (auth/products/...) | Divers stores | Appel `setError` interne | `setTimeout` pour reset `error` → déclenche watchers ci-dessus | — | Timeout 5s pour auto-clear. |

### Autres usages du composable `notify`

- Stores & vues (`cart`, `favorites`, `merchants`, `ProductReserveView`, etc.) appellent directement `notify.success`/`error`. Ces appels sont listés dans l'onglet « Notifications directes » du document de dette (voir synthèse ci-dessous).
- Les composants administrateur (`UsersView`, `MerchantsView`) maintiennent leur propre pile locale (notifications internes) — hors périmètre du container global.

## Tests existants

| Fichier | Portée | Couverture principale |
| --- | --- | --- |
| `tests/unit/NotificationContainer.spec.ts` | Intégration component + Pinia | Rendu des toasts stackés, clear des erreurs stores. |
| `tests/unit/NotificationSystem.spec.ts` | UI système global | Rendu des notifications, propagation `onAction`/`onClose`. |
| `tests/unit/useNotifications.spec.ts` | Composable | Ajout/suppression basiques, callbacks. (Étendu dans cette itération). |
| `tests/unit/notificationStore.spec.ts` | Store notifications serveur | Chargement, lecture, préférences. |
| `tests/unit/uiComponents.spec.ts` | Primitives UI (Toast) | Vérification states visuels (couleurs, actions). |

> ✅ Les nouveaux tests ajoutés cette semaine sont détaillés dans [Test Strategy Notifications v2](./test-strategy.md#plan-de-test) et dans le rapport de couverture (voir `tests/integration` + `tests/unit/useNotifications.spec.ts`).

## Mindmap & dette identifiée

- **Timers locaux** : `useNotifications` gérait des timers par toast sans nettoyage global. `clearAll` garantit désormais la purge systématique (tests associés).
- **Doublons potentiels** : `NotificationContainer` maintient `notificationIds` pour éviter la duplication lorsqu'un store émet la même erreur plusieurs fois — vérifié par le nouveau test d'intégration.
- **Callbacks manquants** : certains appels directs à `notify` (ex. `useNetworkError`) n'envoyaient pas `onClose`/`onAction`. Recommandation : standardiser les callbacks pour journaliser l'origine (documenté dans [invariants](./invariants.md)).
- **Couverture** : les scénarios auto-close, double close et pile simultanée n'étaient pas testés → couverts par la nouvelle suite Vitest.

> ℹ️ Une version visuelle de la mindmap est archivée dans Miro (export `Notifications-v2.png`).
