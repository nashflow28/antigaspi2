# 🤖 CLAUDE.md - Contexte Projet Antigaspi

# Guide pour Claude Code

## Workflow obligatoire
1. TOUJOURS utiliser le Plan Mode pour les tâches complexes
2. Vérifier la liste TODO avant de dire "terminé"
3. Tester chaque fonctionnalité implémentée
4. Ne jamais prétendre avoir terminé sans vérification complète
5. **TOUJOURS relire tous les fichiers modifiés** pour s'assurer qu'aucune mise à jour n'a été omise et qu'aucun code mort ne subsiste.
6. **TOUJOURS exécuter la suite complète de tests (backend & frontend)** après les modifications et corriger immédiatement toute erreur ou tout test en échec.
7. **Vérifier le lint et le build** du projet (TypeScript, ESLint, compilation frontend, etc.) afin de détecter toute régression ou erreur de syntaxe.
8. **Ne déclarer la tâche "terminée" qu'après validation** par l'agent de revue (Phase 2) **ET** par un agent de validation finale (Phase 3) **ET** Phase 4 (reality-checker) avec confirmation explicite de chacun.
9. **🚨 TOUJOURS DEMANDER CONFIRMATION avant de lancer un build APK mobile (eas build)**. Ne JAMAIS lancer de build automatiquement sans l'accord explicite de l'utilisateur.
10. **🧹 CORRIGER LES WARNINGS ESLint opportunément** : Lorsqu'on modifie un fichier, profiter pour corriger les warnings ESLint présents dans ce fichier (imports inutilisés, variables non utilisées avec préfixe `_`, `catch (error)` → `catch`, etc.). Cela permet un nettoyage progressif du codebase sans effort dédié.

## 🚨 GARDE-FOUS ANTI-BIAIS OBLIGATOIRES
**Protection contre auto-validation, optimisme systémique et métriques biaisées**

### **INTERDICTIONS ABSOLUES :**
❌ **CRÉER ou MODIFIER des outils d'audit** pour valider son propre travail
❌ **IGNORER les rapports officiels** en faveur de ses propres métriques
❌ **DÉCLARER "terminé"** sans validation externe INDÉPENDANTE
❌ **ANNONCER des scores** sans vérification par agent spécialisé
❌ **REMPLACER les outils existants** par des versions "améliorées"

### **VALIDATION EMPIRIQUE OBLIGATOIRE :**
✅ **TOUJOURS utiliser les outils OFFICIELS** (audit-legacy-exact.js, phase3-validation-report.json)
✅ **LIRE les rapports existants** AVANT de faire ses propres mesures
✅ **CONFRONTER ses résultats** aux métriques officielles systématiquement
✅ **DÉCLARER ÉCHEC** si discordance entre métriques officielles et personnelles
✅ **DEMANDER validation reality-checker** pour tout score >70/100

## 🚨 AGENT REALITY-CHECKER OBLIGATOIRE
**Activation automatique pour toute déclaration de "succès", "terminé", ou score >70/100**

L'agent **reality-checker** doit SYSTÉMATIQUEMENT être invoqué avant toute conclusion positive :
- Vérifie INDÉPENDAMMENT tous les métriques annoncés
- Challenge IMPITOYABLEMENT toute affirmation optimiste
- Exécute ses propres audits et tests de validation
- BLOQUE toute déclaration de réussite non prouvée empiriquement
- **VÉRIFIE que l'agent principal n'a PAS modifié les outils d'audit**

**Règle absolue :** Aucune tâche ne peut être déclarée "terminée" sans rapport de validation explicite du reality-checker.

## Phase 1: Implémentation
[Agent principal fait le travail]

## Phase 2: Vérification spécialisée
- Délègue automatiquement à code-reviewer
- Focus sur la complétude des tâches TODO
- Validation technique par domaine d'expertise

## Phase 3: Validation indépendante
- Effectuée par un agent différent de celui d'implémentation (ex: agent **test-guardian** spécialisé en tests).
- Comparer le résultat au plan original et s'assurer que toutes les tâches prévues ont été traitées.
- Exécuter **tous les tests automatisés** (tests unitaires PHP + tests E2E Playwright) et vérifier qu'ils passent à 100%.
- S'assurer que la couverture de code est satisfaisante et qu'aucune régression fonctionnelle n'est présente.

## Phase 4: Contrôle empirique reality-checker 🚨
- **OBLIGATOIRE** pour toute déclaration de succès ou score >80/100
- Effectuée par l'agent **reality-checker** avec validation ULTRA-STRICTE
- Audit INDÉPENDANT de tous les fichiers et métriques annoncés
- Vérification EMPIRIQUE : lit les vrais fichiers, exécute les vrais tests
- Challenge SYSTÉMATIQUE de tout optimisme et biais de confirmation
- **VERDICT FINAL :** REJECT/BLOCK/FAIL si moindre discordance détectée

**Triggers automatiques :**
- Claims de "migration réussie" ou "terminé"
- Scores annoncés >70/100 (seuil abaissé pour détecter l'optimisme précoce)
- Déclarations "prêt pour production"
- Métriques de performance ou couverture de test
- **CREATION d'outils d'audit personnalisés**
- **MODIFICATION des outils d'audit existants**
- **IGNORANCE des rapports officiels**

## Règles de vérification
- Aucune tâche n'est "terminée" sans passage par les 4 phases
- Chaque agent doit confirmer explicitement la complétude
- En cas de problème détecté, retour en Phase 1
- **Le reality-checker a un droit de veto ABSOLU sur toute conclusion**

## Commandes de test disponibles
⚠️ **Rappel important : Ces commandes doivent être utilisées automatiquement dans les phases 2, 3 ET 4 (reality-checker), pas seulement listées.**

- **Relecture de tous les fichiers modifiés**  
  ```bash
  git diff --name-only HEAD
  ```

- **Détection de code mort**  
  ```bash
  grep -R "TODO\|FIXME" .
  ```

- **Tests backend (Laravel PHPUnit)**  
  ```bash
  php artisan test
  ```

- **Tests frontend (E2E Playwright)**  
  ```bash
  npm run test:e2e
  ```

- **Lint frontend (ESLint + TypeScript)**  
  ```bash
  npm run lint
  ```

- **Lint backend (Laravel Pint)**  
  ```bash
  ./vendor/bin/pint
  ```

- **Build frontend de production**  
  ```bash
  npm run build
  ```

- **Couverture des tests**
  ```bash
  php artisan test --coverage
  npm run test:coverage
  ```

- **Audit legacy exact (Phase 3 scoring)**
  ```bash
  node audit-legacy-exact.js
  ```

## 🚨 COMMANDES REALITY-CHECKER SPÉCIFIQUES

- **Validation empirique des métriques**
  ```bash
  # OBLIGATOIRE: Vérifier l'intégrité des outils d'audit AVANT utilisation
  git log --oneline audit-legacy-exact.js

  # Vérification avec l'outil OFFICIEL NON MODIFIÉ
  node audit-legacy-exact.js

  # Lecture du rapport OFFICIEL (source de vérité)
  cat frontend/phase3-validation-report.json | grep -A 5 -B 5 "overall\|legacyClasses"

  # Vérification build réel
  npm run build

  # Tests complets indépendants
  npm test && php artisan test
  ```

- **Lecture directe des fichiers critiques**
  - **OBLIGATOIRE:** Vérifier que l'agent n'a pas créé de nouvel outil d'audit
  - Toujours lire les fichiers mentionnés dans les claims de "migration"
  - Compter manuellement les usages legacy avec grep/rg
  - Vérifier les artefacts de build réels dans le système
  - **CONFRONTER** résultats avec phase3-validation-report.json

## 📊 MÉTRIQUES OFFICIELLES DE RÉFÉRENCE

- **Phase 3 Score:** 38/100 (frontend/phase3-validation-report.json)
- **Legacy usages:** 169 patterns détectés (officiel)
- **Tests coverage:** 0/100 (ERROR)
- **Performance:** 0/100 (ERROR)
- **Accessibility:** 0/100 (ERROR)

**⚠️ ATTENTION:** Tout score supérieur à ces métriques officielles doit être considéré comme SUSPECT et invalidé immédiatement.


> **Documentation technique et contexte pour le développement avec Claude Code**

## 📋 **Informations Générales**

### **Nom du Projet**
**Antigaspi** - Application Anti-Gaspillage Alimentaire

### **Objectif Principal**
Développer une plateforme web complète permettant aux commerçants de vendre leurs invendus à prix réduit et aux consommateurs de faire des économies tout en luttant contre le gaspillage alimentaire.

### **Cible Géographique**
Afrique de l'Ouest (Togo en priorité)

### **Repository GitHub**
https://github.com/nashflow28/antigaspi2

---

## 🏗️ **Architecture Technique**

### **Backend (✅ Déployé en Production)**
- **Framework :** Laravel 11 + PHP 8.2+
- **Base de données :** MySQL 8.0 avec 10 tables relationnelles
- **Authentification :** JWT multi-rôles (Consumer/Merchant/Admin)
- **API :** REST complète avec validation et gestion d'erreurs
- **Déploiement :** VPS en ligne (antigaspi.jubtek.com)
- **Status :** Production - fonctionnel

### **Mobile App (✅ Production-Ready)**
- **Framework :** React Native 0.76+ + Expo SDK 52
- **État :** Redux Toolkit avec slices (auth, reservations, products, favorites, cart, loyalty, wallet)
- **Navigation :** React Navigation 6 (Stack + Bottom Tabs) - Role-based
- **HTTP :** Axios avec intercepteurs JWT + refresh automatique
- **Build :** EAS Build pour génération APK Android
- **Tests :** Tests manuels avec APK installé sur appareil physique
- **Design System :** DS2025 avec `useTheme()` hook + Dark Mode complet
- **Push Notifications :** Firebase FCM avec expo-notifications
- **UX :** Haptic feedback via expo-haptics

### **Database Schema**
```sql
10 Tables principales :
├── users (multi-rôles)
├── categories (produits)
├── merchants (commerçants)
├── products (invendus)
├── reservations (réservations)
├── payments (paiements futurs)
├── reviews (avis clients)
├── loyalty_points (fidélité)
├── notifications (alertes)
└── analytics_daily (statistiques)
```

---

## 🎯 **Fonctionnalités par Niveau**

### **✅ Niveau 1 - MVP Backend (Terminé)**
- Authentification multi-rôles sécurisée
- Catalogue de produits avec filtres avancés
- Système de réservation avec gestion des stocks
- API REST complète avec documentation

### **✅ Niveau 2 - Application Mobile (Terminé)**
- Interface Consumer complète (5 onglets : Accueil, Découvrir, Favoris, Commande, Compte)
- Interface Merchant (Dashboard, Produits, Réservations, Fidélité, Compte)
- Interface Admin (Dashboard, Analytics, Paramètres)
- Profils utilisateurs et historiques
- Système de panier avec checkout

### **✅ Niveau 3 - Fonctionnalités Avancées (Terminé)**
- Système d'avis et notations
- Programme de fidélité avec points et tiers (Bronze/Silver/Gold/Platinum)
- Paniers Surprise (Surprise Baskets) pour invendus groupés
- Wallet virtuel avec historique transactions
- Dark Mode complet avec Design System 2025

### **✅ Niveau 4 - Extensions (Terminé)**
- Application mobile React Native + Expo (APK Android)
- Notifications push temps réel (Firebase FCM)
- Analytics avancées avec graphiques (Admin + Merchant)
- Export Excel des données (réservations, analytics)
- Haptic feedback pour UX tactile

### **⏳ Niveau 5 - Intégrations (En cours)**
- Paiements en ligne (Mobile Money, Paystack)
- Géolocalisation des commerçants avec carte
- Support multilingue (FR/EN)

---

## 📊 **État d'Avancement Actuel**

### **✅ Backend Complété (100%)**
- [x] Schema de base de données MySQL (10+ tables)
- [x] Models Eloquent avec relations
- [x] Contrôleurs API (Auth, Products, Reservations, Favorites, Cart, Loyalty, Wallet, Reviews)
- [x] Routes API avec middleware de sécurité JWT
- [x] Backend déployé en production sur VPS
- [x] Système de notifications (in-app + push)
- [x] Analytics API pour dashboard

### **✅ Mobile App Complété (100%)**
- [x] Application React Native + Expo SDK 52
- [x] Build APK Android fonctionnel
- [x] Authentification multi-rôles (Consumer/Merchant/Admin)
- [x] Navigation role-based (5 onglets Consumer, 5 onglets Merchant)
- [x] Design System 2025 avec `useTheme()` hook
- [x] Dark Mode complet
- [x] Haptic feedback sur actions critiques
- [x] Push Notifications via Firebase FCM

### **✅ Fonctionnalités Consumer**
- [x] Catalogue produits avec filtres et recherche
- [x] Détails produit avec info commerçant
- [x] Système de favoris (toggle + liste)
- [x] Panier avec gestion quantités
- [x] Réservations (création, annulation, historique)
- [x] Paniers Surprise (découverte et réservation)
- [x] Programme fidélité (points, tiers, récompenses)
- [x] Wallet virtuel (solde, transactions)
- [x] Notifications inbox avec filtres

### **✅ Fonctionnalités Merchant**
- [x] Dashboard avec statistiques (revenus, réservations, produits)
- [x] Gestion produits (CRUD avec upload images)
- [x] Gestion paniers surprise
- [x] Réservations reçues (confirmation, ready, complete)
- [x] Programme fidélité pour clients
- [x] Export Excel des réservations
- [x] Avis clients

### **✅ Fonctionnalités Admin**
- [x] Dashboard global avec analytics
- [x] Gestion utilisateurs
- [x] Modération produits
- [x] Export données
- [x] Paramètres système

### **🔄 En Cours (Améliorations UX)**
- [x] Migration DS2025 (~85% complète)
- [x] Corrections contraste dark mode
- [x] Haptic feedback sur navigation
- [ ] Derniers écrans à migrer vers useTheme()

### **⏳ À Faire**
- [ ] Intégration paiements Mobile Money
- [ ] Géolocalisation commerçants avec carte
- [ ] Tests automatisés complets
- [ ] Support multilingue (FR/EN)

---

## 🔧 **Configuration de Développement & Production**

### **Environnement de Production**
- **Serveur :** VPS (web58.hosting-systems.io)
- **Backend URL :** https://antigaspi.jubtek.com
- **Base de données :**
  - Host: localhost (depuis le serveur)
  - Database: `c2621486c_antigaspi_db`
  - User: `c2621486c_apiuser`
  - Password: [voir credentials sécurisés]
- **Déploiement Backend :**
  1. Commit et push sur GitHub (branche `main`)
  2. SSH vers le serveur VPS
  3. `git pull origin main` dans le dossier backend
  4. `php artisan migrate` si changements de DB
  5. Vérifier les logs Laravel pour erreurs

### **Environnement Local (Développement)**
- **XAMPP :** Apache + MySQL + PHP 8.2+
- **Node.js :** v18+ pour React Native
- **Composer :** Gestion dépendances PHP
- **Expo CLI :** Pour le développement mobile
- **Git :** Workflow avec branches par étape

### **Structure des Dossiers**
```
antigaspi2/
├── 📊 database/           # Scripts MySQL + docs
├── 🚀 backend/            # Laravel API (déployé)
│   ├── app/Http/Controllers/Api/
│   ├── app/Models/
│   ├── app/Services/
│   └── routes/api.php
├── 📱 mobile/             # React Native + Expo
│   ├── src/
│   │   ├── components/       # Composants réutilisables (DS2025)
│   │   ├── screens/
│   │   │   ├── main/         # Écrans Consumer (Home, Products, Cart, etc.)
│   │   │   ├── merchant/     # Écrans Merchant (Dashboard, Products, etc.)
│   │   │   ├── admin/        # Écrans Admin (Dashboard, Analytics, etc.)
│   │   │   └── auth/         # Écrans Auth (Login, Register)
│   │   ├── navigation/       # Navigateurs role-based
│   │   │   ├── ConsumerNavigator.tsx   # 5 onglets
│   │   │   ├── MerchantNavigator.tsx   # 5 onglets
│   │   │   └── AdminNavigator.tsx      # 3 onglets
│   │   ├── store/            # Redux Toolkit slices
│   │   ├── services/         # API, notifications, export
│   │   ├── hooks/            # useTheme, useHaptics, useFavorite
│   │   ├── theme/            # Design System 2025
│   │   └── types/            # TypeScript interfaces
│   ├── eas.json          # Configuration EAS Build
│   └── app.json          # Configuration Expo
├── 🧪 tests/             # Tests E2E Playwright
├── 📋 docs/              # Documentation
└── 🔧 config/            # Configurations diverses
```

### **URLs**
- **Backend Production :** https://antigaspi.jubtek.com/api
- **API Health Check :** https://antigaspi.jubtek.com/api/health
- **Backend Local :** http://localhost:8000/api (si XAMPP actif)
- **Database Admin Local :** http://localhost/phpmyadmin

### **Mobile App Build**
- **Platform :** Android (APK via EAS Build)
- **Build Command :** `eas build --platform android --profile preview`
- **Distribution :** APK téléchargé et installé manuellement
- **Test :** Installation sur appareil physique Android

---

## 👥 **Comptes de Test Disponibles**

### **Authentification Mobile (Méthode principale)**
Tous les comptes de test supportent l'authentification par téléphone + PIN :
- **PIN par défaut :** `1234`
- **Format téléphone :** Togo (+228)

### **Administrateur**
- Email: `admin@antigaspi.com`
- Phone: `+228 91 00 00 01`
- Password: `password`
- PIN: `1234`
- Rôle: Gestion complète de la plateforme

### **Consommateur**
- Email: `jean.dupont@email.com`
- Phone: `+228 90 65 43 21`
- Password: `password`
- PIN: `1234`
- Rôle: Navigation et réservation des produits

### **Commerçant**
- Email: `boulangerie.martin@email.com`
- Phone: `+228 90 12 34 56`
- Password: `password`
- PIN: `1234`
- Rôle: Ajout de produits et gestion des réservations

### **Connexion Mobile**
1. **Par téléphone + OTP** : Entrer le numéro → Recevoir SMS → Entrer PIN
2. **Par email + password** : Connexion classique (legacy, toujours supporté)

### **Produits de Test**
- Pain complet artisanal - 250 XOF
- Croissants artisanaux - 100 XOF
- Bananes mûres - 150 XOF
- Yaourts nature - 400 XOF

---

## 🎨 **Décisions de Design**

### **Design System 2025 (DS2025)**
Le mobile utilise un système de design unifié accessible via le hook `useTheme()`:

```typescript
import { useTheme } from '../theme'

const MyComponent = () => {
  const theme = useTheme()

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        {theme.isDark ? 'Mode sombre' : 'Mode clair'}
      </Text>
    </View>
  )
}
```

### **Couleurs & Branding**
- **Primaire :** Vert écologie `theme.colors.primary[500]` (#10B981)
- **Secondaire :** Orange économies `theme.colors.secondary` (#F59E0B)
- **Success/Error/Warning :** Via `theme.colors.success/error/warning`
- **Surfaces :** `theme.colors.surface.light` / `theme.colors.neutral[800]` (dark)
- **Monnaie :** Franc CFA (XOF) pour l'Afrique de l'Ouest

### **Dark Mode**
Support complet avec détection automatique des préférences système:
- Backgrounds adaptatifs via `theme.isDark`
- Cartes: `theme.colors.surface.light` (light) / `theme.colors.neutral[800]` (dark)
- Textes: `theme.colors.text`, `theme.colors.textSecondary`, `theme.colors.textTertiary`

### **UX/UI Principles**
- **Mobile-first :** Interface pensée pour smartphone
- **Accessibility :** Contraste WCAG AA, tailles de texte adaptatives
- **Haptic Feedback :** Retour tactile sur actions (via `useHaptics()` hook)
- **Performance :** Lazy loading, optimisation images, FlatList virtualisées
- **Offline :** AsyncStorage pour cache local

---

## 🚀 **Stratégie de Déploiement**

### **Phase 1 - MVP Local**
- Déploiement XAMPP local pour tests
- Validation des fonctionnalités core
- Tests utilisateurs avec comptes démo

### **Phase 2 - Staging**
- Serveur de test en ligne
- Tests de charge et performance
- Validation UX/UI avec utilisateurs réels

### **Phase 3 - Production**
- Déploiement serveur production
- Monitoring et analytics
- Support utilisateurs et maintenance

---

## 📚 **Ressources & Documentation**

### **Documentation Technique**
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Endpoints API complets
- [QUICK_START.md](./QUICK_START.md) - Guide de démarrage rapide
- [database/README.md](./database/README.md) - Structure de la base

### **Tests & Validation**
- Tests Playwright MCP configurés
- Collection Postman pour tests API
- Scripts de build et déploiement automatisés

### **Monitoring & Analytics**
- Logs Laravel configurés
- Métriques de performance frontend
- Analytics utilisateurs (GA4 prévu)

---

## 🔄 **Workflow de Développement & Déploiement**

### **Branches Git**
- `main` - Code de production (déployé sur VPS)
- `feature/etape-X-description` - Développement par étapes
- `hotfix/*` - Corrections urgentes

### **Process de Développement Backend**
1. **Développement local** - Modifications dans `C:\xampp\htdocs\antigaspi2\backend`
2. **Test local** - Vérifier les changements avec XAMPP (si disponible)
3. **Commit Git** - `git add` + `git commit -m "description"`
4. **Push vers GitHub** - `git push origin main`
5. **Déploiement Production** :
   ```bash
   ssh user@web58.hosting-systems.io
   cd /path/to/antigaspi-backend
   git pull origin main
   php artisan migrate --force   # Si changements DB
   php artisan config:cache
   php artisan route:cache
   tail -f storage/logs/laravel.log  # Vérifier erreurs
   ```

### **Process de Développement Mobile**
1. **Développement local** - Modifications dans `mobile/src/`
2. **Test avec Expo Go** - `npx expo start` (optionnel)
3. **Commit Git** - Commit des changements frontend
4. **Build APK Production** :
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
5. **Installation** - Télécharger APK et installer sur appareil
6. **Test manuel** - Vérifier toutes les fonctionnalités

### **Workflow de Test**
- **Backend** : Tests manuels via curl/Postman + vérification logs Laravel
- **Mobile** : Installation APK sur appareil physique + tests manuels
- **Base de données** : Accès direct via MySQL CLI pour vérifications

### **Conventions de Code**
- **Laravel :** PSR-12 + conventions Laravel
- **React Native :** TypeScript strict + Functional Components + Hooks
- **Redux :** Slices avec async thunks pour API calls

---

## 🐛 **Problèmes Connus & En Investigation**

### **Frontend Mobile (React Native)**
- **Annulation réservation** : Backend fonctionne mais UI ne rafraîchit pas automatiquement
  - Cause : `dispatch(cancelReservation()).unwrap()` manquant dans ReservationDetailsScreen
  - Workaround : Retour arrière puis réouvrir la liste des réservations
  - Fix : Nécessite rebuild APK avec `.unwrap()` ajouté

- **Édition profil** : Validation téléphone désactivée dans le code mais APK ancien
  - Cause : APK actuel contient ancienne validation stricte
  - Fix : Rebuild APK avec commit 308476b3

### **Backend (Laravel)**
- **Notifications** : Système de notifications cause rollback si erreur
  - Status : Corrigé avec try-catch non-bloquant dans tous les controllers
  - Méthodes corrigées : cancel(), confirm(), markReady(), complete(), createReservation()

### **Tests Non Complétés**
- [ ] Merchant : Confirmation de réservation (fix appliqué, en attente test)
- [ ] Merchant : markReady() et complete() methods
- [ ] Merchant : Création de nouveaux produits
- [ ] Consumer : Édition profil avec nouveau format téléphone

---

## ⚡ **Commandes Rapides**

### **Backend - Production**
```bash
# SSH vers serveur production
ssh user@web58.hosting-systems.io

# Naviguer vers le backend
cd /path/to/antigaspi-backend

# Pull dernières modifications
git pull origin main

# Migrations si nécessaire
php artisan migrate --force

# Vérifier logs en temps réel
tail -f storage/logs/laravel.log

# Vider les caches
php artisan config:cache
php artisan route:cache
php artisan view:clear
```

### **Backend - Tests API**
```bash
# Login consumer
curl -X POST https://antigaspi.jubtek.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.dupont@email.com","password":"password"}'

# Login merchant
curl -X POST https://antigaspi.jubtek.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"boulangerie.martin@email.com","password":"password"}'

# Tester endpoint avec token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://antigaspi.jubtek.com/api/reservations

# Créer une réservation
curl -X POST https://antigaspi.jubtek.com/api/reservations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":1,"payment_method":"on_site"}'
```

### **Database - Production**
```bash
# Connexion MySQL production (depuis serveur)
mysql -u c2621486c_apiuser -p c2621486c_antigaspi_db

# Vérifier réservations récentes
mysql -u c2621486c_apiuser -p c2621486c_antigaspi_db -e \
  "SELECT id, reservation_code, status, created_at FROM reservations ORDER BY id DESC LIMIT 10;"

# Vérifier produits actifs
mysql -u c2621486c_apiuser -p c2621486c_antigaspi_db -e \
  "SELECT id, name, quantity_available, expiration_date FROM products WHERE is_active = 1;"

# Compter favoris par utilisateur
mysql -u c2621486c_apiuser -p c2621486c_antigaspi_db -e \
  "SELECT user_id, COUNT(*) as nb_favoris FROM favorites GROUP BY user_id;"
```

### **Mobile - Build & Deploy**
```bash
# Build APK production
cd mobile
eas build --platform android --profile preview

# Build APK développement (plus rapide)
eas build --platform android --profile development

# Vérifier status du build
eas build:list

# Installer APK sur appareil
# 1. Télécharger APK depuis lien EAS
# 2. Transférer vers appareil Android
# 3. Installer manuellement (autoriser sources inconnues)
```

### **Git - Workflow**
```bash
# Status et fichiers modifiés
git status
git diff

# Commit changements backend
git add backend/app/Http/Controllers/Api/ReservationController.php
git commit -m "fix(backend): Fix confirm() method logic error"

# Commit changements mobile
git add mobile/src/screens/main/ProfileEditScreen.tsx
git commit -m "fix(mobile): Disable strict phone validation"

# Push vers GitHub
git push origin main

# Vérifier historique
git log --oneline -10
```

---

## 🔐 **Accès & Credentials**

### **Comptes de Test Production**
| Rôle | Email | Phone | Password | PIN | Usage |
|------|-------|-------|----------|-----|-------|
| Admin | admin@antigaspi.com | +228 91 00 00 01 | password | 1234 | Gestion plateforme |
| Consumer | jean.dupont@email.com | +228 90 65 43 21 | password | 1234 | Tests réservations |
| Merchant | boulangerie.martin@email.com | +228 90 12 34 56 | password | 1234 | Tests gestion produits |

### **Serveurs & Base de Données**
- **Serveur VPS** : web58.hosting-systems.io
- **Backend URL** : https://antigaspi.jubtek.com
- **Database Host** : localhost (depuis serveur)
- **Database Name** : c2621486c_antigaspi_db
- **Database User** : c2621486c_apiuser
- **Database Password** : [voir fichier .env sur serveur]

### **GitHub & Repositories**
- **Repository** : https://github.com/nashflow28/antigaspi2
- **Branche principale** : main
- **Commits récents** : Voir git log pour historique complet

### **EAS Build (Expo)**
- **Project ID** : Voir app.json
- **Profils disponibles** : development, preview, production
- **Plateforme** : Android uniquement (pour le moment)

---

## 🔧 **Troubleshooting - Guide de Dépannage**

### **Problème : Réservation ne se crée pas**
**Symptômes** : Erreur "Erreur lors de la création de la réservation"

**Solutions à vérifier** :
1. ✅ Produit existe et est actif (`is_active = 1`)
2. ✅ Produit pas expiré (`expiration_date > NOW()`)
3. ✅ Stock disponible (`quantity_available >= quantity demandée`)
4. ✅ Colonne `expires_at` nullable (sinon : `ALTER TABLE reservations MODIFY expires_at DATETIME NULL`)
5. ✅ Notifications ne bloquent pas (try-catch dans ReservationService.php ligne 164)
6. ✅ Pas de réservation active existante pour ce produit/utilisateur

**Commandes de diagnostic** :
```bash
# Vérifier le produit
mysql -u c2621486c_apiuser -p -e \
  "SELECT id, name, is_active, quantity_available, expiration_date FROM products WHERE id = PRODUCT_ID;" \
  c2621486c_antigaspi_db

# Vérifier les logs
tail -100 storage/logs/laravel.log | grep ERROR
```

---

### **Problème : Token JWT expiré**
**Symptômes** : "Token has expired" ou "Unauthenticated"

**Solution** :
```bash
# Se réauthentifier
curl -X POST https://antigaspi.jubtek.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"USER_EMAIL","password":"password"}'

# Extraire le nouveau token
# Copier le token depuis la réponse JSON
```

**Dans l'app mobile** :
- Se déconnecter et se reconnecter
- Le token sera automatiquement rafraîchi

---

### **Problème : APK crash au démarrage**
**Symptômes** : Application se ferme immédiatement après ouverture

**Solutions** :
1. Vérifier compatibilité Android (`compileSdkVersion = 35`)
2. Vérifier que toutes les dépendances sont installées
3. Rebuild avec cache nettoyé :
```bash
cd mobile
rm -rf node_modules
npm install
eas build --platform android --profile preview --clear-cache
```

---

### **Problème : Favoris vides ou erreur**
**Symptômes** : "Erreur lors de la récupération des favoris"

**Solution** :
1. ✅ Table `favorites` existe
2. ✅ Produits associés ont `category_id` et `merchant_id` non NULL

**Commandes de diagnostic** :
```bash
# Vérifier si table existe
mysql -u c2621486c_apiuser -p -e "SHOW TABLES LIKE 'favorites';" c2621486c_antigaspi_db

# Vérifier favoris d'un utilisateur
mysql -u c2621486c_apiuser -p -e \
  "SELECT f.*, p.name FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = USER_ID;" \
  c2621486c_antigaspi_db
```

---

### **Problème : Modifications backend ne se reflètent pas**
**Symptômes** : Code modifié mais API retourne ancien comportement

**Solution** :
```bash
# Vérifier que les fichiers sont bien sur le serveur
ssh user@server "cat /path/to/ReservationController.php | grep 'confirm()' -A 20"

# Vider tous les caches Laravel
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Redémarrer PHP-FPM (si applicable)
sudo systemctl restart php-fpm
```

---

### **Problème : "Column not found" dans base de données**
**Symptômes** : SQLSTATE[42S22]: Column not found

**Solution** :
1. Identifier la colonne manquante depuis le message d'erreur
2. Vérifier la structure actuelle :
```bash
mysql -u c2621486c_apiuser -p -e "DESCRIBE table_name;" c2621486c_antigaspi_db
```
3. Ajouter la colonne si nécessaire (voir migrations créées)
4. Exécuter les migrations :
```bash
php artisan migrate --force
```

---

### **Problème : Merchant ne peut pas confirmer réservation**
**Symptômes** : "Cette réservation ne peut pas être confirmée"

**Cause** : La méthode `confirm()` ne fonctionne que sur les réservations avec `status = 'pending'`

**Solution** :
```bash
# Vérifier le statut de la réservation
mysql -u c2621486c_apiuser -p -e \
  "SELECT id, reservation_code, status FROM reservations WHERE id = RESERVATION_ID;" \
  c2621486c_antigaspi_db

# Si status = 'confirmed', la réservation est déjà confirmée
# Il faut tester avec une réservation en 'pending'
```

---

**📝 Dernière mise à jour :** 02 Janvier 2026
**🤖 Maintenu automatiquement par Claude Code**

---

## 📱 **Hooks Mobile Disponibles**

### **useTheme()**
Hook principal pour accéder au Design System 2025:
```typescript
const theme = useTheme()
// theme.colors.primary[500], theme.isDark, etc.
```

### **useHaptics()**
Hook pour feedback tactile:
```typescript
const haptics = useHaptics()
await haptics.lightTap()   // Navigation tabs
await haptics.mediumTap()  // Boutons action
await haptics.success()    // Confirmation réussie
await haptics.error()      // Erreur
```

### **useFavorite(productId)**
Hook pour gérer les favoris d'un produit:
```typescript
const { isFavorite, toggleFavorite, loading } = useFavorite(productId)
```

### **useAlert()**
Hook pour afficher des alertes stylisées:
```typescript
const { showAlert } = useAlert()
showAlert({ title: 'Succès', message: '...', type: 'success' })
```