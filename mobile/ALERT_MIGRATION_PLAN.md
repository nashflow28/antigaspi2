# Plan de Migration Alert.alert vers AlertModal

## Objectif
Remplacer tous les `Alert.alert` natifs de React Native par le composant personnalisé `AlertModal` pour une expérience utilisateur cohérente.

---

## Fichiers à Migrer (13 fichiers, ~83 occurrences)

| Priorité | Fichier | Occurrences | Complexité |
|----------|---------|-------------|------------|
| 1 | `screens/main/ProfileEditScreen.tsx` | 15 | Haute |
| 2 | `screens/admin/AdminReviewModerationScreen.tsx` | 15 | Haute |
| 3 | `screens/main/WalletScreen.tsx` | 13 | Haute |
| 4 | `screens/admin/AdminMerchantsScreen.tsx` | 8 | Moyenne |
| 5 | `screens/admin/AdminCategoriesScreen.tsx` | 8 | Moyenne |
| 6 | `screens/merchant/MerchantOpeningHoursScreen.tsx` | 5 | Moyenne |
| 7 | `screens/admin/AdminUsersScreen.tsx` | 4 | Faible |
| 8 | `screens/admin/AdminProductsScreen.tsx` | 4 | Faible |
| 9 | `screens/admin/AdminDashboardScreen.tsx` | 4 | Faible |
| 10 | `screens/admin/AdminBroadcastScreen.tsx` | 4 | Faible |
| 11 | `screens/merchant/MerchantProductsScreen.tsx` | 3 | Faible |
| 12 | `screens/merchant/MerchantSurpriseBasketsScreen.tsx` | 2 | Faible |
| 13 | `screens/admin/AdminAnalyticsScreen.tsx` | 2 | Faible |

**Note:** Les fichiers `.test.tsx` ne doivent PAS être migrés (ils testent le comportement natif).

---

## Pattern de Migration

### Étape 1: Modifier les imports

**AVANT:**
```tsx
import {
  View,
  Text,
  Alert,  // <-- Supprimer cette ligne
  // ... autres imports
} from 'react-native'
```

**APRÈS:**
```tsx
import {
  View,
  Text,
  // Alert supprimé
  // ... autres imports
} from 'react-native'
```

### Étape 2: Ajouter les nouveaux imports

Ajouter après les imports existants:
```tsx
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
```

**Note sur les chemins:**
- Depuis `screens/main/` → `'../../components/AlertModal'`
- Depuis `screens/admin/` → `'../../components/AlertModal'`
- Depuis `screens/merchant/` → `'../../components/AlertModal'`

### Étape 3: Ajouter le hook dans le composant

Au début du composant fonctionnel, ajouter:
```tsx
const MonComposant: React.FC = () => {
  const theme = useTheme()
  // ... autres hooks
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()

  // ... reste du code
}
```

### Étape 4: Remplacer les Alert.alert

#### Type 1: Alert simple (information/erreur)

**AVANT:**
```tsx
Alert.alert('Erreur', 'Message d\'erreur')
```

**APRÈS:**
```tsx
showError('Erreur', 'Message d\'erreur')
```

#### Type 2: Alert de succès

**AVANT:**
```tsx
Alert.alert('Succès', 'Opération réussie')
```

**APRÈS:**
```tsx
showSuccess('Succès', 'Opération réussie')
```

#### Type 3: Alert de confirmation avec boutons

**AVANT:**
```tsx
Alert.alert(
  'Confirmation',
  'Êtes-vous sûr de vouloir continuer ?',
  [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      style: 'destructive',
      onPress: () => {
        // action
      }
    },
  ]
)
```

**APRÈS:**
```tsx
showWarning(
  'Confirmation',
  'Êtes-vous sûr de vouloir continuer ?',
  [
    { text: 'Annuler', style: 'cancel', onPress: hideAlert },
    {
      text: 'Confirmer',
      style: 'destructive',
      onPress: () => {
        hideAlert()  // <-- IMPORTANT: fermer l'alert d'abord
        // action
      }
    },
  ]
)
```

#### Type 4: Alert avec navigation après fermeture

**AVANT:**
```tsx
Alert.alert('Succès', 'Profil mis à jour', [
  {
    text: 'OK',
    onPress: () => navigation.goBack(),
  },
])
```

**APRÈS:**
```tsx
showSuccess('Succès', 'Profil mis à jour', [
  {
    text: 'OK',
    onPress: () => {
      hideAlert()  // <-- Fermer d'abord
      navigation.goBack()
    },
  },
])
```

### Étape 5: Ajouter le composant AlertModal dans le JSX

Ajouter juste avant la fermeture du `</View>` principal (ou `</ScrollView>`, `</KeyboardAvoidingView>`):

```tsx
return (
  <View style={styles.container}>
    {/* ... tout le contenu existant ... */}

    <AlertModal {...alertProps} />  {/* <-- Ajouter ici */}
  </View>
)
```

---

## Fonctions disponibles dans useAlert

| Fonction | Usage | Type d'icône |
|----------|-------|--------------|
| `showError(title, message, buttons?)` | Erreurs, échecs | ❌ Rouge |
| `showSuccess(title, message, buttons?)` | Succès, confirmations | ✅ Vert |
| `showWarning(title, message, buttons?)` | Avertissements, confirmations | ⚠️ Orange |
| `showInfo(title, message, buttons?)` | Informations | ℹ️ Bleu |
| `hideAlert()` | Fermer l'alert manuellement | - |

---

## Exemple Complet de Migration

### Fichier: AdminUsersScreen.tsx

**AVANT:**
```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native'

const AdminUsersScreen: React.FC = () => {
  const theme = useTheme()

  const handleBanUser = (userId: number) => {
    Alert.alert(
      'Bannir utilisateur',
      'Êtes-vous sûr de vouloir bannir cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bannir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.post(`/admin/users/${userId}/ban`)
              Alert.alert('Succès', 'Utilisateur banni')
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de bannir l\'utilisateur')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* contenu */}
    </View>
  )
}
```

**APRÈS:**
```tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

const AdminUsersScreen: React.FC = () => {
  const theme = useTheme()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()

  const handleBanUser = (userId: number) => {
    showWarning(
      'Bannir utilisateur',
      'Êtes-vous sûr de vouloir bannir cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Bannir',
          style: 'destructive',
          onPress: async () => {
            hideAlert()
            try {
              await apiService.post(`/admin/users/${userId}/ban`)
              showSuccess('Succès', 'Utilisateur banni')
            } catch (error) {
              showError('Erreur', 'Impossible de bannir l\'utilisateur')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* contenu */}

      <AlertModal {...alertProps} />
    </View>
  )
}
```

---

## Checklist par Fichier

Pour chaque fichier, cocher:

- [ ] Import `Alert` supprimé de react-native
- [ ] Import `AlertModal` ajouté
- [ ] Import `useAlert` ajouté
- [ ] Hook `useAlert` ajouté dans le composant
- [ ] Tous les `Alert.alert` remplacés
- [ ] `hideAlert()` ajouté dans tous les `onPress` des boutons
- [ ] `<AlertModal {...alertProps} />` ajouté dans le JSX
- [ ] Test manuel: l'écran fonctionne correctement
- [ ] Aucune erreur TypeScript

---

## Commandes Utiles

```bash
# Vérifier les fichiers restants avec Alert.alert
grep -r "Alert\.alert" --include="*.tsx" mobile/src/screens/ -l

# Compter les occurrences par fichier
grep -r "Alert\.alert" --include="*.tsx" mobile/src/screens/ -c | grep -v ":0"

# Vérifier un fichier spécifique
grep -n "Alert\.alert" mobile/src/screens/admin/AdminUsersScreen.tsx
```

---

## Points d'Attention

1. **Ne PAS migrer les fichiers .test.tsx** - Ils testent le comportement natif
2. **Toujours appeler `hideAlert()` AVANT l'action** dans les callbacks
3. **Vérifier les chemins d'import** selon la profondeur du fichier
4. **Tester manuellement** chaque écran après migration
5. **Le fichier `ProductDetailsScreen.original.tsx`** est un backup, l'ignorer

---

## Ordre de Migration Recommandé

1. Commencer par les fichiers avec peu d'occurrences (AdminAnalyticsScreen, MerchantSurpriseBasketsScreen)
2. Progresser vers les fichiers plus complexes
3. Terminer par ProfileEditScreen et AdminReviewModerationScreen (15 occurrences chacun)

Cela permet de se familiariser avec le pattern avant d'attaquer les fichiers complexes.

---

## Validation Finale

Après migration complète, exécuter:
```bash
# Doit retourner 0 résultats (hors tests et AlertModal.tsx)
grep -r "Alert\.alert" --include="*.tsx" mobile/src/screens/ -l | grep -v "\.test\.tsx"

# Build de vérification
cd mobile && npm run build
```
