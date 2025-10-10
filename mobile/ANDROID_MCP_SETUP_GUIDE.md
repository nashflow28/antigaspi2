# Guide Complet : Android Emulator + MCP Servers

## 📋 Analyse des Prérequis

### ✅ Déjà Installé
- **Node.js** : v22.17.0 ✅ (requis : v22+ pour mobile-mcp)
- **Python** : 3.13.5 ✅ (requis : 3.13+ pour adb-mcp)
- **ADB** : version 1.0.41 (34.0.5) ✅ installé dans `C:\platform-tools\adb.exe`
- **Android Studio** : ✅ installé dans `C:\Program Files\Android\Android Studio`

### ❌ À Configurer
- **Android SDK** : Non configuré (ANDROID_HOME non défini)
- **Android Emulator** : Non installé
- **AVD (Android Virtual Device)** : Aucun émulateur créé
- **mobile-mcp** : À installer
- **adb-mcp** : À installer

---

## 🎯 Analyse des MCP Servers pour Antigaspi Mobile

### 1. **mobile-mcp** (Recommandé pour React Native)

**Documentation :** https://github.com/mobile-next/mobile-mcp

#### Fonctionnalités Clés :
- ✅ **Automatisation cross-platform** (Android + iOS simulateurs)
- ✅ **Accessibility tree natif** (rapide et léger)
- ✅ **Screenshot-based analysis** (fallback)
- ✅ **Extraction de données structurées** depuis les écrans
- ✅ **Compatible avec React Native** et apps natives

#### Utilité pour Antigaspi Mobile :
| Feature | Cas d'usage Antigaspi |
|---------|----------------------|
| **UI Testing** | Tester les flux d'authentification (login/signup) |
| **Navigation Testing** | Valider la navigation entre HomeScreen → ProductDetails → Favorites |
| **Form Automation** | Remplir automatiquement les formulaires de réservation |
| **Screenshot Testing** | Captures d'écran automatiques pour tests visuels |
| **Data Extraction** | Extraire les produits affichés pour validation |
| **Interaction Testing** | Tester les gestes (swipe, tap, scroll) sur ProductList |

#### Exemples de Tests Possibles :
```javascript
// Automatiser le login
await mobile.tap({selector: "email-input"})
await mobile.type({text: "jean.dupont@email.com"})
await mobile.tap({selector: "password-input"})
await mobile.type({text: "password"})
await mobile.tap({selector: "login-button"})

// Vérifier que HomeScreen s'affiche
await mobile.screenshot({name: "home-screen"})
await mobile.assertVisible({selector: "product-list"})

// Tester le flux de réservation
await mobile.tap({selector: "product-card-0"})
await mobile.tap({selector: "reserve-button"})
await mobile.tap({selector: "confirm-reservation"})
```

---

### 2. **adb-mcp** (Spécialisé Android)

**Documentation :** https://github.com/nim444/mcp-android-server-python

#### Fonctionnalités Clés :
- ✅ **25+ commandes ADB** pour contrôle total
- ✅ **uiautomator2** pour interactions UI avancées
- ✅ **Device management** (start/stop apps, screen control)
- ✅ **UI Inspector** (uiauto.dev)
- ✅ **Toast messages** capture
- ✅ **Screenshot & video recording**

#### Utilité pour Antigaspi Mobile :
| Feature | Cas d'usage Antigaspi |
|---------|----------------------|
| **App Management** | Lancer/arrêter l'app Antigaspi automatiquement |
| **Screen Control** | Tester le comportement en mode veille/réveil |
| **UI Inspector** | Identifier les éléments UI pour les tests |
| **Toast Validation** | Vérifier les messages de confirmation (ex: "Réservation réussie") |
| **Device Info** | Valider la compatibilité avec différentes versions Android |
| **Swipe/Scroll** | Tester le scroll infini de la liste de produits |
| **Text Input** | Automatiser les formulaires complexes |

#### Exemples de Tests Possibles :
```python
# Lancer l'app Antigaspi
adb.start_app(package="com.antigaspi.mobile")

# Vérifier l'écran actuel
screen_info = adb.get_device_info()

# Tapper sur un élément spécifique
adb.tap(x=500, y=1000)

# Swiper pour scroller la liste de produits
adb.swipe(start_x=500, start_y=1500, end_x=500, end_y=500)

# Capturer un toast message
toast = adb.get_last_toast()
assert "Réservation réussie" in toast

# Prendre une screenshot
adb.screenshot(path="/tests/screenshots/product-list.png")
```

---

## 🔄 Comparaison : mobile-mcp vs adb-mcp

| Critère | mobile-mcp | adb-mcp |
|---------|-----------|---------|
| **Plateforme** | Android + iOS | Android uniquement |
| **Langage** | Node.js (TypeScript) | Python |
| **Approche** | Accessibility tree + screenshots | ADB + uiautomator2 |
| **Poids** | Léger | Moyen |
| **Intégration React Native** | Excellente | Bonne |
| **AI-friendly** | Oui (MCP natif) | Oui (MCP natif) |
| **Complexité setup** | Faible | Moyenne |
| **Tests visuels** | ✅ Excellent | ✅ Bon |
| **Performance** | Rapide | Moyen |
| **Debugging** | Screenshots auto | UI Inspector + screenshots |

**Recommandation :** Utiliser **mobile-mcp** pour les tests de flux utilisateurs et **adb-mcp** pour les tests Android-spécifiques avancés.

---

## 📦 Étape 1 : Configuration Android SDK + Emulator

### Option A : Via Android Studio (Recommandé - GUI)

1. **Ouvrir Android Studio**
   ```bash
   cd "C:\Program Files\Android\Android Studio\bin"
   studio64.exe
   ```

2. **Ouvrir SDK Manager**
   - Menu : `Tools` → `SDK Manager`
   - Ou : `Configure` → `SDK Manager` (page d'accueil)

3. **Installer les packages requis**
   - ✅ **Android SDK Platform** (dernière version, ex: Android 14.0 / API 34)
   - ✅ **Android SDK Build-Tools** (dernière version)
   - ✅ **Android Emulator**
   - ✅ **Android SDK Platform-Tools** (si pas déjà fait)
   - ✅ **Intel x86 Emulator Accelerator (HAXM)** (pour performance)

4. **Noter le chemin du SDK**
   - Par défaut : `C:\Users\<USERNAME>\AppData\Local\Android\Sdk`
   - Ou chemin personnalisé si modifié

5. **Créer un AVD (Android Virtual Device)**
   - Menu : `Tools` → `Device Manager`
   - Cliquer sur `Create Device`
   - Choisir un appareil : **Pixel 5** (recommandé pour React Native)
   - Choisir une image système : **Android 14.0 (API 34)** avec Google APIs
   - Configuration :
     - RAM : 2048 MB (minimum)
     - Heap : 512 MB
     - Internal Storage : 2048 MB
   - Donner un nom : `Pixel_5_API_34_Antigaspi`

6. **Configurer les variables d'environnement**
   ```bash
   # Ajouter dans les variables d'environnement système (via GUI Windows)
   ANDROID_HOME = C:\Users\<USERNAME>\AppData\Local\Android\Sdk

   # Ajouter au PATH :
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

7. **Vérifier l'installation**
   ```bash
   # Redémarrer le terminal puis :
   emulator -list-avds
   # Devrait afficher : Pixel_5_API_34_Antigaspi
   ```

### Option B : Via Command Line (Avancé)

```bash
# Télécharger Android SDK Command Line Tools
# https://developer.android.com/studio#command-tools

# Extraire dans C:\android-sdk

# Installer les packages
cd C:\android-sdk\cmdline-tools\latest\bin
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0" "emulator" "system-images;android-34;google_apis;x86_64"

# Créer un AVD
avdmanager create avd -n Pixel_5_API_34 -k "system-images;android-34;google_apis;x86_64" -d "pixel_5"

# Lancer l'émulateur
emulator -avd Pixel_5_API_34 &
```

---

## 📦 Étape 2 : Installer mobile-mcp (Node.js)

### Installation

```bash
# Option 1 : Via npx (recommandé)
npx -y mobile-mcp

# Option 2 : Installation globale
npm install -g mobile-mcp

# Option 3 : Ajouter au projet mobile
cd mobile
npm install --save-dev mobile-mcp
```

### Configuration pour Claude Code

Ajouter dans les settings MCP de Claude Code :

```json
{
  "mobile-mcp": {
    "command": "npx",
    "args": ["-y", "mobile-mcp"]
  }
}
```

### Test de mobile-mcp

```bash
# Démarrer un émulateur Android
emulator -avd Pixel_5_API_34_Antigaspi &

# Vérifier qu'il est détecté
adb devices
# Devrait afficher : emulator-5554	device

# Lancer l'app Antigaspi sur l'émulateur
cd mobile
npx expo run:android

# Tester mobile-mcp
npx mobile-mcp
```

---

## 📦 Étape 3 : Installer adb-mcp (Python)

### Prérequis

```bash
# Vérifier Python (déjà installé ✅)
python --version
# Output: Python 3.13.5

# Installer uv (package manager Python rapide)
pip install uv
```

### Installation

```bash
# Cloner le repository
cd C:\xampp\htdocs\antigaspi2\mobile
git clone https://github.com/nim444/mcp-android-server-python.git adb-mcp
cd adb-mcp

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel (Windows)
venv\Scripts\activate

# Installer les dépendances
uv pip install -r requirements.txt

# Ou avec pip standard
pip install -r requirements.txt
```

### Configuration

```bash
# Vérifier que ADB fonctionne
adb devices

# Activer le serveur uiautomator2 sur l'émulateur
python -m uiautomator2 init

# Lancer le serveur adb-mcp
uvicorn server:app --factory --host 0.0.0.0 --port 8001
```

### Configuration pour Claude Code

Ajouter dans les settings MCP de Claude Code :

```json
{
  "adb-mcp": {
    "command": "python",
    "args": ["C:/xampp/htdocs/antigaspi2/mobile/adb-mcp/server.py"],
    "env": {
      "PYTHONPATH": "C:/xampp/htdocs/antigaspi2/mobile/adb-mcp"
    }
  }
}
```

### Test de adb-mcp

```bash
# Démarrer l'émulateur
emulator -avd Pixel_5_API_34_Antigaspi &

# Vérifier la connexion
adb devices

# Tester uiautomator2
python -c "import uiautomator2 as u2; d = u2.connect(); print(d.info)"

# Lancer le serveur
cd adb-mcp
uvicorn server:app --factory --host 0.0.0.0 --port 8001

# Dans un autre terminal, tester l'API
curl http://localhost:8001/health
```

---

## 🧪 Étape 4 : Intégration avec Tests Automatisés Antigaspi

### Cas d'usage : Tests E2E avec mobile-mcp

**Créer :** `mobile/e2e-tests/mobile-mcp/auth-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Antigaspi Mobile - Authentication Flow', () => {
  test.beforeAll(async () => {
    // Lancer l'émulateur et l'app via mobile-mcp
    await mobileMcp.startEmulator('Pixel_5_API_34_Antigaspi')
    await mobileMcp.launchApp('com.antigaspi.mobile')
  })

  test('User can login successfully', async () => {
    // Naviguer vers l'écran de login
    await mobileMcp.waitForElement({ selector: 'email-input' })

    // Remplir le formulaire
    await mobileMcp.tap({ selector: 'email-input' })
    await mobileMcp.type({ text: 'jean.dupont@email.com' })

    await mobileMcp.tap({ selector: 'password-input' })
    await mobileMcp.type({ text: 'password' })

    await mobileMcp.tap({ selector: 'login-button' })

    // Vérifier la navigation vers HomeScreen
    await mobileMcp.waitForElement({ selector: 'home-screen' })

    const screenshot = await mobileMcp.screenshot({ name: 'login-success' })
    expect(screenshot).toBeTruthy()

    // Vérifier que les produits s'affichent
    const productsVisible = await mobileMcp.isVisible({ selector: 'product-list' })
    expect(productsVisible).toBe(true)
  })

  test('User can navigate to product details', async () => {
    // Tapper sur le premier produit
    await mobileMcp.tap({ selector: 'product-card-0' })

    // Vérifier l'écran de détails
    await mobileMcp.waitForElement({ selector: 'product-details-screen' })

    // Extraire les données du produit
    const productData = await mobileMcp.extractData({
      fields: ['product-name', 'product-price', 'merchant-name']
    })

    expect(productData.productName).toBeTruthy()
    expect(productData.productPrice).toMatch(/\d+ XOF/)
  })

  test.afterAll(async () => {
    await mobileMcp.stopApp()
    await mobileMcp.stopEmulator()
  })
})
```

### Cas d'usage : Tests avancés avec adb-mcp

**Créer :** `mobile/e2e-tests/adb-mcp/device-rotation.spec.py`

```python
import pytest
import uiautomator2 as u2
from adb_mcp import AdbMcp

@pytest.fixture
def device():
    """Connect to Android device/emulator"""
    d = u2.connect()
    yield d
    d.app_stop('com.antigaspi.mobile')

def test_product_list_rotation(device):
    """Test product list adapts to device rotation"""

    # Lancer l'app
    device.app_start('com.antigaspi.mobile')

    # Mode portrait
    device.set_orientation('n')  # natural (portrait)
    device.screenshot('product-list-portrait.png')

    # Vérifier que les produits sont visibles
    assert device(resourceId='product-list').exists()

    # Mode paysage
    device.set_orientation('l')  # landscape
    device.screenshot('product-list-landscape.png')

    # Vérifier que la liste s'adapte
    assert device(resourceId='product-list').exists()
    product_count_landscape = device(resourceId='product-card').count

    # Retour en portrait
    device.set_orientation('n')
    product_count_portrait = device(resourceId='product-card').count

    # Validation
    assert product_count_landscape > 0
    assert product_count_portrait > 0

def test_toast_message_on_reservation(device):
    """Test toast message appears after successful reservation"""

    device.app_start('com.antigaspi.mobile')

    # Naviguer vers un produit
    device(resourceId='product-card-0').click()
    device(resourceId='reserve-button').click()
    device(resourceId='confirm-button').click()

    # Capturer le toast
    toast = device.toast.get_message()

    assert 'Réservation réussie' in toast or 'Reservation successful' in toast

    device.screenshot('reservation-success-toast.png')
```

---

## 🚀 Étape 5 : Scripts NPM pour Automatisation

Ajouter dans `mobile/package.json` :

```json
{
  "scripts": {
    "android:emulator": "emulator -avd Pixel_5_API_34_Antigaspi",
    "android:start": "npx expo run:android",
    "test:mobile-mcp": "npx mobile-mcp",
    "test:adb-mcp": "cd adb-mcp && uvicorn server:app --factory --host 0.0.0.0 --port 8001",
    "test:e2e:android": "npm run android:emulator & npm run android:start & npx playwright test --config=playwright.config.android.ts"
  }
}
```

---

## 📊 Résumé des Avantages pour Antigaspi Mobile

### Tests Automatisés Possibles :

1. **Flux d'authentification complet**
   - Login consumer/merchant
   - Signup avec validation
   - Password reset

2. **Navigation et user journeys**
   - HomeScreen → ProductDetails → Reservation
   - FavoritesScreen interactions
   - MerchantDetailScreen

3. **Formulaires et interactions**
   - Remplissage automatique des formulaires
   - Validation des champs
   - Messages d'erreur

4. **Tests visuels**
   - Screenshots automatiques pour comparaison
   - Tests de régression visuelle
   - Validation du design responsive

5. **Tests de performance**
   - Temps de chargement des listes
   - Scroll performance
   - Navigation fluide

6. **Tests d'accessibilité**
   - Vérification des labels
   - Navigation au clavier (future feature)
   - Contraste et tailles de texte

---

## 🎯 Prochaines Étapes

1. ✅ **Configurer Android SDK + Emulator** (Étape 1)
2. ✅ **Installer mobile-mcp** (Étape 2)
3. ✅ **Installer adb-mcp** (Étape 3)
4. ✅ **Créer les premiers tests E2E** (Étape 4)
5. ✅ **Intégrer dans CI/CD** (GitHub Actions)

---

**Date de création :** 2025-10-07
**Auteur :** Claude Code
**Version :** 1.0.0
