# Invariants & conventions — Système de notifications

## Pile unique & orchestration

- `useNotifications` expose une **pile globale** (`notifications.value`) consommée par `NotificationSystem`.
- Les composants ne doivent pas créer leur propre instance du composable : utiliser l'export `notify` pour garantir l'unicité.
- `NotificationContainer` reste la seule passerelle entre Pinia et la pile globale. Toute nouvelle source store doit suivre le même pattern (`notificationIds` + `clearNotification`).

## Callbacks obligatoires

- `onClose` doit systématiquement :
  - Libérer les timers (`clearInterval`).
  - Réinitialiser l'état d'erreur du store Pinia (si applicable).
- `onAction` doit :
  - Exécuter l'action métier (ex. `fetchProducts`).
  - Fermer la notification via `notify.removeNotification(id)` pour éviter les toasts persistants.
- Toute notification déclenchée par un watcher Pinia doit fournir au minimum `onClose` pour garantir l'idempotence.

## Timers & durée de vie

- Les notifications auto-close utilisent un intervalle fixe de 50 ms et décrémentent `progress`.
- `notify.error` force `autoClose: false` par défaut → éviter les disparitions silencieuses sur les erreurs critiques.
- `clearAll` est l'API officielle pour réinitialiser la pile (utilisée dans les tests et lors d'un logout global).

## Conventions d'usage

- **Typage** : n'utiliser que les types `'success' | 'error' | 'warning' | 'info'`.
- **Titres** : privilégier des titres explicites (`"Erreur d'authentification"`, `"Chargement des produits"`).
- **Action label** : verbe court à l'impératif (`"Réessayer"`, `"Voir"`).
- **Accessibilité** : les toasts doivent conserver `aria-live="assertive"` et les boutons `aria-label` pour fermeture.

## Checklist QA (handover)

- [x] `npm run test:unit` → suite verte.
- [x] Couverture ≥ 80 % module notifications (rapport `vitest --coverage`).
- [x] Lecture rapide de `inventory.md` pour identifier les watchers.
- [x] Vérification manuelle en dev : déclencher une erreur produit → apparition du toast + action « Réessayer ».
- [x] Documentation à jour (`README.md` + cette page) partagée sur l'espace QA.
