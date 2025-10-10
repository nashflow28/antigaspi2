# Antigaspi Mobile - Android E2E Tests

## 📋 Description

Suite complète de tests E2E automatisés pour l'application mobile Antigaspi utilisant **uiautomator2** et Python.

## 🧪 Test Suites Disponibles

### 1. Authentication Tests (`test_auth.py`)
Tests d'authentification et gestion de compte.

**6 tests :**
- App loading et splash screen
- Écran de connexion visible
- Login consommateur
- Logout
- Navigation vers inscription
- Validation formulaire inscription

### 2. Product Tests (`test_products.py`)
Tests de navigation et consultation des produits.

**9 tests :**
- Liste de produits visible
- Scroll dans la liste
- Clic sur une carte produit
- Navigation dans les détails
- Retour à l'accueil
- Recherche de produits
- Navigation catégories
- Pull-to-refresh
- Mode paysage/portrait

### 3. Reservation Tests (`test_reservation.py`)
Tests du flux complet de réservation.

**9 tests :**
- Sélection d'un produit
- Affichage détails de réservation
- Clic bouton réserver
- Confirmation de réservation
- Consultation "Mes réservations"
- Détails d'une réservation
- Annulation de réservation
- Historique des réservations
- Filtres de réservations

### 4. Favorites Tests (`test_favorites.py`)
Tests de gestion des favoris.

**5 tests :**
- Ajout aux favoris
- Écran favoris visible
- Scroll dans les favoris
- Retrait des favoris
- Message liste vide

### 5. Profile Tests (`test_profile.py`)
Tests de gestion du profil utilisateur.

**10 tests :**
- Navigation vers profil
- Affichage infos profil
- Scroll options profil
- Navigation édition profil
- Édition formulaire profil
- Annulation édition
- Consultation historique
- Affichage paramètres
- Statistiques profil
- Déconnexion

## 📦 Prérequis

### 1. Android Emulator
```bash
# Lancer l'émulateur depuis Android Studio
# ou via ligne de commande:
emulator -avd Pixel_9
```

### 2. Python Environment
```bash
cd mobile/adb-mcp
# Activer l'environnement virtuel
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

### 3. uiautomator2
```bash
# Déjà installé dans venv, mais pour initialiser sur l'émulateur:
python -m uiautomator2 init
```

### 4. Application Antigaspi
```bash
# Lancer l'app via Expo
cd mobile
npx expo start --android
```

## 🚀 Exécution des Tests

### Exécuter Tous les Tests
```bash
cd mobile/e2e-tests/android
../../../mobile/adb-mcp/venv/Scripts/python.exe run_all_tests.py
```

### Exécuter une Suite Spécifique
```bash
# Tests d'authentification
python test_auth.py

# Tests de produits
python test_products.py

# Tests de réservation
python test_reservation.py

# Tests de favoris
python test_favorites.py

# Tests de profil
python test_profile.py
```

## 📊 Rapport de Tests

### Format de Sortie
```
==================================================
ANTIGASPI MOBILE - E2E TEST SUITE
==================================================

=== TEST 1: App Loads ===
[SCREENSHOT] Saved: test-results/auth/01-app-initial.png
[OK] App loaded successfully

...

==================================================
TEST SUMMARY
==================================================
[PASS] test_01_app_loads
[PASS] test_02_login_screen_visible
[FAIL] test_03_login_consumer

Total: 5/6 tests passed
Screenshots saved in: test-results/auth/
```

### Screenshots
Tous les screenshots sont sauvegardés dans `mobile/test-results/` :
```
test-results/
├── auth/
│   ├── 01-app-initial.png
│   ├── 02-login-screen.png
│   └── ...
├── products/
│   ├── 01-home-screen-products.png
│   └── ...
├── reservation/
│   ├── 01-product-list.png
│   └── ...
├── favorites/
│   ├── 01-home-screen.png
│   └── ...
└── profile/
    ├── 01-profile-screen.png
    └── ...
```

## 🔧 Configuration

### Device Connection
Par défaut, les tests se connectent à `emulator-5554`.

Pour changer le device :
```python
# Dans chaque fichier test
self.device = u2.connect('emulator-5556')  # Autre émulateur
self.device = u2.connect('192.168.1.100')  # Device physique
```

### Test Credentials
Comptes de test utilisés :
```python
# Consommateur
email = "jean.dupont@email.com"
password = "password"

# Commerçant (si nécessaire)
email = "boulangerie.martin@email.com"
password = "password"
```

## 🐛 Debugging

### Vérifier Connection Device
```python
import uiautomator2 as u2
d = u2.connect('emulator-5554')
print(d.device_info)
print(d.window_size())
```

### Inspecter UI Hierarchy
```python
print(d.dump_hierarchy())
```

### Screenshot Manuel
```python
d.screenshot('debug.png')
```

### Logs uiautomator2
```bash
# Voir les logs ADB
adb logcat | grep uiautomator
```

## 📝 Écrire de Nouveaux Tests

### Template de Base
```python
#!/usr/bin/env python3
import uiautomator2 as u2
import time
import os

class TestMyFeature:
    def __init__(self):
        self.device = u2.connect('emulator-5554')
        self.screenshots_dir = 'test-results/my-feature'
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def setup(self):
        """Setup test environment"""
        self.device.press("home")
        self.device.app_start("host.exp.exponent")
        time.sleep(5)
        self.quick_login()

    def quick_login(self):
        """Login helper"""
        width, height = self.device.window_size()
        self.device.click(width // 2, int(height * 0.35))
        self.device.send_keys("jean.dupont@email.com", clear=True)
        self.device.click(width // 2, int(height * 0.45))
        self.device.send_keys("password", clear=True)
        self.device.click(width // 2, int(height * 0.55))
        time.sleep(5)

    def take_screenshot(self, name):
        path = f'{self.screenshots_dir}/{name}.png'
        self.device.screenshot(path)
        print(f"[SCREENSHOT] Saved: {path}")
        return path

    def test_01_my_test(self):
        """Test description"""
        print("\n=== TEST 1: My Test ===")
        self.take_screenshot('01-initial-state')

        # Your test logic here

        print("[OK] Test completed")
        return True

    def run_all_tests(self):
        """Run all tests"""
        self.setup()
        tests = [self.test_01_my_test]

        results = []
        for test in tests:
            try:
                result = test()
                results.append((test.__name__, result))
            except Exception as e:
                print(f"[ERROR] {test.__name__}: {e}")
                results.append((test.__name__, False))

        passed = sum(1 for _, r in results if r)
        print(f"\nTotal: {passed}/{len(results)} passed")
        return passed == len(results)

if __name__ == "__main__":
    tester = TestMyFeature()
    success = tester.run_all_tests()
    exit(0 if success else 1)
```

## 🎯 Best Practices

### 1. Coordination de Clics
Utiliser des positions relatives à la taille d'écran :
```python
width, height = self.device.window_size()
# Top third
self.device.click(width // 2, int(height * 0.3))
# Middle
self.device.click(width // 2, height // 2)
# Bottom
self.device.click(width // 2, int(height * 0.8))
```

### 2. Attente et Timing
```python
time.sleep(2)  # Attente fixe
d.wait_idle()  # Attente UI idle
```

### 3. Screenshots Systématiques
Prendre des screenshots à chaque étape importante :
```python
self.take_screenshot('01-before-action')
# Action
self.take_screenshot('02-after-action')
```

### 4. Vérification de Contenu
```python
screen_content = self.device.dump_hierarchy()
if 'success' in screen_content.lower():
    print("[OK] Action succeeded")
```

### 5. Gestion d'Erreurs
```python
try:
    # Test logic
    return True
except Exception as e:
    print(f"[ERROR] {e}")
    self.take_screenshot('error')
    return False
```

## 📚 Documentation

### uiautomator2 API
- Documentation : https://github.com/openatx/uiautomator2
- Click : `d.click(x, y)`
- Swipe : `d.swipe(x1, y1, x2, y2, duration)`
- Input : `d.send_keys("text", clear=True)`
- Press : `d.press("home")`, `d.press("back")`
- Screenshot : `d.screenshot(path)`

### Android Coordinates
- Top-left : `(0, 0)`
- Bottom-right : `(width, height)`
- Center : `(width // 2, height // 2)`

## 🔗 Ressources

- [uiautomator2 GitHub](https://github.com/openatx/uiautomator2)
- [Android Debug Bridge](https://developer.android.com/tools/adb)
- [Expo Testing Guide](https://docs.expo.dev/develop/development-builds/introduction/)

---

**Dernière mise à jour :** 2025-10-10
**Version :** 1.0.0
**Auteur :** Claude Code
