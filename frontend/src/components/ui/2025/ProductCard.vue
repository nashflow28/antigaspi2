<template>
  <Card
    v-bind="cardAttrs"
    :class="cardClasses"
    :variant="resolvedVariant"
    :interactive="interactive && !isDisabled"
    :no-padding="true"
    :aria-label="ariaLabel"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :data-state="isDisabled ? 'disabled' : 'default'"
    :data-promo="isPromo ? 'true' : 'false'"
    :data-testid="dataTestId"
  >
    <div class="product-card__wrapper">
      <div class="product-card__media">
        <img
          :src="image"
          :alt="imageAlt"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        >

        <!-- Badge discount (top-left) -->
        <Badge
          v-if="discount"
          data-testid="product-card-discount"
          variant="promo"
          size="xs"
          class="product-card__discount"
        >
          {{ discount }}
        </Badge>

        <!-- Badge urgency (top-right) - only if low stock -->
        <Badge
          v-if="isLowStock"
          data-testid="product-card-urgency"
          variant="warning"
          size="xs"
          class="product-card__urgency"
        >
          Quasi épuisé
        </Badge>
      </div>

      <div class="product-card__body">
        <div class="space-y-2">
          <h3 class="product-card__title" data-testid="product-name">
            {{ name }}
          </h3>
          <div class="flex items-center gap-2">
            <p class="product-card__merchant">
              {{ merchant }}
            </p>
            <Badge
              v-if="merchantRating && merchantRating > 0"
              variant="soft"
              size="sm"
              class="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            >
              <span class="flex items-center gap-1">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ merchantRating.toFixed(1) }}
              </span>
            </Badge>
          </div>
        </div>

        <!-- Meta info section (replaces multiple badges) -->
        <div v-if="hasMetaInfo" class="product-card__meta">
          <p v-if="quantity" class="product-card__meta-item">
            <span class="product-card__meta-icon">✨</span>
            {{ quantity }}
          </p>
          <p v-if="pickupTime" class="product-card__meta-item">
            <span class="product-card__meta-icon">🕐</span>
            {{ pickupTime }}
          </p>
        </div>

        <div
          v-if="hasTags"
          class="product-card__tags"
        >
          <Badge
            v-for="tag in normalizedTags"
            :key="tag.label"
            data-testid="product-card-tag"
            :variant="tag.variant || 'outline'"
            size="xs"
            class="product-card__tag"
          >
            <component
              :is="tag.icon"
              v-if="tag.icon"
              :size="12"
              class="mr-1"
            />
            {{ tag.label }}
          </Badge>
        </div>

        <div class="product-card__footer">
          <div class="product-card__pricing">
            <p class="product-card__pricing-label">
              Prix anti-gaspi
            </p>
            <div class="product-card__pricing-values">
              <span class="product-card__price" data-testid="product-price">{{ price }}</span>
              <span v-if="originalPrice" class="product-card__original-price">{{ originalPrice }}</span>
            </div>
            <p v-if="savings" class="product-card__savings">
              {{ savings }}
            </p>
          </div>

          <div class="product-card__cta">
            <slot
              name="cta"
              :reserve="handleReserve"
              :disabled="isDisabled"
              :loading="reserveLoading"
              :aria-label="ariaLabel"
            >
              <Button
                :variant="isPromo ? 'promo' : 'primary'"
                size="sm"
                data-testid="add-to-cart"
                :aria-label="ariaLabel"
                :loading="reserveLoading"
                :disabled="isDisabled"
                @click.stop.prevent="handleReserve"
              >
                {{ reserveLabel }}
              </Button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import Card, { type CardVariant } from './Card.vue'
import Badge, { type BadgeVariant } from './Badge.vue'
import Button from './Button.vue'

defineOptions({ inheritAttrs: false })

export interface ProductCardTag {
  label: string
  variant?: BadgeVariant
  icon?: any
}

export interface ProductCardBadge {
  label: string
  variant?: BadgeVariant
  icon?: any
}

interface Props {
  image: string
  name: string
  merchant: string
  merchantRating?: number
  price: string
  originalPrice?: string
  discount?: string
  savings?: string
  quantity?: string
  pickupTime?: string
  lowStock?: boolean
  imageAlt?: string
  tags?: Array<string | ProductCardTag>
  stockBadges?: ProductCardBadge[]
  reserveLabel?: string
  reserveLoading?: boolean
  reserveDisabled?: boolean
  disabled?: boolean
  promo?: boolean
  featured?: boolean
  interactive?: boolean
  cardVariant?: CardVariant
  onReserve?: () => void
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  stockBadges: () => [],
  reserveLabel: 'Réserver',
  reserveLoading: false,
  reserveDisabled: false,
  disabled: undefined,
  promo: undefined,
  interactive: true,
  cardVariant: undefined,
  onReserve: undefined,
  ariaLabel: undefined,
  imageAlt: undefined
})

const emit = defineEmits<{
  (event: 'reserve'): void
  (event: 'onReserve'): void
}>()

const attrs = useAttrs()

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const dataTestId = computed(() => (attrs['data-testid'] as string | undefined) ?? 'product-card-2025')
const ariaLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? props.ariaLabel ?? `Réserver ${props.name}`)
const imageAlt = computed(() => props.imageAlt ?? props.name)
const reserveLoading = computed(() => props.reserveLoading)
const reserveLabel = computed(() => props.reserveLabel)

const otherAttrs = computed(() => {
  const { class: _class, 'aria-label': _ariaLabel, 'data-testid': _dataTestId, role: _role, ...rest } = attrs
  return {
    role: (attrs.role as string | undefined) ?? 'article',
    ...rest
  }
})

const cardAttrs = computed(() => otherAttrs.value)

const isPromo = computed(() => props.promo ?? Boolean(props.discount))
const isDisabled = computed(() => {
  if (typeof props.disabled === 'boolean') {
    return props.disabled
  }

  return props.reserveDisabled || reserveLoading.value
})

const resolvedVariant = computed<CardVariant | undefined>(() => {
  if (props.cardVariant) {
    return props.cardVariant
  }

  return isPromo.value ? 'gradient' : 'elevated'
})

const cardClasses = computed(() => [
  'product-card-2025 group relative flex h-full flex-col overflow-hidden',
  externalClass.value,
  isDisabled.value && 'opacity-80'
].filter(Boolean).join(' '))

const normalizedTags = computed(() => {
  return (props.tags ?? [])
    .map(tag => {
      if (typeof tag === 'string') {
        return { label: tag, variant: 'outline' as BadgeVariant }
      }
      return tag
    })
    .filter((tag): tag is ProductCardTag => Boolean(tag?.label))
})

const normalizedStockBadges = computed(() => {
  return (props.stockBadges ?? [])
    .map(badge => ({
      variant: badge.variant ?? 'secondary',
      ...badge
    }))
    .filter((badge): badge is ProductCardBadge => Boolean(badge?.label))
})

const hasTags = computed(() => normalizedTags.value.length > 0)
const hasStockBadges = computed(() => normalizedStockBadges.value.length > 0)
const isLowStock = computed(() => props.lowStock ?? false)
const hasMetaInfo = computed(() => Boolean(props.quantity || props.pickupTime))

const interactive = computed(() => props.interactive)

const handleReserve = (event?: MouseEvent) => {
  event?.stopPropagation?.()
  event?.preventDefault?.()

  if (isDisabled.value) {
    return
  }

  props.onReserve?.()
  emit('reserve')
  emit('onReserve')
}
</script>

<style scoped>
.product-card__wrapper {
  @apply flex h-full flex-col;
}

.product-card__media {
  @apply relative aspect-[4/3] w-full overflow-hidden;
}

.product-card__discount {
  @apply absolute left-4 top-4 shadow-glow;
}

.product-card__urgency {
  @apply absolute right-4 top-4 shadow-glow bg-amber-500 text-white;
}

.product-card__stock {
  @apply absolute inset-x-4 bottom-4 flex flex-wrap justify-center gap-2;
}

.product-card__stock-badge {
  @apply backdrop-blur-sm bg-surface-light/90 dark:bg-surface-dark/80 shadow-sm;
}

.product-card__body {
  @apply flex h-full flex-col gap-5 p-6;
}

.product-card__title {
  @apply text-xl font-semibold text-neutral-900 dark:text-neutral-50;
}

.product-card__merchant {
  @apply text-sm text-neutral-500 dark:text-neutral-300;
}

.product-card__meta {
  @apply flex flex-col gap-1.5 text-sm text-neutral-600 dark:text-neutral-400;
}

.product-card__meta-item {
  @apply flex items-center gap-2;
}

.product-card__meta-icon {
  @apply text-base;
}

.product-card__tags {
  @apply flex flex-wrap gap-2;
}

.product-card__tag {
  @apply bg-primary-500/10 text-primary-700 dark:text-primary-200;
}

.product-card__footer {
  @apply mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between;
}

.product-card__pricing-label {
  @apply text-xs uppercase tracking-wide text-primary-500;
}

.product-card__pricing-values {
  @apply flex items-baseline gap-3;
}

.product-card__price {
  @apply text-3xl font-semibold text-primary-700 dark:text-primary-200;
}

.product-card__original-price {
  @apply text-sm text-neutral-400 line-through;
}

.product-card__savings {
  @apply text-sm font-medium text-emerald-600 dark:text-emerald-400;
}

.product-card__quantity {
  @apply text-sm text-neutral-500 dark:text-neutral-300;
}

.product-card__cta {
  @apply flex items-center justify-start sm:justify-end;
}

.product-card-2025[data-state='disabled'] {
  @apply saturate-50;
}

.product-card-2025[data-state='disabled'] .product-card__cta :deep(button) {
  @apply pointer-events-none;
}
</style>
