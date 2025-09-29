# Migration des primitives React vers Vue

## État des primitives Vue 2025

### Primitives livrées
- **DashboardLayout.vue** : fournit la grille complète dashboard avec sidebar animée, overlay mobile et slots pour la brand, la navigation, les actions header et l'utilisateur, tout en gérant les points de rupture Tailwind via `@vueuse/motion`.【F:frontend/src/components/ui/DashboardLayout.vue†L1-L200】
- **Button.vue** : variations `primary/secondary/ghost/outline/promo/destructive` + tailles `xs-xl`, icônes gauche/droite et état `loading` animés.【F:frontend/src/components/ui/2025/Button.vue†L1-L200】
- **Card.vue** : variantes `default/glass/gradient/bordered/elevated`, options `interactive`, padding, arrondis et ombres configurables pour les conteneurs 2025.【F:frontend/src/components/ui/2025/Card.vue†L1-L200】
- **Badge.vue** : 8 variantes tonales, tailles `xs-lg`, icônes optionnelles et badge dismissible pour signaux d'état ou KPI.【F:frontend/src/components/ui/2025/Badge.vue†L1-L170】
- **EmptyState.vue** : support icône/image/slot, actions primaires et secondaires réutilisant les boutons DS et gabarits `default/minimal/illustration` dimensionnés (`sm-lg`).【F:frontend/src/components/ui/2025/EmptyState.vue†L1-L200】
- **Input.vue** : champ contrôlé avec label, icônes, bouton clear, variantes `default/outline/filled`, tailles `sm-lg`, textes d'aide/erreur et modifiers `number`.【F:frontend/src/components/ui/2025/Input.vue†L1-L200】
- **Label.vue** : cinq tailles et variantes tonales (`default/muted/success/warning/error`) avec gestion disabled pour cohérence formulaire.【F:frontend/src/components/ui/2025/Label.vue†L1-L76】
- **Form.vue** : gabarit de formulaire avec header/footer, erreurs globales, actions par défaut (`Button` primaire/outline) et variantes `default/contained/minimal` + tailles `sm-lg`.【F:frontend/src/components/ui/2025/Form.vue†L1-L190】
- **Select.vue** : wrapper stylé avec tailles `xs-xl`, variantes `default/success/warning/error`, focus ring DS et prise en charge disabled/required.【F:frontend/src/components/ui/2025/Select.vue†L1-L100】
- **Dropdown.vue** & **DropdownItem.vue** : menu accessible avec placements configurables, déclencheur 2025 et éléments avec icônes, séparateurs, états danger/disabled.【F:frontend/src/components/ui/2025/Dropdown.vue†L1-L200】【F:frontend/src/components/ui/2025/DropdownItem.vue†L1-L105】
- **Tabs.vue** : tabs clavier avec état actif, icônes optionnelles et événements `tab-change` pour la navigation secondaire.【F:frontend/src/components/ui/2025/Tabs.vue†L1-L103】
- **Modal.vue** : téléportée, focus trap, variantes `default/glass/minimal/alert`, tailles `xs-full`, close button optionnel et overlay configurable.【F:frontend/src/components/ui/2025/Modal.vue†L1-L200】
- **Table.vue** : table responsive avec slots cellule, header optionnel, empty state intégré et styles DS (border/hover).【F:frontend/src/components/ui/2025/Table.vue†L1-L90】
- **Pagination.vue** : navigation paginée combinant boutons DS, modes compact/complet et sélecteur de taille via `Select`.【F:frontend/src/components/ui/2025/Pagination.vue†L1-L200】
- **Tooltip.vue** : info-bulle avec placements multiples, variantes (`dark/light/error/warning/success`), flèche et offset configurables.【F:frontend/src/components/ui/2025/Tooltip.vue†L1-L200】
- **Loading.vue** : états `spinner/dots/pulse/skeleton/progress/custom` avec variantes de taille, overlay et textes de statut.【F:frontend/src/components/ui/2025/Loading.vue†L1-L193】
- **Grid.vue** : composant utilitaire pour la grille responsive (cols/gap alignements) encapsulant la nomenclature Tailwind 2025.【F:frontend/src/components/ui/2025/Grid.vue†L1-L132】
- **Navigation.vue** : barre accessible avec skip links, gradients 2025, gestion du menu mobile (`v-model:mobileOpen`) et CTA authentification via `authCta`. Slots `brand/primary/secondary/utilities/mobile-*` exposés pour personnaliser brand, liens principaux et actions.【F:frontend/src/components/ui/2025/Navigation.vue†L1-L340】
- **index.ts** : export centralisé des composants + types (ButtonVariant, ModalSize, etc.) pour consommation des vues 2025.【F:frontend/src/components/ui/2025/index.ts†L1-L32】

### Couverture vs primitives React
| Composant React | Cible Vue 2025 | Statut | Notes |
| --- | --- | --- | --- |
| DashboardLayout | `DashboardLayout.vue` | ✅ Livré | Implémente sidebar responsive, header sticky et slots (plus riche que la version React).【F:frontend/src/components/ui/DashboardLayout.vue†L1-L200】 |
| EmptyState | `EmptyState.vue` | ✅ Livré | Prend en charge icône/image + actions, à brancher partout où un fallback est nécessaire.【F:frontend/src/components/ui/2025/EmptyState.vue†L1-L200】 |
| Input | `Input.vue` | ✅ Livré | Prêt pour la migration des formulaires (icônes, messages, clear).【F:frontend/src/components/ui/2025/Input.vue†L1-L200】 |
| Button | `Button.vue` | ✅ Livré | Variantes/tailles alignées, y compris `promo` et `destructive`.【F:frontend/src/components/ui/2025/Button.vue†L1-L200】 |
| Card | `Card.vue` | ✅ Livré | Slots header/footer, variantes glass/gradient/elevated disponibles.【F:frontend/src/components/ui/2025/Card.vue†L1-L200】 |
| Badge | `Badge.vue` | ✅ Livré | Couleurs statut + mode dismissible pour badges dynamiques.【F:frontend/src/components/ui/2025/Badge.vue†L1-L170】 |
| Modal / ConfirmationModal | `Modal.vue` + boutons DS | ✅ Livré | Supporte tailles, variantes et close behavior personnalisable.【F:frontend/src/components/ui/2025/Modal.vue†L1-L200】 |
| Navigation | `Navigation.vue` | ✅ Livré | Skip links, ARIA et menu mobile contrôlable (`v-model:mobileOpen`) + CTA auth via `authCta`. Slots pour brand/menus permettent d'étendre la barre selon les vues.【F:frontend/src/components/ui/2025/Navigation.vue†L1-L340】 |
| ProductCard | (à produire) | 🚧 À faire | Non implémenté côté Vue ; restera à construire à partir de `Card`/`Badge`. |
| Skeleton | `Loading.vue` (`type='skeleton'`) | ✅ Livré | Alternative plus flexible que le composant Skeleton React.【F:frontend/src/components/ui/2025/Loading.vue†L1-L142】 |
| Stats | (à produire) | 🚧 À faire | Aucun équivalent 2025 (utiliser `Card` + `Badge` en attendant). |
| Textarea | (à produire) | 🚧 À faire | À décliner à partir de `Input` (comportements partagés). |
| ThemeToggle | `2025/ThemeToggle.vue` | ✅ Livré | Composant aligné tokens 2025 (hover/focus, animations réduites) + persistance store (localStorage + media query) vérifiée par Playwright (`frontend/tests/e2e/theme-toggle.spec.ts`).【F:frontend/src/components/ui/2025/ThemeToggle.vue†L1-L141】【F:frontend/tests/e2e/theme-toggle.spec.ts†L1-L59】 |
| Toast | `NotificationToast.vue` / système legacy | 🚧 Harmonisation | Design 2025 pas encore porté (couleurs/bordures). |

### Navigation.vue — API 2025

Le composant expose une API complète pour migrer les topbars React vers Vue tout en conservant l’accessibilité clavier :

| API | Type | Description |
| --- | --- | --- |
| `brand` | `NavigationBrand` | Nom, lien (`to`/`href`), tagline et logo optionnel affichés dans le slot `brand`.【F:frontend/src/components/ui/2025/Navigation.vue†L34-L72】【F:frontend/src/components/layout/NavBar.vue†L6-L32】 |
| `main-links` | `NavigationLink[]` | Tableau rendu par défaut sur desktop/mobile avec rôles `menubar/menuitem`, badges et icônes. Les slots `primary`/`mobile-primary` permettent d’overrider le rendu.【F:frontend/src/components/ui/2025/Navigation.vue†L74-L168】 |
| `secondary-links` | `NavigationLink[]` | Actions secondaires par défaut. Peut être remplacé via `#secondary`/`#mobile-secondary`.【F:frontend/src/components/ui/2025/Navigation.vue†L170-L237】 |
| `auth-cta` | `{ login?: NavigationLink; primary?: NavigationCta }` | Configure le lien « Connexion » et le CTA principal (variant `Button`). Utilisé nativement sur desktop/mobile et exposé dans les slots pour personnalisation.【F:frontend/src/components/ui/2025/Navigation.vue†L170-L237】【F:frontend/src/components/layout/NavBar.vue†L44-L109】 |
| `v-model:mobileOpen` | `boolean` | Contrôle l’état du menu mobile. Le composant gère l’`Escape`, ferme sur clic et émet `@toggle-mobile`.【F:frontend/src/components/ui/2025/Navigation.vue†L241-L314】 |
| Slots | `brand`, `primary`, `secondary`, `utilities`, `mobile-primary`, `mobile-secondary`, `mobile-footer` | Injection avancée pour remplacer la brand, ajouter des toggles (DarkMode), ou proposer des contenus spécifiques mobile (profil).【F:frontend/src/components/ui/2025/Navigation.vue†L34-L237】 |
| Events | `@link-click`, `@cta-click`, `@update:mobileOpen` | Hooks pour analytics/route guards lors des clics nav & CTA.【F:frontend/src/components/ui/2025/Navigation.vue†L316-L340】 |

> ℹ️ `NavBar.vue` consomme désormais la primitive, délègue les slots brand/actions et raccorde `DarkModeToggle` ainsi que le menu utilisateur responsive.【F:frontend/src/components/layout/NavBar.vue†L1-L273】

## Checklists par vue prioritaire

### ProductDetailView2025
**Tokens & composants 2025**
- Fond gradient `from-surface-light` → `to-surface-darker` pour respecter les tokens surface/dark mode.【F:frontend/src/views/ProductDetailView2025.vue†L1-L39】
- `Card` variantes `glass`, `elevated` et `gradient` + `Badge` `success/promo` pour les états produit/prix.【F:frontend/src/views/ProductDetailView2025.vue†L36-L140】
- Boutons DS (`primary`, `ghost`, `success`) sur CTA, sélecteur de quantité et navigation.【F:frontend/src/views/ProductDetailView2025.vue†L16-L200】

**Validation QA recommandée**
- Vérifier les fallback visuels (icône `Package` et overlay) lorsqu’une image produit manque.【F:frontend/src/views/ProductDetailView2025.vue†L41-L52】
- Tester le calcul prix total et les désactivations (`:disabled`) des boutons +/- selon stock disponible.【F:frontend/src/views/ProductDetailView2025.vue†L159-L199】
- Contrôler l’état erreur « Produit introuvable » (alert + CTA retour) pour cohérence tonalités rouge.【F:frontend/src/views/ProductDetailView2025.vue†L11-L19】

### ReservationDetailView2025
**Tokens & composants 2025**
- Fond gradient surface/primary et skeleton `Card` pour loading state.【F:frontend/src/views/ReservationDetailView2025.vue†L1-L33】
- Header sticky avec `Button` ghost, séparateur et `Badge` statut (`size="lg"`).【F:frontend/src/views/ReservationDetailView2025.vue†L37-L71】
- Cartes détaillant produit/réservation + actions conditionnelles (`destructive`, `outline`).【F:frontend/src/views/ReservationDetailView2025.vue†L80-L195】

**Validation QA recommandée**
- S’assurer que le badge de statut change bien de variante selon `reservation.status` (success/warning/error).【F:frontend/src/views/ReservationDetailView2025.vue†L64-L70】
- Vérifier les options d’action (annulation, contact, reçu) et leur accessibilité (icônes + texte).【F:frontend/src/views/ReservationDetailView2025.vue†L170-L195】
- Tester le fallback image produit (bloc neutre + icône) et la cohérence des données marchand (adresse/téléphone).【F:frontend/src/views/ReservationDetailView2025.vue†L84-L120】

### DashboardView2025
**Tokens & composants 2025**
- `DashboardLayout` appliquant fond gradient global et slots sidebar/header.【F:frontend/src/views/DashboardView2025.vue†L1-L27】
- Grille de `Card` `glass` interactives pour les KPI, badges succès et CTA `ghost`/`primary`.【F:frontend/src/views/DashboardView2025.vue†L32-L173】
- États chargement/vides stylés à l’intérieur des cartes récentes (squelettes + fallback CTA).【F:frontend/src/views/DashboardView2025.vue†L175-L195】

**Validation QA recommandée**
- Contrôler le header sticky (blur + border) et la persistance du badge CO₂ dans les différentes largeurs.【F:frontend/src/views/DashboardView2025.vue†L7-L24】
- Vérifier l’animation retardée (`animation-delay`) des cartes KPI pour éviter les clignotements.【F:frontend/src/views/DashboardView2025.vue†L32-L151】
- Tester les scénarios récents : chargement (squelette), liste vide (fallback), navigation CTA « Voir tout ».【F:frontend/src/views/DashboardView2025.vue†L175-L195】

## Statut des tests visuels & snapshots
- `frontend/tests/design-validation.spec.ts` couvre actuellement homepage, profil et dashboard marchand : vérification gradients, responsive mobile, typos Inter, persistance dark mode et accessibilité du toggle (pas de snapshot, assertions CSS/DOM).【F:frontend/tests/design-validation.spec.ts†L1-L149】
- `frontend/tests/simple-design-test.spec.ts` fournit un smoke visuel léger (titre, navigation responsive, police Inter) mais sans ciblage des vues 2025 ni capture `toHaveScreenshot`.【F:frontend/tests/simple-design-test.spec.ts†L1-L39】
- `frontend/tests/e2e/theme-toggle.spec.ts` vérifie le nouveau `ThemeToggle` : focus clavier, aria-label dynamique, persistance localStorage et rechargement, servant de garde-fou accessibilité/UX. 【F:frontend/tests/e2e/theme-toggle.spec.ts†L1-L59】
- `frontend/tests/visual/product-detail-2025.spec.ts` capture désormais quatre snapshots (`desktop/mobile` × `clair/sombre`) du flux `ProductDetailView2025` après moquage de `GET /api/products/:id`, garantissant un rendu stable des badges, cartes et CTA 2025 via `expect(page).toHaveScreenshot()`.【F:frontend/tests/visual/product-detail-2025.spec.ts†L1-L104】
- `frontend/tests/visual/reservation-detail-2025.spec.ts` orchestre le même quadrillage (desktop/mobile × clair/sombre) pour `ReservationDetailView2025`, ensemence l’authentification locale et intercepte `GET /api/reservations/:id` avant la capture Playwright, couvrant header sticky, timeline et encarts d’économies.【F:frontend/tests/visual/reservation-detail-2025.spec.ts†L1-L114】
