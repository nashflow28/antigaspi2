<template>
  <article
    v-bind="otherAttrs"
    :class="articleClasses"
    :aria-label="`Réserver ${name}`"
  >
    <div class="relative h-48 w-full overflow-hidden">
      <img
        :src="image"
        :alt="name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      >
      <span
        v-if="discount"
        class="absolute left-4 top-4 rounded-full bg-primary-700 px-3 py-1 text-caption font-semibold text-neutral-50 shadow-card"
      >
        {{ discount }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-4 p-6">
      <div class="space-y-1">
        <h3 class="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">
          {{ name }}
        </h3>
        <p class="text-small text-neutral-500 dark:text-neutral-300">
          {{ merchant }}
        </p>
      </div>

      <div v-if="hasTags" class="flex flex-wrap gap-2">
        <span
          v-for="tag in tags"
          :key="tag"
          class="rounded-full bg-primary-500/10 px-3 py-1 text-caption text-primary-700 dark:text-primary-200"
        >
          {{ tag }}
        </span>
      </div>

      <div class="mt-auto flex items-end justify-between">
        <div>
          <p class="text-caption uppercase tracking-wide text-primary-500">
            Prix anti-gaspi
          </p>
          <div class="flex items-baseline gap-2">
            <span class="text-h2 font-semibold text-primary-700 dark:text-primary-200">
              {{ price }}
            </span>
            <span v-if="originalPrice" class="text-small text-neutral-400 line-through">
              {{ originalPrice }}
            </span>
          </div>
          <p v-if="quantity" class="text-caption text-neutral-500">
            {{ quantity }}
          </p>
        </div>

        <Button
          variant="primary"
          :aria-label="`Réserver ${name}`"
          :loading="reserveLoading"
          :disabled="reserveDisabled"
          @click="handleReserve"
        >
          Réserver
        </Button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, toRefs, useAttrs } from 'vue'
import Button from './Button.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    image: string;
    name: string;
    merchant: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    quantity?: string;
    tags?: string[];
    onReserve?: () => void;
    reserveLoading?: boolean;
    reserveDisabled?: boolean;
  }>(),
  {
    tags: () => [],
    reserveLoading: false,
    reserveDisabled: false
  }
)

const emit = defineEmits<{
  (event: 'reserve'): void;
  (event: 'onReserve'): void;
}>()

const attrs = useAttrs()

const baseClasses =
  'group relative flex flex-col overflow-hidden rounded-3xl border border-primary-500/15 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-glow dark:bg-neutral-900'

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')

const articleClasses = computed(() => [baseClasses, externalClass.value])

const otherAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const { image, name, merchant, price, originalPrice, discount, quantity, tags } = toRefs(props)

const hasTags = computed(() => (tags.value?.length ?? 0) > 0)

const handleReserve = (event: MouseEvent) => {
  event?.stopPropagation?.()
  event?.preventDefault?.()
  props.onReserve?.()
  emit('reserve')
  emit('onReserve')
}
</script>
