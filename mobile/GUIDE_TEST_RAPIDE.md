# 🚀 Guide de Test Rapide - Produits Merchant

**Temps estimé:** 2 minutes

---

## 📱 Test 1: Vérifier Affichage des Produits Existants

### Étapes:

1. **Ouvre l'émulateur Android** (doit déjà tourner)

2. **Sur l'app mobile, déconnecte-toi et reconnecte-toi :**
   - Va sur l'onglet Profil
   - Appuie sur "Déconnexion"
   - Login avec:
     - Email: `merchant@antigaspi.com`
     - Password: `password`

3. **Va sur "Mes Produits"** (onglet au milieu)

4. **Tire vers le bas** pour rafraîchir (pull-to-refresh)

### ✅ Résultat Attendu:

Tu devrais voir **23 produits**, incluant :
- Viande tendre (5000 → 2500 XOF)
- Agneau (4000 → 3000 XOF)
- Test curl product
- Pain complet artisanal
- Croissants artisanaux
- etc.

### ❌ Si Problème:

Regarde les logs Metro dans le terminal :

```bash
# Cherche ces lignes :
LOG  Erreur chargement produits: [Error details]
ERROR ❌ Error status: 401
```

Si tu vois **401 Unauthorized**, c'est le token expiré. La déconnexion/reconnexion devrait avoir résolu ça.

---

## 🆕 Test 2: Créer un Nouveau Produit

### Étapes:

1. **Sur "Mes Produits", appuie sur le bouton "+"** (en haut à droite)

2. **Remplis le formulaire :**
   - Nom: `Poulet rôti`
   - Description: `Poulet rôti de la veille`
   - Prix original: `3000`
   - Prix réduit: `1500`
   - Quantité: `8`
   - Laisse la date d'expiration vide (sera auto-générée)

3. **Appuie sur "Créer le produit"**

### ✅ Résultat Attendu:

Tu verras dans les **logs Metro** :

```
 LOG  🔴 handleSubmit appelé
 LOG  Form data: {name: "Poulet rôti", originalPrice: "3000", ...}
 LOG  ✅ Validation réussie !
 LOG  📤 Envoi requête API: POST /products
 LOG  📦 Données envoyées: {
   "name": "Poulet rôti",
   "original_price": 3000,
   "discounted_price": 1500,
   ...
 }
 LOG  ✅ Réponse API reçue: {
   "success": true,
   "data": {
     "id": 42,
     "name": "Poulet rôti",
     ...
   }
 }
 LOG  🔙 Navigation retour vers liste produits
```

Puis **Alert "Succès : Produit créé avec succès"**

Et tu reviens sur la liste avec **24 produits** (le nouveau "Poulet rôti" en tête de liste).

### ❌ Si Erreur:

Les logs vont afficher l'erreur détaillée :

```
 ERROR  ❌ ERREUR COMPLÈTE: [Error]
 ERROR  ❌ Error response: {...}
 ERROR  ❌ Error status: 422
 ERROR  ❌ Message erreur affiché: The expiration date must be a date after today.
```

Et tu verras une **Alert avec le message d'erreur clair**.

---

## 🔍 Vérification Finale

### Dans les Logs Metro:

Cherche ces patterns :

**✅ BON SIGNE :**
```
LOG  ✅ Réponse API reçue: {success: true, ...}
LOG  🔙 Navigation retour
```

**❌ MAUVAIS SIGNE :**
```
ERROR  ❌ Error status: 401
ERROR  ❌ Message erreur affiché: Session expirée
```

**⚠️ ATTENTION :**
```
ERROR  ❌ Error status: 422
ERROR  ❌ Message erreur: The expiration date must be a date after today
```
→ Problème de validation (date d'expiration invalide)

---

## 📊 Commandes de Vérification Backend

Si tu veux vérifier que le produit a bien été créé en base :

```bash
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT id, name, original_price, discounted_price, created_at FROM products ORDER BY created_at DESC LIMIT 5;" antigaspi_fresh
```

Tu devrais voir ton nouveau produit en haut de la liste.

---

## 🎯 Résumé des 3 Actions Effectuées

### ✅ 1. Ajout Logs de Debug
- Logs à chaque étape (validation, upload image, envoi API, réponse)
- Logs détaillés des erreurs (status, data, message)

### ✅ 2. Amélioration Gestion d'Erreur
- Messages spécifiques selon type d'erreur (401, 422, etc.)
- Affichage clair à l'utilisateur avec Alert
- Erreurs de validation affichées en détail

### ✅ 3. Vérification Database/API
- ✅ Produits existent en DB (Viande tendre id 39, Agneau id 40)
- ✅ API retourne les 23 produits correctement
- ✅ Code mobile utilise le bon endpoint

---

## 💡 Conseils

**Si les produits ne s'affichent toujours pas :**

1. **Vérifie que tu es bien connecté** comme Marc Commerçant (merchant@antigaspi.com)
2. **Force le reload** de l'app : Dans Metro terminal, appuie sur `r`
3. **Clear cache** : Dans Metro terminal, appuie sur `Shift + d` puis choisis "Clear cache"
4. **Redémarre l'app** : Ferme et rouvre l'app sur l'émulateur

**Si erreur 401 (Session expirée) :**

→ Déconnecte-toi et reconnecte-toi

**Si erreur 422 (Validation) :**

→ Regarde le message d'erreur détaillé dans l'Alert

---

**📝 Créé le 18 Octobre 2025 23:30**
**🤖 Par Claude Code**
