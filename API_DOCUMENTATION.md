# 📋 API Documentation - Antigaspi

## Base URL
```
http://localhost:8000/api
```

## 🔐 Authentication
L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis pour les routes protégées :
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 🚀 Endpoints Disponibles

### 1. **Authentication**

#### 📝 POST `/auth/register`
Inscription d'un nouvel utilisateur (consommateur ou commerçant)

**Body (Consumer):**
```json
{
  "email": "marie.kouame@email.com",
  "password": "password123",
  "first_name": "Marie",
  "last_name": "Kouamé",
  "phone": "0701234567",
  "role": "consumer",
  "city": "Abidjan",
  "address": "Cocody, Angré 8ème tranche"
}
```

**Body (Merchant):**
```json
{
  "email": "boulangerie.martin@email.com",
  "password": "password123",
  "first_name": "Pierre",
  "last_name": "Martin",
  "phone": "0701234567",
  "role": "merchant",
  "city": "Abidjan",
  "address": "Plateau, Avenue Chardy",
  "business_name": "Boulangerie Martin",
  "business_type": "Boulangerie",
  "siret": "CI001234567"
}
```

#### 🔑 POST `/auth/login`
Connexion utilisateur

**Body:**
```json
{
  "email": "marie.kouame@email.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "email": "marie.kouame@email.com",
      "first_name": "Marie",
      "last_name": "Kouamé",
      "role": "consumer",
      "city": "Abidjan"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### 👤 GET `/auth/me` *(Protected)*
Récupérer le profil de l'utilisateur connecté

#### 🚪 POST `/auth/logout` *(Protected)*
Déconnexion (invalide le token)

#### 🔄 POST `/auth/refresh` *(Protected)*
Renouveler le token JWT

---

### 2. **Products**

#### 📦 GET `/products`
Liste des produits disponibles (public)

**Query Parameters:**
- `category_id` - Filtrer par catégorie
- `merchant_id` - Filtrer par commerçant
- `city` - Filtrer par ville
- `min_price` / `max_price` - Fourchette de prix
- `search` - Recherche textuelle
- `expiring_soon` - Produits expirant bientôt (nombre de jours)
- `sort_by` - Tri (`created_at`, `price`, `expiration`)
- `sort_order` - Ordre (`asc`, `desc`)
- `per_page` - Pagination (max 50)

**Example:**
```
GET /products?city=Abidjan&category_id=2&sort_by=price&per_page=12
```

#### 🎯 GET `/products/{id}`
Détail d'un produit (public)

#### 📝 POST `/products` *(Protected - Merchant only)*
Ajouter un nouveau produit

**Body:**
```json
{
  "category_id": 2,
  "name": "Pain complet artisanal",
  "description": "Pain complet fait maison, cuit ce matin",
  "original_price": 500,
  "discounted_price": 250,
  "quantity_available": 10,
  "expiration_date": "2024-01-16",
  "image_url": "https://example.com/pain-complet.jpg"
}
```

#### ✏️ PUT `/products/{id}` *(Protected - Owner only)*
Modifier un produit

#### 🗑️ DELETE `/products/{id}` *(Protected - Owner/Admin only)*
Supprimer un produit

#### 📂 GET `/categories`
Liste des catégories disponibles

---

### 3. **Reservations**

#### 📋 GET `/reservations` *(Protected)*
Mes réservations (consumer)

**Query Parameters:**
- `status` - Filtrer par statut (`pending,confirmed,completed,cancelled`)
- `from_date` / `to_date` - Période
- `sort_by` / `sort_order` - Tri

#### ➕ POST `/reservations` *(Protected - Consumer only)*
Créer une réservation

**Body:**
```json
{
  "product_id": 1,
  "quantity": 2,
  "payment_method": "flooz",
  "customer_phone": "+22891000000",
  "notes": "Je passerai vers 18h"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Réservation créée avec succès",
  "data": {
    "id": 10,
    "reservation_code": "RES006",
    "quantity_reserved": 2,
    "total_amount": 500,
    "status": "pending",
    "payment_status": "pending",
    "expires_at": "2024-01-16T18:00:00.000000Z",
    "product_name": "Pain complet artisanal",
    "merchant_name": "Boulangerie Martin",
    "merchant_phone": "0123456790"
  },
  "payment": {
    "id": 35,
    "reservation_id": 10,
    "amount": 500,
    "currency": "XOF",
    "payment_method": "flooz",
    "status": "pending",
    "provider": "paygate",
    "checkout_url": "https://paygate.test/checkout/PG-123456",
    "customer_phone": "+22891000000",
    "reference": "PG-123456",
    "created_at": "2024-01-15T17:05:00.000000Z"
  }
}
```

#### 🎯 GET `/reservations/{id}` *(Protected)*
Détail d'une réservation

#### ❌ POST `/reservations/{id}/cancel` *(Protected)*
Annuler ma réservation

#### 🏪 GET `/reservations/merchant/list` *(Protected - Merchant only)*
Réservations reçues (pour les commerçants)

---

### 4. **Payments**

#### 💳 POST `/payments` *(Protected - Consumer only)*
Initialise un nouveau paiement pour une réservation existante.

**Body:**
```json
{
  "reservation_id": 10,
  "payment_method": "paystack",
  "customer_email": "marie.kouame@email.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Paiement initialisé avec succès.",
  "data": {
    "id": 42,
    "reservation_id": 10,
    "amount": 500,
    "currency": "XOF",
    "payment_method": "paystack",
    "status": "pending",
    "provider": "paystack",
    "checkout_url": "https://checkout.paystack.test/abc123",
    "reference": "PS-ABCD123"
  }
}
```

#### 🔍 GET `/payments/{id}` *(Protected)*
Rafraîchit le statut d'un paiement (appelle l'API du fournisseur si nécessaire).

#### 🛑 POST `/payments/{id}/cancel` *(Protected)*
Annule un paiement en attente. Pour les paiements Flooz/Tmoney, l'annulation est propagée à PayGate et la réservation repasse en statut `cancelled`.

#### 🔔 POST `/payments/webhook/paygate`
Point d'entrée pour les callbacks PayGate (Flooz / Tmoney).

#### 🔔 POST `/payments/webhook/paystack`
Point d'entrée pour les webhooks Paystack.

#### ✅ POST `/reservations/{id}/confirm` *(Protected - Merchant only)*
Confirmer une réservation

#### 🏁 POST `/reservations/{id}/complete` *(Protected - Merchant only)*
Marquer une réservation comme terminée

---

### 4. **Utility**

#### 💊 GET `/health`
Status de l'API

**Response:**
```json
{
  "success": true,
  "message": "API Antigaspi fonctionnelle",
  "timestamp": "2024-01-15T14:30:00.000000Z",
  "version": "1.0.0"
}
```

---

## 📊 Statuses des Réservations

| Status | Description |
|--------|-------------|
| `pending` | En attente de confirmation du commerçant |
| `confirmed` | Confirmée par le commerçant |
| `completed` | Récupérée et terminée |
| `cancelled` | Annulée |

---

## 🔑 Roles Utilisateurs

| Role | Permissions |
|------|-------------|
| `consumer` | Consulter produits, faire des réservations |
| `merchant` | Gérer ses produits, confirmer réservations |
| `admin` | Accès complet, gestion utilisateurs |

---

## 🚨 Codes d'Erreur

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Erreur de validation |
| `401` | Non authentifié |
| `403` | Accès refusé |
| `404` | Ressource non trouvée |
| `422` | Erreurs de validation |
| `500` | Erreur serveur |

---

## 🧪 Tests avec Postman/Insomnia

### Collection de tests recommandée :

1. **Register Consumer** → `POST /auth/register`
2. **Register Merchant** → `POST /auth/register`
3. **Login Consumer** → `POST /auth/login`
4. **Get Products** → `GET /products`
5. **Create Reservation** → `POST /reservations`
6. **Login Merchant** → `POST /auth/login`
7. **Confirm Reservation** → `POST /reservations/{id}/confirm`

### Variables d'environnement :
- `BASE_URL`: `http://localhost:8000/api`
- `TOKEN`: `{{token}}` (auto-défini après login)

---

## 🛠️ Configuration Locale

1. **Démarrer XAMPP** (Apache + MySQL)
2. **Importer la base de données** :
   ```sql
   SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_schema.sql;
   SOURCE C:/xampp/htdocs/antigaspi-2/database/sample_data.sql;
   ```
3. **Démarrer Laravel** :
   ```bash
   cd C:\xampp\htdocs\antigaspi-2\backend
   php artisan serve
   ```
4. **Tester l'API** → `GET http://localhost:8000/api/health`
### **Analytics**

#### 📊 POST `/analytics/events` *(Protégé)*
Envoie un lot d'événements analytiques collectés côté mobile.

**Headers requis :**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "events": [
    {
      "name": "Reservation Created",
      "category": "Commerce",
      "timestamp": 1736880000000,
      "sessionId": "1736880000000-abcd123",
      "properties": {
        "merchantId": 12,
        "quantity": 2,
        "totalAmount": 7500,
        "paymentMethod": "wallet"
      }
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "stored": 1
}
```

#### 📈 GET `/analytics/stats` *(Protégé)*
Retourne les statistiques agrégées (réservations, revenus, nouveaux utilisateurs, événements) sur la période demandée.

**Query Parameters :**
- `start_date` *(optionnel, ISO 8601)* — Date de début (par défaut: 7 derniers jours)
- `end_date` *(optionnel, ISO 8601)* — Date de fin (inclus)
- `merchant_id` *(optionnel)* — Filtre sur un commerçant spécifique

**Réponse :**
```json
{
  "success": true,
  "filters": {
    "start_date": "2025-01-10",
    "end_date": "2025-01-17",
    "merchant_id": null
  },
  "summary": {
    "total_reservations": 42,
    "total_revenue": 128500,
    "products_saved_from_waste": 96,
    "new_users": 5,
    "event_count": 238
  },
  "daily_breakdown": [
    {
      "date": "2025-01-16",
      "merchant_id": null,
      "total_reservations": 8,
      "total_revenue": 28500,
      "products_saved_from_waste": 14,
      "new_users": 1
    }
  ],
  "top_events": [
    { "name": "Reservation Created", "count": 42 },
    { "name": "Purchase", "count": 38 }
  ],
  "events_by_category": [
    { "category": "Commerce", "count": 80 },
    { "category": "Revenue", "count": 38 }
  ],
  "recent_events": [
    {
      "id": 153,
      "name": "Purchase",
      "category": "Revenue",
      "properties": {
        "amount": 7500,
        "currency": "XOF",
        "paymentMethod": "wallet"
      },
      "occurred_at": "2025-01-17T14:22:08+00:00"
    }
  ]
}
```
