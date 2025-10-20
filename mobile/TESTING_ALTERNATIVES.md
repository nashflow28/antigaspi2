# 🚨 Solutions Alternatives - Tests E2E Antigaspi Mobile

**Problème:** L'émulateur Android API 35 a crashé (exit code 127)
**Raison:** Conflit probable avec Windows Hypervisor Platform (WHPX) ou drivers GPU

---

## ✅ SOLUTION 1: Téléphone Android Physique (RECOMMANDÉ - 5 minutes)

### Avantages:
- ⚡ Le plus rapide
- ✅ Teste l'app sur vrai matériel
- 🎯 Performance réelle

### Setup:

1. **Activer USB Debugging sur votre téléphone:**
   ```
   Paramètres > À propos du téléphone
   > Appuyer 7 fois sur "Numéro de build"
   > Retour > Options développeur
   > Activer "Débogage USB"
   ```

2. **Connecter via USB et vérifier:**
   ```bash
   adb devices
   # Devrait afficher: XXXXXXXXX device
   ```

3. **Lancer Expo sur téléphone:**
   ```bash
   cd C:\xampp\htdocs\antigaspi2\mobile
   npx expo start
   # Presser 'a' pour Android
   # OU scanner QR code avec Expo Go
   ```

4. **Exécuter tests Maestro:**
   ```bash
   wsl
   cd /mnt/c/xampp/htdocs/antigaspi2/mobile
   ~/.maestro/bin/maestro test maestro-tests/01-consumer-auth.yaml
   ```

**Temps total:** ~5 minutes
**Succès:** 95%

---

## ✅ SOLUTION 2: Créer Émulateur API 33 (Plus stable - 20 minutes)

### Pourquoi API 33 vs 35:
- API 35 (Android 15) est récent → bugs
- API 33 (Android 13) est plus stable
- Fonctionne mieux avec WHPX sur Windows

### Setup:

1. **Ouvrir Android Studio:**
   - Tools > Device Manager > Create Device

2. **Choisir configuration:**
   - Phone: Pixel 5
   - System Image: API 33 (Android 13.0)
   - Télécharger l'image si nécessaire

3. **Créer et lancer:**
   ```bash
   # Lister les AVDs
   /c/Users/Kaled/AppData/Local/Android/Sdk/emulator/emulator.exe -list-avds

   # Lancer le nouvel émulateur
   /c/Users/Kaled/AppData/Local/Android/Sdk/emulator/emulator.exe -avd Pixel_5_API_33
   ```

4. **Attendre boot (~2 min) puis vérifier:**
   ```bash
   adb devices
   # Devrait afficher: emulator-5554 device
   ```

5. **Lancer Expo + Tests:**
   ```bash
   cd /mnt/c/xampp/htdocs/antigaspi2/mobile
   npx expo start
   # Presser 'a'

   ~/.maestro/bin/maestro test maestro-tests/
   ```

**Temps total:** ~20 minutes
**Succès:** 80%

---

## ✅ SOLUTION 3: Tests Manuels Guidés (Fallback - 30 minutes)

Si ni téléphone ni émulateur ne fonctionnent, faire tests manuels avec checklist.

### Checklist Critique (10 tests essentiels):

#### 1. Authentication (5 min)
- [ ] **Test 1.1:** Ouvrir app → Login screen visible
- [ ] **Test 1.2:** Email: `jean.dupont@email.com`, Password: `password` → Login success
- [ ] **Test 1.3:** Voir nom "Jean Dupont" dans app
- [ ] **Test 1.4:** Email invalide → Message d'erreur visible
- [ ] **Test 1.5:** Profil > Déconnexion → Retour login screen

#### 2. Products Browsing (5 min)
- [ ] **Test 2.1:** Tap "Produits" → Liste visible avec prix XOF
- [ ] **Test 2.2:** Voir "Pain complet artisanal" - 250 XOF
- [ ] **Test 2.3:** Tap produit → Détail page avec image
- [ ] **Test 2.4:** Voir "500 XOF" (original) et "250 XOF" (réduit)
- [ ] **Test 2.5:** Voir badge "-50%"

#### 3. Reservations (10 min)
- [ ] **Test 3.1:** Sur détail produit → Bouton "Réserver" visible
- [ ] **Test 3.2:** Quantité par défaut = 1
- [ ] **Test 3.3:** Tap "+" 2 fois → Quantité = 3
- [ ] **Test 3.4:** Tap "Réserver" → Notification succès
- [ ] **Test 3.5:** Tap "Réservations" → Voir nouvelle réservation
- [ ] **Test 3.6:** Tap réservation → Voir total = 750 XOF (250 × 3)
- [ ] **Test 3.7:** Tap "Annuler" → Confirmer → Status "Annulée"

#### 4. Profile (5 min)
- [ ] **Test 4.1:** Tap "Profil" → Voir "Jean Dupont" et "jean.dupont@email.com"
- [ ] **Test 4.2:** Tap "Modifier" → Changer nom → Sauvegarder → Voir nouveau nom
- [ ] **Test 4.3:** Toggle "Mode sombre" → UI change de couleur

#### 5. Offline Mode (5 min)
- [ ] **Test 5.1:** Activer mode avion sur téléphone
- [ ] **Test 5.2:** Créer réservation → Voir "Sera synchronisée" ou bannière offline
- [ ] **Test 5.3:** Désactiver mode avion
- [ ] **Test 5.4:** Attendre → Voir notification "Synchronisé" ou bannière "En ligne"

### Documentation des Résultats:

Créer fichier `MANUAL_TEST_RESULTS.md`:

```markdown
# Tests Manuels Antigaspi - 2025-10-03

## Environment
- Appareil: [iPhone 12 / Samsung Galaxy S21 / etc.]
- OS: [iOS 16 / Android 13]
- Backend: http://localhost:8000 ✅
- Expo version: [voir dans app]

## Résultats

### Authentication
- [ ] Test 1.1: ✅ PASS / ❌ FAIL - [Notes]
- [ ] Test 1.2: ✅ PASS / ❌ FAIL - [Notes]
...

### Bugs Trouvés:
1. **BUG-001:** [Description] - Priorité: CRITICAL/HIGH/MEDIUM/LOW
2. **BUG-002:** ...

### Screenshots:
[Ajouter captures d'écran des bugs]
```

**Temps total:** ~30 minutes
**Avantage:** Feedback immédiat sans setup technique

---

## 🔧 Troubleshooting Émulateur

### Erreur: "Exit code 127"
**Cause:** Émulateur incompatible avec système

**Fixes possibles:**
1. Désactiver Hyper-V dans Windows Features
2. Utiliser API plus ancien (33 au lieu de 35)
3. Mettre à jour drivers GPU
4. Installer Intel HAXM (pour processeurs Intel)

### Erreur: "Emulator doesn't start"
```bash
# Vérifier si émulateur peut démarrer
/c/Users/Kaled/AppData/Local/Android/Sdk/emulator/emulator-check.exe accel

# Lister problèmes
/c/Users/Kaled/AppData/Local/Android/Sdk/emulator/emulator-check.exe accel -verbose
```

### Émulateur lent ou freeze:
```bash
# Lancer avec moins de RAM
emulator -avd Pixel_5_API_33 -memory 2048

# Désactiver audio
emulator -avd Pixel_5_API_33 -no-audio

# Mode rapide (pas de skin)
emulator -avd Pixel_5_API_33 -no-window
```

---

## 📊 Comparaison des Solutions

| Critère | Téléphone USB | Émulateur API 33 | Tests Manuels |
|---------|---------------|------------------|---------------|
| **Setup** | 5 min ⭐⭐⭐⭐⭐ | 20 min ⭐⭐⭐ | 0 min ⭐⭐⭐⭐⭐ |
| **Fiabilité** | 95% ⭐⭐⭐⭐⭐ | 80% ⭐⭐⭐⭐ | 100% ⭐⭐⭐⭐⭐ |
| **Performance** | Réelle ⭐⭐⭐⭐⭐ | Simulée ⭐⭐⭐ | Réelle ⭐⭐⭐⭐⭐ |
| **Automatisation** | ✅ Maestro | ✅ Maestro | ❌ Manuel |
| **Temps tests** | 5 min | 5 min | 30 min |

**Recommandation:** Solution 1 (Téléphone USB) si possible, sinon Solution 3 (Tests manuels)

---

## 🎯 Prochaines Étapes

### Si vous avez un téléphone Android:
```bash
# 1. Connecter téléphone USB
# 2. Activer USB debugging
# 3. Vérifier:
adb devices

# 4. Lancer app:
cd /mnt/c/xampp/htdocs/antigaspi2/mobile
npx expo start
# Presser 'a'

# 5. Tests Maestro:
~/.maestro/bin/maestro test maestro-tests/01-consumer-auth.yaml
```

### Si vous voulez créer émulateur API 33:
1. Ouvrir Android Studio
2. Tools > Device Manager
3. Create Device > Pixel 5 + API 33
4. Launch
5. Retour aux commandes ci-dessus

### Si aucun appareil:
1. Suivre checklist tests manuels (30 min)
2. Documenter bugs dans `MANUAL_TEST_RESULTS.md`
3. Prioriser les bugs critiques
4. Fix bugs puis re-tester

---

## ✅ Tests Maestro Déjà Créés

**Rappel:** Vous avez déjà 22 tests Maestro prêts dans `maestro-tests/`:
- 01-consumer-auth.yaml (3 tests)
- 02-products-browsing.yaml (5 tests)
- 03-create-reservation.yaml (5 tests)
- 04-profile-settings.yaml (5 tests)
- 05-offline-mode.yaml (4 tests)

**Dès que vous avez un appareil fonctionnel**, exécutez:
```bash
~/.maestro/bin/maestro test maestro-tests/
```

Et vous aurez un rapport complet de bugs en 5 minutes! 🚀

---

**Next:** Choisir une des 3 solutions et commencer les tests! 💪
