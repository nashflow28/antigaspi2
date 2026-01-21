<template>
  <div class="space-y-2">
    <div class="flex gap-2 justify-center">
      <input
        v-for="(digit, index) in length"
        :key="index"
        :ref="(el) => setInputRef(el as HTMLInputElement, index)"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :value="digits[index] || ''"
        class="w-12 h-12 text-center text-2xl font-semibold border-2 rounded-lg transition-all"
        :class="[
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-200',
          'focus:outline-none focus:ring-2'
        ]"
        @input="handleInput(index, $event)"
        @keydown="handleKeyDown(index, $event)"
        @paste="handlePaste"
      />
    </div>
    <p v-if="error" class="text-sm text-red-600 text-center">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    length?: number
    error?: string
  }>(),
  {
    length: 4,
    error: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const digits = ref<string[]>(Array(props.length).fill(''))
const inputRefs = ref<HTMLInputElement[]>([])

const setInputRef = (el: HTMLInputElement, index: number) => {
  if (el) {
    inputRefs.value[index] = el
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      digits.value = newVal.split('').slice(0, props.length)
    } else {
      digits.value = Array(props.length).fill('')
    }
  },
  { immediate: true }
)

const handleInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')

  if (value.length > 1) {
    value = value[0]
  }

  digits.value[index] = value
  input.value = value

  emitValue()

  if (value && index < props.length - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '') || ''
  const pastedDigits = pastedData.split('').slice(0, props.length)

  pastedDigits.forEach((digit, index) => {
    digits.value[index] = digit
    if (inputRefs.value[index]) {
      inputRefs.value[index].value = digit
    }
  })

  emitValue()

  const nextEmptyIndex = digits.value.findIndex((d) => !d)
  if (nextEmptyIndex !== -1) {
    inputRefs.value[nextEmptyIndex]?.focus()
  } else {
    inputRefs.value[props.length - 1]?.focus()
  }
}

const emitValue = () => {
  const value = digits.value.join('')
  emit('update:modelValue', value)
}
</script>
