<template>
  <BaseNotificationContainer v-bind="$attrs" />
</template>

<script setup lang="ts">
import BaseNotificationContainer from '../NotificationContainer.vue'

defineOptions({ inheritAttrs: false })
</script>
