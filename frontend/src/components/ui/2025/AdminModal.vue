<template>
  <BaseAdminModal v-bind="props" @close="emit('close')" @action="emit('action')">
    <template v-for="(_, slot) in $slots" #[slot]="slotProps">
      <slot :name="slot" v-bind="slotProps" />
    </template>
  </BaseAdminModal>
</template>

<script setup lang="ts">
import BaseAdminModal from '../AdminModal.vue'

defineOptions({ inheritAttrs: false })

type AdminModalType = 'info' | 'success' | 'warning' | 'error'

const props = defineProps<{
  show: boolean
  title: string
  content: string
  icon?: any
  type?: AdminModalType
  actionButton?: string
}>()

const emit = defineEmits<{
  close: []
  action: []
}>()
</script>
