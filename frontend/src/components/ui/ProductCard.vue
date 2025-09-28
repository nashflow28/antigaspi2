<template>
  <article
    v-bind="otherAttrs"
    :class="articleClasses"
    :aria-label="`Réserver ${name}`"
  >
    <div class="relative h-8xl w-full overflow-hidden sm:block">
      <img
        :src="image"
        :alt="name"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      >
      <span
        v-if="discount"
        class="relative sm:absolute left-4 top-4 rounded-full bg-blue-700 px-3 py-3 text-xs font-semibold text-gray-50 shadow-lg"
      >
        {{ discount }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50">
          {{ name }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          {{ merchant }}
        </p>
      </div>

      <div v-if="hasTags" class="flex flex-wrap gap-2">
        <span
          v-for="tag in tags"
          :key="tag"
          class="rounded-full bg-blue-500/10 px-3 py-3 text-xs text-blue-900 dark:text-blue-200"
        >
          {{ tag }}
        </span>
      </div>

      <div class="mt-auto flex items-end justify-start sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-blue-500">
            Prix anti-gaspi
          </p>
          <div class="flex items-baseline gap-2">
            <span class="text-h2 font-semibold text-blue-900 dark:text-blue-200">
              {{ price }}
            </span>
            <span v-if="originalPrice" class="text-sm text-gray-400 line-through">
              {{ originalPrice }}
            </span>
          </div>
          <p v-if="quantity" class="text-xs text-gray-500">
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
  'group relative flex flex-col overflow-hidden rounded border border-blue-500/15 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl dark:bg-gray-900'

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
