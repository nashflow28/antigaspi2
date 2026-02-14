# Rapport d’avancement & manquements (Janvier 2026)

## Synthèse rapide
- **Backend** : riche fonctionnellement, proche de la production, mais nécessite nettoyage (auth legacy + migrations `.disabled` + config paiements/notifications par env).
- **Mobile** : le plus avancé (UX/DS2025, dark mode, haptics, navigation rôle‑based).
- **Web** : beaucoup d’écrans présents mais migration DS2025 + cohérence UX encore incomplètes.

## Backend (Laravel)
### ✅ Réalisé
- Auth JWT + OTP téléphone + device PIN.
- CRUD produits + paniers surprise + inventaire.
- Réservations / commandes / paiements (multi‑gateways).
- Wallet + transactions + limites + PIN.
- Notifications (push + broadcast).
- Livraison (zones, livreurs, tracking, gains).
- Loyauté / récompenses / reviews / messaging.

### ⚠️ Manquements / dettes
- **Coexistence legacy + nouveau flux auth** → clarifier le flux principal.
- **Migrations `.disabled`** non appliquées (risque d’écart entre code et DB).
- **Multi‑gateways** : config par environnement à consolider (webhooks, secrets).
- **Broadcast temps réel** : nécessite config Pusher active.

## Mobile (Expo / RN)
### ✅ Réalisé (fort niveau)
- Navigation par rôle (consumer/merchant/admin/driver).
- UX complète (Home, Discover, Favorites, Cart, Wallet, Loyalty, Rewards, Messaging).
- Merchant (dashboard, produits, réservations, reviews, analytics, paniers surprise).
- Admin (dashboard, analytics, settings, modération, paiements).
- Livraison (côté client + driver).
- Design System 2025 + dark mode + haptics.

### ⚠️ Manquements / à surveiller
- Quelques tests non critiques en échec (à revalider).
- Offline cache et validations paiement à renforcer.
- Couverture tests à améliorer.

## Frontend Web (Vue)
### ✅ Présent
- Écrans consumer/merchant/admin/driver largement existants.
- Wallet, paiements, réservation, delivery, loyalty, messaging, notifications.

### ⚠️ Manquements / retards
- Migration DS2025 incomplète (cohabitation legacy/2025).
- Cohérence UX avec mobile à harmoniser (parcours, micro‑interactions, contenu).
- Temps réel (WebSocket/Pusher) pas garanti tant que backend broadcast non configuré.
- Onboarding temporairement désactivé dans les guards.

## Observations qualité / audit
- `frontend/phase3-validation-report.json` indique un score **100/100**, mais **la documentation AGENTS** mentionne un score **38/100** avec **169 patterns legacy**. → **Discordance à clarifier** via audit officiel.
- Le script `audit-legacy-exact.js` n’est pas présent à la racine (bloquant pour les audits prescrits).

## Résultats de validation locaux (25/01/2026)
### Backend
- `php artisan test` : **124 tests en échec** (ex: `OtpServiceTest`, `AdminAnalyticsExportTest`, `AdminMerchantControllerTest`, `SurpriseBasketControllerTest` avec `Class "App\\Models\\SurpriseBasket" not found`, statuts inattendus 404/405).
- `php artisan test --coverage` : **échoue** (driver de couverture manquant : Xdebug/PCOV).
- `./vendor/bin/pint` : **1 correction automatique** sur `backend/database/migrations/2025_12_25_131247_add_provider_to_payments_table.php`.

### Frontend Web
- `npm run lint` : **11 erreurs + 1129 warnings** (ex: `vue/no-mutating-props` sur `components/ui/2025/ConfirmDialog.vue`).
- `npm run type-check` : **1 erreur** (`ProductEditView.vue`: boolean | undefined).
- `npm run build` : **OK**.
- `npm run test:e2e` : **timeout**.

### Mobile
- `npm test` : **3 tests en échec** (ProductDetailsScreen: label “Mobile Money” absent, ExportButton: “PDF” attendu, AdminBroadcastScreen: endpoint attendu `/admin/notifications/broadcast` vs `/notifications/broadcast`).
- `npm run test:coverage` : **échoue** (mêmes 3 tests) + couverture globale ~**25%**.
- `npm run lint` : **warnings** (unused vars).
- `npm run type-check` : **4 erreurs** (ExportButton, ChangePinScreen refs, cartSlice payload types).
- `npx expo prebuild` : **OK** (warning expo-system-ui).

## Risques principaux
1. **Incohérence UX Web vs Mobile** (parcours utilisateur non uniformes).
2. **Risque d’écart DB** (migrations `.disabled`).
3. **Validation qualité insuffisante** (tests non exécutés systématiquement, audits contradictoires).

## Recommandations immédiates
- Re‑lancer les audits officiels (si disponibles) et résoudre les divergences.
- Prioriser l’alignement Web avec le Mobile (Design System + parcours critiques).
- Stabiliser le flux d’authentification (choisir le flux principal).
