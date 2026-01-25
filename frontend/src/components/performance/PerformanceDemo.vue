<template>
  <div class="p-6 max-w-full sm:max-w-4xl mx-auto">
    <h2 class="text-xl font-semibold mt-4">🚀 Performance Dashboard</h2>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 sm:mb-3xl">
      <div class="bg-white rounded p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-800 mt-2">Performance Score</h3>
        <div class="text-xl font-semibold text-green-600">
          95/100
        </div>
      </div>

      <div class="bg-white rounded p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-800 mt-2">Memory Usage</h3>
        <div class="text-lg">
          45MB / 128MB
        </div>
        <div class="w-full bg-neutral-200 rounded-full h-4 mt-2">
          <div class="bg-primary-600 h-4 rounded-full w-xs/3" />
        </div>
      </div>

      <div class="bg-white rounded p-4 shadow-sm border">
        <h3 class="font-semibold text-neutral-800 mt-2">Bundle Size</h3>
        <div class="text-lg">
          1.2MB gzipped
        </div>
        <div class="text-sm text-green-600">30% reduction</div>
      </div>
    </div>

    <!-- Performance Features -->
    <div class="bg-white rounded p-6 shadow-sm border mt-4 sm:mb-3xl">
      <h3 class="text-lg font-semibold mt-3">✨ Optimizations Implemented</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-4">
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Route-based code splitting</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Component lazy loading</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Image lazy loading</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Virtual scrolling</span>
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Service Worker caching</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Bundle optimization</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Core Web Vitals monitoring</span>
          </div>
          <div class="flex items-center space-y-4 sm:space-x-2">
            <span class="text-green-600-500">✅</span>
            <span>Memory management</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Controls -->
    <div class="bg-white rounded p-6 shadow-sm border">
      <h3 class="text-lg font-semibold mt-3">🔧 Performance Tools</h3>
      <div class="flex flex-wrap gap-3">
        <button class="px-3 py-3 bg-primary-600 text-white rounded hover:transition-colors">
          Analyze Bundle
        </button>
        <button class="px-3 py-3 bg-primary-600 text-white rounded hover:transition-colors">
          Run Lighthouse
        </button>
        <button class="px-3 py-3 bg-purple-600 text-white rounded hover:transition-colors">
          Monitor Vitals
        </button>
        <button class="px-3 py-3 bg-yellow-600 text-white rounded hover:transition-colors">
          Clear Cache
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Performance demo component
// console.log('🚀 Performance Dashboard loaded')
</script>
