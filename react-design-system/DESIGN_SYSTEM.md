# Antigaspi Design System

This design system defines the visual language for the modernized Antigaspi application.

## Color Palette
- **Brand (primary)**: `#2E7D32`
- **Accent (secondary)**: `#40C4FF`
- **CTA Orange**: `#FF9800`
- **Background cream**: `#FAF9F6`
- **Beige**: `#F5F5DC`
- Grays from `#fafafa` to `#09090b` for neutral surfaces.

## Typography
- **Sans/Display**: [Inter](https://fonts.google.com/specimen/Inter) and [Poppins](https://fonts.google.com/specimen/Poppins)
- **Mono**: JetBrains Mono

## Components
Reusable components leverage Tailwind CSS and Framer Motion:
- Buttons with gradient backgrounds and loading states
- Cards with glassmorphism and hover lift
- Inputs and textareas with validation feedback
- Navigation bar with theme toggle
- Footer and Stats sections
- Modal, Dashboard layout and more

### React primitives audit

Each primitive below lists its public API, styling variants and handled states. Use this inventory while migrating or extending the design system so Vue equivalents stay aligned.

#### Button (`src/components/ui/Button.tsx`)
- **Public props**: accepts all `HTMLMotionProps<'button'>` (except native `size`) plus `variant`, `size`, `loading`, `leftIcon`, `rightIcon`.
- **Variants**: `variant` (`primary`, `secondary`, `ghost`, `outline`, `promo`, `destructive`) and `size` (`sm`, `default`, `lg`, `xl`, `icon`).
- **States**: hover/tap scale via Framer Motion, focus-visible ring, `disabled` styling, `loading` spinner, light/dark mode color tokens.

#### Card (`src/components/ui/Card.tsx`)
- **Public props**: `variant`, `hover`, `padding`, plus motion `div` props. Provides `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent` sub-components accepting standard HTML attributes.
- **Variants**: `variant` (`default`, `glass`, `highlight`, `muted`), `hover` (`none`, `lift`, `glow`, `subtle`), `padding` (`none`, `sm`, `md`, `lg`).
- **States**: hover elevation/scale, animated entrance, dark mode border/background tokens.

#### DashboardLayout (`src/components/ui/DashboardLayout.tsx`)
- **Public props**: layout `children`, `sidebar` configuration (brand, navigation items with `active`/`badge`, optional footer), `header` configuration (user info, optional notifications/actions), `className`.
- **Variants**: responsive layout only (no explicit variant prop).
- **States**: internal `sidebarOpen` and `isMobile` state for responsive drawer, hover/focus styles on nav items, dark mode backgrounds.

#### EmptyState (`src/components/ui/EmptyState.tsx`)
- **Public props**: `title`, `description`, optional `actionLabel`, `onAction`, `icon`.
- **Variants**: none (single visual style).
- **States**: entry animation, call-to-action button inherits hover/focus/loading/disabled from `Button`.

#### Footer (`src/components/ui/Footer.tsx`)
- **Public props**: none (stateless footer block).
- **Variants**: none.
- **States**: motion fade-in, social links animate on hover/tap.

#### Input (`src/components/ui/Input.tsx`)
- **Public props**: extends text input attributes (minus native `size`) plus `variant`, `size`, `label`, `error`, `leftIcon`, `rightIcon`, `helperText`.
- **Variants**: `variant` (`subtle`, `filled`, `transparent`) and `size` (`sm`, `md`, `lg`).
- **States**: focus highlighting with internal `isFocused`, hover border transitions, `error` state messaging, `disabled` opacity, dark mode styling.

#### Modal & ConfirmationModal (`src/components/ui/Modal.tsx`)
- **Public props (Modal)**: `isOpen`, `onClose`, optional `title`, `description`, content `children`, `size` (`sm`, `default`, `lg`, `xl`, `full`), `variant` (`surface`, `glass`, `dark`), `showCloseButton`, `closeOnOverlayClick`, `closeOnEscape`, `className`.
- **Public props (ModalFooter)**: `children`, optional `className`.
- **Public props (ConfirmationModal)**: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, optional `confirmText`, `cancelText`, `variant` (`danger`, `primary`).
- **States**: AnimatePresence for enter/exit, overlay click handling, Escape key closing, button hover/focus via nested `Button`, dark mode palettes.

#### Navigation (`src/components/ui/Navigation.tsx`)
- **Public props**: `brand` (name/logo), `items` list (label, href, optional icon/active), optional `actions`, `className`.
- **Variants**: responsive layout only.
- **States**: internal `isOpen` mobile drawer, `scrolled` shadow state, hover/focus styling for links, theme toggle integration for dark mode.

#### ProductCard (`src/components/ui/ProductCard.tsx`)
- **Public props**: `image`, `name`, `merchant`, `price`, optional `originalPrice`, `discount`, `quantity`, `onReserve`, `tags`, `className`.
- **Variants**: none.
- **States**: hover scale/lift, optional discount badge, CTA button inherits button states, dark mode typography/background classes.

#### Skeleton (`src/components/ui/Skeleton.tsx`)
- **Public props**: `className`, `rounded` (`sm`, `md`, `lg`, `full`).
- **Variants**: rounding options.
- **States**: shimmer animation, dark mode background.

#### Stats (`src/components/ui/Stats.tsx`)
- **Public props**: `stats` array (`icon`, `value`, `label`, optional `suffix`).
- **Variants**: none.
- **States**: animated counting via Framer Motion, viewport reveal, dark mode colors.

#### Textarea (`src/components/ui/Textarea.tsx`)
- **Public props**: extends textarea attributes plus `variant`, `size`, `label`, `error`, `helperText`.
- **Variants**: `variant` (`subtle`, `filled`, `transparent`), `size` (`md`, `lg`).
- **States**: focus underline animation, error messaging, disabled opacity, dark mode styling.

#### ThemeToggle (`src/components/ui/ThemeToggle.tsx`)
- **Public props**: none.
- **Variants**: none.
- **States**: internal `isDark` toggles root `dark` class, hover/tap from nested `Button`.

#### Toast (`src/components/ui/Toast.tsx`)
- **Public props**: `isOpen`, `tone` (`success`, `info`, `warning`, `error`), optional `title`, `description`, `actionLabel`, `onAction`, `onClose`.
- **Variants**: tone-specific border/icon mapping.
- **States**: AnimatePresence for visibility, hover/focus on action button and close control, dark mode backgrounds.

Extend the Tailwind configuration in `tailwind.config.js` to modify or add tokens.
