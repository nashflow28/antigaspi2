# 🚨 Bugs Critiques à Fixer IMMÉDIATEMENT - Mobile App

**Date:** 2025-10-01
**Status:** URGENT - À fixer avant déploiement production

---

## 🔴 BUG #1: Race Condition Search (ProductsScreen.tsx)

**Fichier:** `src/screens/main/ProductsScreen.tsx` ligne 51-59
**Sévérité:** 🔴 HAUTE
**Impact:** Résultats de recherche incohérents

### Code Actuel (Bugué)
```typescript
useEffect(() => {
  const searchFilters = {
    ...localFilters,
    search: searchQuery || undefined,
  }
  dispatch(setFilters(searchFilters))
  dispatch(fetchProducts(searchFilters))  // ❌ Race condition!
}, [searchQuery, localFilters])
```

### Problème
- Deux dispatches sans await causent race condition
- Chaque frappe déclenche appel API immédiat
- Surcharge backend et résultats incohérents

### Fix
```typescript
useEffect(() => {
  const searchFilters = {
    ...localFilters,
    search: searchQuery || undefined,
  }
  dispatch(setFilters(searchFilters))

  // ✅ Debounce pour éviter trop d'appels
  const timer = setTimeout(() => {
    dispatch(fetchProducts(searchFilters))
  }, 300)

  return () => clearTimeout(timer)
}, [searchQuery, localFilters])
```

**Temps:** 15 minutes
**Priorité:** ⭐⭐⭐ HAUTE

---

## 🔴 BUG #2: Distance Simulée (ProductDetailsScreen.tsx)

**Fichier:** `src/screens/main/ProductDetailsScreen.tsx` ligne 280-283
**Sévérité:** 🔴 CRITIQUE
**Impact:** Distance affichée complètement fausse (random!)

### Code Actuel (Bugué)
```typescript
const calculateDistance = (coords: any) => {
  // ❌ DONNÉES FACTICES!
  const simulatedDistance = Math.random() * 5 + 0.5
  setDistance(Math.round(simulatedDistance * 10) / 10)
}
```

### Problème
- Distance affichée est aléatoire
- Utilisateur voit distance incorrecte au marchand
- Décision achat basée sur fausses infos

### Fix
```typescript
const calculateDistance = (userCoords: { latitude: number, longitude: number }) => {
  if (!product.merchant.latitude || !product.merchant.longitude) {
    setDistance(null)
    return
  }

  // ✅ Formule de Haversine pour distance GPS réelle
  const R = 6371 // Rayon Terre en km
  const dLat = (product.merchant.latitude - userCoords.latitude) * Math.PI / 180
  const dLon = (product.merchant.longitude - userCoords.longitude) * Math.PI / 180

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userCoords.latitude * Math.PI / 180) *
    Math.cos(product.merchant.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c

  setDistance(Math.round(distance * 10) / 10)
}
```

**Temps:** 30 minutes
**Priorité:** ⭐⭐⭐ CRITIQUE

---

## 🔴 BUG #3: Wallet PIN en Plaintext (ProductDetailsScreen.tsx)

**Fichier:** `src/screens/main/ProductDetailsScreen.tsx` ligne 62
**Sévérité:** 🔴 SÉCURITÉ CRITIQUE
**Impact:** Code PIN portefeuille exposé en React state

### Code Actuel (Bugué)
```typescript
const [walletPin, setWalletPin] = useState('')  // ❌ PIN en plaintext!

// Plus tard, envoyé en clair:
walletPin: selectedPaymentMethod === 'wallet' ? walletPin : undefined
```

### Problème
- PIN stocké en plaintext dans React state
- Accessible via React DevTools
- Risque de vol si device compromis

### Fix Option 1: SecureStore (Recommandé)
```typescript
import * as SecureStore from 'expo-secure-store'

const [walletPinHash, setWalletPinHash] = useState('')

const handleWalletPinInput = async (pin: string) => {
  // ✅ Hash immédiat du PIN
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + user.id  // Salt avec user ID
  )
  setWalletPinHash(hash)
}

// Envoyer le hash, pas le PIN
walletPin: selectedPaymentMethod === 'wallet' ? walletPinHash : undefined
```

### Fix Option 2: Pas de Storage (Plus Simple)
```typescript
const [walletPin, setWalletPin] = useState('')

// ✅ Effacer immédiatement après utilisation
const handleReservation = async () => {
  // ... utiliser walletPin

  // Clear sensitive data immédiatement
  setWalletPin('')
  setCustomerPhone(user?.phone ?? '')
}
```

**Temps:** 1-2 heures
**Priorité:** ⭐⭐⭐ SÉCURITÉ CRITIQUE

---

## 🔴 BUG #4: Race Condition Sync Queue (offlineService.ts)

**Fichier:** `src/services/offlineService.ts` ligne 271-308
**Sévérité:** 🔴 HAUTE
**Impact:** Duplications de requêtes API, perte de données

### Code Actuel (Bugué)
```typescript
async processSyncQueue(): Promise<void> {
  if (this.syncInProgress || this.syncQueue.length === 0) {
    return  // ❌ Check-then-act race condition!
  }
  this.syncInProgress = true
  // ...
}
```

### Problème
- Check `syncInProgress` et set non atomique
- Deux appels simultanés peuvent bypasser le flag
- Résultat: duplications de requêtes API

### Fix
```typescript
private syncLock: Promise<void> | null = null

async processSyncQueue(): Promise<void> {
  // ✅ Attendre le lock existant
  if (this.syncLock) {
    return this.syncLock
  }

  if (this.syncQueue.length === 0) {
    return
  }

  // ✅ Créer nouveau lock
  this.syncLock = (async () => {
    try {
      this.emit('sync-start', this.syncQueue.length)
      const failedItems: SyncQueue[] = []

      for (const item of this.syncQueue) {
        try {
          await this.processSyncItem(item)
          this.emit('sync-progress', {
            total: this.syncQueue.length,
            processed: this.syncQueue.indexOf(item) + 1,
          })
        } catch (error) {
          console.error('Erreur sync:', error)
          item.retries++
          if (item.retries < 3) {
            failedItems.push(item)
          } else {
            this.emit('sync-error', { item, error })
          }
        }
      }

      this.syncQueue = failedItems
      await this.saveSyncQueue()

      this.emit('sync-complete', {
        success: failedItems.length === 0,
        remaining: failedItems.length,
      })
      this.emit('sync-queue-updated', this.syncQueue.length)
    } finally {
      this.syncLock = null  // ✅ Release lock
    }
  })()

  return this.syncLock
}
```

**Temps:** 2-3 heures
**Priorité:** ⭐⭐⭐ HAUTE

---

## 🔴 BUG #5: Redirection 401 Non Implémentée (api.ts)

**Fichier:** `src/services/api.ts` ligne 67-71
**Sévérité:** 🔴 HAUTE
**Impact:** Utilisateur pas redirigé vers login quand token expire

### Code Actuel (Bugué)
```typescript
if (error.response?.status === 401) {
  await AsyncStorage.multiRemove(['auth_token', 'user_data'])
  // ❌ Rediriger vers login (à implémenter avec navigation)
}
```

### Problème
- Commentaire "à implémenter" = feature incomplète
- Token effacé mais user reste sur page
- UX cassée, user confus

### Fix
```typescript
// 1. Créer NavigationRef (nouveau fichier)
// src/navigation/NavigationRef.ts
import { createNavigationContainerRef } from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef()

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never)
  }
}

// 2. Ajouter ref au NavigationContainer
// src/navigation/AppNavigator.tsx
import { navigationRef } from './NavigationRef'

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      {/* ... */}
    </NavigationContainer>
  )
}

// 3. Utiliser dans api.ts
import { navigate } from '../navigation/NavigationRef'

if (error.response?.status === 401) {
  // ✅ Clear auth data
  await AsyncStorage.multiRemove(['auth_token', 'user_data'])

  // ✅ Redirect to login
  navigate('Login')

  // ✅ Notify user
  Alert.alert(
    'Session expirée',
    'Veuillez vous reconnecter',
    [{ text: 'OK' }]
  )
}
```

**Temps:** 1 heure
**Priorité:** ⭐⭐⭐ HAUTE

---

## 🟡 BUG #6: Validation Phone Number (paymentService.ts)

**Fichier:** `src/services/paymentService.ts`
**Sévérité:** 🟡 MOYENNE
**Impact:** Accepte numéros invalides ou rejette valides

### Problème
- Validation phone number non testée
- Formats différents par provider:
  - **Flooz:** +228 90 XX XX XX ou 90 XX XX XX
  - **TMoney:** +228 91/92 XX XX XX
  - **Orange Money:** +228 96/97 XX XX XX
  - **MTN MoMo:** +228 98/99 XX XX XX

### Fix
```typescript
validatePhoneNumber(phone: string, provider: MobileMoneyProvider): boolean {
  // Normaliser le numéro (enlever espaces, tirets)
  const normalized = phone.replace(/[\s-]/g, '')

  // Patterns par provider
  const patterns: Record<MobileMoneyProvider, RegExp> = {
    flooz: /^(\+228)?(90|93)\d{6}$/,
    tmoney: /^(\+228)?(91|92)\d{6}$/,
    orange_money: /^(\+228)?(96|97)\d{6}$/,
    mtn_momo: /^(\+228)?(98|99)\d{6}$/,
  }

  const pattern = patterns[provider]
  if (!pattern) return false

  return pattern.test(normalized)
}

// Tests unitaires requis
describe('PaymentService.validatePhoneNumber', () => {
  it('should validate Flooz numbers', () => {
    expect(validatePhoneNumber('+228 90 12 34 56', 'flooz')).toBe(true)
    expect(validatePhoneNumber('90123456', 'flooz')).toBe(true)
    expect(validatePhoneNumber('+228 91 12 34 56', 'flooz')).toBe(false)
  })

  it('should validate TMoney numbers', () => {
    expect(validatePhoneNumber('+228 91 12 34 56', 'tmoney')).toBe(true)
    expect(validatePhoneNumber('92123456', 'tmoney')).toBe(true)
  })
})
```

**Temps:** 2-3 heures
**Priorité:** ⭐⭐⭐ HAUTE (argent en jeu!)

---

## 📋 Checklist Fixes

- [ ] Bug #1: Debounce search (15 min)
- [ ] Bug #2: Distance réelle Haversine (30 min)
- [ ] Bug #3: Wallet PIN sécurisé (1-2h)
- [ ] Bug #4: Sync queue lock (2-3h)
- [ ] Bug #5: Redirection 401 (1h)
- [ ] Bug #6: Validation phone (2-3h)

**Total temps estimé:** 7-12 heures

---

## 🧪 Tests à Ajouter Après Fixes

### Tests Unitaires Critiques
```bash
# Créer ces fichiers de test:
src/screens/main/__tests__/ProductsScreen.test.tsx
src/screens/main/__tests__/ProductDetailsScreen.test.tsx
src/services/__tests__/api.test.ts
src/services/__tests__/offlineService.test.ts
src/services/__tests__/paymentService.test.ts
```

### Template Test (Exemple)
```typescript
// src/services/__tests__/paymentService.test.ts
import paymentService from '../paymentService'

describe('PaymentService', () => {
  describe('validatePhoneNumber', () => {
    it('should validate Flooz numbers correctly', () => {
      expect(paymentService.validatePhoneNumber('+228 90 12 34 56', 'flooz')).toBe(true)
      expect(paymentService.validatePhoneNumber('90123456', 'flooz')).toBe(true)
      expect(paymentService.validatePhoneNumber('+228 91 12 34 56', 'flooz')).toBe(false)
      expect(paymentService.validatePhoneNumber('123', 'flooz')).toBe(false)
    })

    it('should validate TMoney numbers correctly', () => {
      expect(paymentService.validatePhoneNumber('+228 91 12 34 56', 'tmoney')).toBe(true)
      expect(paymentService.validatePhoneNumber('92123456', 'tmoney')).toBe(true)
    })
  })

  describe('calculateFees', () => {
    it('should calculate correct fees for each provider', () => {
      expect(paymentService.calculateFees(1000, 'flooz')).toBeGreaterThan(0)
      expect(paymentService.calculateFees(1000, 'tmoney')).toBeGreaterThan(0)
    })
  })
})
```

---

## 🚀 Procédure Déploiement Post-Fix

1. **Fixer les 6 bugs** (7-12h)
2. **Ajouter tests unitaires** pour chaque fix (4-6h)
3. **Run full test suite:** `npm run test:coverage`
4. **Vérifier coverage:** Doit passer de 13% à minimum 30%
5. **Test manuel** sur iOS + Android devices réels
6. **Code review** par senior dev
7. **Deploy to staging** pour QA
8. **Deploy to production** seulement si QA ✅

---

## ⚠️ ATTENTION

**NE PAS deployer en production tant que ces bugs ne sont pas fixés!**

Ces bugs sont CRITIQUES et peuvent causer:
- 🔴 Perte d'argent (paiements incorrects)
- 🔴 Faille sécurité (PIN exposed)
- 🔴 Mauvaise UX (distance fausse, search bugué)
- 🔴 Perte de données (race condition sync)

---

**Généré par:** Claude Code - Mobile Analysis Session
**Date:** 2025-10-01
**Priorité:** 🚨 URGENT
