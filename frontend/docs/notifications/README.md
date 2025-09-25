# Notifications v2 — Phase 1 Overview

Cette section centralise les livrables produits durant la phase de fiabilisation du système de notifications.

- [Inventaire Pinia → Notifications](./inventory.md) — cartographie des watchers/abonnements et des artefacts de test existants.
- [Test Strategy Notifications v2](./test-strategy.md) — plan cible couvrant `NotificationContainer`, `NotificationSystem` et le composable `useNotifications`.
- [Invariants & conventions](./invariants.md) — règles de fonctionnement (pile unique, callbacks, conventions `onAction`/`onClose`).

## Synthèse rapide

| Livrable | Responsable | Statut | Emplacement |
| --- | --- | --- | --- |
| Cartographie des watchers Pinia | Lead front | ✅ Livré | `inventory.md` |
| Inventaire des tests existants | QA | ✅ Livré | `inventory.md#tests-existants` |
| Mindmap dépendances & dettes | Lead front + QA | ✅ Livré | `inventory.md#mindmap--dette` |
| Test Strategy Notifications v2 | QA | ✅ Livré | `test-strategy.md` |
| Wrapper d'intégration Vitest | Dev front | ✅ Livré | `frontend/tests/integration/notifications.integration.spec.ts` |
| Tests unitaires useNotifications | Dev front + QA | ✅ Livré | `frontend/tests/unit/useNotifications.spec.ts` |
| Mise à jour dossier tests | Dev front | ✅ Livré | Structure `tests/{unit,integration}` + `vite.config.ts` |
| Documentation invariants | Lead front + QA | ✅ Livré | `invariants.md` |

## Mindmap export (aperçu texte)

```
Notifications
├─ Sources Pinia
│  ├─ Auth.error → notify.error (blocage auth, clearError)
│  ├─ Products.error → notify.error (retry fetchProducts)
│  └─ Reservations.error → notify.error (clearError)
├─ Composable useNotifications
│  ├─ add/remove/clearAll
│  ├─ helpers success/error/warning/info
│  └─ timers autoClose + progress
├─ Containers UI
│  ├─ NotificationContainer (watchers stores)
│  └─ NotificationSystem (render toasts, actions)
└─ Dette
   ├─ Timers locaux → besoin de reset sur clearAll
   ├─ Doublons potentiels si watcher sans clear
   └─ Absence de callbacks standardisés sur certains appels hors Pinia
```

> 💡 Une version visuelle de la mindmap est disponible dans l'espace Miro « Notifications v2 » (lien interne).
