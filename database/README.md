# Base de données Antigaspi

## Installation

### 1. Créer la base de données
```sql
-- Dans phpMyAdmin ou MySQL Workbench
SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_schema.sql;
```

### 2. Insérer les données de test
```sql
SOURCE C:/xampp/htdocs/antigaspi-2/database/sample_data.sql;
```

## Structure de la base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (consommateurs, commerçants, admin) |
| `merchants` | Informations spécifiques aux commerçants |
| `categories` | Catégories de produits |
| `products` | Produits invendus |
| `reservations` | Réservations des consommateurs |

### Tables avancées (Niveaux 3-4)

| Table | Description |
|-------|-------------|
| `payments` | Gestion des paiements |
| `reviews` | Avis et notations |
| `loyalty_points` | Système de fidélité |
| `notifications` | Notifications utilisateurs |
| `analytics_daily` | Statistiques quotidiennes |

### Vues utiles

- `merchant_stats` : Statistiques par commerçant
- `available_products` : Produits disponibles avec infos commerçant

## Données de test incluses

- **4 consommateurs** de différentes villes
- **4 commerçants** vérifiés avec profils complets
- **6 catégories** de produits
- **15+ produits** avec prix et dates d'expiration
- **Réservations** avec différents statuts
- **Avis et points de fidélité**
- **Données analytiques** sur une semaine

## Configuration XAMPP

1. Démarrer Apache + MySQL
2. Accéder à http://localhost/phpmyadmin
3. Importer les scripts SQL
4. Vérifier avec les requêtes de test incluses

## Mot de passe par défaut

Tous les utilisateurs de test utilisent le mot de passe : `password`
(Hash: `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`)

## Prochaines étapes

1. Configuration Laravel avec ces tables
2. Création des modèles Eloquent
3. API REST pour toutes les fonctionnalités