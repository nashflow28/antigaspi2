# Conventions des composants Vue

Ce référentiel documente les règles à valider avec l'équipe avant d'implémenter les primitives Vue équivalentes au design system React. Il peut être partagé en revue interne ou PR de documentation pour confirmer l'alignement.

## Déclaration des props

- Utiliser systématiquement `<script setup lang="ts">`.
- Définir les API avec `const props = defineProps<Props>()` où `Props` est un type ou une interface exportée afin de partager la structure dans la documentation et les tests.
- Employer `withDefaults(defineProps<Props>(), { ... })` pour les valeurs par défaut, en évitant les valeurs implicites dans le template.
- Les props booléennes suivent le préfixe `is`/`has` (`isOpen`, `hasError`), les chaînes décrivent leur contenu (`tone`, `size`, `variant`).

## Événements émis

- Déclarer les événements avec `const emit = defineEmits<Emits>()`.
- Les clés d'événements exposées aux parents sont en kebab-case (`'update:model-value'`, `'submit'`, `'close'`). Côté typage, utiliser des littéraux TypeScript (`type Emits = {(e: 'update:model-value', value: string): void; }`).
- Préciser systématiquement l'intention dans un commentaire JSDoc adjacent pour faciliter la revue.
- Centraliser les noms d'événements partagés (ex. `update:model-value`, `open`, `close`) dans les stories/docs pour éviter les divergences.

## Slots

- Nommer les slots en kebab-case (`<template #header>`, `<template #action-bar>`).
- Prévoir une documentation minimale des slots via des commentaires dans le template ou les stories pour préciser le contenu attendu.
- Prévoir un fallback pour le slot par défaut lorsque c'est pertinent (texte d'aide, illustration) afin d'améliorer l'intégration sans configuration.

## Dépendances et tokens partagés

- Réutiliser les tokens Tailwind définis dans `tailwind.config.js` :
  - Couleurs `primary`, `neutral`, `accent`, `surface`, et l'`overlay`.
  - Familles typographiques `font-sans`, `font-display`, `font-heading`, `font-mono`.
  - Ombres utilitaires `shadow-card`, `shadow-glow`, `shadow-toast`.
  - Animations `ease-spring-out`, `animate-shimmer`, `animate-fade-in-*`, etc.
- Capitaliser sur les utilitaires communs pour les interactions :
  - États focus : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light` (adapter `*-dark` dans les contextes sombres).
  - Transitions : `transition-all duration-300 ease-spring-out`.
  - Gestion du dark mode via la classe `dark` portée par l'élément racine.
- Partager, dans un helper `cn` ou `twMerge` si nécessaire, la composition des classes conditionnelles pour éviter la duplication entre composants Vue.

## Primitives Vue 2025

### Navigation & Layout
- `Navigation.vue` propose une topbar responsive avec menu mobile animé (`Dialog` Headless UI), intégration du toggle thème et slots d'actions pour CTA ou avatar.【F:frontend/src/components/ui/Navigation.vue†L1-L210】
- `DashboardLayout.vue` centralise la sidebar collapsible, le header sticky et les slots `sidebar`, `header` et `default` afin de décliner rapidement des dashboards marchands.【F:frontend/src/components/ui/DashboardLayout.vue†L1-L223】
- Utiliser les tokens `bg-nav-gradient`, `shadow-card` et `backdrop-blur` pour conserver l'effet glass sur les barres latérales et entêtes.【F:frontend/tailwind.config.js†L69-L106】

### Modales & overlays
- `Modal.vue` gère focus trap, animation `fade-in`/`scale-in` et tokens `overlay`/`backdrop-blur` pour l'arrière-plan.【F:frontend/src/components/ui/Modal.vue†L1-L210】
- `ConfirmModal.vue` étend la base pour les scénarios danger/success en s'appuyant sur les variantes de `Button` (`promo`, `destructive`).【F:frontend/src/components/ui/ConfirmModal.vue†L1-L123】【F:frontend/src/components/ui/Button.vue†L1-L160】
- `EmptyState.vue` fournit une structure standard (icône, titre, texte, CTA) avec animations `fade-in-up` pour harmoniser les pages sans données.【F:frontend/src/components/ui/EmptyState.vue†L1-L67】

### Notifications & feedback
- `Toast.vue` implémente les tonalités `success|info|warning|error`, `shadow-toast` et `backdrop-blur-md` pour les overlays flottants.【F:frontend/src/components/ui/Toast.vue†L1-L129】
- `NotificationSystem.vue` orchestre la pile, la minuterie et les transitions `slide-in-right`/`fade-out` pour aligner les toasts multiples sur la version React.【F:frontend/src/components/ui/NotificationSystem.vue†L1-L125】
- `NotificationContainer.vue` agrége les toasts de stores métiers (auth, panier, réservations) et démontre comment mutualiser les tokens de tonalité.【F:frontend/src/components/ui/NotificationContainer.vue†L1-L78】

### Cartes & data viz
- `ProductCard.vue` applique les badges `accent.orange`, `shadow-card` et transitions `hover:scale-105` pour présenter les paniers surprise.【F:frontend/src/components/ui/ProductCard.vue†L1-L118】
- `Stats.vue` anime les KPI avec `IntersectionObserver` + Framer Motion Vue (`@vueuse/motion`) et s'appuie sur les tailles `h3`/`h1` définies dans les tokens typographiques.【F:frontend/src/components/ui/Stats.vue†L1-L86】【F:frontend/tailwind.config.js†L52-L67】
- `Skeleton.vue` expose les arrondis `sm|md|lg|full` et l'animation `shimmer` pour standardiser les placeholders.【F:frontend/src/components/ui/Skeleton.vue†L1-L24】

### Champs de saisie
- `Input.vue` et `Textarea.vue` partagent des helpers pour labels flottants, icônes à gauche/droite et états d'erreur illustrant l'usage des couleurs `primary`, `neutral` et `accent.red`.【F:frontend/src/components/ui/Input.vue†L1-L141】【F:frontend/src/components/ui/Textarea.vue†L1-L120】
- Les tokens `focus-visible:ring-primary-400` et `transition-all ease-spring-out` doivent être respectés pour conserver la cohérence micro-interactions.【F:frontend/tailwind.config.js†L8-L106】

La présente convention doit être relue par l'équipe produit/design avant développement pour confirmer l'alignement sur les équivalents Vue du design system.
