<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-0 z-[110] flex items-stretch sm:items-start justify-center sm:justify-end p-4 sm:p-6">
      <TransitionGroup name="toast-stack" tag="div" class="flex w-full max-w-sm flex-col gap-3 sm:max-w-xl">
        <div v-for="notification in notifications" :key="notification.id" class="pointer-events-auto">
          <Toast
            :is-open="true"
            position="stacked"
            :tone="notification.type"
            :title="notification.title"
            :description="notification.message"
            :action-label="notification.action?.label"
            :on-close="() => closeNotification(notification.id)"
            :on-action="notification.action ? () => triggerAction(notification.id) : undefined"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import Toast from '@/components/ui/Toast.vue'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, removeNotification, handleAction } = useNotifications()

const closeNotification = (id: string) => {
  removeNotification(id)
}

const triggerAction = (id: string) => handleAction(id)
</script>

<style scoped>
.toast-stack-enter-active,
.toast-stack-leave-active {
  transition: all 0.2s ease;
}

.toast-stack-enter-from,
.toast-stack-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

