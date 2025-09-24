<template>
  <TransitionGroup
    name="toast"
    tag="div"
    class="fixed inset-x-4 top-4 z-50 flex flex-col gap-3 sm:inset-auto sm:right-6 sm:top-6 sm:w-80"
  >
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="overflow-hidden rounded-lg border shadow-lg ring-1 ring-black/5"
      :class="typeClasses[notification.type]"
    >
      <div class="flex items-start gap-3 p-4">
        <div class="flex-1">
          <p
            v-if="notification.title"
            class="text-sm font-semibold"
            :class="titleClasses[notification.type]"
          >
            {{ notification.title }}
          </p>
          <p class="text-sm text-gray-700">
            {{ notification.message }}
          </p>
          <p
            v-if="notification.description"
            class="mt-1 text-xs text-gray-500"
          >
            {{ notification.description }}
          </p>
        </div>
        <button
          v-if="notification.closable !== false"
          type="button"
          class="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          @click="handleClose(notification.id)"
          aria-label="Fermer la notification"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div
        v-if="notification.action"
        class="border-t border-white/40 bg-white/60 px-4 py-2"
      >
        <button
          type="button"
          class="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
          @click="handleAction(notification)"
        >
          {{ notification.action.label }}
        </button>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Notification } from '@/composables/useNotifications'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, removeNotification } = useNotifications()

const typeClasses = computed(() => ({
  success: 'border-emerald-100 bg-emerald-50',
  error: 'border-rose-100 bg-rose-50',
  info: 'border-sky-100 bg-sky-50',
  warning: 'border-amber-100 bg-amber-50'
}))

const titleClasses = computed(() => ({
  success: 'text-emerald-900',
  error: 'text-rose-900',
  info: 'text-sky-900',
  warning: 'text-amber-900'
}))

const handleClose = (id: number) => {
  removeNotification(id)
}

const handleAction = (notification: Notification) => {
  notification.action?.handler()
  if (notification.action?.dismissOnClick !== false) {
    removeNotification(notification.id)
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
