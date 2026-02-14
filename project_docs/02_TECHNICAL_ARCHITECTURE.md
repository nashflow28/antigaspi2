# Architecture technique globale

## Vue d’ensemble
Le projet est un monorepo organisé en trois applications principales :
- **Backend** : API REST Laravel (PHP 8.2+, Laravel ^12).
- **Frontend Web** : Vue 3 + Vite + TypeScript + Tailwind.
- **Mobile** : Expo / React Native + Redux Toolkit.

## Schéma d’architecture (système)
```mermaid
flowchart LR
  subgraph Clients
    Web[Frontend Web
Vue 3 + Vite]
    Mobile[App Mobile
Expo / React Native]
  end

  subgraph Backend
    API[API Laravel
JWT + Services]
    Queue[Jobs/Queue]
  end

  DB[(MySQL 8)]
  Search[(Meilisearch)]
  Storage[(Storage fichiers)]
  Push[Notifications
Expo + WebPush]
  SMS[SMS.TG (OTP)]
  Payments[PayGate / CinetPay / Paystack / FedaPay]
  Realtime[Pusher / Broadcast]
  Geo[Geocoding]

  Web -->|HTTPS JSON| API
  Mobile -->|HTTPS JSON| API

  API --> DB
  API --> Search
  API --> Storage
  API --> Push
  API --> SMS
  API --> Payments
  API --> Realtime
  API --> Geo
  Queue --> DB
```

## Flux métier principaux

### Réservation + paiement
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant W as Web/Mobile
  participant API as API Laravel
  participant P as Prestataire paiement
  participant DB as MySQL

  U->>W: Choisit un produit
  W->>API: POST /reservations
  API->>DB: Crée réservation + paiement (pending)
  API-->>W: Données réservation + paiement
  W->>P: Finalise paiement (checkout_url)
  P-->>API: Webhook de statut
  API->>DB: Met à jour paiement + réservation
  API-->>W: Statut final + notifications
```

### Authentification téléphone / OTP / PIN
```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant C as Client (Web/Mobile)
  participant API as API Laravel
  participant SMS as SMS.TG

  U->>C: Saisie téléphone
  C->>API: POST /auth/device/check-phone
  API-->>C: Doit envoyer OTP ?
  C->>API: POST /auth/device/send-otp
  API->>SMS: Envoi code OTP
  SMS-->>U: Code OTP
  U->>C: Saisie OTP
  C->>API: POST /auth/device/verify-otp
  API-->>C: Token + infos utilisateur
  C->>API: POST /auth/device/set-pin (optionnel)
```

### Livraison (côté consommateur et livreur)
```mermaid
sequenceDiagram
  participant C as Consommateur
  participant API as API
  participant D as Livreur
  participant DB as MySQL

  C->>API: POST /deliveries/request/{reservation}
  API->>DB: Crée livraison (pending/searching)
  API-->>D: Offre de livraison (broadcast)
  D->>API: POST /driver/deliveries/{id}/accept
  API->>DB: Assigne livreur, statut assigned
  D->>API: POST /driver/deliveries/{id}/start-pickup
  D->>API: POST /driver/deliveries/{id}/complete
  API->>DB: Statut delivered + gains
  API-->>C: Notification livraison terminée
```

## Communication & données
- **HTTP JSON** : clients → API.
- **JWT** : authentification côté API.
- **Broadcast/Pusher** : notifications temps réel (si activé).
- **WebPush / Expo** : notifications push web/mobile.
- **Meilisearch** : recherche full‑text.

## Points de vigilance d’architecture
- Coexistence de deux flux d’auth (legacy email + nouveau phone/device).
- Certaines migrations sont en `.disabled` (non appliquées en prod).
- Services externes multiples pour paiements → besoin d’une config propre par environnement.
