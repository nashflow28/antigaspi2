# Plan d'Implémentation - Fonctionnalité Livraison Antigaspi

> **Objectif** : Permettre aux consommateurs de se faire livrer leurs commandes avec suivi en temps réel sur carte OpenStreetMap.

---

## Vue d'ensemble

```
┌──────────────┐     Commande      ┌──────────────┐    Assigne     ┌──────────────┐
│   Consumer   │ ────────────────► │   Merchant   │ ─────────────► │   Livreur    │
│     App      │                   │     App      │                │     App      │
└──────────────┘                   └──────────────┘                └──────────────┘
       │                                  │                               │
       │              GPS Tracking (WebSocket)                            │
       │◄─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        🗺️ Carte OpenStreetMap                           │
│   [🏪 Merchant]─────────────[🚴 Livreur]─────────────[📍 Consumer]       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 : Base de données (Backend)

### 1.1 Nouvelles tables

```sql
-- Table des livreurs
CREATE TABLE delivery_drivers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    vehicle_type ENUM('moto', 'velo', 'voiture', 'pied') DEFAULT 'moto',
    license_number VARCHAR(50) NULL,
    is_available BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    current_latitude DECIMAL(10, 8) NULL,
    current_longitude DECIMAL(11, 8) NULL,
    last_location_update TIMESTAMP NULL,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_deliveries INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des livraisons
CREATE TABLE deliveries (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT UNSIGNED NOT NULL,
    driver_id BIGINT UNSIGNED NULL,

    -- Statut de livraison
    status ENUM(
        'pending',           -- En attente d'un livreur
        'assigned',          -- Livreur assigné
        'picking_up',        -- Livreur en route vers merchant
        'picked_up',         -- Colis récupéré
        'delivering',        -- En cours de livraison
        'delivered',         -- Livré
        'cancelled',         -- Annulé
        'failed'             -- Échec de livraison
    ) DEFAULT 'pending',

    -- Adresse de livraison
    delivery_address TEXT NOT NULL,
    delivery_latitude DECIMAL(10, 8) NOT NULL,
    delivery_longitude DECIMAL(11, 8) NOT NULL,
    delivery_instructions TEXT NULL,

    -- Infos merchant (origine)
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,

    -- Tarification
    delivery_fee DECIMAL(10, 2) NOT NULL,
    driver_commission DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(5, 2) NULL,
    estimated_duration_min INT UNSIGNED NULL,

    -- Timestamps
    assigned_at TIMESTAMP NULL,
    picked_up_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,

    -- Notes
    cancellation_reason TEXT NULL,
    consumer_rating TINYINT UNSIGNED NULL,
    consumer_feedback TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE SET NULL
);

-- Historique des positions du livreur (pour tracking)
CREATE TABLE delivery_tracking (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    delivery_id BIGINT UNSIGNED NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2) NULL,
    heading DECIMAL(5, 2) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    INDEX idx_delivery_tracking (delivery_id, recorded_at)
);

-- Configuration des zones de livraison
CREATE TABLE delivery_zones (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    base_fee DECIMAL(10, 2) NOT NULL,
    price_per_km DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    polygon JSON NULL, -- GeoJSON pour définir la zone
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.2 Modifications tables existantes

```sql
-- Ajouter le rôle livreur aux users
ALTER TABLE users
MODIFY COLUMN role ENUM('consumer', 'merchant', 'admin', 'driver') DEFAULT 'consumer';

-- Ajouter option livraison aux reservations
ALTER TABLE reservations
ADD COLUMN delivery_type ENUM('pickup', 'delivery') DEFAULT 'pickup' AFTER status,
ADD COLUMN delivery_address TEXT NULL AFTER delivery_type,
ADD COLUMN delivery_latitude DECIMAL(10, 8) NULL,
ADD COLUMN delivery_longitude DECIMAL(11, 8) NULL,
ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0;
```

---

## Phase 2 : API Backend (Laravel)

### 2.1 Nouveaux Controllers

```
app/Http/Controllers/Api/
├── DeliveryController.php          # Gestion des livraisons (consumer/merchant)
├── DriverController.php            # Gestion du profil livreur
├── DriverDeliveryController.php    # Actions livreur sur livraisons
└── DeliveryTrackingController.php  # Tracking GPS temps réel
```

### 2.2 Endpoints API

#### Consumer Endpoints
```
POST   /api/reservations/{id}/request-delivery   # Demander livraison
GET    /api/deliveries/{id}/track                # Suivre livraison
POST   /api/deliveries/{id}/rate                 # Noter le livreur
GET    /api/delivery-zones                       # Zones disponibles
GET    /api/delivery/estimate                    # Estimer frais livraison
```

#### Driver Endpoints
```
GET    /api/driver/profile                       # Profil livreur
PUT    /api/driver/profile                       # Modifier profil
PUT    /api/driver/availability                  # Activer/désactiver dispo
POST   /api/driver/location                      # Mettre à jour position GPS

GET    /api/driver/deliveries                    # Livraisons disponibles
GET    /api/driver/deliveries/active             # Livraison en cours
POST   /api/driver/deliveries/{id}/accept        # Accepter livraison
POST   /api/driver/deliveries/{id}/reject        # Refuser livraison
POST   /api/driver/deliveries/{id}/pickup        # Marquer comme récupéré
POST   /api/driver/deliveries/{id}/complete      # Marquer comme livré
POST   /api/driver/deliveries/{id}/fail          # Signaler échec

GET    /api/driver/earnings                      # Gains du livreur
GET    /api/driver/stats                         # Statistiques
```

#### Merchant Endpoints
```
GET    /api/merchant/deliveries                  # Livraisons de mes commandes
POST   /api/merchant/deliveries/{id}/ready       # Commande prête pour livreur
```

### 2.3 WebSocket Events (Laravel Reverb ou Pusher)

```php
// Channels
'delivery.{deliveryId}'           // Updates pour une livraison spécifique
'driver.{driverId}'               // Notifications pour un livreur
'merchant.{merchantId}.deliveries' // Nouvelles livraisons pour merchant

// Events
DeliveryStatusUpdated::class      // Changement de statut
DriverLocationUpdated::class      // Position GPS du livreur
NewDeliveryAvailable::class       // Nouvelle livraison disponible
DeliveryAssigned::class           // Livraison assignée
```

### 2.4 Services

```
app/Services/
├── DeliveryService.php           # Logique métier livraison
├── DeliveryPricingService.php    # Calcul des frais
├── DriverMatchingService.php     # Assignation livreur optimal
├── RouteCalculationService.php   # Calcul distance/durée (OSRM)
└── DeliveryNotificationService.php # Notifications push
```

---

## Phase 3 : Application Mobile (React Native)

### 3.1 Structure des fichiers

```
mobile/src/
├── screens/
│   └── delivery/                          # NOUVEAU DOSSIER
│       ├── DriverDashboardScreen.tsx      # Dashboard principal
│       ├── AvailableDeliveriesScreen.tsx  # Livraisons disponibles
│       ├── ActiveDeliveryScreen.tsx       # Livraison en cours + carte
│       ├── DeliveryDetailsScreen.tsx      # Détails d'une livraison
│       ├── DeliveryHistoryScreen.tsx      # Historique
│       ├── DriverEarningsScreen.tsx       # Gains et stats
│       ├── DriverProfileScreen.tsx        # Profil livreur
│       └── DriverSettingsScreen.tsx       # Paramètres
│
├── navigation/
│   ├── DeliveryNavigator.tsx              # NOUVEAU
│   └── AppNavigator.tsx                   # Modifier pour ajouter rôle driver
│
├── store/slices/
│   └── deliverySlice.ts                   # NOUVEAU - État Redux
│
├── services/
│   ├── deliveryService.ts                 # NOUVEAU - API calls
│   ├── locationService.ts                 # NOUVEAU - GPS tracking
│   └── websocketService.ts                # NOUVEAU - Real-time updates
│
├── components/delivery/                   # NOUVEAU DOSSIER
│   ├── DeliveryCard.tsx                   # Carte de livraison
│   ├── DeliveryMap.tsx                    # Carte avec tracking
│   ├── DeliveryStatusBadge.tsx            # Badge statut
│   ├── RouteInfo.tsx                      # Info trajet
│   └── DriverAvailabilityToggle.tsx       # Toggle disponibilité
│
├── hooks/
│   ├── useDeliveryTracking.ts             # NOUVEAU - Hook tracking
│   └── useDriverLocation.ts               # NOUVEAU - Hook GPS livreur
│
└── types/
    └── delivery.ts                        # NOUVEAU - Types TypeScript
```

### 3.2 Navigation Livreur (DeliveryNavigator.tsx)

```typescript
// 4 onglets pour le livreur
const DeliveryNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DriverDashboardScreen}
        options={{ tabBarIcon: HomeIcon, title: 'Accueil' }}
      />
      <Tab.Screen
        name="Deliveries"
        component={AvailableDeliveriesScreen}
        options={{ tabBarIcon: PackageIcon, title: 'Livraisons' }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{ tabBarIcon: WalletIcon, title: 'Gains' }}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{ tabBarIcon: UserIcon, title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};
```

### 3.3 Écran de tracking (Consumer)

```typescript
// Ajout dans ConsumerNavigator - écran de suivi livraison
const DeliveryTrackingScreen = () => {
  const { deliveryId } = useRoute().params;
  const { delivery, driverLocation } = useDeliveryTracking(deliveryId);

  return (
    <View style={styles.container}>
      {/* Carte OpenStreetMap avec Leaflet */}
      <MapView
        provider="osm"
        initialRegion={...}
      >
        {/* Marqueur Merchant */}
        <Marker coordinate={delivery.pickupLocation} title="Merchant" />

        {/* Marqueur Livreur (temps réel) */}
        <Marker
          coordinate={driverLocation}
          title="Livreur"
          icon={MotorcycleIcon}
        />

        {/* Marqueur Destination */}
        <Marker coordinate={delivery.deliveryLocation} title="Vous" />

        {/* Ligne de route */}
        <Polyline coordinates={delivery.route} />
      </MapView>

      {/* Info livreur */}
      <DriverInfoCard driver={delivery.driver} />

      {/* ETA */}
      <EstimatedArrival eta={delivery.estimatedArrival} />

      {/* Actions */}
      <Button onPress={callDriver}>Appeler le livreur</Button>
    </View>
  );
};
```

### 3.4 Redux Slice (deliverySlice.ts)

```typescript
interface DeliveryState {
  // Pour le livreur
  isAvailable: boolean;
  currentLocation: Coordinates | null;
  activeDelivery: Delivery | null;
  availableDeliveries: Delivery[];
  deliveryHistory: Delivery[];
  earnings: {
    today: number;
    week: number;
    month: number;
  };

  // Pour le consumer
  trackingDelivery: Delivery | null;
  driverLocation: Coordinates | null;

  // État
  loading: boolean;
  error: string | null;
}

// Actions
export const {
  setAvailability,
  updateLocation,
  setActiveDelivery,
  updateDeliveryStatus,
  updateDriverLocation,
} = deliverySlice.actions;

// Thunks
export const fetchAvailableDeliveries = createAsyncThunk(...);
export const acceptDelivery = createAsyncThunk(...);
export const updateDeliveryStatus = createAsyncThunk(...);
export const trackDelivery = createAsyncThunk(...);
```

---

## Phase 4 : Tracking GPS Temps Réel

### 4.1 Service de localisation (Driver)

```typescript
// mobile/src/services/locationService.ts
import * as Location from 'expo-location';
import { socket } from './websocketService';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;

  async startTracking(deliveryId: string) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission GPS refusée');
    }

    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,    // Mise à jour tous les 10m
        timeInterval: 5000,      // Ou toutes les 5 secondes
      },
      (location) => {
        // Envoyer au serveur via WebSocket
        socket.emit('driver:location', {
          deliveryId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
          heading: location.coords.heading,
          timestamp: new Date().toISOString(),
        });

        // Aussi sauvegarder via API (backup)
        deliveryService.updateLocation(deliveryId, location.coords);
      }
    );
  }

  stopTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }
}

export const locationService = new LocationService();
```

### 4.2 WebSocket Service

```typescript
// mobile/src/services/websocketService.ts
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateDriverLocation, updateDeliveryStatus } from '../store/slices/deliverySlice';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    // Écouter les mises à jour de position du livreur (pour consumer)
    this.socket.on('driver:location:updated', (data) => {
      store.dispatch(updateDriverLocation(data));
    });

    // Écouter les changements de statut
    this.socket.on('delivery:status:updated', (data) => {
      store.dispatch(updateDeliveryStatus(data));
    });
  }

  subscribeToDelivery(deliveryId: string) {
    this.socket?.emit('subscribe:delivery', { deliveryId });
  }

  unsubscribeFromDelivery(deliveryId: string) {
    this.socket?.emit('unsubscribe:delivery', { deliveryId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const websocketService = new WebSocketService();
```

### 4.3 Backend WebSocket (Laravel avec Reverb)

```php
// app/Events/DriverLocationUpdated.php
class DriverLocationUpdated implements ShouldBroadcast
{
    public function __construct(
        public Delivery $delivery,
        public float $latitude,
        public float $longitude,
        public ?float $speed = null
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('delivery.' . $this->delivery->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'driver.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id' => $this->delivery->id,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'speed' => $this->speed,
            'timestamp' => now()->toISOString(),
        ];
    }
}
```

---

## Phase 5 : Calcul de route (OSRM)

### 5.1 Service de calcul de route

```php
// app/Services/RouteCalculationService.php
class RouteCalculationService
{
    private string $osrmUrl = 'https://router.project-osrm.org';

    public function calculateRoute(
        float $startLat,
        float $startLng,
        float $endLat,
        float $endLng
    ): array {
        $url = sprintf(
            '%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson',
            $this->osrmUrl,
            $startLng, $startLat,  // OSRM utilise lng,lat
            $endLng, $endLat
        );

        $response = Http::get($url);
        $data = $response->json();

        if ($data['code'] !== 'Ok') {
            throw new Exception('Impossible de calculer la route');
        }

        $route = $data['routes'][0];

        return [
            'distance_km' => round($route['distance'] / 1000, 2),
            'duration_min' => round($route['duration'] / 60),
            'geometry' => $route['geometry'],  // GeoJSON pour affichage
        ];
    }

    public function estimateDeliveryFee(float $distanceKm, int $zoneId): float
    {
        $zone = DeliveryZone::findOrFail($zoneId);

        return $zone->base_fee + ($distanceKm * $zone->price_per_km);
    }
}
```

---

## Phase 6 : Interface Utilisateur

### 6.1 Écrans Consumer (modifications)

```
Checkout Flow modifié:
┌─────────────────────────────────────┐
│  Mode de récupération               │
│                                     │
│  ○ Retrait sur place (gratuit)      │
│  ● Livraison (+750 XOF)             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📍 Adresse de livraison     │    │
│  │ Quartier Bè, Rue du Port    │    │
│  │ [Modifier]                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Frais de livraison: 750 XOF        │
│  Distance: 2.3 km                   │
│  Durée estimée: 15-20 min           │
│                                     │
│  [Confirmer la commande]            │
└─────────────────────────────────────┘
```

### 6.2 Écrans Driver (nouveaux)

```
Dashboard Livreur:
┌─────────────────────────────────────┐
│  Bonjour, Kofi! 🚴                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🟢 Disponible              │    │
│  │  [━━━━━━━━━━━○]             │    │
│  └─────────────────────────────┘    │
│                                     │
│  📊 Aujourd'hui                     │
│  ┌─────────┬─────────┬─────────┐   │
│  │ 5       │ 12.5km  │ 2,500   │   │
│  │ courses │ parcouru│ XOF     │   │
│  └─────────┴─────────┴─────────┘   │
│                                     │
│  🔔 Nouvelle livraison!             │
│  ┌─────────────────────────────┐    │
│  │ Boulangerie Martin → Bè     │    │
│  │ 1.8 km • 500 XOF commission │    │
│  │ [Voir] [Accepter]           │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘

Livraison Active:
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │      🗺️ CARTE GPS           │    │
│  │                             │    │
│  │   🏪────────🚴────────📍   │    │
│  │                             │    │
│  │  ETA: 8 min • 1.2 km        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Commande #AG-2025-0042             │
│  ────────────────────────           │
│  📦 2x Pain complet                 │
│  📦 1x Croissants                   │
│                                     │
│  Client: Jean D.                    │
│  📞 +228 90 XX XX XX                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [📞 Appeler] [💬 Message]   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🏪 Arrivé chez merchant]          │
│  [✅ Colis récupéré]                │
│  [📍 Arrivé destination]            │
│  [✅ Livraison terminée]            │
└─────────────────────────────────────┘
```

---

## Phase 7 : Tarification

### 7.1 Modèle de tarification suggéré (Lomé)

| Zone | Frais de base | Prix/km | Commission livreur |
|------|---------------|---------|-------------------|
| Centre-ville | 500 XOF | 150 XOF | 70% |
| Périphérie | 750 XOF | 200 XOF | 70% |
| Banlieue | 1000 XOF | 250 XOF | 70% |

### 7.2 Exemple de calcul

```
Distance: 3 km (Centre-ville)
Frais de base: 500 XOF
Distance: 3 km × 150 XOF = 450 XOF
Total: 950 XOF

Commission livreur (70%): 665 XOF
Commission Antigaspi (30%): 285 XOF
```

---

## Planning d'implémentation

### Sprint 1 (Semaine 1-2) : Foundation
- [ ] Créer migrations base de données
- [ ] Implémenter modèles Eloquent
- [ ] API endpoints basiques (CRUD)
- [ ] Ajouter rôle "driver" au système d'auth

### Sprint 2 (Semaine 3-4) : Backend avancé
- [ ] Service de calcul de route (OSRM)
- [ ] Service de tarification
- [ ] WebSocket avec Laravel Reverb
- [ ] Notifications push

### Sprint 3 (Semaine 5-6) : Mobile - Driver
- [ ] DeliveryNavigator + écrans
- [ ] Redux slice delivery
- [ ] Service GPS tracking
- [ ] Interface livreur complète

### Sprint 4 (Semaine 7-8) : Mobile - Consumer
- [ ] Option livraison dans checkout
- [ ] Écran de suivi avec carte
- [ ] Intégration WebSocket
- [ ] Tests et corrections

### Sprint 5 (Semaine 9-10) : Finalisation
- [ ] Tests end-to-end
- [ ] Optimisations performances
- [ ] Documentation
- [ ] Déploiement production

---

## Technologies utilisées

| Composant | Technologie |
|-----------|-------------|
| Backend API | Laravel 11 |
| WebSocket | Laravel Reverb (gratuit) |
| Base de données | MySQL 8 |
| Carte mobile | react-native-maps + OSM tiles |
| Carte web | Leaflet.js + OpenStreetMap |
| Calcul de route | OSRM (gratuit, self-hosted possible) |
| GPS tracking | expo-location |
| Push notifications | Firebase FCM (existant) |

---

## Estimation des coûts

| Service | Coût mensuel |
|---------|--------------|
| OpenStreetMap tiles | Gratuit |
| OSRM routing | Gratuit (public) ou ~$20/mois (self-hosted) |
| Laravel Reverb | Gratuit (self-hosted) |
| Serveur WebSocket | Inclus dans VPS actuel |
| **Total** | **~0-20$/mois** |

---

## Questions à clarifier

1. **Zone de couverture initiale** : Uniquement Lomé ou autres villes ?
2. **Recrutement livreurs** : Partenariat ou recrutement direct ?
3. **Paiement livreurs** : Quotidien, hebdomadaire, mensuel ?
4. **Assurance** : Couverture en cas d'accident ?
5. **Heures d'opération** : 24/7 ou horaires limités ?

---

*Document créé le 12 Janvier 2025*
*Antigaspi - Fonctionnalité Livraison v1.0*
