# 🎨 AntiGaspi Design System 2025

## Vue d'ensemble

Design system moderne et professionnel pour l'application AntiGaspi, intégrant les tendances 2025 avec glassmorphism, gradients modernes et micro-interactions fluides.

## 🌈 Palette de couleurs

### Couleurs Principales (Charte vert → bleu)
```css
/* Vert (Primary) */
--color-gradient-start: #22c55e (green-500)

/* Cyan (Middle) */
--color-gradient-middle: #06b6d4 (cyan-500)

/* Bleu (End) */
--color-gradient-end: #3b82f6 (blue-500)
```

### Gradients Signature 2025
- **Gradient Moderne** : `linear-gradient(135deg, #22c55e 0%, #06b6d4 50%, #3b82f6 100%)`
- **Gradient Hero** : `linear-gradient(135deg, #22c55e 0%, #0891b2 40%, #3b82f6 100%)`
- **Gradient Card** : `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`

### Dark Mode
- **Background** : `dark-900` → `dark-800` → `dark-900`
- **Text** : `dark-50` pour les titres, `dark-300` pour le contenu
- **Cards** : `dark-800/90` avec borders `dark-600/50`

## 📝 Typographie

### Polices Modernes 2025
- **Primary** : `Inter` (texte courant, UI)
- **Display** : `Outfit` (titres grands, hero)
- **Heading** : `Poppins` (sous-titres, CTA)

### Hiérarchie
```css
/* Display (Hero sections) */
display-sm: 3rem (48px)
display-md: 4rem (64px)
display-lg: 5rem (80px)
display-xl: 6rem (96px)

/* Headings */
h1: text-4xl lg:text-5xl (36px → 48px)
h2: text-3xl lg:text-4xl (30px → 36px)
h3: text-2xl lg:text-3xl (24px → 30px)
```

### Propriétés avancées
- **Letter spacing** : `-0.025em` pour les headings
- **Line height** : `1.2` pour les titres, `1.6` pour le contenu
- **Font features** : `cv11`, `ss01` activées

## 🎛️ Design Tokens (Tailwind)

Les primitives Vue/React reposent sur une couche commune de tokens déclarés dans `frontend/tailwind.config.js` et `react-design-system/tailwind.config.js`. Utilisez systématiquement ces classes utilitaires plutôt que des valeurs ad hoc :

- **Couleurs** : `primary.50-900`, `neutral.50-900`, `accent.blue|orange|red`, `surface.light|muted|dark|darker`, `overlay` pour les arrières-plans modals/toasts.【F:frontend/tailwind.config.js†L8-L37】
- **Typographie** : familles `font-sans`, `font-display`, `font-heading`, `font-mono` et échelles `caption` → `h1` + `display-sm` → `display-xl` pour les héros marketing.【F:frontend/tailwind.config.js†L39-L67】
- **Espacement & rayons** : nouveaux espacements `spacing[18|22|26|30]` et arrondis `rounded-4xl`, `rounded-5xl` pour les cartes hero/modales pleine largeur.【F:frontend/tailwind.config.js†L118-L134】
- **Effets** : `shadow-card`, `shadow-glow`, `shadow-toast`, gradients `bg-emerald-glass`, `bg-nav-gradient`, `backdrop-blur-xs` → `3xl` pour le glassmorphism.【F:frontend/tailwind.config.js†L69-L117】
- **Animations** : keyframes utilitaires (`fade-in-*`, `slide-in-*`, `scale-in`, `pulse-glow`, `float`, `wiggle`, `pulse-soft`, `shimmer`, `slide-up`) couplés à `transition-all duration-300 ease-spring-out`.

> 🔁 Les tokens sont synchronisés entre React et Vue : toute évolution Tailwind doit être reportée dans les deux projets pour garantir la parité visuelle.

## 🎯 Composants

### Button
```vue
<Button
  variant="primary|secondary|ghost|outline|promo|destructive"
  size="sm|default|lg|xl|icon"
  :loading="false"
  :disabled="false"
  :left-icon="IconeGauche"
  :right-icon="IconeDroite"
>
  Texte du bouton
</Button>
```

**Variantes** :
- `primary` : Dégradé nav-bar lumineux avec halo.
- `secondary` : Fond clair avec bordure accentuée.
- `ghost` : Transparent avec hover glassmorphism.
- `outline` : Bordure primaire + hover teinté.
- `promo` : Accent orange pour CTA marketing.
- `destructive` : Rouge soutenu pour actions critiques.

### Card
```vue
<Card
  variant="default|glass|highlight|muted"
  hover="none|lift|glow|subtle"
  padding="none|sm|md|lg"
>
  <template #header>
    <!-- header -->
  </template>

  Contenu principal

  <template #footer>
    <!-- footer -->
  </template>
</Card>
```

**Variantes** :
- `default` : Fond translucide avec border douce.
- `glass` : Effet glassmorphism 2025.
- `highlight` : Accentuation colorée pour focus.
- `muted` : Fond neutre pour blocs secondaires.

### Skeleton
```vue
<Skeleton
  class="h-8 w-full"
  rounded="sm|md|lg|full"
/>
```

Placeholders shimmer pour chargements avec arrondis configurables.

### DarkModeToggle
```vue
<DarkModeToggle />
```

Toggle automatique avec :
- Sauvegarde localStorage
- Détection système
- Animations fluides
- Feedback haptique

## ✨ Effets Visuels

### Glassmorphism
```css
.glass-2025 {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}
```

### Shadows 2025
- **Soft** : `0 2px 15px rgba(0,0,0,0.07)`
- **Medium** : `0 4px 25px rgba(0,0,0,0.1)`
- **Hard** : `0 10px 40px rgba(0,0,0,0.15)`
- **Lift** : `0 20px 60px rgba(0,0,0,0.25)`
- **Glow** : `0 0 20px rgba(34,197,94,0.3)`

### Hover Effects
```css
/* Lift Effect */
.hover-lift-2025:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

/* Glow Effect */
.hover-glow-2025:hover {
  box-shadow: 0 0 30px rgba(34,197,94,0.3);
}

/* Scale Effect */
.hover:scale-105
```

## 🎬 Animations

### Keyframes Modernes
```css
/* Fade In Up */
@keyframes fadeInUp2025 {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale In */
@keyframes scaleIn2025 {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

/* Glow Animation */
@keyframes glow2025 {
  0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.3); }
  50% { box-shadow: 0 0 40px rgba(34,197,94,0.6); }
}
```

### Easing Functions
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-bounce: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

### Durées
```css
--duration-instant: 0.1s;
--duration-fast: 0.2s;
--duration-normal: 0.3s;
--duration-slow: 0.5s;
```

## 📱 Responsive Design

### Breakpoints
- **Mobile** : `< 768px`
- **Tablet** : `768px - 1024px`
- **Desktop** : `> 1024px`

### Mobile-First Adaptations
```css
/* Panels plus petits sur mobile */
@media (max-width: 768px) {
  .surface-panel { @apply p-4 rounded-2xl; }
}

/* Boutons adaptés via l'attribut data-size exposé par Button.vue */
@media (max-width: 768px) {
  [data-size='lg'] { @apply px-4 py-2.5 text-sm; }
}
```

## ♿ Accessibilité

### Focus States
```css
.focus-2025 {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500/50;
  transition: all 0.2s ease-out-expo;
}
```

### Contrastes WCAG AA
- **Text/Background** : Minimum 4.5:1
- **Large Text** : Minimum 3:1
- **UI Components** : Minimum 3:1

### Navigation Clavier
- Tous les composants interactifs sont focusables
- Focus visible avec ring coloré
- Navigation logique avec tab order

## 🔧 Utilisation

### Installation
```vue
<!-- Dans votre composant Vue -->
<script setup>
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
</script>
```

### Import CSS
```css
/* Dans main.css */
@import './modern-2025.css';
```

### Configuration Tailwind
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter'],
        'display': ['Outfit'],
        'heading': ['Poppins']
      }
    }
  }
}
```

## 📊 Performance

### Optimisations
- **Font loading** : `font-display: swap`
- **Critical CSS** : Styles de base inline
- **Lazy loading** : Animations non-critiques
- **Hardware acceleration** : `transform3d`, `will-change`

### Métriques
- **First Paint** : < 1.5s
- **LCP** : < 2.5s
- **CLS** : < 0.1
- **FID** : < 100ms

## 🔍 Vérifications mai 2025

- ✅ Palette UI synchronisée : Tooltip, Tabs, Pagination, Modal, Select, EmptyState & co utilisent désormais uniquement les tokens `primary`/`neutral`/`accent` (revue Storybook clair/sombre + responsive locale).
- ✅ Vues 2025 (ProductDetail, ReservationDetail, Admin Dashboard, Merchant Product Edit) vérifiées visuellement après remplacement des anciennes classes (`gray-*`, `blue-*`) par les utilitaires tokens.

---

## 🎯 Checklist Design 2025

✅ **Typographie moderne** (Inter, Poppins, Outfit)
✅ **Glassmorphism** avec backdrop-blur
✅ **Gradients modernes** 3 couleurs
✅ **Dark mode** automatique
✅ **Micro-animations** fluides
✅ **Hover effects** lift + glow
✅ **Focus states** accessibles
✅ **Mobile-first** responsive
✅ **Performance** optimisée
✅ **Composants** réutilisables

**Status** : ✨ Production Ready 2025 ✨