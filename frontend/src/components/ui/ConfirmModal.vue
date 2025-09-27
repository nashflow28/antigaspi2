<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm transition-opacity animate-fade-in"
        @click="onCancel"
      />

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl p-6 text-left overflow-hidden shadow-2xl transform transition-all max-w-md w-full animate-fade-in-up border border-neutral-200">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl" :class="iconBgClass">
            <component :is="iconComponent" class="w-10 h-10" :class="iconClass" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-responsive-sm text-neutral-600 leading-relaxed">
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
      return 'bg-accent-red/15'
    case 'success':
      return 'bg-primary-100'
    default:
      return 'bg-accent-orange/15'
  }
})

const iconClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-accent-red'
    case 'success':
      return 'text-primary-600'
    default:
      return 'text-accent-orange'
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
