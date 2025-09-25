# 🔍 AUDIT D1 - Cartographie Timers & États d'Erreur

**Date :** $(date)
**Objectif :** Recenser tous les setTimeout, flags d'erreur persistants et usages de notifications dans chaque store Pinia

## 📊 Résultats de l'Audit

| Store | Timer/Flag | Usage/Contexte | Notes |
|-------|------------|----------------|--------|
| **auth.ts** | `setTimeout(5000)` + `error` ref | Erreurs de login/register | ⚠️ **Pattern répétitif** - Candidat prioritaire |
| **products.ts** | `setTimeout(5000)` + `error` ref | Erreurs de chargement produits | ⚠️ **Pattern répétitif** - Candidat prioritaire |
| **reservations.ts** | `setTimeout(5000)` + `error` ref | Erreurs de réservation/annulation | ⚠️ **Pattern répétitif** - Candidat prioritaire |
| **payments.ts** | `error` ref (pas de timer) | Erreurs de paiement | ✅ Pas de timer - Plus simple à migrer |
| **wallet.ts** | `error` ref + console.error | Erreurs portefeuille | ✅ Console.error uniquement - Peut rester |
| **cart.ts** | `error` ref + `notify.*` direct | Panier (ajout/suppression) | ⚠️ **Usage mixte** - Déjà notify mais avec error ref |
| **favorites.ts** | `error` ref + `notify.*` direct | Favoris (ajout/suppression) | ⚠️ **Usage mixte** - Déjà notify mais avec error ref |
| **merchants.ts** | `error` ref + `notify.*` direct | Chargement/erreurs commerçants | ⚠️ **Usage mixte** - Déjà notify mais avec error ref |
| **onboarding.ts** | `notify.*` direct | Onboarding terminé/ignoré | ✅ **Déjà migré** - Aucune action nécessaire |
| **notification.ts** | ~~Toasts supprimés~~ | Notifications serveur uniquement | ✅ **PHASE 2.0 TERMINÉE** |
| **theme.ts** | *(pas de timer/error trouvé)* | Thème UI | ✅ Aucune action nécessaire |
| **index.ts** | *(export uniquement)* | Store principal | ✅ Aucune action nécessaire |

## 🚨 Problématiques Identifiées

### **❌ Pattern Répétitif - setTimeout(5000)**
**Stores concernés :** `auth`, `products`, `reservations`
```typescript
const setError = (message: string) => {
  error.value = message
  setTimeout(() => {
    error.value = null
  }, 5000)
}
```

### **⚠️ Usage Mixte - notify.* + error ref**
**Stores concernés :** `cart`, `favorites`, `merchants`
- Utilise déjà `notify.*` pour les toasts
- Mais garde un `error` ref local inutilisé/redondant

### **✅ Console.error Acceptable**
**Store concerné :** `wallet`
- Utilise `console.error` pour debug technique
- Pas de timer, pas de toast → Peut rester

## 📈 Plan de Migration Priorisé

### **🔥 Priorité 1 - Timers répétitifs**
1. **auth.ts** - Authentification critique
2. **products.ts** - Catalogue principal
3. **reservations.ts** - Fonctionnalité core

### **⚡ Priorité 2 - Usage mixte**
4. **cart.ts** - Suppression error ref redondant
5. **favorites.ts** - Suppression error ref redondant
6. **merchants.ts** - Suppression error ref redondant
7. **payments.ts** - Migration simple (pas de timer)

### **✅ Terminé/Ignoré**
- `onboarding.ts` - Déjà conforme
- `wallet.ts` - Console.error acceptable
- `theme.ts` - Aucun timer/error
- `notification.ts` - PHASE 2.0 terminée

## 🎯 Objectifs de Centralisation

### **Structure Cible Standardisée**
```typescript
// AVANT (anti-pattern)
const setError = (message: string) => {
  error.value = message
  setTimeout(() => error.value = null, 5000)
}

// APRÈS (useNotifications)
const { error, success } = useNotifications()
const handleError = (message: string, title?: string) => {
  error(message, title, {
    onAction: {
      label: 'Réessayer',
      callback: retryAction
    }
  })
}
```

### **Format Payload Homogène**
```typescript
interface NotificationPayload {
  title?: string
  message: string
  action?: {
    label: string
    callback: () => void | Promise<void>
  }
  onClose?: () => void
  duration?: number
}
```

## ⚠️ Points d'Attention

1. **Breaking Changes UX** - Vérifier que les durées/comportements restent cohérents
2. **Memory Leaks** - S'assurer que tous les setTimeout sont bien nettoyés
3. **Tests Coverage** - Chaque store migré doit avoir des tests callbacks
4. **Error Boundaries** - Gestion des exceptions dans les callbacks

## 📊 Métriques de Succès
- ✅ 0 `setTimeout` dans les stores (sauf useNotifications)
- ✅ 0 `error` ref redondant avec notify
- ✅ 100% format standardisé `{ title, message, action? }`
- ✅ Couverture tests > 90%

---
**Prochaines étapes :** Phase 2.2 - Refactor Auth Store