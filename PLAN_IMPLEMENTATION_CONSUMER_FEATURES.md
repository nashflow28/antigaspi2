# 📋 PLAN D'IMPLÉMENTATION - FONCTIONNALITÉS CONSOMMATEUR
## Mobile App Antigaspi - Phase Consumer Features

**Date**: 2025-10-16
**Workflow**: CLAUDE.md strict (Phase 1 → Phase 2 → Phase 3 → Phase 4)
**Estimation globale**: 25-35 jours (5-7 semaines pour 1 développeur)

---

## 🚨 DÉCOUVERTE CRITIQUE

### ❌ Backend Favoris **NON EXISTANT**
**Constat empirique**:
```bash
# Recherche dans routes/api.php
❌ Aucune route /api/favorites

# Recherche de controller
❌ Aucun FavoriteController.php

# Recherche de migration
❌ Aucune migration create_favorites_table
```

**Impact**: Le système de favoris nécessite **AUSSI** la création du backend complet, pas seulement le frontend mobile.

**Nouvelle estimation favoris**: 4-5 jours (au lieu de 2-3 jours)
- Backend: Migration + Model + Controller + Routes (2 jours)
- Frontend mobile: Redux + UI (2-3 jours)

---

## ✅ BACKEND DISPONIBLE - VÉRIFICATION EMPIRIQUE

### ✅ Reviews (Avis Consommateur)
```bash
✅ Routes: GET/POST /api/reviews
✅ Controller: ReviewController.php (complet)
✅ Migrations: create_reviews_table.php + add_approval_columns
✅ Model: Review.php avec relations
```

### ✅ Loyalty Points (Programme Fidélité)
```bash
✅ Routes: GET /api/loyalty/my-points, POST /api/loyalty/redeem
✅ Controller: LoyaltyPointController.php
✅ Endpoints disponibles pour consumer
```

### ⚠️ Payments (Paiements en Ligne)
```bash
⚠️ Backend Phase 8 disponible mais désactivé
⚠️ Tables payments/wallets existent mais tests failent
⚠️ Intégration Paystack/Mobile Money à finaliser
```

---

## 📊 PORTÉE RÉELLE PAR FONCTIONNALITÉ

### 🔴 PRIORITÉ 1: Système de Favoris (4-5 JOURS)

#### Backend (2 jours) ❌ À CRÉER
1. **Migration** (2h):
   ```php
   create_favorites_table:
   - id, user_id, product_id, created_at, updated_at
   - Index: unique(user_id, product_id)
   ```

2. **Model Favorite** (1h):
   ```php
   - Relations: belongsTo(User), belongsTo(Product)
   - Scope: byUser($userId)
   ```

3. **Controller FavoriteController** (4h):
   ```php
   - index(): Liste favoris user
   - store(): Ajouter favori
   - destroy($productId): Retirer favori
   - toggle($productId): Toggle favori
   ```

4. **Routes API** (30min):
   ```php
   GET    /api/favorites
   POST   /api/favorites
   DELETE /api/favorites/{productId}
   POST   /api/favorites/{productId}/toggle
   ```

5. **Tests Backend** (2h):
   - Feature test: CRUD favoris
   - Validation: duplicate prevention

#### Frontend Mobile (2-3 jours)
1. **Redux Slice** (`favoritesSlice.ts`) (3h):
   ```typescript
   - fetchFavorites(): AsyncThunk
   - addFavorite(productId): AsyncThunk
   - removeFavorite(productId): AsyncThunk
   - toggleFavorite(productId): AsyncThunk
   ```

2. **API Service** (`api.ts`) (1h):
   ```typescript
   - getFavorites()
   - addFavorite(productId)
   - removeFavorite(productId)
   - toggleFavorite(productId)
   ```

3. **Bouton Cœur - ProductCard** (2h):
   - Icon conditionnel: heart vs heart-outline
   - OnPress: dispatch toggleFavorite
   - Loading state pendant API call
   - Intégrer dans HomeScreen + ProductsScreen

4. **FavoritesScreen** (4h):
   - Liste FlatList de produits favoris
   - Empty state si aucun favori
   - Pull to refresh
   - Navigation vers ProductDetailsScreen

5. **Tests Mobile** (2h):
   - Jest: favoritesSlice tests
   - Integration: toggle favorite flow

**Total Favoris**: 4-5 jours

---

### 🔴 PRIORITÉ 2: Système d'Avis (3-4 JOURS)

#### Backend (✅ EXISTE DÉJÀ)
```bash
✅ ReviewController complet
✅ Routes GET/POST disponibles
✅ Validation et autorisations en place
```

#### Frontend Mobile (3-4 jours)
1. **Redux Slice** (`reviewsSlice.ts`) (2h):
   ```typescript
   - fetchProductReviews(productId): AsyncThunk
   - createReview(payload): AsyncThunk
   - fetchMyReviews(): AsyncThunk
   ```

2. **API Service** (1h):
   ```typescript
   - getProductReviews(productId, filters?)
   - createReview({ reservationId, rating, comment })
   - getMyReviews()
   ```

3. **Écran Liste Avis** (`ProductReviewsScreen.tsx`) (4h):
   - Affichage note moyenne + distribution
   - Liste des avis avec avatar, nom, note, commentaire
   - Pagination ou infinite scroll
   - Filtre par note (5⭐, 4⭐, etc.)

4. **Modal Création Avis** (`ReviewModal.tsx`) (3h):
   - Star rating component (1-5 étoiles)
   - TextArea commentaire
   - Validation formulaire
   - Submit vers API

5. **Intégration ProductDetailsScreen** (2h):
   - Afficher vraie note moyenne (remplacer mock 4.5-4.9)
   - Bouton "Voir tous les avis" → ProductReviewsScreen
   - Section "Avis clients" avec preview 3 premiers

6. **Intégration ReservationsScreen** (2h):
   - Bouton "Laisser un avis" si réservation completed
   - Ouvrir ReviewModal avec reservationId pré-rempli

7. **Tests Mobile** (2h):
   - Jest: reviewsSlice
   - Snapshot: ReviewModal, ProductReviewsScreen

**Total Avis**: 3-4 jours

---

### 🔴 PRIORITÉ 3: Choix Méthode Paiement (5-7 JOURS)

#### Backend Phase 8 (⚠️ PARTIELLEMENT DISPONIBLE)
- ✅ PaymentService existe
- ✅ Support Flooz, TMoney, Paystack
- ⚠️ Nécessite activation et configuration
- ⚠️ Tables payments/wallets avec tests failants

**Décision**: Implémenter côté mobile SANS activer Phase 8 backend (on_site + préparation pour Phase 8)

#### Frontend Mobile (3-4 jours)
1. **Payment Method Selector** (`PaymentMethodSelector.tsx`) (3h):
   ```typescript
   - Radio buttons: On Site / Mobile Money / Card
   - Si Mobile Money: sous-options Flooz/TMoney
   - Si Card: Paystack
   - Conditional rendering selon disponibilité
   ```

2. **Intégration ProductDetailsScreen** (2h):
   - Remplacer hardcode `paymentMethod: 'on_site'`
   - Afficher PaymentMethodSelector avant "Réserver"
   - State local: selectedPaymentMethod
   - Pass to createReservation payload

3. **Gestion Payment Flow** (4h):
   - Si 'on_site': Flow actuel (direct reservation)
   - Si 'mobile_money': Préparation pour Phase 8 (afficher "Bientôt disponible")
   - Si 'card': Préparation pour Phase 8 (afficher "Bientôt disponible")

4. **UI/UX Payment** (3h):
   - Icons pour chaque méthode
   - Labels clairs (français)
   - Disabled state pour méthodes non actives
   - Message informatif si Phase 8 pas activée

5. **Tests** (2h):
   - Jest: Payment selector component
   - Integration: Reservation avec différentes méthodes

**Total Paiement**: 3-4 jours (frontend uniquement, Phase 8 backend séparé)

---

### 🟠 PRIORITÉ 4: Géolocalisation (5-6 JOURS)

#### Frontend Mobile (5-6 jours)
1. **Setup Permissions** (2h):
   ```typescript
   - expo-location installation
   - Request location permission au démarrage
   - Handle permission denied gracefully
   ```

2. **Location Service** (`locationService.ts`) (3h):
   ```typescript
   - getCurrentPosition(): Promise<Coordinates>
   - calculateDistance(lat1, lon1, lat2, lon2): number
   - watchPosition(): subscription
   ```

3. **Filtre Distance - HomeScreen** (3h):
   - Rendre filtre distance fonctionnel
   - Options: < 5km, < 10km, < 20km, Tout
   - Filtrer products par merchant.latitude/longitude
   - Re-render liste après filtre

4. **Vue Carte - ProductsScreen** (8h):
   ```typescript
   - Installer react-native-maps
   - MapView avec user location marker
   - Markers pour chaque merchant
   - Custom marker avec logo/icon
   - OnMarkerPress: Afficher merchant info
   - Toggle Liste ↔ Carte
   ```

5. **Distance Badge - ProductCard** (2h):
   - Calculer distance user → merchant
   - Afficher badge "2.3 km" dans ProductCard
   - Sort produits par distance si filtre actif

6. **Bouton Itinéraire - MerchantDetailScreen** (2h):
   ```typescript
   - OnPress: Ouvrir GPS natif
   - iOS: Apple Maps (maps://)
   - Android: Google Maps (geo:)
   - Fallback: Browser avec Google Maps URL
   ```

7. **Tests** (2h):
   - Jest: locationService unit tests
   - Mock expo-location pour tests

**Total Géolocalisation**: 5-6 jours

---

### 🟠 PRIORITÉ 5: Notifications Consumer (3-4 JOURS)

#### Backend (✅ PARTIELLEMENT DISPONIBLE)
```bash
✅ Notification model + table existent
✅ NotificationController existe
⚠️ Push subscriptions table en Phase 8 (désactivée)
```

#### Frontend Mobile (3-4 jours)
1. **Notifications Screen** (`NotificationsScreen.tsx`) (4h):
   - Liste FlatList des notifications
   - Types: reservation_confirmed, reservation_ready, new_product, etc.
   - Mark as read
   - Pull to refresh
   - Empty state

2. **Redux Slice** (`notificationsSlice.ts`) (2h):
   ```typescript
   - fetchNotifications(): AsyncThunk
   - markAsRead(notificationId): AsyncThunk
   - getUnreadCount(): Selector
   ```

3. **Badge Compteur** (2h):
   - Badge sur tab "Compte" avec nombre non lus
   - Update en temps réel après fetch

4. **Préférences Notifications** (`NotificationPreferencesScreen.tsx`) (3h):
   - Toggles: Email, SMS, Push
   - Save vers backend (User model)
   - UI avec switches

5. **Push Notifications Setup** (4h):
   ```typescript
   - expo-notifications installation
   - Request push permission
   - Register device token
   - Handle notification received (foreground)
   - Handle notification tapped (background)
   ```

6. **Navigation depuis Notification** (2h):
   - Parse notification.data
   - Navigate vers ReservationDetailScreen si type=reservation
   - Navigate vers ProductDetailsScreen si type=new_product

7. **Tests** (2h):
   - Jest: notificationsSlice
   - Mock expo-notifications

**Total Notifications**: 3-4 jours

---

### 🟠 PRIORITÉ 6: Modification Profil Consumer (2-3 JOURS)

#### Backend (✅ EXISTE DÉJÀ)
```bash
✅ User model avec fillable fields
✅ ProfileController (partiellement - merchant focus)
✅ Routes PUT /api/profile disponibles
```

#### Frontend Mobile (2-3 jours)
1. **Profile Edit Screen** (`ProfileEditScreen.tsx`) (4h):
   - Form fields: first_name, last_name, email, phone, city, address
   - Validation inline
   - Save button
   - Loading state

2. **Avatar Upload** (3h):
   ```typescript
   - expo-image-picker
   - Choose from gallery ou take photo
   - Crop/resize image
   - Upload vers backend (multipart/form-data)
   - Display preview
   ```

3. **Change Password Modal** (`ChangePasswordModal.tsx`) (2h):
   - Fields: current_password, new_password, confirm_password
   - Validation: min 8 chars, match confirm
   - API call POST /api/profile/change-password

4. **Redux Integration** (2h):
   ```typescript
   - updateProfile(payload): AsyncThunk
   - uploadAvatar(file): AsyncThunk
   - Update authSlice.user après save
   ```

5. **Tests** (2h):
   - Jest: Profile edit validation
   - Integration: Save profile flow

**Total Profil**: 2-3 jours

---

### 🟡 PRIORITÉ 7: Pagination Infinie (1-2 JOURS)

#### Frontend Mobile (1-2 jours)
1. **HomeScreen Pagination** (3h):
   ```typescript
   - Remplacer fetchProducts({ per_page: 100 })
   - Par fetchProducts({ page: 1, per_page: 12 })
   - FlatList: onEndReached={loadMore}
   - Track currentPage, hasMore in state
   - Show loading spinner at bottom
   ```

2. **ProductsScreen Pagination** (2h):
   - Même logique pour liste marchands
   - FlatList onEndReached

3. **Redux Slice Update** (2h):
   ```typescript
   // productsSlice.ts
   - loadMoreProducts(): AsyncThunk
   - Append new products to state.products
   - Track pagination metadata
   ```

4. **Tests** (1h):
   - Jest: Pagination logic

**Total Pagination**: 1-2 jours

---

### 🟡 PRIORITÉ 8: Paniers Surprise (2-3 JOURS)

#### Backend (⚠️ PHASE 8 DÉSACTIVÉE)
```bash
⚠️ Table surprise_basket_items désactivée
⚠️ Migration disabled
⚠️ Needs Phase 8 activation
```

**Décision**: Reporter après activation Phase 8 backend

**Alternative**: Afficher message "Bientôt disponible" dans UI

**Total Paniers Surprise**: 0 jours (reporté Phase 8)

---

### 🟡 PRIORITÉ 9: Sélecteur Quantité (1 JOUR)

#### Frontend Mobile (1 jour)
1. **Quantity Selector Component** (`QuantitySelector.tsx`) (2h):
   ```typescript
   - Buttons: - / +
   - Display current quantity
   - Min: 1, Max: product.quantity_available
   - OnChange callback
   ```

2. **Intégration ProductDetailsScreen** (2h):
   - Replace hardcode quantity: 1
   - State: selectedQuantity
   - Update total_amount display
   - Pass to createReservation

3. **Tests** (1h):
   - Jest: QuantitySelector component

**Total Sélecteur Quantité**: 1 jour

---

## 📊 ESTIMATION GLOBALE RÉVISÉE

| Priorité | Fonctionnalité | Backend | Frontend | Total |
|----------|----------------|---------|----------|-------|
| 🔴 P1 | Favoris | 2j ❌ | 2-3j | **4-5j** |
| 🔴 P2 | Avis | 0j ✅ | 3-4j | **3-4j** |
| 🔴 P3 | Paiement | 0j ⚠️ | 3-4j | **3-4j** |
| 🟠 P4 | Géolocalisation | 0j | 5-6j | **5-6j** |
| 🟠 P5 | Notifications | 0j ✅ | 3-4j | **3-4j** |
| 🟠 P6 | Profil | 0j ✅ | 2-3j | **2-3j** |
| 🟡 P7 | Pagination | 0j | 1-2j | **1-2j** |
| 🟡 P8 | Paniers Surprise | - | - | **0j** (Phase 8) |
| 🟡 P9 | Quantité | 0j | 1j | **1j** |

**TOTAL ESTIMÉ: 22-33 JOURS** (4.5-6.5 semaines pour 1 dev)

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### **Sprint 1 (2 semaines)** - Fonctionnalités Critiques
**Objectif**: Implémenter P1, P2, P3

1. **Semaine 1**:
   - Jour 1-2: Backend Favoris (migration, model, controller, tests)
   - Jour 3-5: Frontend Favoris (Redux, UI, intégration)

2. **Semaine 2**:
   - Jour 1-3: Système Avis (Redux, screens, intégration)
   - Jour 4-5: Choix Paiement (selector, intégration)

**Livrable Sprint 1**:
- ✅ Favoris fonctionnels
- ✅ Avis réels (plus de mock data)
- ✅ Sélecteur paiement (préparation Phase 8)

---

### **Sprint 2 (2 semaines)** - Améliorations UX
**Objectif**: Implémenter P4, P5, P6

1. **Semaine 3**:
   - Jour 1-3: Géolocalisation (permissions, filtre distance)
   - Jour 4-5: Vue Carte + markers

2. **Semaine 4**:
   - Jour 1-2: Notifications (screen, Redux, badge)
   - Jour 3-4: Profil Consumer (edit, avatar, password)
   - Jour 5: Tests et polish

**Livrable Sprint 2**:
- ✅ Géolocalisation fonctionnelle
- ✅ Notifications push
- ✅ Profil éditable

---

### **Sprint 3 (1 semaine)** - Polish & Nice to Have
**Objectif**: P7, P9, corrections bugs

1. **Semaine 5**:
   - Jour 1-2: Pagination infinie
   - Jour 3: Sélecteur quantité
   - Jour 4-5: Tests E2E, corrections bugs, documentation

**Livrable Sprint 3**:
- ✅ Pagination optimisée
- ✅ Sélecteur quantité
- ✅ Application polishée et testée

---

## ⚠️ RISQUES & DÉPENDANCES

### Risques Identifiés
1. **Phase 8 Backend**: Paiements et wallets nécessitent activation Phase 8
2. **Permissions Mobile**: Géolocalisation et push peuvent être refusées
3. **API Rate Limiting**: Pagination/géoloc peuvent générer beaucoup de requêtes
4. **Tests E2E Mobile**: Nécessite setup Detox ou Maestro (non fait)

### Dépendances Externes
1. **expo-location**: Géolocalisation
2. **expo-notifications**: Push notifications
3. **expo-image-picker**: Upload avatar
4. **react-native-maps**: Vue carte marchands
5. **Paystack SDK**: Intégration paiements (Phase 8)

---

## 🔍 VALIDATION REQUISE

Avant de commencer l'implémentation, je recommande:

1. **Priorisation User**: Confirmer l'ordre des priorités avec le client
2. **Budget Temps**: 22-33 jours = 4.5-6.5 semaines à temps plein
3. **Phase 8 Activation**: Décider si on active Phase 8 backend maintenant ou plus tard
4. **Tests E2E**: Définir stratégie de tests mobile (Detox, Maestro, ou manuel)

---

**🤖 Plan créé par**: Claude Code
**📅 Date**: 2025-10-16
**⏱️ Temps de planification**: Phase 1 complétée
**📝 Prochaine étape**: Validation par agents spécialisés (Phase 2)
