# 📱 Guide de Déploiement Antigaspi Mobile - Phase 3

## 🚀 État Actuel : Application Production-Ready

L'application mobile Antigaspi est maintenant complète avec toutes les fonctionnalités de Phase 3 implémentées.

### ✅ Fonctionnalités Phase 3 Complétées

#### 💳 **Paiements Mobile Money**
- ✅ Service complet pour Flooz, T-Money, Orange Money, MTN MoMo
- ✅ Validation des numéros selon le provider
- ✅ Génération de codes USSD pour paiement manuel
- ✅ Historique des transactions local
- ✅ Calcul automatique des frais
- ✅ Support multi-devises (XOF par défaut)

#### 🔔 **Notifications Push**
- ✅ Configuration Expo Notifications complète
- ✅ Canaux Android configurés par type
- ✅ Permissions iOS/Android
- ✅ Préférences utilisateur avec heures calmes
- ✅ Notifications locales et distantes
- ✅ Badge management
- ✅ Deep linking depuis les notifications

#### 📴 **Mode Offline & Cache**
- ✅ Détection automatique de connectivité
- ✅ Cache intelligent avec TTL configurable
- ✅ Queue de synchronisation pour actions offline
- ✅ Persistance des données critiques
- ✅ Sync automatique au retour en ligne
- ✅ Gestion des conflits de version

#### 📊 **Analytics & Métriques**
- ✅ Tracking complet des événements
- ✅ Métriques de performance
- ✅ Sessions utilisateur
- ✅ Entonnoir de conversion
- ✅ Tracking des erreurs
- ✅ Export batch optimisé

#### 🏗️ **Configuration Build**
- ✅ Configuration EAS Build
- ✅ Support iOS/Android
- ✅ Environnements dev/preview/production
- ✅ Auto-updates OTA
- ✅ Permissions natives configurées

## 📲 Commandes de Build

### Build de Développement
```bash
# Android (APK de debug)
npx eas build --platform android --profile development

# iOS (Build de développement)
npx eas build --platform ios --profile development
```

### Build de Preview
```bash
# Android (APK pour tests)
npx eas build --platform android --profile preview

# iOS (Simulateur)
npx eas build --platform ios --profile preview
```

### Build de Production
```bash
# Android (AAB pour Play Store)
npx eas build --platform android --profile production

# iOS (IPA pour App Store)
npx eas build --platform ios --profile production
```

## 🎨 Assets Requis pour les Stores

### Icons et Splash Screens
```
mobile/assets/
├── icon.png (1024x1024) - Icon principal
├── adaptive-icon.png (1024x1024) - Android adaptive
├── splash-icon.png (1242x2436) - Splash screen
├── notification-icon.png (96x96) - Notifications
└── favicon.png (48x48) - Web
```

### Screenshots pour les Stores
- **iOS**: 6.5", 5.5", iPad Pro
- **Android**: Phone, 7" tablet, 10" tablet
- Minimum 3, maximum 8 par format

### Descriptions Store

#### 🍎 App Store (iOS)
**Titre**: Antigaspi - Anti-Gaspillage
**Sous-titre**: Sauvez la nourriture, économisez
**Description courte**: Achetez les invendus à prix réduit
**Mots-clés**: antigaspi, food waste, économies, développement durable, alimentation

#### 🤖 Play Store (Android)
**Titre**: Antigaspi - Réduisez le gaspillage alimentaire
**Description courte**: Invendus alimentaires à prix réduits près de chez vous
**Catégorie**: Shopping / Alimentation et boissons

## 🔐 Variables d'Environnement Production

Créer un fichier `.env.production`:
```env
API_URL=https://api.antigaspi.com
SENTRY_DSN=your_sentry_dsn
GOOGLE_MAPS_KEY=your_google_maps_key
EXPO_PROJECT_ID=your_expo_project_id
APPLE_TEAM_ID=your_apple_team_id
```

## 🔔 Notifications Push Expo

### Obtenir les clés nécessaires
1. **Associer le projet Expo** : `npx expo login` puis `npx eas init` dans le dossier `mobile/` pour créer le projet côté Expo.
2. **Identifier le projectId** : `npx expo config --json | jq -r '.extra.eas.projectId'` puis reporter l'identifiant dans `app.json` ou `eas.json` si besoin.
3. **Créer un access token serveur** : sur [expo.dev/settings/access-tokens](https://expo.dev/accounts), générez un token avec la permission `push_notification:server` et ajoutez-le dans `backend/.env` (`EXPO_ACCESS_TOKEN=...`).
4. **Synchroniser le backend** : `php artisan migrate` pour mettre à jour `push_subscriptions`, puis redémarrez la queue/worker afin de prendre en compte la nouvelle configuration.

### Vérification sur appareil physique
1. Lancez le backend (`php artisan serve`) ainsi que les workers (`php artisan queue:listen`).
2. Sur l'appareil, installez Expo Go ou un build de développement (`npx expo run:android --device`).
3. Connectez-vous dans l'application, acceptez les permissions et vérifiez dans les logs backend que le token Expo est bien enregistré.
4. Dans un shell `php artisan tinker`, exécutez :
   ```php
   app(\App\Services\PushSubscriptionService::class)
       ->send(App\Models\User::first(), [
           'title' => 'Test production',
           'body' => 'Notification Expo envoyée depuis le backend',
       ]);
   ```
5. Vérifiez la réception de la notification et ajustez les canaux (Android) ou les réglages de badges si nécessaire.

## 📤 Publication sur les Stores

### App Store Connect (iOS)
```bash
# Soumettre automatiquement
npx eas submit --platform ios

# Ou manuellement
1. Télécharger le .ipa depuis EAS
2. Uploader via Transporter ou Xcode
3. Configurer dans App Store Connect
4. Soumettre pour review
```

### Google Play Console (Android)
```bash
# Soumettre automatiquement
npx eas submit --platform android

# Ou manuellement
1. Télécharger le .aab depuis EAS
2. Uploader dans Play Console
3. Configurer la fiche Store
4. Publier en test interne/externe
```

## 🔄 Updates Over-The-Air (OTA)

### Publier une mise à jour
```bash
# Publier sur le canal de production
npx expo publish --release-channel production

# Ou avec EAS Update
npx eas update --branch production --message "Fix: correction bug réservation"
```

### Rollback si nécessaire
```bash
npx eas update:rollback --branch production
```

## 📊 Monitoring Production

### Services Recommandés
- **Crash Reporting**: Sentry
- **Analytics**: Google Analytics / Mixpanel
- **Performance**: Firebase Performance
- **Logs**: LogRocket

### Configuration Sentry
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: false,
  environment: 'production',
});
```

## 🧪 Tests Pre-Release

### Checklist de Tests
- [ ] Authentification (login/register/logout)
- [ ] Navigation complète
- [ ] Réservations (créer/annuler)
- [ ] Paiements Mobile Money
- [ ] Notifications push
- [ ] Mode offline
- [ ] Géolocalisation
- [ ] QR codes
- [ ] Performance sur appareil réel

### Tests sur Appareils Physiques
```bash
# Android - Installer l'APK de test
adb install antigaspi.apk

# iOS - Via TestFlight
1. Upload build vers TestFlight
2. Inviter les testeurs
3. Collecter les feedbacks
```

## 🚀 Métriques de Succès

### KPIs à Suivre
- **Taux de conversion**: Visiteur → Inscription
- **Retention**: J1, J7, J30
- **Transactions**: Volume et montant moyen
- **Crash-free rate**: > 99.5%
- **App rating**: > 4.5 étoiles
- **Time to first reservation**: < 5 minutes

## 📝 Notes de Version 1.0.0

### Nouveautés
- 🎉 Première version publique d'Antigaspi
- 💳 Paiements Mobile Money intégrés
- 🔔 Notifications push en temps réel
- 📴 Mode offline complet
- 🗺️ Géolocalisation des commerces
- 📱 QR codes pour retrait
- 📊 Tableau de bord personnalisé

### Prochaines Fonctionnalités (v1.1.0)
- Programme de fidélité
- Partage social
- Chat avec les commerçants
- Abonnements premium
- Multi-langue (EN/FR)

## 🆘 Support & Contact

- **Email Support**: support@antigaspi.com
- **Documentation**: https://docs.antigaspi.com
- **GitHub**: https://github.com/antigaspi/mobile
- **Discord**: https://discord.gg/antigaspi

---

**📅 Date de Release Prévue**: À définir
**🎯 Marchés Cibles**: Togo, Bénin, Burkina Faso, Côte d'Ivoire
**📱 Compatibilité**: iOS 13+, Android 8+