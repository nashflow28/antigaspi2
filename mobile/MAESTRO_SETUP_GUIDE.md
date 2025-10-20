# Guide d'Installation - Maestro pour Tests E2E Natifs

## 🎯 Objectif

Tester l'application mobile Antigaspi sur un **vrai appareil Android/iOS** avec Maestro.

---

## 📋 Prérequis

### Option A: Appareil Physique (RECOMMANDÉ - Plus facile)
- ✅ Téléphone Android avec USB debugging activé
- ✅ OU iPhone avec Xcode installé (Mac uniquement)

### Option B: Émulateur
- Android Studio installé avec un AVD (Android Virtual Device)
- OU Xcode avec simulateur iOS (Mac uniquement)

---

## 🚀 Installation de Maestro

### Sur Windows (WSL Recommandé)

#### Option 1: Via WSL (Meilleur choix)
```bash
# Dans WSL Ubuntu
curl -Ls "https://get.maestro.mobile.dev" | bash

# Ajouter au PATH
export PATH="$PATH:$HOME/.maestro/bin"

# Vérifier installation
maestro --version
```

#### Option 2: Téléchargement Manuel
1. Télécharger depuis https://github.com/mobile-dev-inc/maestro/releases
2. Extraire dans `C:\maestro\`
3. Ajouter `C:\maestro\bin` au PATH Windows

### Sur Mac/Linux
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"
maestro --version
```

---

## 📱 Setup Android Emulator

### 1. Installer Android Studio
Télécharger depuis: https://developer.android.com/studio

### 2. Créer un AVD (Android Virtual Device)
```bash
# Ouvrir Android Studio
# Tools > Device Manager > Create Device
# Choisir: Pixel 5 avec API 33 (Android 13)
```

### 3. Lancer l'émulateur
```bash
# Trouver le nom de l'AVD
emulator -list-avds

# Lancer l'émulateur
emulator -avd Pixel_5_API_33
```

### 4. Vérifier connexion
```bash
adb devices
# Devrait afficher: emulator-5554 device
```

---

## 🍎 Setup iOS Simulator (Mac uniquement)

```bash
# Installer Xcode depuis App Store

# Lancer simulateur
open -a Simulator

# Choisir iPhone 14 Pro
```

---

## 🧪 Exécuter les Tests Maestro

### 1. Lancer l'app Antigaspi sur émulateur

#### Option A: Expo Go (Simple)
```bash
cd C:\xampp\htdocs\antigaspi2\mobile

# Lancer Expo
npx expo start

# Scanner le QR code avec Expo Go sur émulateur
# OU presser 'a' pour ouvrir sur Android
```

#### Option B: Build de développement (Recommandé)
```bash
# Créer un build de dev
npx expo install expo-dev-client
eas build --profile development --platform android

# Installer le .apk sur émulateur
adb install app-build.apk

# Lancer Expo
npx expo start --dev-client
```

### 2. Exécuter les tests Maestro
```bash
cd C:\xampp\htdocs\antigaspi2\mobile

# Lancer un test spécifique
maestro test maestro-tests/01-consumer-auth.yaml

# Lancer tous les tests
maestro test maestro-tests/

# Avec rapport HTML
maestro test --format junit maestro-tests/ > test-results.xml
```

---

## 🔍 Debugging

### Maestro Studio (Inspecteur UI)
```bash
# Lancer l'app sur émulateur
# Puis ouvrir Maestro Studio
maestro studio

# Interface graphique pour:
# - Explorer les éléments de l'UI
# - Enregistrer des interactions
# - Générer des tests automatiquement
```

### Logs ADB
```bash
# Voir les logs de l'app
adb logcat | grep "ReactNativeJS"
```

---

## ⚡ Quick Start (15 minutes)

### Setup Express Android
```bash
# 1. Vérifier ADB
adb version

# 2. Connecter téléphone Android via USB
# Activer "USB Debugging" dans Paramètres > Options développeur
adb devices

# 3. Installer Maestro (WSL)
wsl
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"

# 4. Installer Expo Go sur téléphone
# Via Google Play Store

# 5. Lancer Antigaspi
cd /mnt/c/xampp/htdocs/antigaspi2/mobile
npx expo start

# Scanner QR code avec Expo Go

# 6. Exécuter tests
maestro test maestro-tests/01-consumer-auth.yaml
```

---

## 📊 Commandes Utiles

```bash
# Lister les appareils connectés
maestro test --list-devices

# Exécuter sur appareil spécifique
maestro test --device emulator-5554 maestro-tests/01-consumer-auth.yaml

# Mode interactif (step-by-step)
maestro test --debug maestro-tests/01-consumer-auth.yaml

# Générer rapport avec screenshots
maestro test --format html maestro-tests/ -e REPORT_DIR=maestro-reports
```

---

## 🐛 Troubleshooting

### Erreur: "No devices found"
```bash
# Vérifier connexion
adb devices

# Redémarrer ADB
adb kill-server
adb start-server
```

### Erreur: "App not found"
```bash
# Vérifier que l'app est lancée
adb shell pm list packages | grep expo

# Relancer Expo
npx expo start
```

### Tests échouent: "Element not found"
```bash
# Utiliser Maestro Studio pour inspecter
maestro studio

# Vérifier les IDs des éléments dans l'app
```

---

## 📚 Ressources

- Documentation Maestro: https://maestro.mobile.dev/
- Expo + Maestro: https://docs.expo.dev/guides/maestro/
- Android Studio: https://developer.android.com/studio
- ADB Debugging: https://developer.android.com/studio/command-line/adb

---

## ✅ Checklist de Validation

Avant de lancer les tests, vérifier:

- [ ] Maestro installé (`maestro --version`)
- [ ] ADB fonctionne (`adb devices` montre un appareil)
- [ ] Backend Laravel tourne sur `http://localhost:8000`
- [ ] App Antigaspi lancée sur émulateur/téléphone
- [ ] Login visible dans l'app
- [ ] Tests Maestro créés dans `maestro-tests/`

---

**Prochaine étape:** Créer les tests YAML dans `maestro-tests/` (voir fichiers adjacents)
