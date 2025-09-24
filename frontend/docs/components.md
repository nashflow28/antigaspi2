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

La présente convention doit être relue par l'équipe produit/design avant développement pour confirmer l'alignement sur les équivalents Vue du design system.
