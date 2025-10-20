# 🧪 Guide de Debug Progressif

## 📋 Comment utiliser les tests

1. **Ouvrez `App.tsx`** dans votre éditeur
2. **Changez la valeur de `TEST_NUMBER`** (ligne 16)
3. **Sauvegardez** et rechargez http://localhost:8081
4. **Notez le résultat** de chaque test

## 🔍 Tests disponibles

### TEST 1 - App Minimal 🟢
```javascript
const TEST_NUMBER = 1
```
- **Résultat attendu**: Écran VERT avec texte blanc "TEST 1: React Native OK ✅"
- **Si ça marche**: React Native fonctionne correctement
- **Si page blanche**: Problème avec React Native lui-même

### TEST 2 - Avec Redux 🔵
```javascript
const TEST_NUMBER = 2
```
- **Résultat attendu**: Écran BLEU avec texte blanc "TEST 2: Redux OK ✅"
- **Si ça marche**: Redux est bien configuré
- **Si page blanche**: Problème avec le store Redux

### TEST 3 - Avec Theme 🟣
```javascript
const TEST_NUMBER = 3
```
- **Résultat attendu**: Écran VIOLET avec texte blanc "TEST 3: Theme OK ✅"
- **Si ça marche**: ThemeProvider fonctionne
- **Si page blanche**: Problème dans ThemeContext

### TEST 4 - Hook useTheme 🟠
```javascript
const TEST_NUMBER = 4
```
- **Résultat attendu**: Écran ORANGE avec infos du thème
- **Si ça marche**: Le hook useTheme est OK
- **Si écran rouge**: Erreur dans useTheme (voir le message)

### TEST 5 - ConnectivityBanner 🟦
```javascript
const TEST_NUMBER = 5
```
- **Résultat attendu**: Écran CYAN avec bannière de connectivité
- **Si ça marche**: ConnectivityBanner OK
- **Si écran rouge**: Erreur dans ConnectivityBanner (voir le message)

### TEST 6 - MainNavigator 📱
```javascript
const TEST_NUMBER = 6
```
- **Résultat attendu**: Navigation avec tabs en bas
- **Si ça marche**: Navigation principale OK
- **Si écran rouge**: Erreur dans MainNavigator

### TEST 7 - App Complète 🚀
```javascript
const TEST_NUMBER = 7
```
- **Résultat attendu**: Application complète
- **Si ça marche**: Tout fonctionne!
- **Si écran rouge**: Problème dans AppNavigator

## 🔴 En cas d'erreur

Si vous voyez un **écran rouge** avec un message d'erreur:

1. **Ouvrez la console du navigateur** (F12)
2. **Cherchez le message d'erreur** qui commence par "❌ TEST X ERREUR:"
3. **Copiez le message d'erreur complet**

## 💡 Conseils de debug

1. **Commencez TOUJOURS par TEST 1**
2. **N'augmentez le numéro** que si le test précédent réussit
3. **Le premier test qui échoue** indique l'origine du problème
4. **Regardez la console** pour plus de détails

## 🔄 Pour revenir à l'app normale

Renommez les fichiers:
```bash
mv App.tsx App.test-mode.tsx
mv App.original.tsx App.tsx
```

## 📊 Résumé rapide

| Test | Composant testé | Couleur OK | Problème si échec |
|------|----------------|------------|-------------------|
| 1 | React Native seul | VERT 🟢 | Installation RN |
| 2 | + Redux | BLEU 🔵 | Store Redux |
| 3 | + Theme | VIOLET 🟣 | ThemeContext |
| 4 | Hook useTheme | ORANGE 🟠 | useTheme hook |
| 5 | ConnectivityBanner | CYAN 🟦 | ConnectivityBanner |
| 6 | MainNavigator | Navigation | MainNavigator |
| 7 | App complète | App normale | AppNavigator |

---

**🎯 Objectif**: Identifier précisément quel composant cause la page blanche!