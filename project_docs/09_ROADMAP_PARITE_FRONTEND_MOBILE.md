# Roadmap : aligner le Frontend Web sur le Mobile (P0 → P2)

## Objectif
Atteindre une parité fonctionnelle et UX entre le Web et l’app mobile, en priorité sur les parcours critiques (consommateur/merchant/admin).

---

## P0 — Bloquants (parcours critiques)
1. **Aligner l’authentification Web sur le flux phone/OTP/PIN**
   - Écrans et store Web déjà présents, mais à valider et homogénéiser.
   - Clarifier le flux principal (legacy email vs phone).
2. **Parcours consommateur complet (recherche → panier → paiement → réservation)**
   - Vérifier l’intégration Wallet/Payment + statut de réservation.
3. **Design System 2025 sur les vues critiques**
   - Home, Products, ProductDetail, Cart, Checkout, Dashboard, Reservations, Wallet.
4. **Cohérence des statuts**
   - Réservations, paiements, livraison : mêmes libellés et transitions que mobile.
5. **Stabilité API Web**
   - Corriger les divergences entre `services/api.ts` et `routes/api.php`.

---

## P1 — Important (parité riche)
1. **Notifications**
   - WebPush + préférences utilisateur, alignées sur mobile.
2. **Messagerie temps réel**
   - Websocket/Pusher fonctionnel, notifications live.
3. **Livraison & tracking**
   - Cartes + tracking temps réel côté Web (alignement Mobile).
4. **Loyauté & Rewards**
   - Parcours complet Web (gain → échange → historique).
5. **Dashboards Merchant/Admin**
   - Graphiques, exports, modération complète.
6. **Onboarding & UX**
   - Réactiver l’onboarding web et l’aligner visuellement avec mobile.

---

## P2 — Optimisation & durcissement
1. **Tests & qualité Web**
   - E2E Playwright + unitaires + coverage réels.
2. **Performance & accessibilité**
   - Audit Lighthouse, réduction bundle, a11y.
3. **PWA & offline**
   - Cache stratégique des écrans clés.
4. **Observabilité**
   - Logs centralisés, erreurs front (Sentry si souhaité).

---

## Critères d’acceptation (extraits)
- Parité visuelle DS2025 sur les écrans principaux.
- Parcours réservation + paiement sans divergence de statut.
- Fonctionnalités wallet & delivery utilisables sur Web comme sur Mobile.
- Tests Web exécutables et reproductibles.
