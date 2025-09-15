# 🧪 **GUIDE DE TEST - ANTIGASPI**

> **Procédures de test complètes pour valider toutes les fonctionnalités**

## 🚀 **DÉMARRAGE RAPIDE**

### **Lancement des Serveurs**
```bash
# Terminal 1 - Backend
cd backend && php artisan serve --port=8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### **URLs de Test**
- **Frontend** : http://localhost:3001
- **Backend** : http://localhost:8000
- **API Health** : http://localhost:8000/api/health

---

## 👥 **COMPTES DE TEST**

### **🔐 Admin - Accès Complet**
```
Email: admin@antigaspi.com
Password: password
Rôle: Administrateur système
Accès: Toutes les fonctionnalités
```

### **🏪 Merchant - Commerçant**
```
Email: boulangerie.martin@email.com
Password: password
Rôle: Commerçant vérifié
Accès: Gestion produits + réservations
```

### **👤 Consumer - Consommateur**
```
Email: jean.dupont@email.com
Password: password
Rôle: Consommateur
Accès: Navigation + réservations
```

---

## 🎯 **TESTS PAR INTERFACE**

### **🏢 Interface Administrateur**

#### **1. Test Dashboard Admin**
```
✅ Connexion avec admin@antigaspi.com
✅ Accès à /admin/dashboard
✅ Vérification graphiques Chart.js
✅ Statistiques temps réel affichées
✅ Navigation vers autres sections
```

#### **2. Test Gestion Utilisateurs**
```
✅ Accès à /admin/users
✅ Liste des utilisateurs chargée
✅ Fonction suspension utilisateur
✅ Fonction réactivation utilisateur
✅ Filtres et recherche fonctionnels
```

#### **3. Test Modération Commerçants**
```
✅ Accès à /admin/merchants
✅ Liste des commerçants en attente
✅ Approbation commerçant
✅ Rejet commerçant avec motif
✅ Modération produits signalés
```

### **🏪 Interface Commerçant**

#### **1. Test Dashboard Commerçant**
```
✅ Connexion avec boulangerie.martin@email.com
✅ Accès à /merchant/dashboard
✅ Statistiques personnelles
✅ Aperçu réservations récentes
✅ Liens vers gestion produits
```

#### **2. Test Gestion Produits**
```
✅ Accès à /merchant/products
✅ Liste des produits du commerçant
✅ Création nouveau produit
✅ Modification produit existant
✅ Activation/désactivation produit
```

#### **3. Test Gestion Réservations**
```
✅ Accès à /merchant/reservations
✅ Réservations reçues affichées
✅ Confirmation réservation
✅ Marquage comme récupérée
✅ Gestion des annulations
```

### **🛒 Interface Consommateur**

#### **1. Test Page d'Accueil**
```
✅ Accès à / (sans connexion)
✅ Catalogue produits affiché
✅ Filtres par catégorie fonctionnels
✅ Barre de recherche active
✅ Design glassmorphism visible
```

#### **2. Test Navigation Produits**
```
✅ Accès à /products
✅ Liste complète des produits
✅ Filtres avancés (prix, ville, etc.)
✅ Tri par pertinence/prix/date
✅ Cartes produits interactives
```

#### **3. Test Détail Produit**
```
✅ Clic sur produit depuis catalogue
✅ Page détail /products/:id
✅ Informations complètes affichées
✅ Bouton réservation fonctionnel
✅ Informations commerçant visibles
```

#### **4. Test Processus Réservation**
```
✅ Connexion avec jean.dupont@email.com
✅ Sélection quantité désirée
✅ Confirmation réservation
✅ Page confirmation affichée
✅ Email de confirmation (si configuré)
```

#### **5. Test Profil Utilisateur**
```
✅ Accès à /profile
✅ Modification informations personnelles
✅ Changement préférences notifications
✅ Modification mot de passe
✅ Statistiques personnelles affichées
```

#### **6. Test Historique Réservations**
```
✅ Accès à /reservations
✅ Liste réservations personnelles
✅ Filtres par statut fonctionnels
✅ Détail de chaque réservation
✅ Actions d'annulation possibles
```

---

## 🔧 **TESTS TECHNIQUES**

### **API Backend**
```bash
# Test santé API
curl http://localhost:8000/api/health
# Résultat attendu: {"status":"ok",...}

# Test liste produits
curl http://localhost:8000/api/products
# Résultat attendu: {"success":true,"data":[...],...}

# Test authentification
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@antigaspi.com","password":"password"}'
# Résultat attendu: {"success":true,"token":"..."}
```

### **Build & Performance**
```bash
# Test build frontend
cd frontend && npm run build
# Résultat attendu: Build réussi sans erreurs

# Test types TypeScript
cd frontend && npm run type-check
# Résultat attendu: Aucune erreur de type

# Test linting
cd frontend && npm run lint
# Résultat attendu: Code conforme aux standards
```

---

## 📱 **TESTS RESPONSIVES**

### **Tailles d'Écran à Tester**
- **Mobile** : 375px (iPhone SE)
- **Tablet** : 768px (iPad)
- **Desktop** : 1200px+ (écrans standards)

### **Éléments à Vérifier**
```
✅ Navigation mobile hamburger
✅ Cartes produits empilées sur mobile
✅ Formulaires adaptatifs
✅ Boutons touch-friendly
✅ Images responsive
```

---

## 🚨 **TESTS DE SÉCURITÉ**

### **Authentification**
```
✅ Accès routes protégées sans token
✅ Expiration de session
✅ Validation des rôles utilisateur
✅ Protection contre XSS
✅ Validation des entrées formulaires
```

### **Permissions par Rôle**
```
❌ Consumer ne peut pas accéder à /admin
❌ Merchant ne peut pas modifier autres commerçants
❌ Admin ne peut pas voir profils privés
✅ Chaque rôle accède uniquement à ses fonctions
```

---

## 🔍 **DEBUGGING & LOGS**

### **Frontend (Browser DevTools)**
```
✅ Console sans erreurs JavaScript
✅ Network: Requêtes API réussies (200/201)
✅ Performance: LCP < 2.5s
✅ Accessibilité: Score > 90%
```

### **Backend (Laravel Logs)**
```bash
# Vérifier logs d'erreurs
tail -f backend/storage/logs/laravel.log

# Résultat attendu: Aucune erreur critique
```

---

## ✅ **CHECKLIST DE VALIDATION**

### **Fonctionnalités Core**
- [ ] Inscription utilisateur
- [ ] Connexion/déconnexion
- [ ] Navigation entre interfaces
- [ ] Création/modification produits
- [ ] Processus réservation complet
- [ ] Gestion admin fonctionnelle

### **Performance**
- [ ] Build frontend sans erreurs
- [ ] API répond en < 500ms
- [ ] Pages chargent en < 3s
- [ ] Aucune fuite mémoire détectée

### **UX/UI**
- [ ] Design cohérent sur toutes les pages
- [ ] Messages d'erreur clairs
- [ ] Feedback utilisateur approprié
- [ ] Navigation intuitive

### **Sécurité**
- [ ] Routes protégées fonctionnelles
- [ ] Validation des données
- [ ] Gestion des erreurs appropriée
- [ ] Pas de data sensible exposée

---

## 🎉 **VALIDATION FINALE**

Lorsque tous les tests passent avec succès :

1. ✅ **Application fonctionnelle** à 100%
2. ✅ **Prête pour déploiement** en production
3. ✅ **Documentation complète** disponible
4. ✅ **Support maintenance** assuré

**🚀 Antigaspi est validé et prêt pour les utilisateurs !**

*Guide de test version 1.0.0*