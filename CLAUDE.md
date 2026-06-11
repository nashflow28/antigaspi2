# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**GÊLADAL** - Ton Panier N'attend Que Toi ! Anti-food-waste platform for West Africa (Togo) enabling merchants to sell unsold products at reduced prices.

## Tech Stack

- **Backend:** Laravel 12 (PHP 8.2+) + JWT multi-role auth (Consumer/Merchant/Admin/Driver)
- **Frontend:** Vue 3 + Vite + TailwindCSS + Pinia + TypeScript
- **Mobile:** React Native 0.81 + Expo SDK 54 (React 19) + Redux Toolkit
- **Database:** MySQL 8 (10 tables)
- **Push Notifications:** Firebase FCM (project: `geladal`)
- **Mobile Build:** EAS Build (Android APK) — package `com.geladal.app`
- **Payments:** Paystack, FedaPay, CinetPay, Mobile Money (in progress)

## Project Structure

```
antigaspi2/
├── backend/           # Laravel API (deployed at antigaspi.jubtek.com)
│   ├── app/Http/Controllers/Api/   # 33 controllers
│   ├── app/Models/                 # 31 models
│   └── routes/api.php              # 193+ routes
├── frontend/          # Vue 3 web app
│   ├── src/views/                  # 74 views (consumer/merchant/admin/driver)
│   ├── src/components/ui/2025/     # DS2025 components (37 components)
│   └── src/stores/                 # 15 Pinia stores
├── mobile/            # React Native + Expo
│   ├── src/screens/                # 80+ screens (role-based)
│   ├── src/store/slices/           # 14 Redux slices
│   ├── src/services/api.ts         # API service layer
│   └── src/theme/                  # Design System 2025
├── database/          # MySQL scripts + docs
├── tests/             # E2E Playwright tests
└── docs/              # Documentation
```

## Development Commands

### Backend (backend/)
```bash
composer install
php artisan migrate
php artisan db:seed
php artisan serve              # Local dev server
php artisan test               # Run tests
php artisan test --coverage    # With coverage
./vendor/bin/pint              # Lint (Laravel Pint)
php artisan config:cache && php artisan route:cache  # Cache for prod
```

### Frontend (frontend/)
```bash
npm install
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint + TypeScript
npm run test:e2e # E2E Playwright
```

### Mobile (mobile/)
```bash
npm install
npx expo start                                          # Dev (Expo Go)
eas build --platform android --profile preview          # APK for testing
eas build --platform android --profile development      # APK with dev client
eas build:list --limit 5                                # Check build status
npx tsc --noEmit                                        # TypeScript check
```

> **🚨 ALWAYS ASK FOR CONFIRMATION before running `eas build`.**

## Architecture

### Backend Patterns
- **Controllers:** REST API in `app/Http/Controllers/Api/`
- **Models:** Eloquent with `$fillable` (never use `$guarded`)
- **Services:** Business logic in `app/Services/`
- **Middleware:** `jwt.auth`, `can:admin`, `throttle:*`
- **Error handling:** Use `ErrorHelper::safeMessage($e)` — never expose `$e->getMessage()` in prod

### Frontend Patterns
- **State:** Pinia stores in `src/stores/`
- **API:** Services in `src/services/` (api.ts primary, + 16 specialized services)
- **DS2025:** Import from `@/components/ui/2025/`
- **Theme:** CSS custom properties, dark mode via `dark:` Tailwind classes

### Mobile Patterns
- **State:** Redux Toolkit with async thunks (never direct API calls in screens)
- **Theme:** `const theme = useTheme()` from `../theme` — always use DS2025
- **Haptics:** `const haptics = useHaptics()` for tactile feedback
- **Navigation:** Role-based (Consumer 5 tabs, Merchant 5 tabs, Admin 5 tabs, Driver 5 tabs)

### Key Domain Models

| Model | Key Relationships |
|-------|-----------------|
| User | hasMany(Reservation, Favorite, LoyaltyPoint); hasOne(Merchant, Wallet, Cart) |
| Product | belongsTo(Merchant, Category); hasMany(Reservation, Review) |
| Reservation | belongsTo(User, Product); hasMany(Payment) |
| Merchant | belongsTo(User); hasMany(Product, Review) |
| Wallet | belongsTo(User); hasMany(WalletTransaction) |

### Reservation States
`pending` → `confirmed` → `ready` → `completed` (or `cancelled`/`rejected`)

### Loyalty Tiers
Bronze → Silver → Gold → Platinum (based on points)

## Mobile Design System 2025

```typescript
import { useTheme } from '../theme'
const theme = useTheme()
// theme.colors.primary[500] (#10B981 green)
// theme.colors.secondary (#F59E0B orange)
// theme.isDark → boolean
// theme.colors.text, textSecondary, textTertiary
// theme.colors.surface.light / neutral[800] (dark cards)
```

```typescript
import { useHaptics } from '../hooks/useHaptics'
const haptics = useHaptics()
await haptics.lightTap()   // Tab navigation
await haptics.mediumTap()  // Action buttons
await haptics.success()    // Confirmations
await haptics.error()      // Errors
```

## API Endpoints Summary

```
# Auth
POST /api/auth/register|login|logout|refresh
POST /api/auth/register-phone|login-phone
POST /api/auth/device/set-pin|change-pin

# Core
GET|POST        /api/products
GET|POST|PATCH  /api/reservations
GET|POST|DELETE /api/cart|cart/items
POST            /api/cart/checkout
GET|POST        /api/favorites/{id}/toggle

# Features
GET  /api/wallet|wallet/transactions|wallet/stats
POST /api/wallet/recharge|wallet/pin|wallet/transfer
GET  /api/loyalty/my-points
POST /api/loyalty/redeem
GET  /api/surprise-baskets

# Admin
GET  /api/admin/dashboard|analytics|audit
POST /api/admin/users/{id}/suspend
POST /api/admin/merchants/{id}/approve|reject
```

## Language

Interface in **French**. Currency: **XOF (FCFA)**.

## Production Server

**IMPORTANT:** Read `DEPLOY.local.md` (gitignored) for all server details: SSH access, database credentials, deployment steps, and test accounts.
Do NOT commit server IPs, passwords, or connection strings to tracked files.

---

## Claude Code Workflow Rules

### Mandatory Workflow
1. Use Plan Mode for complex tasks
2. Check TODO list before declaring "done"
3. Test each implemented feature
4. **Always re-read all modified files** to ensure no update was missed and no dead code remains
5. **Always run the full test suite** (backend + frontend) after changes and fix any failures immediately
6. **Check lint and build** (TypeScript, ESLint, frontend compilation) to detect regressions
7. **Declare task "done" only after** Phase 2 (code-reviewer) + Phase 3 (test-guardian) + Phase 4 (reality-checker) validation
8. **🚨 Always ask confirmation before `eas build`**
9. **🧹 Fix ESLint warnings opportunistically** when modifying a file (unused imports, `catch (error)` → `catch`, etc.)

### Anti-Bias Safeguards
❌ Never create/modify audit tools to validate your own work
❌ Never ignore official reports in favor of personal metrics
❌ Never declare "done" without independent external validation
✅ Always use OFFICIAL tools (`audit-legacy-exact.js`, `phase3-validation-report.json`)
✅ Always read existing reports BEFORE making your own measurements
✅ Declare FAILURE if discordance between official and personal metrics

### Validation Phases
- **Phase 1:** Implementation (main agent)
- **Phase 2:** Specialized review → `code-reviewer` agent
- **Phase 3:** Independent validation → `test-guardian` agent (run all automated tests)
- **Phase 4:** Empirical control → `reality-checker` agent (mandatory for any success claim or score >70/100)

### Reality-Checker Triggers (automatic activation)
- Claims of "migration complete" or "done"
- Announced scores >70/100
- "Production-ready" declarations
- Performance or test coverage metrics
- Creation/modification of audit tools
- Ignoring official reports

### Test Commands
```bash
git diff --name-only HEAD           # Files modified
php artisan test                    # Backend tests
php artisan test --coverage         # Backend coverage
npm run test:e2e                    # Frontend E2E
npm run lint                        # Frontend lint
npm run build                       # Frontend build
./vendor/bin/pint                   # Backend lint
cd frontend && node audit-legacy-exact.js   # Legacy audit (Phase 3)
npx tsc --noEmit                    # Mobile TypeScript
```

### Official Reference Metrics
- **Phase 3 Score:** 99/100 (`frontend/phase3-validation-report.json`, généré le 2026-01-28)
- **Legacy usages:** 2 imports legacy intentionnels (Toast, NotificationSystem) — migration DS2025 terminée

> The official report (`frontend/phase3-validation-report.json`, regenerated by `audit-legacy-exact.js`) is the single source of truth. Any self-measured score that contradicts it must be considered SUSPECT and invalidated.
