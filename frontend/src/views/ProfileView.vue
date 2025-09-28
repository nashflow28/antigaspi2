<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
    <div class="max-w-full sm:max-w-4xl mx-auto">
      <Card variant="elevated" class="mt-4 sm:mb-3xl">
        <div class="p-4 sm:p-6 lg:p-12">
          <h1 class="text-xl font-semibold mt-3">Mon Profil</h1>
          <p class="text-gray-700">Gestion des informations personnelles</p>

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
