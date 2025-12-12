/**
 * Primitives UI 2025 - Export centralisé
 * Point d'entrée unique pour tous les composants 2025
 */

// Core components
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { Card } from './Card'
export type { CardProps, CardVariant } from './Card'

export { Badge } from './Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge'

export { Modal } from './Modal'
export type { ModalProps, ModalVariant } from './Modal'

export { default as ConfirmModal } from './ConfirmModal'
export type { ConfirmModalVariant } from './ConfirmModal'

export {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  BodyText,
  SmallText,
  CaptionText,
  Display,
} from './Typography'
export type { TypographyProps, TypographyVariant, TypographyColor } from './Typography'

export { default as Toast } from './Toast'
export type { ToastProps, ToastVariant } from './Toast'