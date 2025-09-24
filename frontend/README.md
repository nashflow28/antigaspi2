# Frontend AntiGaspi — Design System Vue 2025

Ce dossier contient l'implémentation Vue des primitives UI alignées avec le design system 2025. Il sert de référence pour les développeurs qui intègrent les composants et les tokens Tailwind centralisés.

## Primitives disponibles

| Primitive | Fichier | Cas d'usage principal |
| --- | --- | --- |
| `Button` | `src/components/ui/Button.vue` | Actions primaires/secondaires, CTA marketing, boutons fantômes ou outline avec états `loading`/`disabled` et icônes. |
| `Card` | `src/components/ui/Card.vue` | Conteneur glassmorphism avec slots `header`/`footer`, padding responsive et effets de hover (`lift`, `glow`). |
| `Navigation` | `src/components/ui/Navigation.vue` | Barre supérieure responsive, menu mobile animé et synchronisation du thème clair/sombre. |
| `DashboardLayout` | `src/components/ui/DashboardLayout.vue` | Gabarit complet avec sidebar collapsible, header sticky et gestion du mode dark. |
| `Modal` / `ConfirmModal` | `src/components/ui/Modal.vue`, `ConfirmModal.vue` | Fenêtres accessibles (focus trap, overlay, animation) + confirmation danger/success. |
| `EmptyState` | `src/components/ui/EmptyState.vue` | Bloc de fallback (icône, titre, description, CTA). |
| `Toast` / `NotificationSystem` | `src/components/ui/Toast.vue`, `NotificationSystem.vue` | Notifications flottantes tonales avec actions secondaires, pile multi-toasts et minuterie. |
| `ProductCard` | `src/components/ui/ProductCard.vue` | Carte produit marchand (prix remisé, badge de réduction, CTA « Réserver »). |
| `Stats` | `src/components/ui/Stats.vue` | KPI animés (compteur framer-motion, suffixes). |
| `Input` / `Textarea` | `src/components/ui/Input.vue`, `Textarea.vue` | Champs de saisie multi-variantes avec labels flottants, helper text et messages d'erreur animés. |
| `Skeleton` | `src/components/ui/Skeleton.vue` | Placeholders shimmer avec tokens d'arrondis (`sm` → `full`). |
| `ThemeToggle` | `src/components/ui/ThemeToggle.vue` | Toggle persistant du thème (`localStorage` + media query). |

> ℹ️ Les autres utilitaires (ex. `LazyImage`, `NetworkStatus`, `PageTransition`) réutilisent ces primitives et les tokens décrits ci-dessous.

## Tokens Tailwind

Les tokens sont définis dans `tailwind.config.js` et doivent être consommés via des classes utilitaires plutôt que des valeurs hex/brutes.

### Couleurs
- `primary` (`50` → `900`) : gradient vert pour CTA, badges et halos focus.
- `neutral` (`50` → `900`) : fonds neutres, texte secondaire et bordures.
- `accent.blue`, `accent.orange`, `accent.red` : CTA marketing, états promotionnels ou destructifs.
- `surface.light`, `surface.muted`, `surface.dark`, `surface.darker` : blocs glass/dark.
- `overlay` : backdrop semi-opaque utilisé par `Modal` et `Toast`.

### Typographie
- `font-sans`, `font-display`, `font-heading`, `font-mono` : Inter/Outfit/Poppins/JetBrains.
- Échelles `caption` → `h1` et `display-sm` → `display-xl` pour héro, titres marketing et dashboards.

### Spacing & Radius
- Nouveaux espacements `18`, `22`, `26`, `30` (4.5 → 7.5rem) pour sections et layouts.
- Rayon `rounded-4xl`/`5xl` pour cartes hero, modales et illustrations.

### Effets & Animations
- Ombres `shadow-card`, `shadow-glow`, `shadow-toast`.
- Fond `bg-emerald-glass`, `bg-nav-gradient` pour boutons/headers.
- `backdrop-blur-xs` → `3xl` pour overlays, toasts, cards glass.
- Timing `ease-spring-out` et animations `fade-in-*`, `slide-in-*`, `scale-in`, `pulse-glow`, `float`, `wiggle`, `pulse-soft`, `shimmer`, `slide-up`.

### Bonnes pratiques
- Toujours coupler `transition-all duration-300 ease-spring-out` aux interactions primaires.
- Respecter les tokens focus : `focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50` (adapter en dark mode).
- Préférer les classes `dark:` plutôt que des conditions JS pour les couleurs.

## Flow d'intégration
1. Importer les primitives depuis `src/components/ui` (chemin relatif ou alias `@/components/ui`).
2. Injecter les tokens via classes Tailwind, ou via `:class` lorsqu'une variante dynamique est nécessaire.
3. Documenter les combinaisons spécifiques dans `frontend/docs/components.md` pour conserver l'alignement avec la version React.
4. Vérifier les cas `dark` dans Storybook ou via `ThemeToggle` avant de merger.

## Ressources complémentaires
- [Design System 2025](../DESIGN_SYSTEM_2025.md)
- [Guide de migration des primitives](docs/design-system-migration.md)
- [Changelog UI](docs/design-system-changelog.md)
