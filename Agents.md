# 🤖 Agents.md - Guide Complet pour les Agents Claude

> **Documentation complète pour les agents Claude travaillant sur le projet Antigaspi**

---

## 📋 TABLE DES MATIÈRES

1. [Workflow Obligatoire](#workflow-obligatoire)
2. [Garde-fous Anti-Biais](#garde-fous-anti-biais)
3. [Phases de Validation](#phases-de-validation)
4. [Commandes de Test](#commandes-de-test)
5. [Architecture du Projet](#architecture-du-projet)
6. [Informations Générales](#informations-générales)
7. [Comptes de Test](#comptes-de-test)
8. [Configuration Développement](#configuration-développement)
9. [État Actuel Mobile](#état-actuel-mobile)
10. [API Endpoints Essentiels](#api-endpoints-essentiels)

---

## 🔄 WORKFLOW OBLIGATOIRE

### Règles Fondamentales

1. ✅ **TOUJOURS utiliser le Plan Mode** pour les tâches complexes
2. ✅ **Vérifier la liste TODO** avant de dire "terminé"
3. ✅ **Tester chaque fonctionnalité** implémentée
4. ✅ **Ne JAMAIS prétendre avoir terminé** sans vérification complète
5. ✅ **TOUJOURS relire tous les fichiers modifiés** pour s'assurer qu'aucune mise à jour n'a été omise
6. ✅ **TOUJOURS exécuter la suite complète de tests** (backend & frontend) après modifications
7. ✅ **Vérifier le lint et le build** (TypeScript, ESLint, compilation)
8. ✅ **Ne déclarer "terminé" qu'après validation** des 4 phases

### Principe de Base

**AUCUNE tâche n'est terminée sans passage par les 4 phases de validation.**

---

## 🚨 GARDE-FOUS ANTI-BIAIS OBLIGATOIRES

### Protection contre auto-validation et optimisme systémique

### INTERDICTIONS ABSOLUES

❌ **CRÉER ou MODIFIER des outils d'audit** pour valider son propre travail
❌ **IGNORER les rapports officiels** en faveur de ses propres métriques
❌ **DÉCLARER "terminé"** sans validation externe INDÉPENDANTE
❌ **ANNONCER des scores** sans vérification par agent spécialisé
❌ **REMPLACER les outils existants** par des versions "améliorées"

### VALIDATIONS EMPIRIQUES OBLIGATOIRES

✅ **TOUJOURS utiliser les outils OFFICIELS** (audit-legacy-exact.js, phase3-validation-report.json)
✅ **LIRE les rapports existants AVANT** de faire ses propres mesures
✅ **CONFRONTER ses résultats** aux métriques officielles systématiquement
✅ **DÉCLARER ÉCHEC** si discordance entre métriques officielles et personnelles
✅ **DEMANDER validation reality-checker** pour tout score >70/100

---

## 🎯 PHASES DE VALIDATION

### Phase 1: Implémentation
- Agent principal effectue le travail demandé
- Code proprement et teste au fur et à mesure
- Documente les changements importants

### Phase 2: Vérification Spécialisée
- Délègue automatiquement à **code-reviewer**
- Focus sur la complétude des tâches TODO
- Validation technique par domaine d'expertise

### Phase 3: Validation Indépendante
- Effectuée par agent **test-guardian** (différent de l'implémenteur)
- Comparer au plan original
- Exécuter **TOUS les tests automatisés** (PHP + Playwright + Jest)
- Vérifier couverture de code satisfaisante
- S'assurer qu'aucune régression n'est présente

### Phase 4: Contrôle Empirique Reality-Checker 🚨

**OBLIGATOIRE** pour toute déclaration de succès ou score >80/100

- Effectuée par agent **reality-checker**
- Validation ULTRA-STRICTE
- Audit INDÉPENDANT de tous fichiers et métriques
- Vérification EMPIRIQUE : lit les vrais fichiers, exécute les vrais tests
- Challenge SYSTÉMATIQUE de tout optimisme
- **VERDICT FINAL :** REJECT/BLOCK/FAIL si moindre discordance

### Triggers Automatiques Reality-Checker

- Claims de "migration réussie" ou "terminé"
- Scores annoncés >70/100
- Déclarations "prêt pour production"
- Métriques de performance ou couverture
- **CRÉATION d'outils d'audit personnalisés**
- **MODIFICATION des outils d'audit existants**
- **IGNORANCE des rapports officiels**

### Règles de Vérification

- ❌ Aucune tâche "terminée" sans passage par les 4 phases
- ✅ Chaque agent confirme explicitement la complétude
- 🔄 En cas de problème, retour en Phase 1
- 🛑 **Reality-checker a droit de veto ABSOLU**

---

## 🧪 COMMANDES DE TEST

### Tests Backend (Laravel)

```bash
# Tests unitaires et fonctionnels
php artisan test

# Tests avec couverture
php artisan test --coverage

# Lint backend
./vendor/bin/pint
```

### Tests Frontend Web (Vue.js)

```bash
# Tests E2E Playwright
npm run test:e2e

# Build production
npm run build

# Lint frontend
npm run lint

# Type check TypeScript
npx vue-tsc
```

### Tests Mobile (React Native)

```bash
# Tests Jest
cd mobile && npm test

# Tests avec couverture
cd mobile && npm run test:coverage

# Build mobile (vérification)
cd mobile && npx expo prebuild
```

### Audits et Vérifications

```bash
# Audit legacy (frontend)
node audit-legacy-exact.js

# Fichiers modifiés
git diff --name-only HEAD

# Détection code mort
grep -R "TODO\|FIXME" .

# Vérifier intégrité outils audit
git log --oneline audit-legacy-exact.js
```

### Commandes Reality-Checker Spécifiques

```bash
# Lecture rapport officiel
cat frontend/phase3-validation-report.json | grep -A 5 -B 5 "overall\|legacyClasses"

# Vérification build réel
npm run build

# Tests complets indépendants
npm test && php artisan test

# Compter manuellement usages legacy
rg -i "class=\".*btn-" frontend/src
rg -i "class=\".*card-" frontend/src
```

---

## 🏗️ ARCHITECTURE DU PROJET

### Vue d'Ensemble

**Antigaspi** est une application anti-gaspillage alimentaire composée de 3 parties:

1. **Backend** - Laravel 11 + MySQL (✅ Terminé)
2. **Frontend Web** - Vue.js 3 + TypeScript (🔄 En cours)
3. **Mobile App** - React Native + Expo (✅ Interfaces complètes)

### Stack Technique

#### Backend (✅ 100% Fonctionnel)

- **Framework:** Laravel 11 + PHP 8.2+
- **Base de données:** MySQL 8.0
- **Authentification:** JWT multi-rôles (Consumer/Merchant/Admin)
- **API:** REST complète avec validation
- **Status:** Production-ready

#### Frontend Web (🔄 En cours - Migration Design System 2025)

- **Framework:** Vue.js 3 + Composition API + TypeScript
- **CSS:** Tailwind CSS + Headless UI
- **État:** Pinia
- **Routing:** Vue Router avec guards d'authentification
- **HTTP:** Axios avec intercepteurs JWT
- **Tests:** Playwright pour E2E
- **Migration:** Passage de patterns legacy vers Design System 2025

#### Mobile App (✅ Production-Ready)

- **Framework:** React Native 0.76+ + Expo SDK 52
- **État:** Redux Toolkit avec slices (auth, products, reservations, favorites, cart, loyalty, wallet)
- **Navigation:** React Navigation 6 (role-based) avec haptic feedback
- **TypeScript:** Full type safety
- **Tests:** Jest + React Native Testing Library
- **Design System:** DS2025 avec hook `useTheme()` + Dark Mode complet
- **Features:**
  - ✅ Navigation basée sur rôles (Consumer 5 tabs / Merchant 5 tabs / Admin 3 tabs)
  - ✅ Authentification JWT avec refresh automatique
  - ✅ Interface Consumer complète (Home, Discover, Favorites, Orders, Account)
  - ✅ Interface Merchant (Dashboard, Products, Reservations, Loyalty, Account)
  - ✅ Interface Admin (Dashboard, Analytics, Settings)
  - ✅ Upload d'images avec expo-image-picker
  - ✅ Push Notifications via Firebase FCM
  - ✅ Haptic feedback via expo-haptics
  - ✅ Paniers Surprise (Surprise Baskets)
  - ✅ Wallet virtuel avec transactions
  - ✅ Programme fidélité (points, tiers, récompenses)
  - ✅ Système de panier avec checkout
  - ✅ Export Excel (réservations, analytics)

### Base de Données

```sql
10 Tables Principales:
├── users                # Utilisateurs multi-rôles
├── categories           # Catégories de produits
├── merchants            # Profils commerçants
├── products             # Produits/Invendus
├── reservations         # Réservations clients
├── payments             # Paiements (futur)
├── reviews              # Avis clients (futur)
├── loyalty_points       # Programme fidélité (futur)
├── notifications        # Notifications système
└── analytics_daily      # Statistiques quotidiennes
```

### Structure des Dossiers

```
antigaspi2/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── routes/api.php
│   └── database/
├── frontend/                # Vue.js Web
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   └── store/
│   └── package.json
├── mobile/                  # React Native
│   ├── src/
│   │   ├── screens/
│   │   │   ├── main/       # Consumer screens
│   │   │   ├── merchant/   # Merchant screens
│   │   │   └── admin/      # Admin screens
│   │   ├── navigation/
│   │   │   ├── ConsumerNavigator.tsx
│   │   │   ├── MerchantNavigator.tsx
│   │   │   ├── AdminNavigator.tsx
│   │   │   └── MainNavigator.tsx (role-based router)
│   │   ├── store/          # Redux Toolkit
│   │   └── services/
│   └── package.json
└── database/                # SQL Scripts
```

---

## 📋 INFORMATIONS GÉNÉRALES

### Nom du Projet
**Antigaspi** - Application Anti-Gaspillage Alimentaire

### Objectif Principal
Développer une plateforme complète permettant aux commerçants de vendre leurs invendus à prix réduit et aux consommateurs de faire des économies tout en luttant contre le gaspillage alimentaire.

### Cible Géographique
**Afrique de l'Ouest** (Togo en priorité)

### Repository GitHub
https://github.com/nashflow28/antigaspi2

### Monnaie
**Franc CFA (XOF)** - Format: `250 F CFA` (pas d'euros €)

### Localisation
**Togo** (pas "Guadeloupe" - cela a été corrigé dans le mobile)

### Couleurs & Branding

- **Primaire:** Vert #10B981 (écologie, fraîcheur)
- **Secondaire:** Orange #F59E0B (économies, chaleur)
- **Neutre:** Gris/Blanc pour lisibilité

### UX/UI Principles

- **Mobile-first:** Interface pensée pour smartphone
- **Accessibility:** Contraste, tailles de texte, navigation
- **Performance:** Lazy loading, optimisation images
- **Offline:** PWA avec cache (web), AsyncStorage (mobile)

---

## 👥 COMPTES DE TEST

### Administrateur
```
Email: admin@antigaspi.com
Password: password
Rôle: admin
```
**Permissions:** Gestion complète de la plateforme

### Commerçant (Merchant)
```
Email: boulangerie.martin@email.com
Password: password
Rôle: merchant
```
**Permissions:** Ajout produits, gestion réservations

### Autre Commerçant (pour tests)
```
Email: marie.martin@email.com
Password: password
Rôle: merchant
Merchant ID: 1
```

### Consommateur (Consumer)
```
Email: jean.dupont@email.com
Password: password
Rôle: consumer
```
**Permissions:** Navigation, réservation produits

### Produits de Test

- Pain complet artisanal - 250 F CFA (Boulangerie)
- Croissants artisanaux - 100 F CFA (Boulangerie)
- Bananes mûres - 150 F CFA (Épicerie)
- Yaourts nature - 400 F CFA (Supermarché)

---

## 🔧 CONFIGURATION DÉVELOPPEMENT

### Environnement Local

- **XAMPP:** Apache + MySQL + PHP 8.2+
- **Node.js:** v18+ (pour Vue.js et React Native)
- **Composer:** Gestion dépendances PHP
- **Git:** Workflow avec branches par étape
- **Expo CLI:** Pour le développement mobile

### URLs de Développement

#### Backend API
```
http://localhost:8000/api
```

#### Frontend Web (Vue.js)
```
http://localhost:5173  (Vite dev server)
```

#### Mobile Web (Expo)
```
http://localhost:9001  (Expo web)
```

#### Base de Données
```
http://localhost/phpmyadmin
Database: antigaspi_fresh
User: root
Password: (vide)
```

#### Health Check
```
http://localhost:8000/api/health
```

### Variables d'Environnement

#### Backend (.env)
```env
APP_NAME=Antigaspi
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=antigaspi_fresh
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=(généré)
JWT_TTL=60
```

#### Frontend Web (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

#### Mobile (app.json extra config)
```json
{
  "extra": {
    "apiUrl": "http://localhost:8000/api"
  }
}
```

---

## 📱 ÉTAT ACTUEL MOBILE

### ✅ Fonctionnalités Implémentées

#### Navigation Role-Based
- **MainNavigator** détecte le rôle utilisateur (`user.role`)
- **ConsumerNavigator** - 5 tabs (Accueil, Découvrir, Favoris, Commande, Compte)
- **MerchantNavigator** - 5 tabs (Tableau de bord, Produits, Réservations, Fidélité, Compte)
- **AdminNavigator** - 3 tabs (Dashboard, Analytics, Paramètres)

#### Interface Consumer
- ✅ HomeScreen avec filtres catégories, tri et paniers surprise
- ✅ ProductsScreen avec recherche et filtres avancés
- ✅ ProductDetailsScreen avec informations commerçant et bouton favori
- ✅ SurpriseBasketDetailsScreen pour paniers surprise
- ✅ FavoritesScreen avec gestion des favoris
- ✅ CartScreen avec gestion panier et checkout
- ✅ ReservationsScreen avec historique et statuts
- ✅ WalletScreen avec solde et transactions
- ✅ LoyaltyScreen (programme fidélité, points, tiers)
- ✅ NotificationsScreen avec filtres (toutes/non lues)
- ✅ ProfileScreen avec édition profil et logout

#### Interface Merchant
- ✅ MerchantDashboardScreen (stats: produits actifs, réservations, revenus)
- ✅ MerchantProductsScreen (liste produits du commerçant)
- ✅ MerchantSurpriseBasketsScreen (gestion paniers surprise)
- ✅ ProductFormScreen (création/édition avec upload image)
- ✅ MerchantReservationsScreen (liste réservations avec actions)
- ✅ MerchantLoyaltyScreen (programme fidélité clients)
- ✅ MerchantReviewsScreen (avis clients)
- ✅ MerchantAnalyticsScreen (graphiques et exports)
- ✅ ExportReservationsButton (export Excel)

#### Interface Admin
- ✅ AdminDashboardScreen (stats globales)
- ✅ AdminAnalyticsScreen (graphiques détaillés)
- ✅ AdminSettingsScreen (paramètres système)

### 🔧 Corrections Récentes

#### Design System 2025 Migration (Janvier 2026)
- ✅ Migration NotificationsScreen vers `useTheme()`
- ✅ Migration RewardsScreen vers `useTheme()`
- ✅ Support Dark Mode complet sur NotificationsScreen
- ✅ Haptic feedback sur navigation tabs
- ✅ Haptic feedback sur FavoriteButton toggle
- ✅ Haptic feedback sur CartScreen checkout
- ✅ Fix contraste LoginScreen (erreur invisible)
- ✅ Masquage bouton "Test recharge" en production (`__DEV__`)

#### Currency & Localisation
- ✅ Changé € → F CFA dans tous les écrans
- ✅ Changé "Guadeloupe" → "Togo"
- ✅ Changé "Cooper" (utilisateur par défaut) → "Invité"

#### Bugs Corrigés
- ✅ ProductDetailsScreen crash (optional chaining ajouté)
- ✅ Filtre catégorie cassé (`product.category.id` au lieu de `product.category_id`)
- ✅ Theme colors dynamiques via `useTheme()` hook
- ✅ Logout ne fonctionnait pas (ajouté `AsyncStorage.clear()`)
- ✅ Dark mode: cartes blanches sur fond sombre (fixé avec `theme.isDark`)
- ✅ Push notifications: icône manquante ajoutée

### 🧪 Tests Mobile

**Résultats:** 381/425 tests passing (89.6%)

- ✅ Tests navigation role-based: 4/4 passing
- ✅ Tests réservations: 35/43 passing
- ⚠️ Échecs non-critiques: offline cache (8), payment validation (5)

### 📦 Dépendances Mobiles Importantes

```json
{
  "expo": "~52.0.0",
  "react-native": "0.76+",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "@reduxjs/toolkit": "^2.0.1",
  "expo-image-picker": "~16.0.5",
  "expo-haptics": "~14.0.0",
  "expo-notifications": "~0.29.0",
  "axios": "^1.6.2",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "xlsx": "^0.18.5"
}
```

### 🚀 Commandes Mobile Essentielles

```bash
# Démarrer serveur de développement
cd mobile && npx expo start --port 9001

# Nettoyer cache et redémarrer
cd mobile && npx expo start --clear --port 9001

# Lancer tests Jest
cd mobile && npm test

# Vérifier types TypeScript
cd mobile && npx tsc --noEmit

# Installer dépendance Expo
cd mobile && npx expo install [package-name]

# Killer un port bloqué
npx kill-port 9001
```

---

## 🌐 API ENDPOINTS ESSENTIELS

### Authentification

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh
```

### Produits

```http
GET /api/products              # Liste tous produits
GET /api/products/{id}         # Détail produit
POST /api/products             # Créer (merchant only)
PUT /api/products/{id}         # Modifier (merchant only)
DELETE /api/products/{id}      # Supprimer (merchant only)
GET /api/products/merchant     # Produits du merchant connecté
```

### Réservations

```http
GET /api/reservations          # Réservations de l'utilisateur
GET /api/reservations/{id}     # Détail réservation
POST /api/reservations         # Créer réservation
PUT /api/reservations/{id}     # Modifier statut
GET /api/reservations/merchant # Réservations du merchant
```

### Catégories

```http
GET /api/categories            # Liste catégories
POST /api/categories           # Créer (admin only)
PUT /api/categories/{id}       # Modifier (admin only)
DELETE /api/categories/{id}    # Supprimer (admin only)
```

### Merchants

```http
GET /api/merchants             # Liste commerçants
GET /api/merchants/{id}        # Détail commerçant
PUT /api/merchants/{id}        # Modifier profil
```

### Admin Analytics

```http
GET /api/analytics/stats?role=admin     # Stats globales
GET /api/analytics/stats?role=merchant  # Stats merchant
```

### Users (Admin)

```http
GET /api/users                 # Liste utilisateurs (admin)
GET /api/users/{id}            # Détail utilisateur
PUT /api/users/{id}            # Modifier utilisateur
DELETE /api/users/{id}         # Supprimer utilisateur
```

### Panier (Cart)

```http
GET /api/cart                  # Panier de l'utilisateur
POST /api/cart/items           # Ajouter au panier
PUT /api/cart/items/{id}       # Modifier quantité
DELETE /api/cart/items/{id}    # Retirer du panier
POST /api/cart/checkout        # Valider le panier
```

### Paniers Surprise (Surprise Baskets)

```http
GET /api/surprise-baskets                # Liste paniers disponibles
GET /api/surprise-baskets/{id}           # Détail panier
POST /api/surprise-baskets               # Créer (merchant)
PUT /api/surprise-baskets/{id}           # Modifier (merchant)
DELETE /api/surprise-baskets/{id}        # Supprimer (merchant)
GET /api/surprise-baskets/merchant       # Paniers du merchant
```

### Wallet

```http
GET /api/wallet                # Solde et infos wallet
GET /api/wallet/transactions   # Historique transactions
POST /api/wallet/topup         # Recharger (dev only)
```

### Programme Fidélité (Loyalty)

```http
GET /api/loyalty               # Points et tier actuel
GET /api/loyalty/history       # Historique points
GET /api/loyalty/rewards       # Récompenses disponibles
POST /api/loyalty/redeem/{id}  # Échanger points
```

### Notifications

```http
GET /api/notifications              # Liste notifications
POST /api/notifications/{id}/read   # Marquer comme lue
POST /api/notifications/read-all    # Tout marquer lu
```

### Structure de Réponse API

#### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Erreur
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }
}
```

#### Produit (exemple)
```json
{
  "id": 1,
  "name": "Pain complet artisanal",
  "description": "Pain bio au levain naturel",
  "original_price": 500,
  "discounted_price": 250,
  "quantity_available": 10,
  "expiry_date": "2025-10-08",
  "image_url": "http://localhost:8000/storage/products/pain.jpg",
  "category": {
    "id": 1,
    "name": "Boulangerie"
  },
  "merchant": {
    "id": 1,
    "business_name": "Boulangerie Martin",
    "address": "123 Rue de la Paix",
    "city": "Lomé",
    "phone": "+228 90 12 34 56"
  }
}
```

---

## 📊 MÉTRIQUES OFFICIELLES DE RÉFÉRENCE

### Frontend Web (Design System 2025)

- **Phase 3 Score:** 38/100 (frontend/phase3-validation-report.json)
- **Legacy usages:** 169 patterns détectés (officiel)
- **Tests coverage:** 0/100 (ERROR)
- **Performance:** 0/100 (ERROR)
- **Accessibility:** 0/100 (ERROR)

⚠️ **ATTENTION:** Tout score supérieur doit être considéré comme SUSPECT.

### Mobile React Native

- **Tests Jest:** 381/425 passing (89.6%)
- **Coverage:** À améliorer
- **TypeScript:** Stricte activée
- **Build:** ✅ Fonctionnel

---

## 🎯 PRIORITÉS ACTUELLES

### Mobile React Native (Principal)
1. ✅ Interfaces role-based complètes (Consumer 5 tabs, Merchant 5 tabs, Admin 3 tabs)
2. ✅ Authentification JWT fonctionnelle avec refresh
3. ✅ Design System 2025 avec `useTheme()` (~85% migré)
4. ✅ Dark Mode complet
5. ✅ Haptic feedback sur actions critiques
6. ✅ Push Notifications Firebase FCM
7. 🔄 Derniers écrans à migrer vers DS2025
8. ⏳ Tests automatisés à compléter

### Backend Laravel
1. ✅ API complète et fonctionnelle
2. ✅ Tests PHPUnit complets
3. ✅ Push Notifications système
4. ⏳ Intégration paiements Mobile Money
5. ⏳ Géolocalisation commerçants

### Frontend Web (Secondaire)
1. 🔄 Migration vers Design System 2025
2. ⏳ Éliminer patterns legacy restants
3. ⏳ Améliorer couverture tests E2E

---

## 🚀 WORKFLOW GIT

### Branches

- `main` - Code de production
- `feature/mobile-prototype` - Développement mobile (branche actuelle)
- `feature/etape-X-description` - Développement par étapes
- `hotfix/*` - Corrections urgentes

### Process de Validation

1. Développement sur branche feature
2. Tests automatiques (Jest, Playwright, PHPUnit)
3. Build et vérification intégrité
4. Push vers GitHub
5. Validation par les 4 phases
6. Merge vers main après validation complète

### Conventions de Code

#### Laravel (Backend)
- PSR-12
- Conventions Laravel standard
- Type hints stricts

#### Vue.js (Frontend Web)
- Composition API
- TypeScript strict
- Design System 2025 components

#### React Native (Mobile)
- TypeScript strict
- Functional components + Hooks
- Redux Toolkit pour état global
- React Navigation pour routing

---

## 📝 NOTES IMPORTANTES

### Problèmes Connus

#### Frontend Web
- Migration Design System 2025 incomplète
- Tests E2E coverage faible

#### Mobile
- Quelques tests Jest en échec (non-critiques)
- Offline cache à améliorer
- Validation paiements en ligne à compléter

### Solutions Appliquées

✅ **Design System 2025:**
- Hook `useTheme()` pour accès unifié aux couleurs
- Support Dark Mode via `theme.isDark`
- Migration ~85% complète des écrans

✅ **Dark Mode Fixes:**
- NotificationsScreen: cartes avec fond adaptatif
- Filtres et headers avec couleurs dynamiques
- Contraste texte/fond vérifié

✅ **Haptic Feedback:**
- Navigation tabs avec `lightTap()`
- FavoriteButton avec `mediumTap()`
- Checkout avec `success()` / `error()`

✅ **Currency & Location:**
- Format XOF au lieu d'EUR
- Localisation Togo au lieu de Guadeloupe

✅ **Logout Fix:**
- Ajouté `AsyncStorage.clear()` avant logout
- Amélioration visuelle du bouton logout (rouge)

### Décisions Techniques

1. **Mobile Role-Based Navigation:** MainNavigator détecte `user.role` et affiche le navigateur approprié
2. **JWT Auth:** Token stocké dans AsyncStorage (mobile) et localStorage (web)
3. **Image Upload:** expo-image-picker pour mobile
4. **Offline First:** AsyncStorage pour cache local (mobile)
5. **Type Safety:** TypeScript strict activé partout
6. **Design System 2025:** Hook `useTheme()` pour accès unifié (pas d'import statique de theme)
7. **Haptic Feedback:** Hook `useHaptics()` pour retour tactile standardisé
8. **Dark Mode:** Conditionnel via `theme.isDark` pour backgrounds et surfaces
9. **Alertes:** Hook `useAlert()` pour alertes stylisées (pas de `Alert.alert()` natif)

---

## ⚠️ RÈGLES À RESPECTER ABSOLUMENT

### Pour Tous les Agents

1. ❌ **NE JAMAIS** déclarer une tâche terminée sans les 4 phases de validation
2. ❌ **NE JAMAIS** créer ses propres outils d'audit
3. ❌ **NE JAMAIS** ignorer les rapports officiels
4. ✅ **TOUJOURS** utiliser les outils officiels (audit-legacy-exact.js)
5. ✅ **TOUJOURS** exécuter les tests complets avant de conclure
6. ✅ **TOUJOURS** demander validation reality-checker pour score >70/100
7. ✅ **TOUJOURS** lire les fichiers modifiés pour vérifier les changements
8. ✅ **TOUJOURS** vérifier le build avant de déclarer succès

### Pour Reality-Checker

1. 🔍 **Vérifier l'intégrité** des outils d'audit (`git log`)
2. 🔍 **Lire les rapports officiels** (phase3-validation-report.json)
3. 🔍 **Exécuter les tests indépendamment** (ne pas faire confiance aux claims)
4. 🔍 **Confronter systématiquement** aux métriques officielles
5. 🔍 **BLOQUER** toute conclusion optimiste non prouvée
6. 🔍 **Droit de VETO ABSOLU** sur toute déclaration de succès

---

**📝 Dernière mise à jour:** 2026-01-02
**🤖 Document maintenu pour les agents Claude Code**
**📍 Repository:** https://github.com/nashflow28/antigaspi2

---

## 📱 HOOKS MOBILE DISPONIBLES

### useTheme()
Hook principal pour accéder au Design System 2025:
```typescript
const theme = useTheme()

// Couleurs
theme.colors.primary[500]      // Vert principal
theme.colors.background        // Fond adaptatif (dark/light)
theme.colors.text              // Texte principal
theme.colors.textSecondary     // Texte secondaire
theme.colors.surface.light     // Surface (light mode)
theme.colors.neutral[800]      // Surface (dark mode)
theme.colors.success/error/warning  // États

// Mode
theme.isDark                   // Boolean pour mode sombre
```

### useHaptics()
Hook pour retour tactile:
```typescript
const haptics = useHaptics()

await haptics.lightTap()       // Navigation, sélection légère
await haptics.mediumTap()      // Actions principales (favoris, boutons)
await haptics.heavyTap()       // Actions importantes
await haptics.success()        // Confirmation réussie
await haptics.warning()        // Avertissement
await haptics.error()          // Erreur
await haptics.selection()      // Changement de sélection
```

### useFavorite(productId)
Hook pour gestion des favoris:
```typescript
const { isFavorite, toggleFavorite, loading } = useFavorite(productId)
```

### useAlert()
Hook pour alertes stylisées:
```typescript
const { showAlert } = useAlert()

showAlert({
  title: 'Succès',
  message: 'Opération réussie',
  type: 'success'  // success | error | warning | info
})
```
