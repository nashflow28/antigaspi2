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
8. **Ne déclarer la tâche "terminée" qu'après validation** par l’agent de revue (Phase 2) **ET** par un agent de validation finale (Phase 3), avec confirmation explicite de chacun.

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
- S'assurer que la couverture de code est satisfaisante et qu'aucune régression fonctionnelle n’est présente.

## Règles de vérification
- Aucune tâche n'est "terminée" sans passage par les 3 phases
- Chaque agent doit confirmer explicitement la complétude
- En cas de problème détecté, retour en Phase 1

## Commandes de test disponibles
⚠️ **Rappel important : Ces commandes doivent être utilisées automatiquement dans les phases 2 et 3, pas seulement listées.**

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

### **Backend (✅ Terminé)**
- **Framework :** Laravel 11 + PHP 8.2+
- **Base de données :** MySQL 8.0 avec 10 tables relationnelles
- **Authentification :** JWT multi-rôles (Consumer/Merchant/Admin)
- **API :** REST complète avec validation et gestion d'erreurs
- **Status :** 100% fonctionnel et testé

### **Frontend (🔄 En cours)**
- **Framework :** Vue.js 3 + Composition API + TypeScript
- **CSS :** Tailwind CSS + Headless UI
- **État :** Pinia (successor de Vuex)
- **Routing :** Vue Router avec guards d'authentification
- **HTTP :** Axios avec intercepteurs JWT
- **Tests :** Playwright MCP pour tests E2E

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

### **🔄 Niveau 2 - Frontend Web (En cours)**
- Interface Consumer (consultation + réservation)
- Interface Merchant (gestion produits + réservations)
- Interface Admin (modération + analytics)
- Profils utilisateurs et historiques

### **⏳ Niveau 3 - Fonctionnalités Avancées (Prévu)**
- Paiements en ligne (Mobile Money, Paystack)
- Système d'avis et notations
- Géolocalisation des commerçants
- Programme de fidélité avec points

### **🚀 Niveau 4 - Extensions (Futur)**
- Application mobile (React Native/Flutter)
- Notifications push temps réel
- Analytics avancées avec graphiques
- Support multilingue (FR/EN)

---

## 📊 **État d'Avancement Actuel**

### **✅ Complété (100%)**
- [x] Schema de base de données MySQL
- [x] Models Eloquent avec relations
- [x] Contrôleurs API (Auth, Products, Reservations)
- [x] Routes API avec middleware de sécurité
- [x] Documentation API complète
- [x] Données de test et comptes démo
- [x] Repository Git configuré

### **🔄 En Cours (Phase Frontend)**
- [ ] **Étape 1 :** Configuration tests Playwright MCP
- [ ] **Étape 2 :** Architecture Vue.js + Tailwind
- [ ] **Étape 3 :** Interface d'authentification
- [ ] **Étape 4 :** Interface Consumer (Niveau 1)
- [ ] **Étape 5 :** Interface Merchant (Niveau 1)
- [ ] **Étape 6 :** Profils & Historiques (Niveau 2)
- [ ] **Étape 7 :** Interface Admin (Niveau 2)
- [ ] **Étape 8 :** Optimisation & Déploiement

---

## 🔧 **Configuration de Développement**

### **Environnement Local**
- **XAMPP :** Apache + MySQL + PHP 8.2+
- **Node.js :** v18+ pour Vue.js
- **Composer :** Gestion dépendances PHP
- **Git :** Workflow avec branches par étape

### **Structure des Dossiers**
```
antigaspi-2/
├── 📊 database/           # Scripts MySQL + docs
├── 🚀 backend/            # Laravel API (terminé)
├── 📱 frontend/           # Vue.js (à créer)
├── 🧪 tests/             # Tests E2E Playwright
├── 📋 docs/              # Documentation
└── 🔧 config/            # Configurations diverses
```

### **URLs de Développement**
- **Backend API :** http://localhost:8000/api
- **Frontend Web :** http://localhost:3000 (à configurer)
- **Database Admin :** http://localhost/phpmyadmin
- **API Health Check :** http://localhost:8000/api/health

---

## 👥 **Comptes de Test Disponibles**

### **Administrateur**
- Email: `admin@antigaspi.com`
- Password: `password`
- Rôle: Gestion complète de la plateforme

### **Consommateur**
- Email: `jean.dupont@email.com`
- Password: `password`
- Rôle: Navigation et réservation des produits

### **Commerçant**
- Email: `boulangerie.martin@email.com`
- Password: `password`
- Rôle: Ajout de produits et gestion des réservations

### **Produits de Test**
- Pain complet artisanal - 250 XOF
- Croissants artisanaux - 100 XOF
- Bananes mûres - 150 XOF
- Yaourts nature - 400 XOF

---

## 🎨 **Décisions de Design**

### **Couleurs & Branding**
- **Primaire :** Vert (écologie, fraîcheur) #10B981
- **Secondaire :** Orange (économies, chaleur) #F59E0B
- **Neutre :** Gris/Blanc pour la lisibilité
- **Monnaie :** Franc CFA (XOF) pour l'Afrique de l'Ouest

### **UX/UI Principles**
- **Mobile-first :** Interface pensée pour smartphone
- **Accessibility :** Contraste, tailles de texte, navigation
- **Performance :** Lazy loading, optimisation images
- **Offline :** PWA avec cache pour la consultation

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

## 🔄 **Workflow de Développement**

### **Branches Git**
- `main` - Code de production
- `feature/etape-X-description` - Développement par étapes
- `hotfix/*` - Corrections urgentes

### **Process de Validation**
1. Développement sur branche feature
2. Tests Playwright MCP automatiques
3. Build et vérification intégrité
4. Push vers GitHub
5. Merge vers main après validation

### **Conventions de Code**
- **Laravel :** PSR-12 + conventions Laravel
- **Vue.js :** Composition API + TypeScript strict
- **CSS :** Tailwind utility-first + composants réutilisables

---

**📝 Dernière mise à jour :** ${new Date().toLocaleDateString('fr-FR')}
**🤖 Maintenu automatiquement par Claude Code**