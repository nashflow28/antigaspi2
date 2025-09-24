# Changelog Design System — Sprint Tokens & Primitives 2025

## Résumé
- Alignement des primitives Vue avec le design system React (Navigation, DashboardLayout, Modales, Notifications).
- Documentations mises à jour pour consommer les tokens Tailwind communs (couleurs, typos, effets, animations).
- Introduction d'une note de revue détaillant les impacts UI et les points d'attention QA.

## Impacts UI
- **Navigation & layout** : topbar responsive et layout dashboard exploitent désormais `bg-nav-gradient`, `shadow-card` et les slots documentés pour conserver l'effet glass responsive.【F:frontend/src/components/ui/Navigation.vue†L1-L210】【F:frontend/src/components/ui/DashboardLayout.vue†L1-L223】
- **Modales & overlays** : toutes les modales utilisent l'`overlay` Tailwind et les animations `fade-in`/`scale-in` pour uniformiser les transitions.【F:frontend/src/components/ui/Modal.vue†L1-L210】【F:frontend/tailwind.config.js†L69-L117】
- **Notifications** : `Toast` + `NotificationSystem` partagent `shadow-toast`, `backdrop-blur-md` et les tonalités documentées.【F:frontend/src/components/ui/Toast.vue†L1-L129】【F:frontend/src/components/ui/NotificationSystem.vue†L1-L125】
- **Composants data** : `ProductCard`, `Stats`, `Skeleton` et `EmptyState` réemploient les nouveaux tokens de couleurs, arrondis `5xl` et animation `shimmer` pour harmoniser les vues d'exploration.【F:frontend/src/components/ui/ProductCard.vue†L1-L118】【F:frontend/src/components/ui/Stats.vue†L1-L86】【F:frontend/src/components/ui/Skeleton.vue†L1-L24】【F:frontend/src/components/ui/EmptyState.vue†L1-L67】
- **Pages transactionnelles** : `CheckoutView` adopte les tokens neutres/dark (`bg-neutral-900`, `text-neutral-50`), des contrôles radio ARIA et des focus visibles, tandis que `ProfileView` expose ses onglets avec `role="tablist"` et des champs harmonisés pour le thème sombre.【F:frontend/src/views/CheckoutView.vue†L1-L198】【F:frontend/src/views/ProfileView.vue†L1-L180】

## Instructions revue & QA
1. **Design tokens** : vérifier que toute nouvelle couleur/ombre/animation ajoutée dans une PR est déclarée dans `tailwind.config.js` côté Vue *et* React. Pas d'hex direct dans les composants.【F:frontend/tailwind.config.js†L8-L134】
2. **Accessibilité** : contrôler la présence des attributs ARIA (`role="dialog"`, aria-live des toasts) et des focus rings `focus-visible:ring-primary-400`. Refuser les surcharges CSS qui masquent le focus.【F:frontend/src/components/ui/Modal.vue†L68-L152】【F:frontend/src/components/ui/Toast.vue†L1-L129】
3. **Dark mode** : déclencher la classe `dark` (via `ThemeToggle`) et inspecter les composants mis à jour (Navigation, Modales, Toasters) pour éviter les contrastes insuffisants. Prévoir une capture avant/après pour les PR modifiant ces surfaces.【F:frontend/src/components/ui/ThemeToggle.vue†L1-L129】
4. **Tests manuels** :
   - Navigation mobile (ouverture/fermeture drawer, focus trap) sur `Navigation.vue` + validation du `ThemeToggle` global.
   - Empilage de 3 toasts simultanés pour observer la minuterie et le dismiss manuel.
   - Vérifier `Skeleton` sur les listes chargées paresseusement (ex. `ProductCard` en cours de fetch) pour s'assurer de la cohérence shimmer.
   - `CheckoutView` et `ProfileView` en dark mode sur mobile/tablette/desktop pour contrôler contrastes et focus.
5. **Storybook** : ajouter/mettre à jour les stories pertinentes pour chaque primitive lorsque l'API publique change. Utiliser les contrôles pour exposer les variantes (`variant`, `size`, `tone`).

## Checklist reviewers
- [ ] Les tokens ajoutés sont documentés dans `frontend/README.md` et `DESIGN_SYSTEM_2025.md`.
- [ ] Les primitives modifiées ont des tests visuels ou des stories à jour.
- [ ] Les instructions QA (mobile, dark mode, empilage toasts) ont été jouées ou commentées dans la PR.
