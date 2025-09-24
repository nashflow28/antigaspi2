<template>
  <div v-if="isOpen" class="fixed inset-0 z-[120] overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm transition-opacity animate-fade-in"
        @click="onCancel"
      ></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl p-6 text-left overflow-hidden shadow-2xl transform transition-all max-w-md w-full animate-fade-in-up border border-neutral-200">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl" :class="iconBgClass">
            <component :is="iconComponent" class="w-6 h-6" :class="iconClass" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-neutral-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-sm text-neutral-600 leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-6">
          <button
            type="button"
            class="flex-1 btn btn-ghost"
            @click="onCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="flex-1 btn"
            :class="confirmButtonClass"
            @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-vue-next'

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

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'btn-error'
    case 'success':
      return 'btn-success'
    default:
      return 'btn-warning'
  }
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>