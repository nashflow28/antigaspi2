# Guide développeur Frontend Web (Vue 3)

## Stack & versions
- Vue 3.5 + Composition API
- Vite 7
- TypeScript 5.9
- Tailwind CSS 3.4
- Pinia 3
- Headless UI, Chart.js

## Structure principale (`frontend/src`)
- `components/` : UI, formulaires, modales, cartes, etc.
  - `components/ui/2025/` : Design System 2025 (référence).
- `views/` : pages (consumer, merchant, admin, driver, delivery…)
- `stores/` : Pinia stores (auth, cart, wallet, notifications…)
- `services/` : appels API, web socket, wallet, messaging…
- `router/` : routes et guards (rôles).

## Design System 2025
Le Web contient **deux systèmes UI** (legacy + DS2025). La migration est en cours.
- Référence : `components/ui/2025/*`
- Éviter les anciens composants `components/ui/*` quand possible.

## Routing & rôles
Routes principales par rôle :
- Consumer : `/dashboard`, `/products`, `/reservations`, `/wallet`, `/loyalty`, `/messaging`, `/deliveries/*`
- Merchant : `/merchant/*`
- Admin : `/admin/*`
- Driver : `/driver/*`

Les guards sont dans `frontend/src/router/index.ts` (auth + rôle).

## API
- Base URL : `VITE_API_BASE_URL` (par défaut `/api`).
- Service principal : `frontend/src/services/api.ts`.

## Commandes
```bash
cd frontend
npm install
npm run dev

# Qualité
npm run lint
npm run type-check
npm run test:unit
npm run test:e2e
```

## Points d’attention
- Migration DS2025 incomplète (cohabitation legacy/2025).
- Certains écrans peuvent manquer de cohérence UX avec le mobile.
- WebSocket service côté web n’est pas garanti tant que le backend broadcast n’est pas configuré.

## Fichiers utiles
- `frontend/src/App.vue`
- `frontend/src/router/index.ts`
- `frontend/src/stores/*`
- `frontend/src/components/ui/2025/index.ts`
