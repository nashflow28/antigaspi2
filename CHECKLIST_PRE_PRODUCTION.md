# 📋 Checklist Pré-Production - Antigaspi

## 🎯 Objectif
Liste des tâches à compléter avant les tests réels avec de vrais commerçants et consommateurs au Togo.

---

## 🔴 CRITIQUE - À faire impérativement

### 1. Déploiement Backend
- [ ] **Commit et push** des corrections backend (avis en double, etc.)
- [ ] **Pull sur le serveur VPS** (antigaspi.jubtek.com)
- [ ] **Exécuter les migrations** : `php artisan migrate --force`
- [ ] **Vérifier les logs** : `tail -f storage/logs/laravel.log`

### 2. Build Mobile Production
- [ ] **Tester le build development** avec MapLibre (en cours)
- [ ] **Valider toutes les fonctionnalités** sur appareil physique
- [ ] **Générer l'APK production** : `eas build --platform android --profile production`
- [ ] **Tester l'APK production** avant distribution

### 3. Bugs Critiques à Vérifier
- [ ] **Carte MapLibre** - Fonctionne-t-elle correctement ?
- [ ] **Upload photo profil** - Erreur Network Error résolue ?
- [ ] **Avis en double** - Bloqué par le backend ?
- [ ] **Safe area** - Headers visibles sur tous les téléphones ?

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
- [ ] Voir la carte des commerçants
- [ ] Cliquer sur un commerçant depuis la carte

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
- [ ] Modifier la localisation sur la carte
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

### 9. Notifications
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
- [ ] HTTPS partout
- [ ] JWT tokens sécurisés
- [ ] Validation côté serveur
- [ ] Protection contre injection SQL
- [ ] Rate limiting activé
- [ ] Logs sans données sensibles

---

## 📝 Documentation pour les Testeurs

- [ ] Guide d'installation de l'APK
- [ ] Comptes de test disponibles
- [ ] Formulaire de feedback / bug report
- [ ] Contact support en cas de problème

---

## ✅ Avant le Lancement

1. **Sauvegarder** la base de données
2. **Documenter** les comptes de test
3. **Préparer** un canal de feedback (WhatsApp group ?)
4. **Définir** les métriques de succès
5. **Planifier** les sessions de test

---

**Dernière mise à jour :** 8 décembre 2024
