<template>
  <Modal
    v-model="isOpenModel"
    :title="title"
    :description="message"
    size="sm"
    :variant="variantMapping[type]"
    :closable="false"
    :close-on-overlay="false"
  >
    <div class="flex items-center justify-center py-4">
      <div
        :class="[
          'flex h-16 w-16 items-center justify-center rounded-full',
          iconBgClass
        ]"
      >
        <component :is="iconComponent" :class="['h-8 w-8', iconClass]" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <Button
          v-if="cancelText"
          variant="ghost"
          @click="handleCancel"
        >
          {{ cancelText }}
        </Button>
        <Button
          :variant="confirmVariant"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-vue-next'

export type ConfirmDialogType = 'danger' | 'warning' | 'success' | 'info'

interface Props {
  isOpen: boolean
  type?: ConfirmDialogType
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
  'update:isOpen': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Computed ref to bridge prop to v-model
const isOpenModel = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
})

const variantMapping: Record<ConfirmDialogType, 'default' | 'alert'> = {
  danger: 'alert',
  warning: 'alert',
  success: 'default',
  info: 'default'
}

const iconComponent = computed(() => {
  const icons = {
    danger: XCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
  }
  return icons[props.type]
})

const iconBgClass = computed(() => {
  const classes = {
    danger: 'bg-red-100 dark:bg-red-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    success: 'bg-green-100 dark:bg-green-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30'
  }
  return classes[props.type]
})

const iconClass = computed(() => {
  const classes = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  return classes[props.type]
})

const confirmVariant = computed(() => {
  const variants: Record<ConfirmDialogType, 'destructive' | 'warning' | 'primary'> = {
    danger: 'destructive',
    warning: 'warning',
    success: 'primary',
    info: 'primary'
  }
  return variants[props.type]
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:isOpen', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>
