# 📋 Conventions Callbacks Notifications - Phase 2 AntiGaspi

**Date :** 2025-01-25
**Objectif :** Définir les conventions `onAction` / `onClose` pour un comportement cohérent des notifications

---

## 🎯 **Structure Payload Standardisée**

### **Interface Recommandée**
```typescript
interface NotificationPayload {
  title?: string           // Titre de la notification (optionnel)
  message: string         // Message principal (obligatoire)
  action?: {              // Action callback avec label
    label: string         // Texte du bouton d'action
    callback: () => void | Promise<void>  // Fonction à exécuter
  }
  onClose?: () => void    // Callback de fermeture
  duration?: number       // Durée d'affichage (ms) - défaut 5000
  autoClose?: boolean     // Auto-fermeture - défaut true
}
```

### **Migration des Anciens Patterns**
```typescript
// ❌ ANCIEN PATTERN (anti-pattern)
const setError = (message: string) => {
  error.value = message
  setTimeout(() => error.value = null, 5000)
}

// ✅ NOUVEAU PATTERN (recommandé)
notify.error(message, title, {
  action: {
    label: 'Réessayer',
    callback: retryFunction
  }
})
```

---

## 📚 **Conventions par Type de Notification**

### **🚨 Erreurs (`notify.error`)**
**Usage :** Échecs d'opérations critiques nécessitant une action utilisateur

```typescript
// Convention : Toujours proposer une action de retry
notify.error(err.message || 'Erreur de connexion', 'Authentification', {
  action: {
    label: 'Réessayer',
    callback: () => login(credentials)  // Retry la même opération
  }
})

// Cas spécial : Session expirée
notify.error('Session expirée, veuillez vous reconnecter', 'Authentification', {
  action: {
    label: 'Se reconnecter',
    callback: () => router.push('/login')
  }
})
```

**Invariants :**
- ✅ **Pas d'auto-close** : `autoClose: false` par défaut
- ✅ **Action obligatoire** : Toujours proposer un callback
- ✅ **Retry safe** : Les callbacks doivent être idempotents

### **✅ Succès (`notify.success`)**
**Usage :** Confirmation d'opérations réussies

```typescript
// Convention : Auto-close rapide, pas d'action nécessaire
notify.success('Connexion réussie', 'Authentification', {
  duration: 3000  // Plus court que la durée par défaut
})

// Avec action optionnelle (cas spéciaux)
notify.success('Inscription réussie', 'Bienvenue !', {
  action: {
    label: 'Découvrir',
    callback: () => startOnboarding()
  }
})
```

**Invariants :**
- ✅ **Auto-close** : `autoClose: true` par défaut
- ✅ **Action optionnelle** : Généralement pas d'action
- ✅ **Durée courte** : 3000ms recommandé

### **ℹ️ Info (`notify.info`)**
**Usage :** Informations non-critiques, changements d'état

```typescript
// Convention : Auto-close, message informatif
notify.info('Vous avez été déconnecté', 'Au revoir !', {
  duration: 4000
})

// Avec action informative
notify.info('Panier vidé', 'Panier', {
  action: {
    label: 'Annuler',
    callback: restoreCart  // Undo si possible
  }
})
```

**Invariants :**
- ✅ **Auto-close** : `autoClose: true` par défaut
- ✅ **Action d'annulation** : Pour les opérations réversibles
- ✅ **Durée moyenne** : 4000ms recommandé

### **⚠️ Avertissements (`notify.warning`)**
**Usage :** Actions potentiellement dangereuses ou états d'attention

```typescript
// Convention : Pas d'auto-close, action requise
notify.warning('Impossible de supprimer une catégorie qui contient des produits', 'Attention', {
  autoClose: false,
  action: {
    label: 'Vider la catégorie',
    callback: () => confirmEmptyCategory()
  }
})
```

**Invariants :**
- ✅ **Pas d'auto-close** : `autoClose: false`
- ✅ **Action obligatoire** : Résoudre la situation
- ✅ **Confirmation** : Actions destructives doivent demander confirmation

---

## 🔒 **Gestion des Callbacks**

### **Retry Multiple & État Loading**
```typescript
// Pattern recommandé pour éviter double-clics
const handleRetryLogin = async () => {
  if (loading.value) return  // Garde contre double-clic

  loading.value = true
  try {
    await login(credentials)
  } finally {
    loading.value = false
  }
}

notify.error('Erreur de connexion', 'Authentification', {
  action: {
    label: loading.value ? 'Connexion...' : 'Réessayer',
    callback: handleRetryLogin
  }
})
```

### **Double Close Prevention**
```typescript
// Pattern pour éviter les doubles fermetures
let notificationClosed = false

notify.error(message, title, {
  onClose: () => {
    if (notificationClosed) return  // Garde contre double close
    notificationClosed = true

    // Cleanup logic
    resetErrorState()
  }
})
```

### **Error Boundaries dans Callbacks**
```typescript
// Pattern pour gérer les exceptions dans callbacks
notify.error(message, title, {
  action: {
    label: 'Réessayer',
    callback: async () => {
      try {
        await retryOperation()
      } catch (err) {
        console.error('Retry failed:', err)
        notify.error('La nouvelle tentative a échoué', 'Erreur')
      }
    }
  }
})
```

---

## 🧪 **Scénarios de Tests Obligatoires**

### **Tests Unitaires Callbacks**
```typescript
describe('Auth Store Notifications', () => {
  it('should retry login on error callback', async () => {
    const mockCredentials = { email: 'test', password: 'test' }

    // Simuler échec puis succès
    apiService.login
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { token: 'abc', user: {} } })

    await authStore.login(mockCredentials)

    // Vérifier que la notification d'erreur a un callback retry
    expect(notify.error).toHaveBeenCalledWith(
      expect.any(String),
      'Authentification',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Réessayer',
          callback: expect.any(Function)
        })
      })
    )

    // Exécuter le callback retry
    const callback = notify.error.mock.calls[0][2].action.callback
    await callback()

    // Vérifier le succès du retry
    expect(apiService.login).toHaveBeenCalledTimes(2)
    expect(notify.success).toHaveBeenCalledWith('Connexion réussie', 'Authentification')
  })
})
```

### **Tests E2E Callbacks**
```typescript
test('should retry failed login via notification action', async ({ page }) => {
  await page.goto('/login')

  // Intercepter et faire échouer la première requête
  await page.route('**/api/auth/login', route => route.abort())

  await page.fill('[data-testid="email"]', 'test@test.com')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-btn"]')

  // Vérifier l'apparition de la notification d'erreur
  const errorNotif = page.locator('[data-testid="notification-error"]')
  await expect(errorNotif).toBeVisible()

  // Réussir les requêtes suivantes
  await page.unroute('**/api/auth/login')
  await page.route('**/api/auth/login', route =>
    route.fulfill({ json: { data: { token: 'abc', user: {} } } })
  )

  // Cliquer sur le bouton retry
  await page.click('[data-testid="notification-action-btn"]:text("Réessayer")')

  // Vérifier le succès
  await expect(page.locator('[data-testid="notification-success"]')).toBeVisible()
  await expect(page).toHaveURL('/dashboard')
})
```

---

## ✅ **Checklist de Validation**

### **Pour Chaque Store Migré**
- [ ] ✅ Utilise les conventions de type (error avec retry, success avec durée courte, etc.)
- [ ] ✅ Callbacks sont idempotents (safe pour retry multiple)
- [ ] ✅ Gestion des états loading dans les callbacks
- [ ] ✅ Protection contre double-close dans onClose
- [ ] ✅ Error boundaries dans les callbacks async
- [ ] ✅ Tests unitaires couvrent les callbacks
- [ ] ✅ Tests E2E vérifient les interactions utilisateur

### **Métriques de Qualité**
- [ ] ✅ 0 setTimeout dans les stores (sauf useNotifications)
- [ ] ✅ 100% des erreurs ont une action retry
- [ ] ✅ 100% format standardisé `{ title, message, action? }`
- [ ] ✅ Couverture tests callbacks > 90%

---

## 🔄 **Migration en Cours**

### ✅ **Stores Terminés**
- **auth.ts** - Pattern complet avec retry callbacks
- **notification.ts** - Duplication supprimée (Phase 2.0)

### 🔄 **Stores en Attente**
- **products.ts** - Priorité 1 (Phase 2.4)
- **reservations.ts** - Priorité 1
- **cart.ts** - Priorité 2 (usage mixte)
- **favorites.ts** - Priorité 2 (usage mixte)
- **merchants.ts** - Priorité 2 (usage mixte)
- **payments.ts** - Priorité 2 (simple, pas de timer)

---
**Prochaine étape :** Phase 2.4 - Refactor Products Store