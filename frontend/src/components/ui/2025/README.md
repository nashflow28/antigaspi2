# Design System 2025 - Composants UI

## Vue d'ensemble

Le Design System 2025 d'GELADAL est une collection complète de composants UI modernes conçus pour offrir une expérience utilisateur cohérente et accessible.

## Composants disponibles

### 🔘 Boutons et Actions
- **Button** - Bouton polyvalent avec 8 variantes
- **Dropdown** - Menu déroulant avec actions
- **DropdownItem** - Élément de menu dropdown

### 📝 Formulaires
- **Form** - Wrapper de formulaire avec validation
- **Input** - Champ de saisie avec variantes
- **Label** - Étiquette de formulaire
- **Select** - Liste déroulante

### 📊 Affichage de données
- **Table** - Tableau de données avec tri et pagination
- **Pagination** - Navigation de données
- **Card** - Conteneur de contenu
- **Badge** - Indicateurs et étiquettes

### 🎛️ Navigation
- **Tabs** - Onglets de navigation
- **Modal** - Boîtes de dialogue et overlays

### 💬 Feedback
- **Tooltip** - Info-bulles contextuelles
- **Loading** - États de chargement
- **EmptyState** - États vides

### 🎨 Mise en page
- **Grid** - Système de grille responsive

## Utilisation

```vue
<script setup>
import { Button, Card, Modal, useModal } from '@/components/ui/2025'

const modal = useModal()
</script>

<template>
  <Card variant="glass" hover="lift">
    <template #header>
      <h3>Mon Contenu</h3>
    </template>
    
    <p>Contenu de la carte...</p>
    
    <template #footer>
      <Button @click="modal.open()">
        Ouvrir Modal
      </Button>
    </template>
  </Card>

  <Modal
    v-model="modal.isOpen.value"
    title="Ma Modal"
    size="lg"
  >
    <p>Contenu de la modal...</p>
  </Modal>
</template>
```

## Composables

### useModal
Gestion d'état pour les modales

### useForm
Validation et gestion de formulaires

### useToast
Notifications toast

## Fonctionnalités

### ✨ Design Moderne 2025
- Glassmorphism et effets de flou
- Gradients modernes vert → cyan → bleu
- Micro-animations fluides
- Ombres sophistiquées

### ♿ Accessibilité
- Navigation clavier complète
- Focus states visibles
- ARIA labels et roles
- Contrastes WCAG AA

### 📱 Responsive
- Mobile-first design
- Breakpoints cohérents
- Layouts adaptatifs

### 🎨 Personnalisable
- Système de variantes
- Props flexibles
- Slots pour customisation
- Tokens de design

### 🚀 Performance
- Tree-shaking optimisé
- Bundle size minimal
- Animation hardware-accelerated
- Lazy loading

## Types TypeScript

Tous les composants incluent des types TypeScript complets pour une meilleure expérience de développement.

```typescript
import type { 
  ButtonVariant, 
  ModalSize, 
  TableColumn 
} from '@/components/ui/2025'
```

## Convention de nommage

- **Composants**: PascalCase (Button, Modal, etc.)
- **Props**: camelCase (variant, showHeader, etc.)
- **Slots**: kebab-case (header, footer, etc.)
- **Events**: kebab-case (tab-change, item-click, etc.)

## Contribution

Pour ajouter de nouveaux composants :

1. Suivre les patterns existants
2. Inclure les types TypeScript
3. Ajouter la documentation
4. Tester l'accessibilité
5. Vérifier la responsivité

## Validation visuelle (mai 2025)

- ✅ Boutons : vérification Storybook clair/sombre + responsive → tokens `primary`, `neutral`, `surface`, `accent` appliqués.
- ✅ Cartes : états par variante (`default`, `glass`, `gradient`, `bordered`) conformes aux ombres `shadow-card` et fonds `surface`.
- ✅ Badges : déclinaisons `default`, `status` et `outline` compatibles tokens + halo `ring` vérifié.
- ✅ Inputs : focus states et variantes (`default`, `outline`, `filled`) testés en desktop/mobile (claire/sombre).
- ✅ Vues migrées (Dashboard, Home, Product, Reservation) : audit visuel responsive → remplacement complet des anciens tokens Tailwind (`gray-*`, `blue-*`).

---

*Maintenu par l'équipe GELADAL - Design System 2025*
