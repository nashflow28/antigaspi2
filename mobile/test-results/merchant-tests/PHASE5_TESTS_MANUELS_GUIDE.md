# ✅ PHASE 5 - GUIDE DES TESTS MANUELS

**Date:** 2025-10-12
**Mode:** Ultrathink
**Objectif:** Valider toutes les corrections apportées dans les Phases 1-4

---

## 📋 RÉCAPITULATIF DES CORRECTIONS

### Phase 1: Diagnostic BDD
✅ Confirmé: **27 produits actifs** dans la base de données
- 12 Boulangerie
- 5 Fruits & Légumes
- 4 Épicerie
- 3 Viandes & Plats
- 2 Produits Laitiers
- 1 Plats préparés

### Phase 2: Backend - Endpoint `/categories/merchant`
✅ Créé endpoint filtrant les catégories selon `business_type`
- **Boulangerie** → voit uniquement catégorie "Boulangerie"
- **Primeur/Bio/Fruits** → voit uniquement "Fruits & Légumes"
- **Supermarché** → voit toutes les catégories (1,2,3,4,5,6)

### Phase 3: Mobile - ProductFormScreen
✅ Modifié pour utiliser `/categories/merchant` au lieu de l'endpoint public

### Phase 4: Mobile - HomeScreen UX
✅ Ajout compteurs de produits sur chips catégories: "Tous (27)", "Boulangerie (12)"
✅ Amélioration empty state avec messages contextuels et bouton reset

---

## 🧪 TEST 1: CONSUMER - AFFICHAGE DES PRODUITS

### Test 1.1: Login Consumer
**Compte:** `jean.dupont@email.com` / `password`

**Actions:**
1. Ouvrir l'application
2. Se connecter avec les identifiants consumer
3. Vérifier la navigation vers l'onglet "Accueil"

**Résultats attendus:**
- ✅ Login réussi
- ✅ Redirection vers HomeScreen
- ✅ Header affiche "Bonjour Jean"

**Screenshot:** `01-consumer-login.png`

---

### Test 1.2: Vérifier les Compteurs de Catégories
**Écran:** HomeScreen (onglet Accueil)

**Actions:**
1. Scroller horizontalement sur les chips de catégories
2. Vérifier les compteurs affichés

**Résultats attendus:**
- ✅ "Tous (27)" → 27 produits au total
- ✅ "Boulangerie (12)" → 12 produits boulangerie
- ✅ "Fruits & Légumes (5)" → 5 produits fruits/légumes
- ✅ "Viandes & Plats (3)" → 3 produits viandes
- ✅ "Épicerie (4)" → 4 produits épicerie
- ✅ "Produits Laitiers (2)" → 2 produits laitiers
- ✅ "Plats préparés (1)" → 1 produit plats préparés

**Screenshot:** `02-consumer-category-chips.png`

---

### Test 1.3: Filtre "Tous" - Affichage Complet
**Écran:** HomeScreen (onglet Accueil)

**Actions:**
1. S'assurer que le filtre "Tous (27)" est sélectionné
2. Vérifier le toggle "Produits disponibles" (ON par défaut)
3. Scroller verticalement pour voir tous les produits

**Résultats attendus:**
- ✅ Header résultats affiche "27 produits trouvés"
- ✅ Affichage de 27 cards produits (avec scroll)
- ✅ Chaque card affiche: image, nom, prix, merchant, rating

**Screenshot:** `03-consumer-all-products.png`

---

### Test 1.4: Filtre Catégorie Spécifique
**Écran:** HomeScreen (onglet Accueil)

**Actions:**
1. Cliquer sur chip "Boulangerie (12)"
2. Vérifier le filtrage des produits

**Résultats attendus:**
- ✅ Chip "Boulangerie" devient bleu (sélectionné)
- ✅ Header résultats affiche "12 produits trouvés"
- ✅ Bouton "Effacer les filtres" apparaît à droite
- ✅ Affichage de 12 produits uniquement (tous de Boulangerie Martin)

**Screenshot:** `04-consumer-filter-boulangerie.png`

---

### Test 1.5: Empty State - Catégorie avec Filtres Actifs
**Écran:** HomeScreen (onglet Accueil)

**Actions:**
1. Sélectionner une catégorie avec peu de produits (ex: "Plats préparés (1)")
2. Activer filtre "Produits disponibles" si pas déjà actif
3. Si produit(s) affiché(s), désactiver/activer le toggle pour simuler vide

**Résultats attendus (si aucun produit):**
- ✅ Icône basket vide (gris)
- ✅ Titre: "Aucun produit dans cette catégorie"
- ✅ Message contextuel: `Aucun produit disponible dans "Plats préparés". Essayez une autre catégorie...`
- ✅ Bouton "Voir tous les produits" avec icône refresh
- ✅ Clic sur bouton → retour au filtre "Tous (27)"

**Screenshot:** `05-consumer-empty-state-category.png`

---

### Test 1.6: Toggle "Produits Disponibles"
**Écran:** HomeScreen (onglet Accueil)

**Actions:**
1. Désactiver le toggle "Produits disponibles" (OFF)
2. Vérifier si nombre de produits change
3. Réactiver le toggle (ON)

**Résultats attendus:**
- ✅ OFF: Affiche TOUS les produits (y compris quantity_available = 0)
- ✅ ON: Affiche uniquement produits avec quantity_available > 0
- ✅ Compteurs des chips se mettent à jour dynamiquement

**Screenshot:** `06-consumer-toggle-available.png`

---

## 🧪 TEST 2: MERCHANT - CATÉGORIES FILTRÉES

### Test 2.1: Login Merchant Boulangerie
**Compte:** `marie.martin@email.com` / `password`

**Actions:**
1. Se déconnecter du compte consumer
2. Retour à l'écran de login
3. Se connecter avec identifiants merchant

**Résultats attendus:**
- ✅ Login réussi
- ✅ Redirection vers **MerchantDashboardScreen** (pas ConsumerNavigator!)
- ✅ Navigation tabs affichent: Dashboard, Mes Produits, Réservations, Compte
- ✅ PAS d'onglets "Découvrir" ni "Favoris" (réservés au consumer)

**Screenshot:** `07-merchant-login-dashboard.png`

---

### Test 2.2: Navigation vers "Mes Produits"
**Écran:** MerchantDashboardScreen

**Actions:**
1. Cliquer sur l'onglet "Mes Produits" (icône storefront)
2. Vérifier la liste des produits

**Résultats attendus:**
- ✅ Affichage de la liste des produits DU MERCHANT UNIQUEMENT
- ✅ Boulangerie Martin devrait voir ~12 produits (ses propres produits)
- ✅ Pas de produits d'autres merchants (Primeur Bio, etc.)

**Screenshot:** `08-merchant-products-list.png`

---

### Test 2.3: Ajouter un Produit - Catégories Filtrées
**Écran:** MerchantProductsScreen

**Actions:**
1. Cliquer sur bouton "Ajouter un produit" (FAB + ou header button)
2. Navigation vers ProductFormScreen (mode: create)
3. Scroller jusqu'à la section "Catégorie *"

**Résultats attendus:**
- ✅ **Boulangerie Martin voit UNIQUEMENT la catégorie "Boulangerie"**
- ✅ Pas de catégories "Fruits & Légumes", "Viandes", etc.
- ✅ Logs console affichent:
  ```
  Merchant business type: Boulangerie
  Catégories autorisées: 1
  ```

**Screenshot:** `09-merchant-add-product-categories.png`

---

### Test 2.4: Éditer un Produit Existant - Catégories
**Écran:** MerchantProductsScreen

**Actions:**
1. Cliquer sur un produit existant de la liste
2. Navigation vers ProductFormScreen (mode: edit)
3. Vérifier section "Catégorie *"

**Résultats attendus:**
- ✅ Catégorie actuelle du produit est pré-sélectionnée (chip bleu)
- ✅ **Boulangerie Martin voit UNIQUEMENT "Boulangerie"**
- ✅ Impossible de changer vers une catégorie interdite (non affichée)

**Screenshot:** `10-merchant-edit-product-categories.png`

---

### Test 2.5: Tester Merchant Type "Primeur"
**Compte:** Créer un merchant de type "Primeur" ou utiliser existant

**Actions:**
1. Si aucun compte primeur:
   - Utiliser backend pour créer merchant avec `business_type: "Primeur"`
   - Ou tester via curl/Postman
2. Login avec ce compte
3. Aller dans "Ajouter un produit"

**Résultats attendus:**
- ✅ Primeur voit UNIQUEMENT catégorie "Fruits & Légumes" (id: 2)
- ✅ Logs console:
  ```
  Merchant business type: Primeur
  Catégories autorisées: 1
  ```

**Screenshot:** `11-merchant-primeur-categories.png` (optionnel)

---

### Test 2.6: Tester Merchant Type "Supermarché"
**Compte:** Créer merchant "Supermarché" ou tester via API

**Actions:**
1. Login merchant supermarché
2. Aller dans "Ajouter un produit"

**Résultats attendus:**
- ✅ Supermarché voit TOUTES les catégories (1,2,3,4,5,6)
- ✅ Chips: Boulangerie, Fruits & Légumes, Viandes, Épicerie, Laitiers, Plats
- ✅ Logs console:
  ```
  Merchant business type: Supermarché
  Catégories autorisées: 6
  ```

**Screenshot:** `12-merchant-supermarket-categories.png` (optionnel)

---

## 🧪 TEST 3: NAVIGATION - CONSUMER vs MERCHANT

### Test 3.1: Vérifier Tabs Consumer
**Compte:** `jean.dupont@email.com`

**Actions:**
1. Login consumer
2. Compter les onglets de la bottom tab navigation

**Résultats attendus:**
- ✅ **5 onglets visibles:**
  1. Accueil (home)
  2. Découvrir (compass)
  3. Favoris (heart)
  4. Commandes (receipt)
  5. Compte (person)

**Screenshot:** `13-consumer-tabs.png`

---

### Test 3.2: Vérifier Tabs Merchant
**Compte:** `marie.martin@email.com`

**Actions:**
1. Logout consumer
2. Login merchant
3. Compter les onglets de la bottom tab navigation

**Résultats attendus:**
- ✅ **4 onglets visibles:**
  1. Dashboard (bar-chart)
  2. Mes Produits (storefront)
  3. Réservations (calendar)
  4. Compte (person)
- ✅ **Onglets absents:** Découvrir, Favoris (spécifiques consumer)

**Screenshot:** `14-merchant-tabs.png`

---

## 📊 RÉSULTATS ATTENDUS - CHECKLIST

### ✅ Backend
- [ ] Endpoint `/categories/merchant` retourne catégories filtrées
- [ ] Boulangerie → [1]
- [ ] Primeur → [2]
- [ ] Supermarché → [1,2,3,4,5,6]
- [ ] Middleware `jwt.auth` protège la route

### ✅ Mobile - Consumer
- [ ] HomeScreen affiche 27 produits (filtre "Tous")
- [ ] Compteurs catégories corrects: "Tous (27)", "Boulangerie (12)", etc.
- [ ] Filtre catégorie fonctionne (ex: clic sur "Boulangerie" → 12 produits)
- [ ] Empty state contextuel avec nom catégorie + bouton reset
- [ ] Toggle "Produits disponibles" filtre correctement
- [ ] Navigation 5 tabs: Accueil, Découvrir, Favoris, Commandes, Compte

### ✅ Mobile - Merchant
- [ ] ProductFormScreen charge `/categories/merchant` (pas endpoint public)
- [ ] Boulangerie Martin voit uniquement "Boulangerie"
- [ ] Fallback vers endpoint public si erreur 403/500
- [ ] Navigation 4 tabs: Dashboard, Mes Produits, Réservations, Compte
- [ ] Pas d'onglets "Découvrir" ni "Favoris"

---

## 📸 SCREENSHOTS À FOURNIR

### Consumer (7 screenshots minimum)
1. `01-consumer-login.png` - Écran de login rempli
2. `02-consumer-category-chips.png` - Chips avec compteurs
3. `03-consumer-all-products.png` - Filtre "Tous (27)" avec produits
4. `04-consumer-filter-boulangerie.png` - Filtre "Boulangerie (12)"
5. `05-consumer-empty-state-category.png` - Empty state avec bouton reset
6. `06-consumer-toggle-available.png` - Toggle ON/OFF
7. `13-consumer-tabs.png` - Bottom tabs (5 onglets)

### Merchant (5 screenshots minimum)
1. `07-merchant-login-dashboard.png` - Dashboard après login
2. `08-merchant-products-list.png` - Liste des produits merchant
3. `09-merchant-add-product-categories.png` - Form création, catégories filtrées
4. `10-merchant-edit-product-categories.png` - Form édition, catégories
5. `14-merchant-tabs.png` - Bottom tabs (4 onglets)

### Optionnels
- `11-merchant-primeur-categories.png` - Primeur voit "Fruits & Légumes"
- `12-merchant-supermarket-categories.png` - Supermarché voit toutes catégories

---

## 🚀 PROCÉDURE DE TEST

### 1. Préparation
```bash
# Terminal 1: Backend Laravel
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2: Mobile Expo
cd mobile
npx expo start --clear
```

### 2. Connexion Émulateur
- Lancer émulateur Android
- Ouvrir l'app Antigaspi
- Vérifier connexion backend: logs doivent afficher requêtes API

### 3. Exécution Tests
- Suivre ordre: TEST 1 → TEST 2 → TEST 3
- Prendre screenshot à chaque étape marquée
- Noter toute divergence par rapport aux résultats attendus

### 4. Rapport Final
- Copier ce fichier et cocher [ ] → [x] pour chaque test validé
- Ajouter notes si comportement inattendu
- Joindre tous les screenshots dans `mobile/test-results/merchant-tests/`

---

## 🐛 EN CAS DE PROBLÈME

### Problème 1: Consumer voit toujours 1 seul produit
**Diagnostic:**
- Vérifier BDD: `SELECT COUNT(*) FROM products WHERE is_active = 1`
- Vérifier Redux: logs doivent afficher `Product found in store: {...}` (27 fois)
- Vérifier API: `curl http://localhost:8000/api/products?per_page=50`

**Solution:** Si API retourne 27 produits mais app affiche 1 → vérifier filtres actifs (catégorie, disponibilité)

### Problème 2: Merchant voit toutes les catégories
**Diagnostic:**
- Vérifier logs Expo: doit afficher "Merchant business type: Boulangerie"
- Vérifier endpoint: `curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/categories/merchant`
- Vérifier fallback: si erreur 403 → utilise endpoint public (pas normal)

**Solution:**
- Vérifier token JWT valide
- Vérifier route API protégée par `jwt.auth`
- Relire code ProductFormScreen ligne 50 (endpoint utilisé)

### Problème 3: Navigation tabs identiques Consumer/Merchant
**Diagnostic:**
- Vérifier App.tsx: doit utiliser `userRole === 'merchant' ? <MerchantNavigator /> : <ConsumerNavigator />`
- Vérifier Redux auth store: `user.role` correct après login

**Solution:** Relire navigation/index.tsx et vérifier condition de routing

---

## ✅ VALIDATION FINALE

Une fois TOUS les tests passés:
1. Cocher toutes les cases [ ] → [x]
2. Compiler screenshots dans dossier `merchant-tests/`
3. Créer rapport `PHASE5_TESTS_RESULTS.md` avec résumé
4. Prêt pour commit Git final

---

**📌 ACTION REQUISE:** Exécuter les 3 séries de tests et reporter les résultats.

---

**🤖 Généré en mode ultrathink par Claude Code**
**Auteur:** Claude <noreply@anthropic.com>
**Date:** 2025-10-12
**Version:** Antigaspi Mobile v1.0 (Expo SDK 54.0.13)
