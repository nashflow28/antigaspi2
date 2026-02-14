# Guide développeur Backend (Laravel)

## Stack & versions
- PHP ^8.2
- Laravel ^12
- MySQL 8
- JWT Auth (tymon/jwt-auth)
- Scout + Meilisearch (recherche)
- Web Push + Expo (notifications)

## Structure principale
- `backend/app/Http/Controllers/Api/` : contrôleurs API.
- `backend/app/Models/` : modèles Eloquent.
- `backend/app/Services/` : logique métier (paiements, wallet, OTP, livraison…).
- `backend/routes/api.php` : routes API (source de vérité).
- `backend/database/migrations/` : schéma base de données.

## Modules métier clés
- **Auth & sécurité** : login email (legacy) + phone/OTP/PIN + device sessions.
- **Produits & paniers surprise** : CRUD, inventaire, catégories.
- **Réservations & commandes** : workflow complet (pending → confirmé → terminé).
- **Paiements** : PayGate / CinetPay / Paystack / FedaPay + webhooks.
- **Wallet** : solde, transactions, recharge, limites quotidiennes, PIN.
- **Livraison** : zones, drivers, tracking, commissions.
- **Notifications** : push + broadcast + préférences.
- **Loyauté & récompenses** : points, tiers, redemptions.
- **Messagerie** : conversations et messages.
- **Analytics** : stats admin/merchant + events.

## Configuration (.env)
Clés essentielles :
- DB : `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- JWT : `JWT_SECRET`
- Paiements : `PAYGATE_*`, `PAYSTACK_*`, `FEDAPAY_*`, `CINETPAY_*`
- SMS : `SMS_TG_TOKEN`, `SMS_TG_SENDER`
- Push : `WEB_PUSH_*`, `EXPO_ACCESS_TOKEN`
- Broadcast : `BROADCAST_DRIVER`, `PUSHER_*`
- Search : `SCOUT_DRIVER`, `MEILISEARCH_HOST`

## Démarrage local
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```

## Commandes utiles
```bash
# Tests backend
php artisan test
php artisan test --coverage

# Lint
./vendor/bin/pint
```

## Points d’attention
- **Deux flux d’auth** coexistent (legacy + phone/device) → clarifier le flux cible.
- **Routes throttling** : `throttle:auth`, `throttle:write`, etc.
- **Migrations .disabled** : non appliquées automatiquement.
- **Paiements** : vérifier les secrets webhook et la configuration par provider.

## Où regarder en priorité
- `backend/routes/api.php`
- `backend/app/Services/Payments/`
- `backend/app/Services/WalletService.php`
- `backend/app/Services/DeliveryService.php`
- `backend/app/Services/OtpService.php`
