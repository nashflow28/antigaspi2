<template>
  <div class="min-h-screen bg-neutral-50 p-4">
    <h1 class="text-xl font-semibold text-neutral-900 mt-3">
      🌱 GÊLADAL - Simple Test View
    </h1>

    <div class="bg-white rounded shadow p-6 mt-3">
      <h2 class="text-lg font-semibold mt-2">Vue Application Status</h2>
      <p class="text-green-600">✅ Vue.js is working!</p>
      <p class="text-green-600">✅ Router is working!</p>
      <p class="text-green-600">✅ Components are rendering!</p>
    </div>

    <div class="bg-primary-50 rounded border border-primary-200 p-4 mt-3">
      <h3 class="text-neutral-800 font-medium mt-2">🎯 Quick Navigation</h3>
      <div class="space-y-4">
        <router-link
          to="/onboarding"
          class="block text-info hover:text-neutral-800 underline"
        >
          → Go to Onboarding
        </router-link>
        <router-link
          to="/gaspiz-demo"
          class="block text-info hover:text-neutral-800 underline"
        >
          → Go to Gaspiz Demo
        </router-link>
        <router-link
          to="/products"
          class="block text-info hover:text-neutral-800 underline"
        >
          → Go to Products
        </router-link>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-green-50 rounded border border-primary-200 p-4">
        <h3 class="text-green-800 font-medium mt-2">✅ Success</h3>
        <ul class="text-green-700 text-sm space-y-4">
          <li>• Vue 3 initialized</li>
          <li>• Tailwind CSS working</li>
          <li>• Router navigation active</li>
          <li>• No redirect loops</li>
        </ul>
      </div>

      <div class="bg-orange-50 rounded border border-orange-200 p-4">
        <h3 class="text-yellow-800 font-medium mt-2">🔧 Next Steps</h3>
        <ul class="text-orange-700 text-sm space-y-4">
          <li>• Test complex components</li>
          <li>• Enable MobileLayout</li>
          <li>• Connect to API</li>
          <li>• Re-enable onboarding</li>
        </ul>
      </div>
    </div>

    <!-- Simple interactive test -->
    <div class="mt-6 bg-purple-50 rounded border border-purple-200 p-4">
      <h3 class="text-primary-800 font-medium mt-2">🧪 Interactive Test</h3>
      <button
        class="bg-purple-600 hover:transition-colors"
        @click="counter++"
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
