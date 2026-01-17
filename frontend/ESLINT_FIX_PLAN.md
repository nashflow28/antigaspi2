# Plan de Correction ESLint - Frontend

## Résumé des Erreurs (1592 problèmes)

| Catégorie | Règle | Nombre | Priorité |
|-----------|-------|--------|----------|
| Globals non définis | `no-undef` | 110 | P1 - Critique |
| Parsing template | `vue/no-parsing-error` | 5 | P1 - Critique |
| Variables inutilisées | `no-unused-vars` | 160 | P2 - Important |
| Variables TS inutilisées | `@typescript-eslint/no-unused-vars` | 89 | P2 - Important |
| Imports dupliqués | `no-duplicate-imports` | 15 | P2 - Important |
| Nommage composants | `vue/multi-word-component-names` | 25 | P3 - Convention |
| Props sans défaut | `vue/require-default-prop` | 85 | P3 - Convention |
| Escape inutiles | `no-useless-escape` | 12 | P3 - Convention |
| Regex misleading | `no-misleading-character-class` | 3 | P3 - Convention |
| Console statements | `no-console` | 604 | P4 - Warning |
| Type `any` explicite | `@typescript-eslint/no-explicit-any` | 471 | P4 - Warning |

---

## Étape 1 : Configuration ESLint (P1)
**Objectif** : Corriger les faux positifs `no-undef`

### 1.1 Ajouter les environnements globaux
Les erreurs `no-undef` pour `HTMLSelectElement`, `FocusEvent`, `Node`, `NodeJS` sont des types globaux non reconnus.

**Action** : Mettre à jour `.eslintrc.cjs` :
```js
env: {
  browser: true,
  node: true,
  es2022: true
},
globals: {
  NodeJS: 'readonly',
  // Types DOM déjà inclus via browser: true
}
```

**Fichiers concernés** : ~15 fichiers
**Estimation** : 5 minutes

---

## Étape 2 : Erreurs de Parsing Vue (P1)
**Objectif** : Corriger les templates invalides

### 2.1 Fichiers avec `vue/no-parsing-error`
- `src/views/consumer/SurpriseBasketDetailView.vue` (lignes 85, 86, 159, 167)
- Autres fichiers à identifier

**Action** : Corriger les balises mal fermées et caractères invalides

**Estimation** : 15 minutes

---

## Étape 3 : Variables Inutilisées (P2)
**Objectif** : Nettoyer le code des variables non utilisées

### 3.1 Pattern `catch (error)` non utilisé
**Action** : Remplacer par `catch (_error)` ou `catch` vide

```typescript
// Avant
} catch (error) {
  notify.error('Message')
}

// Après
} catch {
  notify.error('Message')
}
```

### 3.2 Variables définies mais jamais lues
**Action** : Supprimer ou préfixer avec `_`

**Fichiers concernés** : ~50 fichiers
**Estimation** : 30 minutes

---

## Étape 4 : Imports Dupliqués (P2)
**Objectif** : Fusionner les imports du même module

### 4.1 Pattern à corriger
```typescript
// Avant
import { ref } from 'vue'
import { computed } from 'vue'

// Après
import { ref, computed } from 'vue'
```

**Fichiers concernés** : 15 fichiers
**Estimation** : 15 minutes

---

## Étape 5 : Nommage Composants (P3)
**Objectif** : Respecter la convention multi-word

### 5.1 Composants à renommer
| Actuel | Nouveau |
|--------|---------|
| `Alert.vue` | `AlertBox.vue` ou `BaseAlert.vue` |
| `Badge.vue` | `BaseBadge.vue` |
| `Button.vue` | `BaseButton.vue` |
| `Card.vue` | `BaseCard.vue` |
| `Input.vue` | `BaseInput.vue` |
| `Label.vue` | `FormLabel.vue` |
| `Select.vue` | `FormSelect.vue` |
| `Textarea.vue` | `FormTextarea.vue` |

**Alternative** : Désactiver la règle pour le dossier `components/ui/2025/`

**Estimation** : 20 minutes (si renommage) ou 2 minutes (si désactivation)

---

## Étape 6 : Props sans Défaut (P3)
**Objectif** : Ajouter des valeurs par défaut aux props optionnelles

### 6.1 Pattern à corriger
```typescript
// Avant
defineProps<{
  title?: string
}>()

// Après
withDefaults(defineProps<{
  title?: string
}>(), {
  title: ''
})
```

**Fichiers concernés** : ~30 composants
**Estimation** : 45 minutes

---

## Étape 7 : Nettoyage Regex et Escapes (P3)

### 7.1 `no-useless-escape`
Supprimer les `\` inutiles dans les strings/regex

### 7.2 `no-misleading-character-class`
Corriger les classes de caractères regex ambiguës

**Estimation** : 10 minutes

---

## Étape 8 : Warnings (P4 - Optionnel)

### 8.1 `no-console` (604 occurrences)
**Options** :
- A) Remplacer par un service de logging
- B) Désactiver la règle en développement
- C) Ajouter `// eslint-disable-next-line` cas par cas

**Recommandation** : Option B pour l'instant

### 8.2 `@typescript-eslint/no-explicit-any` (471 occurrences)
**Action** : Typage progressif, non prioritaire

---

## Ordre d'Exécution Recommandé

```
1. Étape 1 (Config ESLint)     →  5 min   → Élimine ~110 erreurs
2. Étape 2 (Parsing Vue)       → 15 min   → Élimine ~5 erreurs
3. Étape 3 (Variables)         → 30 min   → Élimine ~249 erreurs
4. Étape 4 (Imports)           → 15 min   → Élimine ~15 erreurs
5. Étape 5 (Nommage)           →  5 min   → Élimine ~25 erreurs (désactivation)
6. Étape 6 (Props)             → 45 min   → Élimine ~85 erreurs
7. Étape 7 (Regex)             → 10 min   → Élimine ~15 erreurs
8. Étape 8 (Warnings)          →  5 min   → Configure les warnings
```

**Total estimé** : ~2h pour passer de 424 erreurs à ~0 erreurs

---

## Commandes Utiles

```bash
# Vérifier les erreurs
npm run lint

# Auto-fix ce qui peut l'être
npm run lint -- --fix

# Vérifier un fichier spécifique
npx eslint src/path/to/file.vue

# Voir les règles désactivables
npx eslint --print-config .eslintrc.cjs
```
