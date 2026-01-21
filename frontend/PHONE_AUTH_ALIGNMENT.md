# Alignement de l'authentification par téléphone Frontend/Mobile

## 📋 Résumé

Le processus de connexion du frontend web a été aligné avec celui de l'application mobile pour offrir une expérience utilisateur unifiée. L'authentification par **téléphone + OTP/PIN** est maintenant la méthode principale, tout en conservant la connexion par email comme option legacy.

## 🎯 Objectif

Permettre aux utilisateurs du frontend web de se connecter de la même manière que sur l'application mobile :
1. Entrer leur numéro de téléphone (+228 XX XX XX XX)
2. Recevoir un code OTP par SMS
3. Utiliser un code PIN pour connexion rapide sur appareil connu

## 📁 Fichiers créés

### 1. `/frontend/src/services/deviceService.ts`
Service de gestion des appareils pour le web, adapté du service mobile :
- Génération d'un ID d'appareil unique basé sur le fingerprinting web
- Vérification du numéro de téléphone (`checkPhone`)
- Envoi d'OTP (`sendOtp`)
- Vérification d'OTP et connexion (`verifyOtpAndLogin`)
- Connexion par PIN (`loginWithPin`)
- Gestion du PIN (`setPin`, `changePin`)
- Déconnexion avec désactivation de l'appareil (`logout`)

**Différences avec le mobile :**
- Utilise `localStorage` au lieu de `SecureStore`
- Génère un device_id basé sur les caractéristiques du navigateur
- Type d'appareil : `'web'` au lieu de `'android'` ou `'ios'`

### 2. `/frontend/src/components/forms/PhoneLoginForm.vue`
Formulaire de saisie du numéro de téléphone :
- Input formaté pour numéro Togo (+228 XX XX XX XX)
- Validation du format (8 chiffres)
- Appel à `deviceService.checkPhone()` pour déterminer le flow
- Redirection vers OTP ou PIN selon la réponse backend
- Option pour basculer vers connexion email

### 3. `/frontend/src/components/forms/OTPVerificationForm.vue`
Formulaire de vérification du code OTP :
- Envoi automatique d'OTP au montage du composant
- Input pour code à 6 chiffres
- Timer de cooldown pour renvoi (60 secondes)
- Gestion des nouveaux utilisateurs (redirection vers inscription)
- Gestion des utilisateurs existants (connexion directe)

### 4. `/frontend/src/components/forms/PINEntryForm.vue`
Formulaire de connexion par code PIN :
- Input masqué pour PIN à 4 chiffres
- Toggle pour afficher/masquer le PIN
- Option "Oublié le PIN ?" pour basculer vers OTP
- Connexion rapide sans SMS

### 5. `/frontend/src/views/auth/LoginView.vue` (mis à jour)
Vue principale de connexion avec gestion de l'état :
- Gère 4 flows : `phone`, `email`, `otp`, `pin`
- Méthode par défaut : téléphone (aligné avec mobile)
- Navigation fluide entre les différents écrans
- Conservation de l'état (numéro de téléphone, isNewUser)
- Redirection post-connexion selon le rôle

## 🔄 Fichiers modifiés

### `/frontend/src/stores/auth.ts`
- Ajout de l'import `deviceService`
- Mise à jour de la méthode `logout()` pour appeler `deviceService.logout()`
- Utilisation de `Promise.allSettled()` pour appeler les deux APIs de logout

## 🌊 Flux d'authentification

### 1. Connexion par téléphone (nouvel utilisateur)
```
PhoneLoginForm
  → User enters: 90 XX XX XX
  → deviceService.checkPhone(+22890XXXXXX)
  → Backend responds: { user_exists: false }

OTPVerificationForm (isNewUser: true)
  → Sends OTP automatically
  → User enters 6-digit code
  → deviceService.verifyOtpAndLogin()
  → Backend responds: { status: 'new_user' }
  → Redirect to RegisterView with verified phone
```

### 2. Connexion par téléphone (utilisateur existant, nouvel appareil)
```
PhoneLoginForm
  → User enters: 90 XX XX XX
  → deviceService.checkPhone(+22890XXXXXX)
  → Backend responds: { user_exists: true, requires_otp: true }

OTPVerificationForm (isNewUser: false)
  → Sends OTP automatically
  → User enters 6-digit code
  → deviceService.verifyOtpAndLogin()
  → Backend responds: { status: 'success', token, user }
  → authStore.setAuth(token, user)
  → Redirect to dashboard
```

### 3. Connexion par téléphone (utilisateur existant, appareil connu)
```
PhoneLoginForm
  → User enters: 90 XX XX XX
  → deviceService.checkPhone(+22890XXXXXX)
  → Backend responds: { user_exists: true, requires_pin: true, has_pin: true }

PINEntryForm
  → User enters 4-digit PIN
  → deviceService.loginWithPin()
  → Backend responds: { status: 'success', token, user }
  → authStore.setAuth(token, user)
  → Redirect to dashboard
```

### 4. Connexion par email (legacy, toujours supporté)
```
LoginForm2025
  → User enters email + password
  → authStore.login({ email, password })
  → Legacy /auth/login endpoint
  → Redirect to dashboard
```

## 🔐 Sécurité

### Device ID
- Généré à partir du fingerprint du navigateur
- Stocké dans `localStorage` (clé: `antigaspi_device_id`)
- Persistant entre les sessions
- Format: `WEB{fingerprint}{timestamp}{random}`

### PIN
- Stocké de manière sécurisée sur le backend
- Associé à l'appareil via `device_id`
- 4 chiffres
- Peut être changé via `deviceService.changePin()`

### OTP
- Code à 6 chiffres envoyé par SMS
- Expire après un certain temps (défini backend)
- Rate limiting : cooldown de 60 secondes entre les envois
- Purpose: 'login' ou 'registration'

## 🎨 Design System

Tous les nouveaux composants utilisent le Design System 2025 :
- Composants : `Button`, `Input` de `@/components/ui/2025/`
- Icons : `lucide-vue-next`
- Styles : classes utilitaires Tailwind
- Animations : `animate-fade-in-up`
- Sécurité XSS : `sanitizeErrorMessage()` pour tous les messages d'erreur

## 🔌 Endpoints Backend utilisés

### Authentification par appareil
- `POST /auth/device/check-phone` - Vérifier téléphone et déterminer méthode auth
- `POST /auth/device/send-otp` - Envoyer OTP SMS
- `POST /auth/device/verify-otp` - Vérifier OTP et connecter
- `POST /auth/device/login-pin` - Connexion par PIN
- `POST /auth/device/set-pin` - Définir un PIN (authentifié)
- `POST /auth/device/change-pin` - Changer le PIN (authentifié)
- `POST /auth/device/logout` - Déconnexion avec désactivation appareil

### Authentification legacy (toujours supporté)
- `POST /auth/login` - Connexion email + password
- `POST /auth/logout` - Déconnexion standard

## ✅ Avantages

1. **Expérience unifiée** : Même processus sur web et mobile
2. **Sécurité renforcée** : OTP + device ID + PIN optionnel
3. **Simplicité** : Pas besoin de mémoriser un mot de passe
4. **Connexion rapide** : PIN sur appareils connus
5. **Accessibilité** : Support téléphones sans email
6. **Backward compatible** : Email/password toujours disponible

## 🧪 Tests à effectuer

### Tests fonctionnels
- [ ] Connexion nouveau utilisateur par téléphone
- [ ] Connexion utilisateur existant avec OTP
- [ ] Connexion utilisateur existant avec PIN
- [ ] Renvoi d'OTP avec cooldown
- [ ] Basculement téléphone ↔ email
- [ ] Oublié le PIN → OTP
- [ ] Modification du numéro pendant le flow
- [ ] Expiration d'OTP
- [ ] Code OTP incorrect (3 tentatives)
- [ ] Code PIN incorrect
- [ ] Redirection post-connexion selon rôle

### Tests d'intégration
- [ ] Device ID persistant entre sessions
- [ ] Logout désactive l'appareil
- [ ] Plusieurs appareils pour un même compte
- [ ] Synchronisation du store auth
- [ ] Gestion des erreurs réseau

### Tests de sécurité
- [ ] XSS dans messages d'erreur (protection active)
- [ ] Validation format téléphone
- [ ] Validation format OTP/PIN
- [ ] Rate limiting OTP
- [ ] Device ID unique par navigateur

## 📊 Compatibilité

### Navigateurs supportés
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive)

### Dépendances
- Vue 3 + Composition API
- Pinia (state management)
- Vue Router
- Axios (via apiService)
- Lucide Vue (icons)
- Tailwind CSS

## 🚀 Déploiement

### Frontend
```bash
cd frontend
npm install
npm run build
# Déployer dist/ sur serveur web
```

### Backend
Aucun changement nécessaire - les endpoints existent déjà.

## 📝 Notes

1. **Migration progressive** : Les utilisateurs existants avec email/password peuvent continuer à se connecter ainsi. Ils peuvent ensuite lier leur téléphone via les paramètres de compte.

2. **Device ID web** : Contrairement au mobile, le device ID web n'est pas 100% permanent (peut être effacé si l'utilisateur nettoie le localStorage). C'est une limitation acceptable du web.

3. **SMS Provider** : Le backend utilise SMS.TG pour l'envoi d'OTP au Togo.

4. **Future improvements** :
   - Biométrie web (WebAuthn) pour connexion sans mot de passe
   - Support d'autres pays/indicatifs
   - Notification push web pour OTP (si supporté)
   - Lien "Pas reçu de SMS ?" avec support

## 🔗 Ressources

- Backend API routes : `/backend/routes/api.php`
- DeviceAuthController : `/backend/app/Http/Controllers/Api/DeviceAuthController.php`
- Mobile reference : `/mobile/src/services/deviceService.ts`
- Mobile screens : `/mobile/src/screens/auth/`

---

**Date de création** : 2026-01-21
**Auteur** : Claude Code
**Version** : 1.0.0
