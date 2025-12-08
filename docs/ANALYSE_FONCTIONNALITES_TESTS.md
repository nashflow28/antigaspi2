# 📱 ANALYSE COMPLÈTE - APPLICATION MOBILE ANTIGASPI

## Full Stack (Mobile + Backend + Base de données)
### Plan de Tests Manuels APK - Production (antigaspi.jubtek.com)

**Date de création:** 3 décembre 2025
**Dernière mise à jour:** 7 décembre 2025
**Version:** 1.1

---

## 📊 RÉSUMÉ EXÉCUTIF

| Métrique | Valeur |
|----------|--------|
| **Fonctionnalités testables** | 89 |
| **Tests manuels définis** | 32 |
| **Screens Mobile** | 42 |
| **Endpoints API** | 70+ |

---

## 🔵 FONCTIONNALITÉS CONSUMER (Consommateur)

### 1. AUTHENTIFICATION
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-AUTH-01 | Inscription | RegisterScreen | `POST /auth/register` |
| C-AUTH-02 | Connexion | LoginScreen | `POST /auth/login` |
| C-AUTH-03 | Déconnexion | ProfileScreen | `POST /auth/logout` |
| C-AUTH-04 | Récupérer profil | Auto (Redux) | `GET /auth/me` |
| C-AUTH-05 | Refresh token | Auto (Axios) | `POST /auth/refresh` |

### 2. CATALOGUE PRODUITS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-PROD-01 | Liste produits | ProductsScreen | `GET /products` |
| C-PROD-02 | Détail produit | ProductDetailsScreen | `GET /products/{id}` |
| C-PROD-03 | Filtrer par catégorie | ProductsScreen | `GET /products?category_id=X` |
| C-PROD-04 | Filtrer par prix max | ProductsScreen | `GET /products?max_price=X` |
| C-PROD-05 | Recherche texte | ProductsScreen | `GET /products?search=X` |
| C-PROD-06 | Filtrer par rayon GPS | ProductsScreen | `GET /products?radius=X` |
| C-PROD-07 | Pagination infinie | ProductsScreen | `GET /products?page=X` |
| C-PROD-08 | Liste catégories | ProductsScreen | `GET /categories` |

### 3. PANIERS SURPRISE
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-SURP-01 | Liste paniers surprise | HomeScreen (section) | `GET /surprise-baskets` |
| C-SURP-02 | Détail panier surprise | ProductDetailsScreen | `GET /surprise-baskets/{id}` |

### 4. RÉSERVATIONS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-RES-01 | Créer réservation | ProductDetailsScreen | `POST /reservations` |
| C-RES-02 | Mes réservations | ReservationsScreen | `GET /reservations` |
| C-RES-03 | Détail réservation | ReservationDetailsScreen | `GET /reservations/{id}` |
| C-RES-04 | Annuler réservation | ReservationDetailsScreen | `POST /reservations/{id}/cancel` |
| C-RES-05 | Filtrer par statut | ReservationsScreen | `GET /reservations?status=X` |

### 5. FAVORIS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-FAV-01 | Liste favoris | FavoritesScreen | `GET /favorites` |
| C-FAV-02 | Toggle favori | ProductDetailsScreen | `POST /favorites/{id}/toggle` |
| C-FAV-03 | Vérifier si favori | ProductDetailsScreen | `GET /favorites/check/{id}` |

### 6. AVIS & REVIEWS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-REV-01 | Voir avis produit | ReviewsListScreen | `GET /reviews?productId=X` |
| C-REV-02 | Voir avis commerçant | MerchantDetailScreen | `GET /reviews?merchantId=X` |
| C-REV-03 | Statistiques avis | ProductDetailsScreen | `GET /reviews/stats` |
| C-REV-04 | Créer avis | AddReviewScreen | `POST /reviews` |
| C-REV-05 | Modifier mon avis | AddReviewScreen | `PUT /reviews/{id}` |
| C-REV-06 | Supprimer mon avis | ReviewsListScreen | `DELETE /reviews/{id}` |

### 7. PROFIL UTILISATEUR
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-PROF-01 | Voir profil | ProfileScreen | `GET /auth/me` |
| C-PROF-02 | Modifier profil | ProfileEditScreen | `PUT /consumers/profile` |
| C-PROF-03 | Upload photo | ProfileEditScreen | `POST /consumers/profile/photo` |

### 8. COMMERÇANTS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-MERCH-01 | Détail commerçant | MerchantDetailScreen | `GET /merchants/{id}` |
| C-MERCH-02 | Commerçants à proximité | HomeScreen | `GET /merchants/nearby` |

### 9. MESSAGERIE
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| C-MSG-01 | Liste conversations | MerchantMessagingScreen | `GET /messaging/conversations` |
| C-MSG-02 | Créer conversation | MerchantDetailScreen | `POST /messaging/conversations` |
| C-MSG-03 | Voir conversation | MerchantMessagingScreen | `GET /messaging/conversations/{id}` |
| C-MSG-04 | Envoyer message | MerchantMessagingScreen | `POST /messaging/conversations/{id}/messages` |

---

## 🟠 FONCTIONNALITÉS MERCHANT (Commerçant)

### 1. DASHBOARD & ANALYTICS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-DASH-01 | Dashboard principal | MerchantDashboardScreen | `GET /analytics/merchant-stats` |
| M-DASH-02 | Graphique revenus | MerchantAnalyticsScreen | `GET /analytics/merchant-revenue-chart` |
| M-DASH-03 | Top produits | MerchantAnalyticsScreen | `GET /analytics/merchant-products-chart` |

### 2. GESTION PRODUITS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-PROD-01 | Liste mes produits | MerchantProductsScreen | `GET /products/merchant` |
| M-PROD-02 | Créer produit | ProductFormScreen | `POST /products` |
| M-PROD-03 | Modifier produit | ProductFormScreen | `PUT /products/{id}` |
| M-PROD-04 | Supprimer produit | MerchantProductsScreen | `DELETE /products/{id}` |
| M-PROD-05 | Upload image produit | ProductFormScreen | `POST /products/upload-image` |

### 3. PANIERS SURPRISE (MERCHANT)
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-SURP-01 | Mes paniers surprise | MerchantSurpriseBasketsScreen | `GET /surprise-baskets/merchant/list` |
| M-SURP-02 | Créer panier surprise | MerchantSurpriseBasketsScreen | `POST /surprise-baskets` |
| M-SURP-03 | Modifier panier | MerchantSurpriseBasketsScreen | `PUT /surprise-baskets/{id}` |
| M-SURP-04 | Supprimer panier | MerchantSurpriseBasketsScreen | `DELETE /surprise-baskets/{id}` |

### 4. GESTION RÉSERVATIONS (MERCHANT)
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-RES-01 | Réservations reçues | MerchantReservationsScreen | `GET /reservations/merchant/list` |
| M-RES-02 | Confirmer réservation | MerchantReservationsScreen | `POST /reservations/{id}/confirm` |
| M-RES-03 | Marquer prêt | MerchantReservationsScreen | `POST /reservations/{id}/ready` |
| M-RES-04 | Marquer terminée | MerchantReservationsScreen | `POST /reservations/{id}/complete` |
| M-RES-05 | Annuler réservation | MerchantReservationsScreen | `POST /reservations/{id}/cancel` |

### 5. AVIS REÇUS (MERCHANT)
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-REV-01 | Dashboard avis | MerchantReviewsScreen | `GET /merchants/reviews/dashboard` |
| M-REV-02 | Liste avis reçus | MerchantReviewsScreen | `GET /merchants/reviews/list` |
| M-REV-03 | Répondre à un avis | MerchantReviewsScreen | `POST /merchants/reviews/{id}/respond` |

### 6. PROFIL COMMERÇANT
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| M-PROF-01 | Modifier profil | MerchantProfileEditScreen | `PUT /merchants/profile` |
| M-PROF-02 | Upload photo | MerchantProfileEditScreen | `POST /merchants/profile/photo` |
| M-PROF-03 | Horaires d'ouverture | MerchantOpeningHoursScreen | `GET /merchants/opening-hours` |
| M-PROF-04 | Modifier horaires | MerchantOpeningHoursScreen | `PUT /merchants/opening-hours` |
| M-PROF-05 | Position GPS | MerchantProfileEditScreen | `GET /merchants/location` |
| M-PROF-06 | Modifier position (carte) | MerchantProfileEditScreen | `PUT /merchants/location` |

---

## 🔴 FONCTIONNALITÉS ADMIN (Administrateur)

### 1. DASHBOARD ADMIN
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-DASH-01 | Dashboard principal | AdminDashboardScreen | `GET /admin/dashboard` |
| A-DASH-02 | Analytics avancées | AdminAnalyticsScreen | `GET /analytics/stats` |

### 2. GESTION UTILISATEURS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-USER-01 | Liste utilisateurs | AdminUsersScreen | `GET /admin/users` |
| A-USER-02 | Suspendre utilisateur | AdminUsersScreen | `PATCH /admin/users/{id}/suspend` |
| A-USER-03 | Réactiver utilisateur | AdminUsersScreen | `PATCH /admin/users/{id}/unsuspend` |

### 3. MODÉRATION PRODUITS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-PROD-01 | Liste produits (modération) | AdminProductsScreen | `GET /admin/moderation` |
| A-PROD-02 | Approuver produit | AdminProductsScreen | `POST /admin/products/{id}/approve` |
| A-PROD-03 | Rejeter produit | AdminProductsScreen | `POST /admin/products/{id}/reject` |

### 4. MODÉRATION COMMERÇANTS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-MERCH-01 | Liste commerçants | AdminMerchantsScreen | `GET /merchants` |
| A-MERCH-02 | Approuver commerçant | AdminMerchantsScreen | `POST /admin/merchants/{id}/approve` |
| A-MERCH-03 | Rejeter commerçant | AdminMerchantsScreen | `POST /admin/merchants/{id}/reject` |

### 5. MODÉRATION AVIS
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-REV-01 | Stats modération | AdminReviewModerationScreen | `GET /admin/reviews/stats` |
| A-REV-02 | Avis en attente | AdminReviewModerationScreen | `GET /admin/reviews/pending` |
| A-REV-03 | Approuver/Rejeter avis | AdminReviewModerationScreen | `POST /admin/reviews/{id}/approve` |

### 6. GESTION CATÉGORIES
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-CAT-01 | Liste catégories | AdminCategoriesScreen | `GET /admin/categories` |
| A-CAT-02 | Créer catégorie | AdminCategoriesScreen | `POST /admin/categories` |
| A-CAT-03 | Modifier catégorie | AdminCategoriesScreen | `PUT /admin/categories/{id}` |
| A-CAT-04 | Supprimer catégorie | AdminCategoriesScreen | `DELETE /admin/categories/{id}` |

### 7. NOTIFICATIONS BROADCAST
| ID | Fonctionnalité | Écran Mobile | Endpoint Backend |
|----|----------------|--------------|------------------|
| A-NOTIF-01 | Envoyer broadcast | AdminBroadcastScreen | `POST /notifications/broadcast` |

---

# 🧪 PLAN DE TESTS MANUELS APK - PRODUCTION

## Environnement de Test
- **URL Backend:** https://antigaspi.jubtek.com/api
- **APK:** Build production via EAS Build
- **Appareil:** Android physique (sources inconnues autorisées)
- **Comptes de test:**
  - Consumer: `jean.dupont@email.com` / `password`
  - Merchant: `boulangerie.martin@email.com` / `password`
  - Admin: `admin@antigaspi.com` / `password`

---

## 📋 TESTS CONSUMER (14 tests)

### TEST-C-01: Inscription Consommateur
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'app | Écran de bienvenue/login s'affiche |
| 2 | Taper "S'inscrire" | Formulaire d'inscription |
| 3 | Remplir: prénom, nom, email unique, mot de passe | Validation en temps réel |
| 4 | Sélectionner rôle "Consumer" | Case cochée |
| 5 | Taper "Créer compte" | Succès, redirection vers Home |
| **Critère de succès:** Compte créé, token JWT stocké, écran Home affiché |

### TEST-C-02: Connexion Consommateur
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'app (déconnecté) | Écran login |
| 2 | Email: `jean.dupont@email.com` | Champ rempli |
| 3 | Password: `password` | Champ masqué |
| 4 | Taper "Se connecter" | Loading puis succès |
| 5 | Vérifier écran Home | Onglets Consumer visibles |
| **Critère de succès:** Connexion réussie, navigation Consumer affichée |

### TEST-C-03: Parcourir Catalogue Produits
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet "Discover" | Liste produits chargée |
| 2 | Scroll vers le bas | Pagination infinie (plus de produits) |
| 3 | Taper icône filtre | Modal filtres s'ouvre |
| 4 | Sélectionner catégorie "Boulangerie" | Filtre appliqué |
| 5 | Vérifier produits affichés | Uniquement produits boulangerie |
| 6 | Taper "Réinitialiser" | Tous les filtres supprimés |
| **Critère de succès:** Filtres fonctionnels, pagination OK |

### TEST-C-04: Détail Produit
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Taper sur un produit | Écran ProductDetails s'ouvre |
| 2 | Vérifier informations | Nom, prix original, prix réduit, % économie |
| 3 | Vérifier image | Image produit affichée |
| 4 | Vérifier commerçant | Nom, distance |
| 5 | Scroll vers avis | Section avis avec stats |
| **Critère de succès:** Toutes les informations affichées correctement |

### TEST-C-05: Créer Réservation
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Depuis ProductDetails | Bouton "Réserver" visible |
| 2 | Sélectionner quantité: 2 | Quantité mise à jour |
| 3 | Vérifier total | Prix × quantité affiché |
| 4 | Taper "Réserver" | Modal confirmation |
| 5 | Choisir méthode paiement "Sur place" | Sélectionné |
| 6 | Confirmer | Loading puis succès |
| 7 | Vérifier code réservation | Code unique affiché (ex: RES-XXXXXX) |
| **Critère de succès:** Réservation créée avec code unique |

### TEST-C-06: Voir Mes Réservations
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet "Orders" | Liste réservations |
| 2 | Vérifier réservation créée | Statut "pending", code visible |
| 3 | Filtrer par "Confirmées" | Uniquement confirmées affichées |
| 4 | Taper sur une réservation | Détails affichés |
| **Critère de succès:** Liste filtrée correctement |

### TEST-C-07: Annuler Réservation
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Ouvrir une réservation "pending" | Détails affichés |
| 2 | Taper "Annuler" | Modal confirmation |
| 3 | Confirmer annulation | Loading |
| 4 | Vérifier statut | Passe à "cancelled" |
| **Critère de succès:** Annulation réussie, statut mis à jour |

### TEST-C-08: Ajouter/Retirer Favoris
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Depuis ProductDetails | Icône cœur visible (vide) |
| 2 | Taper icône cœur | Devient rempli (rouge) |
| 3 | Onglet "Favorites" | Produit apparaît dans la liste |
| 4 | Retaper icône cœur | Devient vide |
| 5 | Onglet "Favorites" | Produit disparaît |
| **Critère de succès:** Toggle instantané, synchronisé avec backend |

### TEST-C-09: Créer un Avis
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | ProductDetails → Section Avis | Liste avis |
| 2 | Taper "Ajouter un avis" | AddReviewScreen |
| 3 | Sélectionner 4 étoiles | Étoiles remplies |
| 4 | Titre: "Excellent produit" | Champ rempli |
| 5 | Commentaire: "Très bon rapport qualité/prix" | Champ rempli |
| 6 | Taper "Publier" | Loading puis succès |
| 7 | Retour ProductDetails | Avis visible dans la liste |
| **Critère de succès:** Avis créé et affiché |

### TEST-C-10: Modifier/Supprimer Avis
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Mon avis → icône crayon | Mode édition |
| 2 | Modifier note à 5 étoiles | Mise à jour |
| 3 | Sauvegarder | Succès |
| 4 | Mon avis → icône poubelle | Modal confirmation |
| 5 | Confirmer suppression | Avis supprimé |
| **Critère de succès:** Modification et suppression OK |

### TEST-C-11: Avis déjà existant (doublon)
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Produit où j'ai déjà un avis | - |
| 2 | Taper "Ajouter un avis" | AddReviewScreen |
| 3 | Remplir et publier | Erreur affichée |
| 4 | Vérifier message | "Vous avez déjà donné un avis..." |
| **Critère de succès:** Message d'erreur clair, pas de doublon créé |

### TEST-C-12: Voir Profil Commerçant
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | ProductDetails → Nom commerçant | MerchantDetailScreen |
| 2 | Vérifier infos | Nom, adresse, téléphone |
| 3 | Voir horaires | Heures d'ouverture par jour |
| 4 | Liste produits | Produits de ce commerçant |
| **Critère de succès:** Profil complet affiché |

### TEST-C-13: Modifier Profil
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Account → Modifier profil | ProfileEditScreen |
| 2 | Changer prénom: "Jean-Pierre" | Champ modifié |
| 3 | Sauvegarder | Loading puis succès |
| 4 | Vérifier ProfileScreen | Nouvelles données affichées |
| **Critère de succès:** Profil mis à jour |

### TEST-C-14: Déconnexion
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Account → Déconnexion | Modal confirmation |
| 2 | Confirmer | Retour écran login |
| 3 | Fermer et rouvrir app | Écran login (pas auto-connecté) |
| **Critère de succès:** Token supprimé, session terminée |

---

## 📋 TESTS MERCHANT (12 tests)

### TEST-M-01: Connexion Commerçant
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Email: `boulangerie.martin@email.com` | Champ rempli |
| 2 | Password: `password` | Champ rempli |
| 3 | Se connecter | Succès |
| 4 | Vérifier navigation | Onglets Merchant visibles |
| **Critère de succès:** Interface Merchant affichée |

### TEST-M-02: Dashboard Commerçant
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Dashboard | MerchantDashboardScreen |
| 2 | Vérifier KPIs | Revenus, nb réservations, produits actifs |
| 3 | Taper "Analytics" | MerchantAnalyticsScreen |
| 4 | Vérifier graphiques | Courbe revenus, top produits |
| **Critère de succès:** Données affichées |

### TEST-M-03: Créer un Produit
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Products → "+" | ProductFormScreen |
| 2 | Nom: "Pain aux céréales" | Champ rempli |
| 3 | Description: "Pain frais du jour" | Champ rempli |
| 4 | Prix original: 600 XOF | Champ rempli |
| 5 | Prix réduit: 350 XOF | Champ rempli |
| 6 | Quantité: 5 | Champ rempli |
| 7 | Upload image | Image téléchargée |
| 8 | Sauvegarder | Loading puis succès (modal stylé) |
| 9 | Vérifier liste produits | Nouveau produit visible |
| **Critère de succès:** Produit créé avec tous les champs |

### TEST-M-04: Modifier un Produit
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Liste produits → taper produit | ProductFormScreen (mode édition) |
| 2 | Modifier quantité: 10 | Champ modifié |
| 3 | Sauvegarder | Succès |
| 4 | Vérifier dans liste | Nouvelles valeurs affichées |
| **Critère de succès:** Produit mis à jour |

### TEST-M-05: Supprimer un Produit
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Liste produits → swipe ou icône | Modal confirmation |
| 2 | Confirmer suppression | Produit retiré |
| **Critère de succès:** Produit supprimé |

### TEST-M-06: Confirmer Réservation
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Reservations | Liste réservations reçues |
| 2 | Trouver réservation "pending" | Statut visible |
| 3 | Taper "Confirmer" | Loading |
| 4 | Vérifier statut | Passe à "confirmed" |
| **Critère de succès:** Réservation confirmée |

### TEST-M-07: Marquer Réservation Prête
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Réservation "confirmed" | Bouton "Prêt" visible |
| 2 | Taper "Prêt" | Loading |
| 3 | Vérifier statut | Passe à "ready" |
| **Critère de succès:** Statut mis à jour |

### TEST-M-08: Compléter Réservation
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Réservation "ready" | Bouton "Terminé" visible |
| 2 | Taper "Terminé" | Loading |
| 3 | Vérifier statut | Passe à "completed" |
| **Critère de succès:** Transaction finalisée |

### TEST-M-09: Gérer Horaires d'Ouverture
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Account → Horaires | MerchantOpeningHoursScreen |
| 2 | Modifier Lundi: 08:00 - 19:00 | Heures modifiées |
| 3 | Fermer Dimanche | Case décochée |
| 4 | Sauvegarder | Succès |
| **Critère de succès:** Horaires sauvegardés |

### TEST-M-10: Modifier Position sur Carte
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Account → Modifier profil | MerchantProfileEditScreen |
| 2 | Taper "Carte" | MapLocationPicker s'ouvre |
| 3 | Déplacer le marqueur | Nouvelle position |
| 4 | Valider | Position sauvegardée |
| **Critère de succès:** Coordonnées GPS mises à jour |

### TEST-M-11: Créer Panier Surprise
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Products → Paniers Surprise | MerchantSurpriseBasketsScreen |
| 2 | Taper "+" | Formulaire création |
| 3 | Nom: "Panier découverte" | Champ rempli |
| 4 | Prix: 1500 XOF | Champ rempli |
| 5 | Quantité: 3 | Champ rempli |
| 6 | Sauvegarder | Succès (modal stylé) |
| **Critère de succès:** Panier surprise créé |

### TEST-M-12: Répondre à un Avis
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Dashboard → Avis | MerchantReviewsScreen |
| 2 | Trouver un avis sans réponse | Avis visible |
| 3 | Taper "Répondre" | Champ réponse |
| 4 | Écrire: "Merci pour votre avis !" | Champ rempli |
| 5 | Envoyer | Réponse affichée sous l'avis |
| **Critère de succès:** Réponse publiée |

---

## 📋 TESTS ADMIN (6 tests)

### TEST-A-01: Connexion Admin
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Email: `admin@antigaspi.com` | Champ rempli |
| 2 | Password: `password` | Champ rempli |
| 3 | Se connecter | Succès |
| 4 | Vérifier navigation | Onglets Admin visibles |
| **Critère de succès:** Interface Admin affichée |

### TEST-A-02: Dashboard Admin
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Dashboard | AdminDashboardScreen |
| 2 | Vérifier KPIs globaux | Revenu total, utilisateurs |
| 3 | Taper Analytics | AdminAnalyticsScreen |
| **Critère de succès:** Données système visibles |

### TEST-A-03: Gestion Utilisateurs
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Users | AdminUsersScreen |
| 2 | Filtrer par "consumer" | Uniquement consumers |
| 3 | Rechercher "jean" | Résultats filtrés |
| 4 | Taper "Suspendre" | Modal confirmation |
| 5 | Confirmer | Utilisateur suspendu |
| **Critère de succès:** Suspension fonctionnelle |

### TEST-A-04: Modérer Commerçants
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Merchants | AdminMerchantsScreen |
| 2 | Sélectionner commerçant | Détails |
| 3 | Taper "Approuver" | Badge vérifié ajouté |
| **Critère de succès:** Vérification effective |

### TEST-A-05: Gérer Catégories
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Categories | AdminCategoriesScreen |
| 2 | Taper "+" | Formulaire création |
| 3 | Nom: "Épicerie fine" | Champ rempli |
| 4 | Sauvegarder | Catégorie créée |
| 5 | Toggle actif/inactif | Statut changé |
| **Critère de succès:** CRUD catégories fonctionnel |

### TEST-A-06: Envoyer Notification Broadcast
| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Onglet Notifications | AdminBroadcastScreen |
| 2 | Titre: "Nouvelle fonctionnalité" | Champ rempli |
| 3 | Message: "Découvrez les paniers surprise!" | Champ rempli |
| 4 | Rôles: Consumer + Merchant | Cases cochées |
| 5 | Envoyer | Notification diffusée |
| **Critère de succès:** Notifications envoyées |

---

## 📊 TABLEAU DE SUIVI DES TESTS

### Consumer (14 tests)
| Test ID | Description | Statut | Date | Commentaires |
|---------|-------------|--------|------|--------------|
| TEST-C-01 | Inscription | ⬜ | | |
| TEST-C-02 | Connexion | ⬜ | | |
| TEST-C-03 | Catalogue | ⬜ | | |
| TEST-C-04 | Détail Produit | ⬜ | | |
| TEST-C-05 | Créer Réservation | ⬜ | | |
| TEST-C-06 | Mes Réservations | ⬜ | | |
| TEST-C-07 | Annuler Réservation | ⬜ | | |
| TEST-C-08 | Favoris | ⬜ | | |
| TEST-C-09 | Créer Avis | ⬜ | | |
| TEST-C-10 | Modifier Avis | ⬜ | | |
| TEST-C-11 | Avis doublon | ⬜ | | |
| TEST-C-12 | Profil Commerçant | ⬜ | | |
| TEST-C-13 | Modifier Profil | ⬜ | | |
| TEST-C-14 | Déconnexion | ⬜ | | |

### Merchant (12 tests)
| Test ID | Description | Statut | Date | Commentaires |
|---------|-------------|--------|------|--------------|
| TEST-M-01 | Connexion | ⬜ | | |
| TEST-M-02 | Dashboard | ⬜ | | |
| TEST-M-03 | Créer Produit | ⬜ | | |
| TEST-M-04 | Modifier Produit | ⬜ | | |
| TEST-M-05 | Supprimer Produit | ⬜ | | |
| TEST-M-06 | Confirmer Réservation | ⬜ | | |
| TEST-M-07 | Marquer Prêt | ⬜ | | |
| TEST-M-08 | Compléter Réservation | ⬜ | | |
| TEST-M-09 | Horaires | ⬜ | | |
| TEST-M-10 | Position Carte | ⬜ | | |
| TEST-M-11 | Panier Surprise | ⬜ | | |
| TEST-M-12 | Répondre Avis | ⬜ | | |

### Admin (6 tests)
| Test ID | Description | Statut | Date | Commentaires |
|---------|-------------|--------|------|--------------|
| TEST-A-01 | Connexion | ⬜ | | |
| TEST-A-02 | Dashboard | ⬜ | | |
| TEST-A-03 | Gestion Utilisateurs | ⬜ | | |
| TEST-A-04 | Modérer Commerçants | ⬜ | | |
| TEST-A-05 | Gérer Catégories | ⬜ | | |
| TEST-A-06 | Broadcast | ⬜ | | |

**Légende:**
- ⬜ Non testé
- 🟡 En cours
- ✅ Passé
- ❌ Échec
- ⏸️ Bloqué

---

## ⚠️ FONCTIONNALITÉS NON TESTABLES (Exclues)

Les fonctionnalités suivantes ont été retirées car non implémentées ou non testables en production :

### Non implémentées
- Sessions actives / Révocation session
- Statistiques réservations consumer
- Signaler avis
- Archiver conversation
- Transfert portefeuille
- Historique recherche
- Gestion inventaire (merchant)
- Santé système (admin)
- Dashboard paiements (admin)
- Paramètres système (admin)
- Audit trail (admin)

### Nécessitent intégration externe
- Paiement Mobile Money (nécessite provider réel)
- Recharge portefeuille (nécessite intégration paiement)
- Notifications Push (nécessite configuration FCM/APNs)

---

## 📈 MÉTRIQUES DE COUVERTURE

| Rôle | Fonctionnalités testables | Tests définis |
|------|---------------------------|---------------|
| Consumer | 35 | 14 |
| Merchant | 26 | 12 |
| Admin | 16 | 6 |
| **TOTAL** | **77** | **32** |

---

**Document mis à jour le 7 décembre 2025**
**Projet:** Antigaspi - Application Anti-Gaspillage Alimentaire
