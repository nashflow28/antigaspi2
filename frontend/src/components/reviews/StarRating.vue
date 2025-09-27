<template>
  <div class="flex items-center space-y-2 sm:space-y-0 sm:space-x-2">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      class="focus:outline-none transition-colors duration-200"
      :class="{
        'cursor-pointer hover:scale-110': !readonly,
        'cursor-default': readonly
      }"
      @click="!readonly && setRating(star)"
    >
      <Star
        :size="size"
        :class="[
          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300',
          !readonly && star <= hoverRating ? 'text-yellow-400 fill-yellow-400' : '',
          !readonly ? 'hover:text-yellow-300' : ''
        ]"
        @mouseenter="!readonly && (hoverRating = star)"
        @mouseleave="!readonly && (hoverRating = 0)"
      />
    </button>

    <span v-if="showText" class="ml-2 text-responsive-sm text-body">
      {{ ratingText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star } from 'lucide-vue-next'

interface Props {
  modelValue?: number
  readonly?: boolean
  size?: number
  showText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  readonly: false,
  size: 20,
  showText: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rating = computed({
  get: () => props.modelValue,
  set: (value: number) => emit('update:modelValue', value)
})

const hoverRating = ref(0)

const ratingText = computed(() => {
  const currentRating = hoverRating.value || rating.value
  const texts = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bon', 'Excellent']
  return texts[currentRating] || ''
})

const setRating = (value: number) => {
  rating.value = value
}
</script>
