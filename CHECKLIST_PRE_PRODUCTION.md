# 📋 Checklist Pré-Production - Antigaspi

## 🎯 Objectif
Liste des tâches à compléter avant les tests réels avec de vrais commerçants et consommateurs au Togo.

---

## 🔴 CRITIQUE - À faire impérativement

### 1. Déploiement Backend
- [x] **Commit et push** des corrections backend (avis en double, etc.) ✅ Pushé
- [ ] **Pull sur le serveur VPS** (antigaspi.jubtek.com)
- [ ] **Exécuter les migrations** : `php artisan migrate --force`
- [ ] **Vérifier les logs** : `tail -f storage/logs/laravel.log`

**Commandes à exécuter sur le VPS :**
```bash
cd /chemin/vers/backend
git pull origin main
php artisan migrate --force
php artisan config:cache
```

### 2. Build Mobile
- [ ] **Tester le build development** avec MapLibre
  - 🔗 https://expo.dev/accounts/nashflow/projects/antigaspi/builds/90fdcf26-e7dd-4e3d-a72e-77db10519322
- [ ] **Tester le build preview** (APK standalone)
  - 🔗 https://expo.dev/accounts/nashflow/projects/antigaspi/builds/5648654a-574b-4d84-aad1-82d7f351f568
- [ ] **Valider toutes les fonctionnalités** sur appareil physique
- [ ] **Générer l'APK production** (après validation preview)

### 3. Bugs Critiques à Vérifier
| Bug | Code Corrigé | À Tester |
|-----|--------------|----------|
| Carte MapLibre (tuiles vides) | ✅ CARTO tiles | ⏳ APK en cours |
| Carte - tap ne fonctionne pas | ✅ onPress fix | ⏳ APK en cours |
| MerchantDetailScreen crash | ✅ Migré MapLibre | ⏳ APK en cours |
| Upload photo profil | ✅ fetch natif | ⏳ À retester |
| Avis en double | ✅ Backend + migration | ⏳ Migration VPS |
| Safe area / headers | ✅ useSafeAreaInsets | ⏳ À retester |

---

## 🟠 IMPORTANT - Fonctionnalités Core à Tester

### 4. Parcours Consumer (Client)
- [ ] Inscription nouveau compte
- [ ] Connexion / Déconnexion
- [ ] Parcourir les produits (liste + filtres)
- [ ] Voir détails d'un produit
- [ ] Ajouter aux favoris
- [ ] Créer une réservation
- [ ] Voir ses réservations
- [ ] Annuler une réservation
- [ ] Modifier son profil (+ photo)
- [ ] Laisser un avis (1 seul par produit)
- [ ] Voir la carte des commerçants (onglet Découvrir)
- [ ] Cliquer sur un commerçant depuis la carte
- [ ] Voir détails d'un commerçant (avec carte)

### 5. Parcours Merchant (Commerçant)
- [ ] Inscription commerçant
- [ ] Compléter le profil commerçant
- [ ] Ajouter un produit (avec photo)
- [ ] Modifier un produit
- [ ] Supprimer un produit
- [ ] Voir les réservations entrantes
- [ ] Confirmer une réservation
- [ ] Marquer "prêt à récupérer"
- [ ] Marquer "terminé"
- [ ] Annuler une réservation
- [ ] **Modifier la localisation sur la carte** ⚠️ Bug MapLibre corrigé
- [ ] Voir les avis reçus
- [ ] Voir le dashboard / statistiques

### 6. Cas Edge / Erreurs
- [ ] Créer réservation sur produit en rupture de stock
- [ ] Créer réservation sur produit expiré
- [ ] Double tap sur boutons (éviter double soumission)
- [ ] Comportement hors connexion / connexion lente
- [ ] Token JWT expiré (re-login automatique ?)
- [ ] Validation des champs (email, téléphone, etc.)

---

## 🟡 RECOMMANDÉ - Améliorations UX

### 7. Interface Utilisateur
- [ ] Mode sombre fonctionne partout
- [ ] Textes lisibles (contraste suffisant)
- [ ] Boutons assez grands pour le tactile
- [ ] Messages d'erreur compréhensibles
- [ ] Feedback visuel sur les actions (loading, success)
- [ ] Pull-to-refresh sur les listes

### 8. Performance
- [ ] Temps de chargement acceptable (<3s)
- [ ] Images optimisées (pas de lag)
- [ ] Pas de crash sur les actions rapides
- [ ] Mémoire stable (pas de fuite)

### 9. Notifications (V1.1)
- [ ] Notifications push configurées ?
- [ ] Notification sur nouvelle réservation (merchant)
- [ ] Notification sur confirmation (consumer)
- [ ] Notification sur annulation

---

## 🟢 OPTIONNEL - Pour la V1.1

### 10. Fonctionnalités Futures
- [ ] Paiement Mobile Money (Flooz, T-Money)
- [ ] Programme de fidélité / points
- [ ] Chat entre merchant et consumer
- [ ] Paniers surprise
- [ ] QR code pour confirmation
- [ ] Historique des transactions

### 11. Administration
- [ ] Interface admin fonctionnelle
- [ ] Modération des commerçants
- [ ] Statistiques globales
- [ ] Gestion des utilisateurs

---

## 📱 Tests sur Appareils

### Appareils à tester (minimum)
- [ ] Android récent (Android 12+)
- [ ] Android ancien (Android 8-10)
- [ ] Téléphone avec notch/encoche
- [ ] Téléphone sans notch
- [ ] Écran petit (<5.5")
- [ ] Écran grand (>6.5")

### Conditions à tester
- [ ] WiFi stable
- [ ] 4G/LTE
- [ ] 3G lent
- [ ] Mode avion → reconnexion

---

## 🔐 Sécurité

- [ ] Pas de credentials en dur dans le code
- [x] HTTPS partout (antigaspi.jubtek.com)
- [x] JWT tokens sécurisés
- [x] Validation côté serveur
- [x] Protection contre injection SQL (Eloquent ORM)
- [ ] Rate limiting activé
- [ ] Logs sans données sensibles

---

## 📝 Documentation pour les Testeurs

- [ ] Guide d'installation de l'APK
- [ ] Comptes de test disponibles
- [ ] Formulaire de feedback / bug report (WhatsApp group?)
- [ ] Contact support en cas de problème

### Comptes de Test Existants
| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@antigaspi.com | password |
| Consumer | jean.dupont@email.com | password |
| Merchant | boulangerie.martin@email.com | password |

---

## ✅ Avant le Lancement

1. **Sauvegarder** la base de données production
2. **Documenter** les comptes de test
3. **Préparer** un canal de feedback (WhatsApp group)
4. **Définir** les métriques de succès
5. **Planifier** les sessions de test

---

## 🔄 Ordre de Priorité Recommandé

### Étape 1 - Backend (5 min)
```bash
# Sur le VPS
git pull origin main
php artisan migrate --force
```

### Étape 2 - APK (en attente)
- Télécharger APK Preview quand prêt
- Installer sur téléphone de test

### Étape 3 - Tests Critiques (30 min)
1. Carte commerçants (Découvrir) - tuiles + markers
2. Détail commerçant - carte affichée
3. Modification localisation (merchant)
4. Upload photo profil
5. Création avis (vérifie pas de doublon)

### Étape 4 - Tests Parcours Complets (1h)
1. Parcours Consumer complet
2. Parcours Merchant complet

### Étape 5 - Tests Edge Cases (30 min)
1. Hors connexion
2. Connexion lente
3. Actions rapides

---

**Dernière mise à jour :** 8 décembre 2024 - 19h45
