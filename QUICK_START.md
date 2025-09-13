# ⚡ Quick Start - Antigaspi

## 🎯 **Démarrage Rapide (5 minutes)**

### 1. **Base de Données**
```bash
# Démarrer XAMPP
# Ouvrir http://localhost/phpmyadmin
# Créer nouvelle base : antigaspi_db
# Onglet SQL → Importer les fichiers suivants :
```

**Dans phpMyAdmin, exécuter dans l'ordre :**
1. `database/antigaspi_schema.sql`
2. `database/sample_data.sql`

### 2. **Backend Laravel**
```bash
cd C:\xampp\htdocs\antigaspi-2\backend
php artisan serve
```
➡️ **API disponible sur : http://localhost:8000/api**

### 3. **Test API**
```bash
curl http://localhost:8000/api/health
```

---

## 🧪 **Tests Essentiels**

### ✅ **1. Inscription Consommateur**
```bash
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "email": "test.consumer@antigaspi.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "Consumer",
  "phone": "0700000001",
  "role": "consumer",
  "city": "Abidjan"
}
```

### ✅ **2. Inscription Commerçant**
```bash
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "email": "test.merchant@antigaspi.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "Merchant",
  "phone": "0700000002",
  "role": "merchant",
  "city": "Abidjan",
  "business_name": "Test Boulangerie",
  "business_type": "Boulangerie"
}
```

### ✅ **3. Connexion**
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "test.consumer@antigaspi.com",
  "password": "password123"
}
```
**→ Copier le `token` de la réponse**

### ✅ **4. Liste des Produits**
```bash
GET http://localhost:8000/api/products?city=Abidjan
```

### ✅ **5. Créer une Réservation**
```bash
POST http://localhost:8000/api/reservations
Authorization: Bearer {VOTRE_TOKEN}
Content-Type: application/json

{
  "product_id": 1,
  "quantity_reserved": 1,
  "notes": "Test de réservation"
}
```

---

## 🗂️ **Données de Test Disponibles**

### 👥 **Utilisateurs**
- **Admin** : `admin@antigaspi.com` / `password`
- **Consommateurs** :
  - `marie.kouame@email.com` / `password`
  - `ibrahim.kone@email.com` / `password`
- **Commerçants** :
  - `boulangerie.martin@email.com` / `password`
  - `superette.bella@email.com` / `password`

### 🍞 **Produits Disponibles**
- Pain complet (Boulangerie Martin) - 250 XOF
- Croissants artisanaux - 100 XOF
- Bananes mûres (Superette Bella) - 150 XOF
- Poulet braisé (Restaurant Chez Tante) - 1500 XOF

### 📂 **Catégories**
1. Fruits et Légumes 🥬
2. Boulangerie 🥖
3. Plats préparés 🍽️
4. Épicerie 🛒

---

## 🚀 **Prochaines Étapes**

### **A. Interface Web (Vue.js)**
```bash
# Dans un nouveau terminal
cd C:\xampp\htdocs\antigaspi-2
npm create vue@latest frontend
cd frontend
npm install
npm run dev
```

### **B. Tests Postman/Insomnia**
- Importer la collection depuis `API_DOCUMENTATION.md`
- Configurer l'environnement avec `BASE_URL`
- Tester tous les endpoints

### **C. Fonctionnalités Avancées**
- Interface admin
- Système de notifications
- Géolocalisation
- Paiements en ligne

---

## 🔧 **Dépannage Courant**

### ❌ **"SQLSTATE[HY000] [1049] Unknown database"**
➡️ Créer la base `antigaspi_db` dans phpMyAdmin

### ❌ **"Class 'Tymon\JWTAuth\Facades\JWTAuth' not found"**
```bash
cd backend
composer require tymon/jwt-auth
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
```

### ❌ **"Route [api] not defined"**
➡️ Vérifier que `routes/api.php` existe et est bien configuré

### ❌ **CORS Issues**
➡️ Laravel gère automatiquement CORS, mais pour les tests :
```bash
# Dans backend/.env
APP_URL=http://localhost:8000
```

---

## 📱 **Prêt pour Mobile**

L'API est **100% compatible** React Native / Flutter :
- Authentification JWT standard
- Responses JSON structurées
- Endpoints RESTful
- Gestion des erreurs normalisée

---

## 📊 **Architecture Actuelle**

```
antigaspi-2/
├── 📊 database/           # MySQL Schema + Data
├── 🚀 backend/            # Laravel API (100% fonctionnel)
│   ├── app/Models/        # 9 modèles Eloquent
│   ├── app/Controllers/   # Auth + Products + Reservations
│   └── routes/api.php     # Routes API complètes
├── 📱 frontend/           # Vue.js (à créer)
└── 📋 docs/               # Documentation
```

**Status** : ✅ MVP Backend Complet - Prêt pour Frontend!