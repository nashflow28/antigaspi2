# 🥬 Antigaspi - Application Anti-Gaspillage Alimentaire

> **Système de lutte contre le gaspillage alimentaire connectant commerçants et consommateurs**

## 🎯 **Objectif**
Réduire le gaspillage alimentaire en permettant aux commerçants de vendre leurs invendus à prix réduit et aux consommateurs de faire des économies tout en agissant pour l'environnement.

## 🚀 **Technologies Utilisées**

### **Backend**
- **Laravel 11** - Framework PHP
- **MySQL 8.0** - Base de données
- **JWT Authentication** - Authentification sécurisée
- **API RESTful** - Architecture moderne

### **Frontend** *(À venir)*
- **Vue.js 3** - Framework JavaScript moderne
- **Tailwind CSS** - Styling utilitaire
- **Pinia/Vuex** - Gestion d'état

### **Mobile** *(Prévu)*
- **React Native** ou **Flutter**
- Réutilisation de la même API backend

## 📋 **Fonctionnalités**

### ✅ **MVP (Niveau 1) - Implémenté**
- 🔐 **Authentification multi-rôles** (Consommateur, Commerçant, Admin)
- 📦 **Catalogue de produits** avec filtres avancés
- 🎯 **Système de réservation** avec gestion des stocks
- 💰 **Gestion des prix** (prix original vs prix réduit)
- ⏰ **Dates d'expiration** et alertes
- 🏪 **Profils commerçants** avec vérification

### 🔄 **En Développement (Niveau 2)**
- 👤 **Profils utilisateurs** complets
- 📊 **Historique des commandes**
- 📈 **Tableaux de bord** (commerçant/admin)
- 🔔 **Système de notifications**

### 🎯 **Prévu (Niveaux 3-4)**
- 💳 **Paiements en ligne** (Mobile Money, Paystack)
- ⭐ **Système d'avis et notations**
- 🗺️ **Géolocalisation** (Google Maps)
- 🏆 **Programme de fidélité**
- 🌍 **Support multilingue**

## 🛠️ **Installation Locale**

### **Prérequis**
- XAMPP (Apache + MySQL + PHP 8.0+)
- Composer
- Node.js & npm

### **1. Base de Données**
```bash
# Démarrer XAMPP
# Ouvrir http://localhost/phpmyadmin
# Exécuter le script SQL :
```
```sql
SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_working_final.sql;
```

### **2. Backend Laravel**
```bash
cd backend
composer install
cp .env.example .env
# Configurer la base de données dans .env
php artisan key:generate
php artisan jwt:secret
php artisan serve
```

### **3. Test API**
```bash
curl http://localhost:8000/api/health
```

## 📊 **Structure du Projet**

```
antigaspi-2/
├── 📊 database/                    # Scripts MySQL
│   ├── antigaspi_working_final.sql # Schema principal
│   ├── sample_data.sql            # Données de test
│   └── README.md                  # Instructions DB
├── 🚀 backend/                    # Laravel API
│   ├── app/Models/                # 9 modèles Eloquent
│   ├── app/Http/Controllers/Api/  # Contrôleurs API
│   ├── routes/api.php             # Routes API
│   └── config/                    # Configurations
├── 📱 frontend/                   # Vue.js (à venir)
├── 📋 API_DOCUMENTATION.md        # Documentation API complète
├── ⚡ QUICK_START.md              # Guide démarrage rapide
└── 🔧 database/CHANGES_APPLIED.md # Historique modifications
```

## 🔌 **API Endpoints**

### **Authentification**
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### **Produits**
- `GET /api/products` - Liste des produits (avec filtres)
- `GET /api/products/{id}` - Détail d'un produit
- `POST /api/products` - Ajouter produit (commerçant)
- `PUT /api/products/{id}` - Modifier produit
- `DELETE /api/products/{id}` - Supprimer produit

### **Réservations**
- `GET /api/reservations` - Mes réservations
- `POST /api/reservations` - Créer réservation
- `POST /api/reservations/{id}/cancel` - Annuler réservation
- `GET /api/reservations/merchant/list` - Réservations commerçant
- `POST /api/reservations/{id}/confirm` - Confirmer réservation

## 🧪 **Données de Test**

### **Comptes de Test**
```
Admin: admin@antigaspi.com / password
Consommateur: jean.dupont@email.com / password
Commerçant: boulangerie.martin@email.com / password
```

### **Produits Disponibles**
- Pain complet artisanal - 250 XOF (Boulangerie Martin)
- Croissants artisanaux - 100 XOF
- Bananes mûres - 150 XOF (Superette Bella)
- Yaourts nature - 400 XOF

## 📱 **Architecture Mobile-Ready**

L'API est conçue pour être **100% compatible** avec les applications mobiles :
- Authentification JWT standard
- Responses JSON structurées
- Endpoints RESTful normalisés
- Gestion d'erreurs uniformisée

## 🤝 **Contribution**

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 **Roadmap**

- [x] ✅ **MVP Backend** - API complète fonctionnelle
- [x] ✅ **Base de données** - Schema et données de test
- [ ] 🔄 **Frontend Vue.js** - Interface utilisateur web
- [ ] 📱 **Application Mobile** - React Native/Flutter
- [ ] 💳 **Paiements** - Intégration Mobile Money
- [ ] 🌍 **Déploiement** - Production sur serveur

---

**Développé avec ❤️ pour lutter contre le gaspillage alimentaire en Afrique de l'Ouest**