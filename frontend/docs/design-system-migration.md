# Migration des primitives React vers Vue

## Primitives React existantes
- **Button** : bouton animé multi-variantes avec états de chargement et icônes optionnelles.【F:react-design-system/src/components/ui/Button.tsx†L1-L112】
- **Card** : carte composée (header/content/footer) avec variantes de style, effets hover et options de padding.【F:react-design-system/src/components/ui/Card.tsx†L1-L131】
- **DashboardLayout** : layout complet avec sidebar réactive, en-tête sticky et gestion mobile du menu.【F:react-design-system/src/components/ui/DashboardLayout.tsx†L1-L163】
- **EmptyState** : bloc de repli centré avec icône, texte et CTA optionnel.【F:react-design-system/src/components/ui/EmptyState.tsx†L1-L36】
- **Footer** : pied de page marketing avec signature de marque et liens sociaux animés.【F:react-design-system/src/components/ui/Footer.tsx†L1-L40】
- **Input** : champ texte avec variantes (subtle/filled/transparent), gestion d’icônes et messages d’aide/erreur animés.【F:react-design-system/src/components/ui/Input.tsx†L1-L141】
- **Modal** (+ `ConfirmationModal`) : fenêtre modale accessible avec variantes de taille/style et footer d’actions.【F:react-design-system/src/components/ui/Modal.tsx†L1-L194】
- **Navigation** : barre supérieure responsive avec menu mobile, états actifs et toggle de thème intégré.【F:react-design-system/src/components/ui/Navigation.tsx†L1-L151】
- **ProductCard** : carte produit dédiée (image, prix remisé, tags, CTA « Réserver »).【F:react-design-system/src/components/ui/ProductCard.tsx†L1-L83】
- **Skeleton** : placeholder simple avec options d’arrondis et animation shimmer.【F:react-design-system/src/components/ui/Skeleton.tsx†L1-L25】
- **Stats** : grille de KPI animés (compteur framer-motion, icône, suffixe).【F:react-design-system/src/components/ui/Stats.tsx†L1-L57】
- **Textarea** : zone de saisie multi-variantes avec focus animés et messages d’aide/erreur.【F:react-design-system/src/components/ui/Textarea.tsx†L1-L120】
- **ThemeToggle** : bouton toggle clair/sombre appliquant la classe `dark` au document.【F:react-design-system/src/components/ui/ThemeToggle.tsx†L1-L48】
- **Toast** : notification flottante avec tonalités (success/info/warning/error), action secondaire et fermeture.【F:react-design-system/src/components/ui/Toast.tsx†L1-L106】

## Composants Vue actuels sur le même périmètre UI
- **Button** : bouton composable (variantes, tailles, icônes, états de chargement).【F:frontend/src/components/ui/Button.vue†L1-L158】
- **Card** : carte polyvalente avec slots header/footer et variantes hover/padding.【F:frontend/src/components/ui/Card.vue†L1-L78】
- **AccessibleModal** : modale accessible (focus trap, slots header/body/footer, actions confirm/cancel).【F:frontend/src/components/ui/AccessibleModal.vue†L1-L200】
- **AdminModal** : modale de contenu riche avec header iconique et actions personnalisées.【F:frontend/src/components/ui/AdminModal.vue†L1-L136】
- **ConfirmModal** : modale de confirmation légère avec variantes danger/success/warning.【F:frontend/src/components/ui/ConfirmModal.vue†L1-L123】
- **SimpleTopBar** : barre supérieure fixe avec actions (recherche, notifications, panier, menu utilisateur).【F:frontend/src/components/ui/SimpleTopBar.vue†L1-L167】
- **PageTransition** : wrapper de transition de page (fade/slide) selon navigation et préférences d’animation.【F:frontend/src/components/ui/PageTransition.vue†L1-L192】
- **DarkModeToggle** : switch clair/sombre persistant (localStorage + media query).【F:frontend/src/components/ui/DarkModeToggle.vue†L1-L129】
- **NotificationToast** : toast individuel (types, auto-dismiss, fermeture).【F:frontend/src/components/ui/NotificationToast.vue†L1-L90】
- **NotificationSystem** : pile de notifications avec icônes, barre de progression et gestion store/composable.【F:frontend/src/components/ui/NotificationSystem.vue†L1-L125】
- **NotificationContainer** : conteneur d’alertes store (auth/produits/réservations).【F:frontend/src/components/ui/NotificationContainer.vue†L1-L78】
- **Skeleton** : placeholder shimmer avec arrondis configurables.【F:frontend/src/components/ui/Skeleton.vue†L1-L24】

## Table de correspondance et état de migration
| Composant React | Rôle principal | Cible Vue actuelle | Statut de migration | Notes |
| --- | --- | --- | --- | --- |
| Button | Bouton d’action multi-variantes.【F:react-design-system/src/components/ui/Button.tsx†L6-L112】 | Button.【F:frontend/src/components/ui/Button.vue†L1-L158】 | OK | Prise en charge des variantes 2025, icônes et états de chargement natifs. |
| Card | Conteneur carte avec sous-composants.【F:react-design-system/src/components/ui/Card.tsx†L6-L131】 | Card.【F:frontend/src/components/ui/Card.vue†L1-L78】 | OK | Slots header/footer et options de padding/hover alignées sur le DS. |
| DashboardLayout | Layout dashboard sidebar + header.【F:react-design-system/src/components/ui/DashboardLayout.tsx†L5-L159】 | (à créer) – SimpleTopBar ne couvre qu’une barre supérieure.【F:frontend/src/components/ui/SimpleTopBar.vue†L1-L167】 | À faire | Construire un layout Vue complet (sidebar responsive, header actions) pour remplacer `DashboardLayout`. |
| EmptyState | État vide avec CTA.【F:react-design-system/src/components/ui/EmptyState.tsx†L5-L31】 | Aucun équivalent direct | À faire | Créer un composant Vue réutilisable d’état vide (icône, titre, description, action). |
| Footer | Pied de page marketing.【F:react-design-system/src/components/ui/Footer.tsx†L4-L37】 | Aucun équivalent direct | À faire | Implémenter un footer Vue stylé cohérent DS. |
| Input | Champ texte riche.【F:react-design-system/src/components/ui/Input.tsx†L6-L133】 | Aucun équivalent direct | À faire | Besoin d’un composant Input Vue avec variantes, icônes et messages. |
| Modal / ConfirmationModal | Modale générique + confirmation.【F:react-design-system/src/components/ui/Modal.tsx†L6-L190】 | AccessibleModal / AdminModal / ConfirmModal.【F:frontend/src/components/ui/AccessibleModal.vue†L1-L200】【F:frontend/src/components/ui/AdminModal.vue†L1-L136】【F:frontend/src/components/ui/ConfirmModal.vue†L1-L123】 | Partiel | Fonctionnalités présentes mais multiples implémentations ; converger vers une base unique alignée sur le DS React. |
| Navigation | Barre nav responsive + thème.【F:react-design-system/src/components/ui/Navigation.tsx†L24-L146】 | SimpleTopBar + DarkModeToggle.【F:frontend/src/components/ui/SimpleTopBar.vue†L1-L167】【F:frontend/src/components/ui/DarkModeToggle.vue†L1-L118】 | À compléter | Vue couvre topbar et toggle mais pas menu desktop/mobile unifié ; créer une `Navigation` Vue complète. |
| ProductCard | Carte produit CTA.【F:react-design-system/src/components/ui/ProductCard.tsx†L6-L78】 | Aucun équivalent direct | À faire | À implémenter en Vue (peut réutiliser Card + CTA). |
| Skeleton | Placeholder animé.【F:react-design-system/src/components/ui/Skeleton.tsx†L4-L21】 | Skeleton.【F:frontend/src/components/ui/Skeleton.vue†L1-L24】 | OK | Placeholder shimmer léger, arrondis configurables comme sur React. |
| Stats | Grille de KPI animés.【F:react-design-system/src/components/ui/Stats.tsx†L4-L54】 | Aucun équivalent direct | À faire | Créer composant `Stats` Vue avec compteur animé/variants. |
| Textarea | Zone de texte riche.【F:react-design-system/src/components/ui/Textarea.tsx†L6-L112】 | Aucun équivalent direct | À faire | Développer Textarea Vue calquée sur Input. |
| ThemeToggle | Switch thème.【F:react-design-system/src/components/ui/ThemeToggle.tsx†L5-L45】 | DarkModeToggle.【F:frontend/src/components/ui/DarkModeToggle.vue†L1-L118】 | OK | Fonctionnalité équivalente (persistante + animation). |
| Toast | Notification flottante.【F:react-design-system/src/components/ui/Toast.tsx†L6-L100】 | NotificationToast / NotificationSystem.【F:frontend/src/components/ui/NotificationToast.vue†L1-L90】【F:frontend/src/components/ui/NotificationSystem.vue†L1-L125】 | Partiel | Vue possède un toast unitaire et un système multi-toasts ; aligner design (bordure, actions ghost) et API. |

## Lots navigation grand public (vue côté client)

| Vue | Primitives DS utilisées | Statut |
| --- | --- | --- |
| `DiscoverView` | `Card`, `Button`, `Skeleton`, toasts globaux | ✅ Intégrée (liste des commerçants + favoris) |
| `CartPage` | `Card`, `Button`, `formatPrice`, toasts du store panier | ✅ Intégrée (résumé commande) |
| `CheckoutView` | `Card`, `Button`, `Skeleton`, notifications | ✅ Intégrée (formulaire paiement) |
| `FavoritesView` | `Card`, `Button`, `useFavoritesStore` + toasts | ✅ Intégrée (gestion favoris) |
| `MerchantDetailView` | `Card`, `Button`, `Skeleton`, `useMerchantsStore` | ✅ Intégrée (fiche détaillée) |
| `PublicReviewsView` | `Card`, `Button`, `Skeleton`, `useMerchantsStore` | ✅ Intégrée (retours communauté) |
| `OnboardingFlow` | `Card`, `Button`, `useOnboardingStore` | ✅ Intégrée (guide onboarding) |

