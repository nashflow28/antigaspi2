# 🎨 Antigaspi React Design System

Un système de design moderne, élégant et professionnel pour l'application React Antigaspi, utilisant **dark mode par défaut** avec des accents violet (#6B21A8) et bleu (#3B82F6).

## ✨ Caractéristiques

- **🌙 Dark Mode** - Interface sombre par défaut avec palette de couleurs optimisée
- **💎 Glassmorphism** - Effets de transparence et backdrop-blur modernes
- **🎭 Animations fluides** - Micro-interactions avec Framer Motion
- **📱 Mobile-first** - Design responsive pour tous les écrans
- **🎯 TypeScript** - Typage strict pour une meilleure DX
- **🔧 Modulaire** - Composants réutilisables et configurables

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Brand**: Purple (#a855f7, #6b21a8) - Couleur principale violette moderne
- **Accent**: Blue (#3b82f6) - Couleur d'accentuation bleue
- **Success**: Green (#22c55e) - Pour les états de succès
- **Warning**: Yellow (#eab308) - Pour les avertissements
- **Error**: Red (#ef4444) - Pour les erreurs
- **Neutral**: Grays (#fafafa → #0a0a0a) - Nuances de gris

## 🧩 Composants

### Core Components

#### Button
```tsx
import { Button } from './components/ui/Button';

<Button variant="primary" size="lg">
  Action Principale
</Button>

<Button variant="outline" leftIcon={<Icon />}>
  Avec Icône
</Button>

<Button loading={true}>
  Chargement...
</Button>
```

**Variants:** `primary` | `secondary` | `outline` | `ghost` | `destructive`
**Sizes:** `sm` | `default` | `lg` | `xl` | `icon`

#### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';

<Card variant="glass" hover="lift">
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu avec effet glassmorphism
  </CardContent>
</Card>
```

**Variants:** `default` | `glass` | `primary` | `accent`
**Hover:** `none` | `lift` | `glow`

#### Input & Textarea
```tsx
import { Input, Textarea } from './components/ui';

<Input
  label="Email"
  variant="glass"
  error="Message d'erreur"
  leftIcon={<EmailIcon />}
/>

<Textarea
  label="Description"
  variant="glass"
  helperText="Texte d'aide"
/>
```

#### Modal
```tsx
import { Modal, ConfirmationModal } from './components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Titre du modal"
  size="lg"
  variant="glass"
>
  Contenu du modal avec animations
</Modal>

<ConfirmationModal
  isOpen={confirmOpen}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Confirmer l'action"
  message="Êtes-vous sûr de vouloir continuer ?"
  variant="danger"
/>
```

#### Navigation
```tsx
import { Navigation } from './components/ui/Navigation';

<Navigation
  brand={{ name: "Antigaspi", logo: <Logo /> }}
  items={[
    { label: "Accueil", href: "/", active: true },
    { label: "Produits", href: "/products" },
  ]}
  actions={<Button>Se connecter</Button>}
  variant="glass"
/>
```

### Layout Components

#### DashboardLayout
```tsx
import { DashboardLayout } from './components/ui/DashboardLayout';

<DashboardLayout
  sidebar={{
    brand: { name: "Antigaspi", logo: <Logo /> },
    navigation: sidebarItems
  }}
  header={{
    user: { name: "Marie", email: "marie@example.com" },
    notifications: <NotificationBell />,
    actions: <Button>Action</Button>
  }}
>
  <div>Contenu principal</div>
</DashboardLayout>
```

## 🎬 Animations

Le système utilise Framer Motion avec des animations préconfigurées :

```tsx
import {
  pageVariants,
  containerVariants,
  itemVariants
} from './utils/animations';

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Animations Disponibles
- **Page Transitions** - Transitions fluides entre les pages
- **Stagger Animations** - Animations en cascade pour les listes
- **Hover Effects** - Effets au survol (scale, lift, glow, rotate)
- **Loading States** - États de chargement (pulse, shimmer, spinner)
- **Modal Animations** - Ouverture/fermeture de modals
- **Micro-interactions** - Feedback visuel sur les interactions

## 📱 Pages d'Exemple

### Page de Connexion
- Design centré avec effets de background
- Formulaire avec validation en temps réel
- Intégration sociale (Google, Facebook)
- Animations d'entrée fluides

### Dashboard
- Layout responsive avec sidebar collapsible
- Cartes de statistiques avec icônes
- Activité récente avec animations stagger
- Actions rapides et métriques d'impact

## 🛠️ Installation & Usage

1. **Installation des dépendances**
```bash
npm install framer-motion class-variance-authority clsx tailwind-merge
npm install -D @types/react @types/react-dom tailwindcss
```

2. **Configuration Tailwind**
Utilisez le fichier `tailwind.config.js` fourni avec toutes les couleurs, animations et utilitaires personnalisés.

3. **Import des composants**
```tsx
import { Button, Card, Modal } from './components/ui';
import { pageVariants, containerVariants } from './utils/animations';
```

## 🎯 Conventions de Design

### Espacement
- **Système 4px** - Espacement cohérent basé sur des multiples de 4
- **Composants** - Padding intérieur généreux (16px, 24px)
- **Layout** - Margins externes consistantes

### Typographie
- **Font Primary** - Inter (ui-sans-serif fallback)
- **Font Display** - Cal Sans pour les titres
- **Font Mono** - JetBrains Mono pour le code
- **Échelle** - sm (14px), base (16px), lg (18px), xl (20px)

### Couleurs d'Usage
- **Background** - gray-950 (très foncé)
- **Surface** - gray-900 avec transparence
- **Text Primary** - white
- **Text Secondary** - gray-300
- **Text Muted** - gray-500

### Bordures & Shadows
- **Border Radius** - Généreux (xl: 12px, 2xl: 16px)
- **Borders** - Subtiles avec transparence (border-gray-700/50)
- **Shadows** - Douces avec couleurs de marque (shadow-brand-500/25)

## 🚀 Bonnes Pratiques

### Performance
- **Lazy Loading** - Chargement différé des composants lourds
- **Code Splitting** - Division du code par fonctionnalités
- **Memoization** - React.memo pour les composants coûteux

### Accessibilité
- **Focus States** - États de focus visibles et cohérents
- **ARIA Labels** - Labels appropriés pour les lecteurs d'écran
- **Keyboard Navigation** - Navigation clavier complète
- **Color Contrast** - Contrastes respectant les standards WCAG

### Responsive Design
- **Mobile-First** - Design optimisé pour mobile d'abord
- **Breakpoints** - sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible Grids** - CSS Grid et Flexbox pour des layouts adaptatifs

---

## 📦 Structure du Projet

```
react-design-system/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Modal.tsx
│   │       ├── Navigation.tsx
│   │       ├── DashboardLayout.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── utils/
│   │   ├── cn.ts
│   │   └── animations.ts
│   └── types/
├── tailwind.config.js
└── README.md
```

**Créé avec passion pour Antigaspi** 🌱✨