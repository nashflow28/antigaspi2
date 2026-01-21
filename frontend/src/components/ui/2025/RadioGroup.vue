<template>
  <div class="space-y-2" role="radiogroup">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const selectedValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

const selectOption = (value: string | number) => {
  selectedValue.value = value
  emit('update:modelValue', value)
}

provide('radioGroup', {
  selectedValue,
  selectOption
})
</script>
