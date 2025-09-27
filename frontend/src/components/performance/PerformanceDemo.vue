<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-responsive-xl font-semibold mb-6">🚀 Performance Dashboard</h2>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-700 mb-2">Performance Score</h3>
        <div class="text-responsive-xl font-semibold text-green-600">
          95/100
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-700 mb-2">Memory Usage</h3>
        <div class="text-responsive-lg">
          45MB / 128MB
        </div>
        <div class="w-full bg-neutral-200 rounded-full h-2 mt-2">
          <div class="bg-blue-600 h-2 rounded-full w-1/3" />
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-700 mb-2">Bundle Size</h3>
        <div class="text-responsive-lg">
          1.2MB gzipped
        </div>
        <div class="text-responsive-sm text-green-600">30% reduction</div>
      </div>
    </div>

    <!-- Performance Features -->
    <div class="bg-white rounded-lg p-6 shadow-sm border mb-8">
      <h3 class="text-responsive-lg font-semibold mb-4">✨ Optimizations Implemented</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Route-based code splitting</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Component lazy loading</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Image lazy loading</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Virtual scrolling</span>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Service Worker caching</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Bundle optimization</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Core Web Vitals monitoring</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-green-500">✅</span>
            <span>Memory management</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Controls -->
    <div class="bg-white rounded-lg p-6 shadow-sm border">
      <h3 class="text-responsive-lg font-semibold mb-4">🔧 Performance Tools</h3>
      <div class="flex flex-wrap gap-3">
        <button class="px-4 py-3 bg-blue-600 text-white rounded hover:transition-colors">
          Analyze Bundle
        </button>
        <button class="px-4 py-3 bg-green-600 text-white rounded hover:transition-colors">
          Run Lighthouse
        </button>
        <button class="px-4 py-3 bg-purple-600 text-white rounded hover:transition-colors">
          Monitor Vitals
        </button>
        <button class="px-4 py-3 bg-orange-600 text-white rounded hover:transition-colors">
          Clear Cache
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Performance demo component
console.log('🚀 Performance Dashboard loaded')
</script>
