<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">
      🌱 Antigaspi - Simple Test View
    </h1>

    <div class="bg-white rounded-lg shadow p-6 mb-4">
      <h2 class="text-lg font-semibold mb-2">Vue Application Status</h2>
      <p class="text-green-600">✅ Vue.js is working!</p>
      <p class="text-green-600">✅ Router is working!</p>
      <p class="text-green-600">✅ Components are rendering!</p>
    </div>

    <div class="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
      <h3 class="text-blue-800 font-medium mb-2">🎯 Quick Navigation</h3>
      <div class="space-y-2">
        <router-link
          to="/onboarding"
          class="block text-blue-600 hover:text-blue-800 underline"
        >
          → Go to Onboarding
        </router-link>
        <router-link
          to="/gaspiz-demo"
          class="block text-blue-600 hover:text-blue-800 underline"
        >
          → Go to Gaspiz Demo
        </router-link>
        <router-link
          to="/products"
          class="block text-blue-600 hover:text-blue-800 underline"
        >
          → Go to Products
        </router-link>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-green-50 rounded-lg border border-green-200 p-4">
        <h3 class="text-green-800 font-medium mb-2">✅ Success</h3>
        <ul class="text-green-700 text-sm space-y-1">
          <li>• Vue 3 initialized</li>
          <li>• Tailwind CSS working</li>
          <li>• Router navigation active</li>
          <li>• No redirect loops</li>
        </ul>
      </div>

      <div class="bg-orange-50 rounded-lg border border-orange-200 p-4">
        <h3 class="text-orange-800 font-medium mb-2">🔧 Next Steps</h3>
        <ul class="text-orange-700 text-sm space-y-1">
          <li>• Test complex components</li>
          <li>• Enable MobileLayout</li>
          <li>• Connect to API</li>
          <li>• Re-enable onboarding</li>
        </ul>
      </div>
    </div>

    <!-- Simple interactive test -->
    <div class="mt-6 bg-purple-50 rounded-lg border border-purple-200 p-4">
      <h3 class="text-purple-800 font-medium mb-2">🧪 Interactive Test</h3>
      <button
        @click="counter++"
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
      >
        Clicked {{ counter }} times
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const counter = ref(0)
</script>