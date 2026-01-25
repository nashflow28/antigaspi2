<template>
  <label
    class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all"
    :class="[
      isSelected
        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
        : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-25'
    ]"
  >
    <input
      type="radio"
      :value="value"
      :checked="isSelected"
      class="mt-1 h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
      @change="handleChange"
    >
    <div class="flex-1">
      <slot />
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

const props = defineProps<{
  value: string | number
}>()

const radioGroup = inject<{
  selectedValue: { value: string | number }
  selectOption: (value: string | number) => void
    }>('radioGroup')

const isSelected = computed(() => {
  return radioGroup?.selectedValue.value === props.value
})

const handleChange = () => {
  radioGroup?.selectOption(props.value)
}
</script>
