<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-3 pb-20 text-left sm:text-center">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity animate-fade-in"
        @click="onCancel"
      />

      <!-- Modal -->
      <div class="relative bg-white rounded p-6 text-left overflow-hidden sm:block shadow-80 transform transition-all max-w-xl w-full animate-fade-in-up border border-gray-200">
        <div class="flex items-stretch sm:items-start gap-3">
          <div class="flex-shrink-0 flex items-center justify-center w-12 h-10 rounded" :class="iconBgClass">
            <component :is="iconComponent" class="h-6 w-6" :class="iconClass" />
          </div>
          <div class="flex-1 min-w-none">
            <h3 class="text-lg font-semibold text-gray-900 mt-2">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-700 leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            class="flex-1"
            @click="onCancel"
          >
            {{ cancelText }}
          </Button>
          <Button
            type="button"
            :variant="confirmButtonVariant"
            class="flex-1"
            @click="onConfirm"
          >
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'

interface Props {
  isOpen: boolean
  type?: 'danger' | 'success' | 'warning'
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmText: 'Confirmer',
  cancelText: 'Annuler'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'danger':
      return AlertTriangle
    case 'success':
      return CheckCircle
    default:
      return HelpCircle
  }
})

const iconBgClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-600/15'
    case 'success':
      return 'bg-blue-100'
    default:
      return 'bg-orange-500/15'
  }
})

const iconClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-red-600'
    case 'success':
      return 'text-blue-600'
    default:
      return 'text-orange-500'
  }
})

const confirmButtonVariant = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'error'
    case 'success':
      return 'success'
    default:
      return 'warning'
  }
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>
