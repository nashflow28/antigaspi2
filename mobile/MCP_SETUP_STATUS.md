# Status Installation : Android Emulator + MCP Servers

**Date :** 2025-10-07
**Projet :** Antigaspi Mobile - Tests Automatisés Android

---

## ✅ TERMINÉ

### 1. Prérequis (100%)
| Composant | Version | Status |
|-----------|---------|--------|
| **Node.js** | v22.17.0 | ✅ Installé (requis: v22+) |
| **Python** | 3.13.5 | ✅ Installé (requis: 3.13+) |
| **ADB** | 1.0.41 (API 34.0.5) | ✅ Installé (`C:\platform-tools\adb.exe`) |
| **Android Studio** | Latest | ✅ Installé (`C:\Program Files\Android\Android Studio`) |

### 2. mobile-mcp (100%)
- ✅ Installé via npm : `mobile-mcp@0.0.7`
- ✅ 153 packages ajoutés
- ✅ Fonctionne : `npx mobile-mcp --version` → `0.0.7`
- ✅ Prêt pour utilisation avec Android emulators

**Installation :**
```bash
cd mobile
npm install --save-dev mobile-mcp
```

**Test :**
```bash
npx mobile-mcp --version
# Output: 0.0.7
```

---

## 🔄 EN COURS

### 3. adb-mcp (90%)
- ✅ Repository cloné : `mobile/adb-mcp`
- ✅ Environnement virtuel Python créé : `venv`
- 🔄 **Installation des dépendances en cours** (background process)

**Dépendances principales :**
- `uiautomator2` (Android UI automation)
- `mcp` (Model Context Protocol)
- `uiautodev` (UI Inspector)
- `fastapi` + `uvicorn` (HTTP server)
- `pytest` (tests)

**Commande en cours :**
```bash
mobile/adb-mcp/venv/Scripts/python.exe -m pip install -e mobile/adb-mcp
```

**Vérification après installation :**
```bash
mobile/adb-mcp/venv/Scripts/python.exe -c "import uiautomator2; import mcp; print('OK')"
```

---

## ⏳ À FAIRE MANUELLEMENT

### 4. Android SDK + Emulator (0%)

**⚠️ IMPORTANT : Configuration manuelle requise via Android Studio**

#### Étapes à suivre :

**A. Ouvrir Android Studio**
```bash
cd "C:\Program Files\Android\Android Studio\bin"
studio64.exe
```

**B. Installer Android SDK**
1. Dans Android Studio : `Tools` → `SDK Manager`
2. Cocher et installer :
   - ✅ Android SDK Platform (API 34 - Android 14)
   - ✅ Android SDK Build-Tools (latest)
   - ✅ Android Emulator
   - ✅ Intel x86 Emulator Accelerator (HAXM)

3. Noter le chemin du SDK (par défaut : `C:\Users\<USERNAME>\AppData\Local\Android\Sdk`)

**C. Créer un émulateur Android**
1. `Tools` → `Device Manager`
2. `Create Device`
3. **Appareil recommandé :** Pixel 5
4. **Image système :** Android 14.0 (API 34) avec Google APIs
5. **Configuration :**
   - RAM : 2048 MB
   - Heap : 512 MB
   - Internal Storage : 2048 MB
6. Nom : `Pixel_5_API_34_Antigaspi`
7. Créer l'AVD

**D. Configurer variables d'environnement Windows**

1. Ouvrir les variables d'environnement système :
   - `Système` → `Paramètres système avancés` → `Variables d'environnement`

2. Créer nouvelle variable système :
   - **Nom :** `ANDROID_HOME`
   - **Valeur :** `C:\Users\<USERNAME>\AppData\Local\Android\Sdk`

3. Ajouter au PATH système :
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

4. **Redémarrer le terminal/PowerShell**

**E. Vérifier l'installation**
```bash
# Vérifier emulator
emulator -list-avds
# Devrait afficher : Pixel_5_API_34_Antigaspi

# Vérifier ADB
adb version
# Output: Android Debug Bridge version 1.0.41

# Lancer l'émulateur
emulator -avd Pixel_5_API_34_Antigaspi
```

---

## 📊 ANALYSE : Utilité pour Tests Automatisés Antigaspi

### Fonctionnalités mobile-mcp

#### 1. Tests d'Authentification
```typescript
// Test login automatisé
await mobileMcp.tap({ selector: "email-input" })
await mobileMcp.type({ text: "jean.dupont@email.com" })
await mobileMcp.tap({ selector: "password-input" })
await mobileMcp.type({ text: "password" })
await mobileMcp.tap({ selector: "login-button" })
await mobileMcp.waitForElement({ selector: "home-screen" })
```

**Utilité pour Antigaspi :**
- ✅ Tester login Consumer/Merchant
- ✅ Tester logout
- ✅ Tester signup flow
- ✅ Tester forgot password

#### 2. Tests de Navigation
```typescript
// Test navigation produits
await mobileMcp.tap({ selector: "product-card-0" })
await mobileMcp.waitForElement({ selector: "product-details-screen" })
await mobileMcp.tap({ selector: "reserve-button" })
await mobileMcp.waitForElement({ selector: "confirmation-modal" })
```

**Utilité pour Antigaspi :**
- ✅ HomeScreen → ProductDetails → Reservation
- ✅ FavoritesScreen interactions
- ✅ MerchantDetailScreen navigation
- ✅ CartScreen flow

#### 3. Tests Visuels (Screenshots)
```typescript
// Captures d'écran automatiques
await mobileMcp.screenshot({ name: "home-screen-logged-in" })
await mobileMcp.screenshot({ name: "product-list-loaded" })
await mobileMcp.screenshot({ name: "reservation-success" })
```

**Utilité pour Antigaspi :**
- ✅ Visual regression testing
- ✅ Documentation automatique des flows
- ✅ QA screenshots pour review
- ✅ Comparaison avant/après design changes

#### 4. Extraction de Données
```typescript
// Extraire données produits
const productData = await mobileMcp.extractData({
  fields: ['product-name', 'product-price', 'merchant-name']
})
```

**Utilité pour Antigaspi :**
- ✅ Vérifier que les produits s'affichent correctement
- ✅ Valider les prix (format XOF)
- ✅ Tester le tri/filtrage de produits
- ✅ Valider les données merchant

### Fonctionnalités adb-mcp

#### 1. Device Control
```python
# Contrôle avancé du device
adb.start_app(package="com.antigaspi.mobile")
adb.screen_on()
adb.unlock_device()
adb.set_orientation("landscape")
```

**Utilité pour Antigaspi :**
- ✅ Tester en mode paysage/portrait
- ✅ Tester lock/unlock behavior
- ✅ Tester app resume après background
- ✅ Tester notifications

#### 2. UI Inspector
```python
# Inspecter les éléments UI
element = adb.find_element(resourceId="product-card-0")
print(element.bounds, element.text, element.clickable)
```

**Utilité pour Antigaspi :**
- ✅ Identifier les éléments pour tests
- ✅ Débugger les problèmes d'accessibilité
- ✅ Valider les layouts
- ✅ Tester les touch targets (44x44dp minimum)

#### 3. Toast Messages
```python
# Capturer les messages toast
toast = adb.get_last_toast()
assert "Réservation réussie" in toast
```

**Utilité pour Antigaspi :**
- ✅ Valider messages de confirmation
- ✅ Tester messages d'erreur
- ✅ Vérifier traductions
- ✅ Tester UX feedback

#### 4. Gestures Avancés
```python
# Swipe, scroll, pinch-to-zoom
adb.swipe(start_x=500, start_y=1500, end_x=500, end_y=500)
adb.scroll(direction="up", steps=10)
adb.pinch_in(percent=50)  # Zoom out
```

**Utilité pour Antigaspi :**
- ✅ Tester scroll infini de ProductList
- ✅ Tester swipe-to-delete dans FavoritesScreen
- ✅ Tester pull-to-refresh
- ✅ Tester gestures complexes

### Comparaison : Quand Utiliser Chaque Outil ?

| Cas d'usage | Outil recommandé | Raison |
|-------------|------------------|--------|
| **Tests de flux utilisateurs** | mobile-mcp | Plus simple, accessibility-based |
| **Tests Android-spécifiques** | adb-mcp | Contrôle device complet |
| **Visual regression testing** | mobile-mcp | Screenshots intégrés |
| **Debug UI complexe** | adb-mcp | UI Inspector puissant |
| **Tests multi-plateforme** | mobile-mcp | Support iOS + Android |
| **Tests de performance** | adb-mcp | Métriques device détaillées |
| **CI/CD Pipeline** | mobile-mcp | Plus léger, plus rapide |
| **Tests manuels assistés** | adb-mcp | Server HTTP + UI Inspector |

---

## 🎯 Cas d'Usage Spécifiques Antigaspi

### Test Complet : Réservation de Produit

**Avec mobile-mcp :**
```typescript
test('Complete product reservation flow', async () => {
  // 1. Login
  await mobileMcp.tap({ selector: "email-input" })
  await mobileMcp.type({ text: "jean.dupont@email.com" })
  await mobileMcp.tap({ selector: "password-input" })
  await mobileMcp.type({ text: "password" })
  await mobileMcp.tap({ selector: "login-button" })

  // 2. Navigate to product
  await mobileMcp.waitForElement({ selector: "product-list" })
  await mobileMcp.screenshot({ name: "home-screen" })
  await mobileMcp.tap({ selector: "product-card-0" })

  // 3. Reserve product
  await mobileMcp.waitForElement({ selector: "reserve-button" })
  await mobileMcp.screenshot({ name: "product-details" })
  await mobileMcp.tap({ selector: "reserve-button" })

  // 4. Confirm reservation
  await mobileMcp.waitForElement({ selector: "confirm-button" })
  await mobileMcp.tap({ selector: "confirm-button" })

  // 5. Verify success
  await mobileMcp.waitForElement({ selector: "success-message" })
  await mobileMcp.screenshot({ name: "reservation-success" })

  const successText = await mobileMcp.extractData({
    fields: ['success-message-text']
  })
  expect(successText).toContain("Réservation confirmée")
})
```

**Avec adb-mcp :**
```python
def test_complete_reservation_with_rotation():
    # 1. Launch app
    adb.start_app("com.antigaspi.mobile")

    # 2. Login
    adb.tap_element(resourceId="email-input")
    adb.input_text("jean.dupont@email.com")
    adb.tap_element(resourceId="password-input")
    adb.input_text("password")
    adb.tap_element(resourceId="login-button")

    # 3. Test en portrait
    adb.set_orientation("natural")
    adb.screenshot("product-list-portrait.png")

    # 4. Navigate to product
    adb.tap_element(resourceId="product-card-0")
    adb.screenshot("product-details-portrait.png")

    # 5. Test en paysage
    adb.set_orientation("left")
    adb.screenshot("product-details-landscape.png")

    # 6. Reserve product
    adb.tap_element(resourceId="reserve-button")
    adb.tap_element(resourceId="confirm-button")

    # 7. Verify toast
    toast = adb.get_last_toast()
    assert "Réservation confirmée" in toast

    adb.screenshot("reservation-success.png")
```

---

## 🚀 Prochaines Étapes

### Étape 1 : Terminer Installation (Aujourd'hui)
1. ✅ Attendre fin installation adb-mcp (en cours)
2. ⏳ Configurer Android SDK + Emulator (manuel via Android Studio)
3. ⏳ Configurer variables d'environnement ANDROID_HOME

### Étape 2 : Tests Initiaux (Aujourd'hui/Demain)
1. Lancer émulateur : `emulator -avd Pixel_5_API_34_Antigaspi`
2. Lancer app mobile : `cd mobile && npx expo run:android`
3. Tester mobile-mcp : `npx mobile-mcp`
4. Tester adb-mcp : `cd adb-mcp && venv/Scripts/python server.py`

### Étape 3 : Créer Tests E2E (Cette Semaine)
1. Créer `mobile/e2e-tests/android/auth-flow.spec.ts`
2. Créer `mobile/e2e-tests/android/product-reservation.spec.ts`
3. Créer `mobile/e2e-tests/android/visual-regression.spec.ts`

### Étape 4 : Intégration CI/CD (Semaine Prochaine)
1. Ajouter workflow GitHub Actions pour tests Android
2. Configurer Android Emulator dans CI
3. Automatiser screenshots et rapports de tests

---

## 📚 Documentation Complète

- **Guide d'installation** : `mobile/ANDROID_MCP_SETUP_GUIDE.md`
- **Status actuel** : `mobile/MCP_SETUP_STATUS.md` (ce fichier)
- **Tests automatisés** : `mobile/TESTS_AUTOMATIQUES_DETECTION_BUGS.md`
- **Git hooks** : `GIT_HOOKS_GUIDE.md`

---

## 🎉 Conclusion

### Ce Qui Fonctionne Déjà
- ✅ mobile-mcp installé et prêt
- ✅ Tous les prérequis (Node.js, Python, ADB)
- ✅ Backend Laravel sur port 8000
- ✅ Frontend Vue.js sur port 3000
- ✅ Mobile Expo Web sur port 9001

### Ce Qui Reste À Faire
- ⏳ Terminer installation adb-mcp (5-10 min)
- ⏳ Configurer Android SDK + Emulator (15-20 min manuel)
- ⏳ Premier test avec émulateur (5 min)

### Impact Attendu
Une fois configuré, tu pourras :
- ✅ Tester automatiquement tous les flows utilisateurs
- ✅ Détecter les bugs avant les commits
- ✅ Générer des screenshots automatiques
- ✅ Valider l'UX sur Android en quelques secondes

**Temps total économisé par cycle de test :** ~30 minutes → ~2 minutes (automatisé)

---

**Dernière mise à jour :** 2025-10-07 14:45
**Auteur :** Claude Code
**Status global :** 75% completé
