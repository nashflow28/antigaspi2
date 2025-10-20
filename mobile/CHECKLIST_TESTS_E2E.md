# ✅ Checklist Tests E2E Manuels - Antigaspi Mobile

**📱 App lancée sur:** Émulateur Pixel_9 (emulator-5554)
**🔧 Backend:** http://127.0.0.1:8000 ✅
**⏱️ Temps estimé:** 20 minutes

---

## ✅ **1. AUTHENTICATION (5 min)**

- [ ] **1.1** - Login screen visible
  - Voir Email + Password + "Se connecter"

- [ ] **1.2** - Login valide
  - Email: `jean.dupont@email.com`
  - Password: `password`
  - ✅ Voir "Jean Dupont" après login

- [ ] **1.3** - Login invalide
  - Email: `invalid@test.com` / Password: `wrong`
  - ✅ Message d'erreur visible

- [ ] **1.4** - Profil visible
  - Tap "Profil"
  - ✅ Voir email et nom

- [ ] **1.5** - Logout
  - Tap "Déconnexion"
  - ✅ Retour login screen

---

## ✅ **2. PRODUCTS (5 min)**

- [ ] **2.1** - Liste produits
  - Tap "Produits"
  - ✅ Voir produits avec prix XOF

- [ ] **2.2** - Produit "Pain complet"
  - ✅ 250 XOF / 500 XOF / -50%

- [ ] **2.3** - Détail produit
  - Tap sur produit
  - ✅ Image + Description + Marchand + "Réserver"

- [ ] **2.4** - Navigation retour
  - ✅ Retour liste

- [ ] **2.5** - Scroll
  - ✅ Plus de produits ou fin de liste

---

## ✅ **3. RESERVATIONS (7 min)**

- [ ] **3.1** - Quantité = 1 par défaut

- [ ] **3.2** - Bouton "+" fonctionne
  - Tap + → Quantité = 2

- [ ] **3.3** - Créer réservation
  - Tap "Réserver"
  - ✅ Notification succès

- [ ] **3.4** - Voir dans liste
  - Tap "Réservations"
  - ✅ Réservation visible

- [ ] **3.5** - Détail réservation
  - ✅ Quantité + Prix total corrects

- [ ] **3.6** - Annuler
  - Tap "Annuler" → Confirmer
  - ✅ Status "Annulée"

- [ ] **3.7** - Onglet annulées
  - ✅ Voir réservation annulée

---

## ✅ **4. PROFILE (3 min)**

- [ ] **4.1** - Info profil
  - ✅ Nom + Email + Rôle

- [ ] **4.2** - Modifier nom
  - Tap "Modifier" → Changer nom → Enregistrer
  - ✅ Nom changé visible

- [ ] **4.3** - Dark mode
  - Toggle "Mode sombre"
  - ✅ UI change couleur

---

## 📝 **BUGS TROUVÉS**

Documenter ici:

**BUG-001:**
- Test: [Numéro test]
- Attendu: [...]
- Obtenu: [...]
- Priorité: CRITICAL/HIGH/MEDIUM/LOW

**BUG-002:**
[...]

---

**✅ TOUT PASSE:** App fonctionne! 🎉  
**❌ BUGS TROUVÉS:** Les documenter et me dire! 🔧
