# Checklist d’onboarding (développeurs)

## Prérequis
- PHP 8.2+, Composer
- Node.js 18+ / npm
- MySQL 8 (XAMPP local)
- Expo CLI (mobile)

## 1) Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```
Vérifier : `GET http://localhost:8000/api/health`

## 2) Frontend Web
```bash
cd frontend
npm install
npm run dev
```
Vérifier : `http://localhost:5173`

## 3) Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```
Vérifier l’API dans `mobile/app.json` (`expo.extra.apiUrl`).

## 4) Comptes de test (exemples)
- admin@antigaspi.com / password
- boulangerie.martin@email.com / password
- jean.dupont@email.com / password

## 5) Tests (si requis)
```bash
# Backend
php artisan test
./vendor/bin/pint

# Web
npm run lint
npm run type-check
npm run test:e2e

# Mobile
npm test
npm run test:coverage
```

## 6) Vérifications rapides
- Auth (login + phone/OTP si activé)
- Réservation produit
- Paiement (sandbox)
- Wallet (recharge test)
- Notifications
