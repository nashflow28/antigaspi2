# Référence API (essentiel)

## Base URL
- Dev : `http://localhost:8000/api`
- Prod : selon configuration (ex: `https://antigaspi.jubtek.com/api` côté mobile)

## Authentification
- JWT Bearer dans l’en‑tête `Authorization: Bearer <token>`.
- Routes publiques et protégées selon `backend/routes/api.php`.

## Endpoints clés par domaine

### Auth (legacy + phone/device)
- `POST /auth/register` (legacy email)
- `POST /auth/login` (legacy email)
- `POST /auth/register-phone`
- `POST /auth/login-phone`
- `POST /auth/otp/send` / `verify` / `resend`
- `POST /auth/device/check-phone`
- `POST /auth/device/send-otp`
- `POST /auth/device/verify-otp`
- `POST /auth/device/login-pin`
- `POST /auth/device/set-pin`
- `POST /auth/device/change-pin`
- `GET /auth/me` (protégé)

### Produits & catégories
- `GET /products`
- `GET /products/{id}`
- `GET /products/merchant` (protégé)
- `POST /products` (protégé)
- `PUT /products/{id}` (protégé)
- `DELETE /products/{id}` (protégé)
- `POST /products/upload-image` (protégé)
- `GET /categories`
- `GET /categories/merchant` (protégé)

### Paniers surprise
- `GET /surprise-baskets`
- `GET /surprise-baskets/{id}`
- `GET /surprise-baskets/merchant/list` (protégé)
- `POST /surprise-baskets` (protégé)
- `PUT /surprise-baskets/{id}` (protégé)
- `POST /surprise-baskets/{basketId}/products` (protégé)

### Réservations & commandes
- `GET /reservations` (protégé)
- `GET /reservations/{id}` (protégé)
- `POST /reservations` (protégé)
- `PATCH /reservations/{id}` (update quantity)
- `POST /reservations/{id}/cancel`
- `POST /reservations/{id}/confirm`
- `POST /reservations/{id}/ready`
- `POST /reservations/{id}/complete`
- `GET /orders` / `POST /orders` / `GET /orders/{id}`

### Paiements
- `GET /payments` (protégé)
- `GET /payments/methods` (protégé)
- `POST /payments` (protégé)
- `POST /payments/mobile-money` (protégé)
- `GET /payments/{id}`
- `POST /payments/{id}/cancel`
- Webhooks : `/payments/webhook/paygate`, `/paystack`, `/fedapay`, `/cinetpay`

### Wallet
- `GET /wallet`
- `GET /wallet/transactions`
- `GET /wallet/stats`
- `POST /wallet/pin`
- `PUT /wallet/pin`
- `PUT /wallet/status`
- `PUT /wallet/daily-limit`
- `POST /wallet/recharge`
- `POST /wallet/transfer`
- `POST /wallet/payment`
- `POST /wallet/test-recharge` (dev only)

### Notifications
- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `POST /notifications/register`
- `POST /notifications/subscriptions`
- `DELETE /notifications/subscriptions`
- `PATCH /notifications/preferences`

### Reviews
- `GET /reviews`
- `GET /reviews/stats`
- `POST /reviews` (protégé)
- `PUT /reviews/{id}`
- `DELETE /reviews/{id}`
- `POST /reviews/{id}/report`

### Loyalty / Rewards
- `GET /loyalty/my-points`
- `POST /loyalty/redeem`
- `GET /loyalty/tier`
- `GET /rewards`
- `POST /rewards/{id}/redeem`

### Messaging
- `GET /messaging/conversations`
- `POST /messaging/conversations`
- `GET /messaging/conversations/{id}`
- `POST /messaging/conversations/{id}/messages`

### Delivery
- `GET /delivery-zones`
- `POST /deliveries/request/{reservation}`
- `GET /deliveries/{delivery}/track`
- `POST /driver/deliveries/{id}/accept`
- `POST /driver/deliveries/{id}/complete`

### Admin
- `GET /admin/dashboard`
- `GET /admin/analytics`
- `GET /admin/users`
- `GET /admin/merchants`
- `GET /admin/categories`
- `GET /admin/reviews`
- `GET /admin/payments`
- `GET /admin/settings`
- `GET /admin/audit`

## Format de réponse (standard)
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

## Source de vérité
- `backend/routes/api.php`
- `API_DOCUMENTATION.md` (peut être partiellement obsolète)
