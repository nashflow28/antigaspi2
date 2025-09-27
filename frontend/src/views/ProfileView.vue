<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 p-6">
    <div class="max-w-4xl mx-auto">
      <Card variant="elevated" class="mb-8">
        <div class="p-8">
          <h1 class="text-2xl font-bold mb-4">Mon Profil</h1>
          <p class="text-gray-600">Gestion des informations personnelles</p>

          <!-- Performance Demo Integration -->
          <div class="mt-8">
            <Suspense>
              <template #default>
                <PerformanceDemo />
              </template>
              <template #fallback>
                <LoadingSkeleton />
              </template>
            </Suspense>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import Card from '@/components/ui/2025/Card.vue'
import LoadingSkeleton from '@/components/performance/LoadingSkeleton.vue'

// Lazy load performance demo
const PerformanceDemo = defineAsyncComponent(() =>
  import('@/components/performance/PerformanceDemo.vue')
)
</script>
