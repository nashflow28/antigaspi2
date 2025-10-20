# 📋 GUIDE TESTS MANUELS - PHASE 2 à 5

## ✅ PHASE 1: TERMINÉE
- Architecture MerchantNavigator corrigée
- DashboardStack, ReservationsStack, AccountStack créés
- Navigation cohérente avec ConsumerNavigator

---

## 🧪 PHASE 2: VALIDATION LOGIN & NAVIGATION

### Test 2.1: Login Consumer
**Objectif :** Vérifier que le login consumer fonctionne après corrections

**Actions :**
1. Ouvrir l'app mobile (émulateur déjà lancé)
2. Si déjà connecté, se déconnecter
3. Sur l'écran de login :
   - Cliquer sur le bouton "Consumer"
   - Utiliser le bouton Quick Login (jean.dupont@email.com)
4. **Vérifier :**
   - ✅ Login réussi sans erreur
   - ✅ Redirection vers HomeScreen (onglet Accueil)
   - ✅ Tabs visibles : Accueil, Découvrir, Favoris, Réservations, Compte
   - ✅ Tous les tabs cliquables et répondent

**Résultat attendu :** Navigation consumer 100% fonctionnelle

**Screenshot :** Prendre screenshot après login et navigation entre tabs

---

### Test 2.2: Login Merchant
**Objectif :** Vérifier que le login merchant fonctionne après corrections MerchantNavigator

**Actions :**
1. Se déconnecter du compte consumer
2. Sur l'écran de login :
   - Cliquer sur le bouton "Merchant"
   - Utiliser le Quick Login (marie.martin@email.com)
3. **Vérifier :**
   - ✅ Login réussi sans erreur
   - ✅ Redirection vers MerchantDashboardScreen
   - ✅ Tabs visibles : Tableau de bord, Mes Produits, Réservations, Compte
   - ✅ Tous les tabs cliquables et répondent
   - ✅ Aucun freeze de navigation (BUG #1 corrigé)

**Résultat attendu :** Navigation merchant 100% fonctionnelle

**Actions supplémentaires :**
- Cliquer sur chaque tab et revenir
- Vérifier que chaque écran s'affiche correctement
- Tester retour arrière (back button Android)

**Screenshot :** Prendre screenshot de chaque tab merchant

---

### Test 2.3: BUG #4 - Validation
**Objectif :** Déterminer si BUG #4 est réel ou limitation adb

**Contexte :** Rapport précédent mentionnait que les TextInput ne fonctionnaient pas avec adb automation

**Actions :**
1. Se déconnecter
2. Sur l'écran de login, tenter login MANUEL (sans Quick Login) :
   - Email: `test@email.com`
   - Mot de passe: `password`
3. **Vérifier :**
   - ✅ Champs TextInput répondent au clavier
   - ✅ Saisie possible dans email et password
   - ✅ Bouton "Se connecter" cliquable

**Résultat attendu :** Champs fonctionnent normalement = BUG #4 est une limitation adb, pas un vrai bug

**Conclusion :**
- Si les champs fonctionnent → BUG #4 = Faux positif (limitation automation)
- Si les champs ne fonctionnent pas → BUG #4 = Vrai bug à corriger

---

## 🛍️ PHASE 3: TESTS MERCHANT COMPLETS (12 Tests)

### Test 3.1: Navigation Dashboard
**Actions :**
1. Connecté comme merchant (marie.martin@email.com)
2. Sur Dashboard :
   - Vérifier affichage des 3 stats cards
   - Vérifier affichage "Réservations récentes"
   - Cliquer sur bouton refresh (icône refresh en haut)

**Attendu :**
- ✅ Stats s'affichent correctement
- ✅ Liste réservations récentes visible
- ✅ Refresh fonctionne (loader visible)

---

### Test 3.2: Navigation Mes Produits
**Actions :**
1. Cliquer sur tab "Mes Produits"
2. Vérifier liste des produits du merchant
3. Scroll dans la liste

**Attendu :**
- ✅ Liste produits visible
- ✅ Scroll fonctionne
- ✅ Bouton "Ajouter un produit" visible

---

### Test 3.3: Ajouter un Produit
**Actions :**
1. Sur "Mes Produits", cliquer "Ajouter un produit"
2. Remplir formulaire :
   - Nom: "Produit Test"
   - Description: "Test ajout produit"
   - Prix original: 1000
   - Prix réduit: 500
   - Quantité: 10
   - Catégorie: Boulangerie
3. Cliquer "Enregistrer"

**Attendu :**
- ✅ Formulaire s'affiche correctement
- ✅ Tous les champs éditables
- ✅ Sauvegarde réussie
- ✅ Retour à liste produits
- ✅ Nouveau produit visible

**Screenshot :** Formulaire + Nouveau produit dans liste

---

### Test 3.4: Modifier un Produit
**Actions :**
1. Cliquer sur un produit existant dans la liste
2. Modifier le prix réduit (ex: 500 → 450)
3. Cliquer "Enregistrer"

**Attendu :**
- ✅ Écran édition s'affiche
- ✅ Champs pré-remplis avec valeurs actuelles
- ✅ Modification sauvegardée
- ✅ Prix mis à jour dans liste

---

### Test 3.5: Upload Image Produit
**Actions :**
1. Sur formulaire produit (édition ou création)
2. Cliquer "Ajouter une image"
3. Sélectionner une image depuis galerie

**Attendu :**
- ✅ Sélecteur d'image s'ouvre
- ✅ Image sélectionnée s'affiche en preview
- ✅ Upload réussit après sauvegarde

---

### Test 3.6: Navigation Réservations
**Actions :**
1. Cliquer sur tab "Réservations"
2. Vérifier liste des réservations
3. Tester filtres : Toutes, En attente, Confirmées, Terminées, Annulées

**Attendu :**
- ✅ Liste réservations visible
- ✅ Filtres fonctionnels
- ✅ Changement de filtre met à jour la liste

---

### Test 3.7: Voir Détails Réservation
**Actions :**
1. Sur liste réservations, cliquer sur une réservation
2. Vérifier affichage :
   - Nom client
   - Téléphone client
   - Produit réservé
   - Quantité
   - Montant total
   - Statut

**Attendu :**
- ✅ Toutes les infos visibles et correctes
- ✅ Boutons d'action affichés selon statut

---

### Test 3.8: Confirmer Réservation
**Actions :**
1. Trouver une réservation "En attente"
2. Cliquer bouton "Confirmer"
3. Confirmer dans la popup

**Attendu :**
- ✅ Popup de confirmation s'affiche
- ✅ Après confirmation, statut passe à "Confirmée"
- ✅ Liste se met à jour automatiquement

---

### Test 3.9: Rejeter Réservation
**Actions :**
1. Trouver une réservation "En attente"
2. Cliquer bouton "Refuser"
3. Confirmer dans la popup

**Attendu :**
- ✅ Popup de confirmation s'affiche
- ✅ Après rejet, statut passe à "Annulée"
- ✅ Liste se met à jour

---

### Test 3.10: Navigation Compte
**Actions :**
1. Cliquer sur tab "Compte" (ProfileScreen)
2. Vérifier affichage profil merchant
3. Scroll dans les options

**Attendu :**
- ✅ Profil merchant visible
- ✅ Informations commercant affichées
- ✅ Options disponibles

---

### Test 3.11: Retours Arrière Navigation
**Actions :**
1. Naviguer : Dashboard → Mes Produits → Ajouter Produit
2. Cliquer retour arrière (back button Android)
3. Vérifier retour à "Mes Produits"
4. Cliquer retour → Vérifier retour à Dashboard

**Attendu :**
- ✅ Navigation arrière fonctionne
- ✅ Pas de crash ou freeze
- ✅ États préservés lors des retours

---

### Test 3.12: Déconnexion
**Actions :**
1. Sur tab Compte, cliquer "Se déconnecter"
2. Vérifier redirection vers écran login

**Attendu :**
- ✅ Déconnexion réussie
- ✅ Pas de popup "Logout API error" (BUG #3 corrigé)
- ✅ Retour écran login
- ✅ Boutons Consumer/Merchant visibles

**Screenshot :** Écran login après déconnexion

---

## 🔄 PHASE 4: TESTS DE RÉGRESSION

### Test 4.1: Navigation Consumer Complète
**Objectif :** S'assurer que les corrections merchant n'ont pas cassé consumer

**Actions :**
1. Se connecter en Consumer (jean.dupont@email.com)
2. Tester chaque tab : Accueil, Découvrir, Favoris, Réservations, Compte
3. Naviguer entre tabs multiples fois
4. Tester retours arrière

**Attendu :**
- ✅ Tous les tabs fonctionnent
- ✅ Navigation fluide sans freeze
- ✅ Aucune régression détectée

---

### Test 4.2: Navigation Merchant Complète
**Objectif :** Validation finale navigation merchant

**Actions :**
1. Se connecter en Merchant (marie.martin@email.com)
2. Naviguer entre tous les tabs 5 fois de suite
3. Tester retours arrière multiples
4. Tester refresh sur chaque écran

**Attendu :**
- ✅ Navigation 100% stable
- ✅ Aucun freeze
- ✅ Aucune erreur console

---

### Test 4.3: Performance
**Actions :**
1. Chronométrer temps de login (Consumer et Merchant)
2. Chronométrer temps de navigation entre tabs
3. Vérifier utilisation mémoire (adb shell dumpsys meminfo)

**Attendu :**
- ✅ Login < 2 secondes
- ✅ Navigation entre tabs < 500ms
- ✅ Pas de memory leak

---

## 📊 PHASE 5: DOCUMENTATION & COMMIT

### Actions finales :
1. ✅ Compiler tous les screenshots dans un rapport
2. ✅ Mettre à jour RAPPORT_FINAL_TESTS_COMPLET.md avec :
   - Résultats des 12 tests merchant
   - Validation BUG #4 (vrai ou faux)
   - Résultats tests de régression
   - Métriques de performance
3. ✅ Créer commit Git détaillé :
   ```
   feat(mobile): Fix MerchantNavigator architecture - Add DashboardStack, ReservationsStack, AccountStack

   PHASE 1 COMPLETED:
   - Created DashboardStack for consistent navigation pattern
   - Created ReservationsStack to enable future detail screen
   - Created AccountStack to enable future settings/profile sub-navigation
   - Modified all Tab.Screen components to use Stack navigators

   FIXES:
   - BUG #1 (BLOCKER): Navigation freeze risk eliminated
   - Architecture now 100% consistent with ConsumerNavigator
   - All tabs use Stack pattern for future extensibility

   TESTS: [Results from manual testing phases 2-4]

   FILES MODIFIED:
   - mobile/src/navigation/MerchantNavigator.tsx

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. ✅ Push vers GitHub

---

## 📝 NOTES IMPORTANTES

### Contrainte Screenshots :
- **TOUJOURS vérifier dimensions avant lecture**
- Si hauteur > 2000px, utiliser `resize-screenshot.py` :
  ```bash
  python mobile/resize-screenshot.py input.png output-resized.png
  ```

### Compte de test disponibles :
- **Consumer :** jean.dupont@email.com / password
- **Merchant :** marie.martin@email.com / password
- **Admin :** admin@antigaspi.com / password

### Logs utiles :
```bash
# Voir logs Expo en temps réel
cd mobile && npx expo start

# Voir logs Android device
adb logcat -s ReactNativeJS:*

# Vérifier processus Metro bundler
netstat -ano | findstr "8081"
```

---

## ✅ CHECKLIST COMPLETION

**Phase 1: Architecture** ✅ TERMINÉE
- [x] DashboardStack créé
- [x] ReservationsStack créé
- [x] AccountStack créé
- [x] Tab.Screen modifiés
- [x] Metro bundler recompilé sans erreurs

**Phase 2: Validation Login** ⏳ EN ATTENTE TESTS MANUELS
- [ ] Test 2.1: Login Consumer
- [ ] Test 2.2: Login Merchant
- [ ] Test 2.3: BUG #4 investigation

**Phase 3: Tests Merchant** ⏳ EN ATTENTE TESTS MANUELS
- [ ] Tests 3.1 à 3.12

**Phase 4: Régression** ⏳ EN ATTENTE TESTS MANUELS
- [ ] Tests 4.1 à 4.3

**Phase 5: Documentation** ⏳ EN ATTENTE RÉSULTATS
- [ ] Rapport final
- [ ] Commit Git
- [ ] Push GitHub

---

**📌 PROCHAINE ÉTAPE :** Exécuter les tests manuels Phase 2 (Login Consumer + Merchant)
