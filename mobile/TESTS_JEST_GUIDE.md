# 🧪 Guide des Tests Jest - Antigaspi Mobile

## 📋 Vue d'ensemble

Ce guide explique comment utiliser les tests automatiques Jest pour détecter rapidement les bugs dans l'application mobile Antigaspi.

## ✅ Ce que Jest PEUT détecter automatiquement

### 1. **Bugs de logique métier**
- Filtres de produits par catégorie
- Calculs de prix et remises
- Gestion des stocks (quantité disponible)
- Transformation des données (API → UI)

### 2. **Bugs de crash/erreurs**
- Composants qui plantent au chargement
- Erreurs JavaScript non gérées
- Problèmes de typage TypeScript

### 3. **Bugs Redux (State Management)**
- Actions Redux qui échouent
- State mal mis à jour
- Selectors incorrects

## ❌ Ce que Jest NE PEUT PAS détecter

- ❌ Bugs visuels (layout, couleurs, positions CSS)
- ❌ Bugs d'intégration API réelle
- ❌ Performances
- ❌ Interactions tactiles (swipe, scroll)

---

## 🚀 Commandes disponibles

### Lancer TOUS les tests
```bash
npm test
```

### Lancer les tests en mode watch (relance automatique)
```bash
npm run test:watch
```

### Lancer les tests avec rapport de couverture
```bash
npm run test:coverage
```

### Lancer des tests spécifiques
```bash
# Tester uniquement HomeScreen
npm test -- HomeScreen

# Tester uniquement ProductDetailsScreen
npm test -- ProductDetails

# Tester uniquement Redux
npm test -- productsSlice
```

---

## 📊 Interpréter les résultats

### ✅ Tests réussis
```
PASS  src/screens/main/__tests__/HomeScreen.test.tsx
  ✓ displays products correctly (45ms)
  ✓ filters products by category (62ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```
**= Aucun bug détecté dans la logique testée** ✅

### ❌ Tests échoués
```
FAIL  src/screens/main/__tests__/HomeScreen.test.tsx
  ✕ filters products by category (152ms)

  ● HomeScreen › filters products by category

    expect(received).toBeNull()

    Received: <Text>Bananes mûres</Text>
```
**= BUG DÉTECTÉ : Le filtre ne marche pas correctement** ❌

---

## 🐛 Tests créés pour détecter les bugs

### **HomeScreen.test.tsx**
| Test | But |
|------|-----|
| `renders without crashing` | Détecte les erreurs de chargement |
| `displays products correctly` | Vérifie l'affichage des produits |
| `filters products by category` | Détecte les bugs de filtre catégorie |
| `filters out unavailable products` | Vérifie le filtre "Disponible uniquement" |
| `displays prices in F CFA format` | Vérifie le format des prix |
| `navigates to product details` | Teste la navigation |
| `clears filters correctly` | Vérifie le bouton "Effacer filtres" |

### **ProductDetailsScreen.test.tsx**
| Test | But |
|------|-----|
| `renders without crashing` | Détecte les erreurs de chargement |
| `displays product details correctly` | Vérifie l'affichage complet |
| `displays prices in F CFA format` | Vérifie le format des prix |
| `shows "Réserver" button when available` | Teste l'état disponible |
| `shows "Rupture de stock" when unavailable` | Teste l'état indisponible |

### **productsSlice.test.ts**
| Test | But |
|------|-----|
| `fetchProducts updates state correctly` | Vérifie Redux |
| `handles API errors properly` | Teste la gestion d'erreurs |
| `filters products correctly` | Vérifie la logique de filtrage |
| `parses price strings correctly` | Teste le parsing des prix |

---

## 🔧 Workflow de développement recommandé

### 📝 Avant de commencer une modification

```bash
# Terminal 1 : Dev server
npm start

# Terminal 2 : Tests en watch mode
npm run test:watch
```

Les tests se relancent automatiquement à chaque sauvegarde ! ⚡

### ✅ Après avoir fait une modification

1. **Vérifier que les tests passent**
   ```bash
   npm test
   ```

2. **Si un test échoue :**
   - Lire le message d'erreur
   - Identifier le bug
   - Corriger le code
   - Relancer les tests

3. **Avant de commit :**
   ```bash
   npm test && npm run type-check
   ```

---

## 🎯 Exemples concrets

### Exemple 1 : Bug de filtre catégorie détecté

**Code bugué :**
```typescript
// ❌ BUG : utilise category_id qui n'existe pas
const filtered = products.filter(p => p.category_id === selectedCategory)
```

**Test qui échoue :**
```
✕ filters products by category
  Expected null but received <Text>Bananes mûres</Text>
```

**Correction :**
```typescript
// ✅ FIX : utilise category.id
const filtered = products.filter(p => p.category.id === selectedCategory)
```

**Test réussit :**
```
✓ filters products by category (45ms)
```

---

### Exemple 2 : Bug de prix détecté

**Code bugué :**
```typescript
// ❌ BUG : affiche en €
<Text>{price}€</Text>
```

**Test qui échoue :**
```
✕ displays prices in F CFA format
  Unable to find text matching /F CFA/i
```

**Correction :**
```typescript
// ✅ FIX : affiche en F CFA
<Text>{price} F CFA</Text>
```

---

## 📈 Couverture de code

### Voir la couverture
```bash
npm run test:coverage
```

### Résultat exemple
```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
HomeScreen.tsx      |   85.5  |   78.3   |   92.1  |   84.2
ProductDetails.tsx  |   78.9  |   65.4   |   81.3  |   77.5
productsSlice.ts    |   94.2  |   88.7   |   96.5  |   93.8
```

**Objectif : > 80% de couverture sur les fichiers critiques**

---

## 🚨 Limitations importantes

### Tests Jest ne remplacent PAS :

1. **Tests manuels** - Toujours tester visuellement après modification
2. **Tests E2E** - Pour tester l'intégration complète
3. **Tests backend** - Lancer `php artisan test` séparément

### Checklist rapide post-modification

- [ ] Tests Jest passent (`npm test`)
- [ ] Tests visuels OK (tester dans Expo Go)
- [ ] Tests backend OK (`php artisan test`)
- [ ] Build réussit (`npm run build`)

---

## 🛠️ Dépannage

### Problème : Tests ne se lancent pas
```bash
# Nettoyer le cache Jest
npm test -- --clearCache

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

### Problème : Erreur "Cannot find module"
```bash
# Vérifier que tous les packages sont installés
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

### Problème : Tests trop lents
```bash
# Lancer uniquement les tests modifiés
npm test -- --onlyChanged

# Limiter aux tests d'un dossier
npm test -- src/screens
```

---

## 📝 Ajouter de nouveaux tests

### Créer un nouveau test

1. **Créer le fichier**
   ```
   src/components/MyComponent/__tests__/MyComponent.test.tsx
   ```

2. **Structure de base**
   ```typescript
   import { render } from '@testing-library/react-native'
   import { Provider } from 'react-redux'
   import { ThemeProvider } from '../../../theme/ThemeContext'
   import MyComponent from '../MyComponent'
   import { createTestStore } from '../../../test-utils'

   describe('MyComponent', () => {
     it('renders correctly', () => {
       const store = createTestStore()
       const { getByText } = render(
         <Provider store={store}>
           <ThemeProvider>
             <MyComponent />
           </ThemeProvider>
         </Provider>
       )

       expect(getByText('My Component')).toBeTruthy()
     })
   })
   ```

3. **Lancer le test**
   ```bash
   npm test -- MyComponent
   ```

---

## 🎓 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**📅 Dernière mise à jour :** ${new Date().toLocaleDateString('fr-FR')}
**🤖 Généré automatiquement par Claude Code**
