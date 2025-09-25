import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('chart.js')) {
            return 'chart'
          }

          if (id.includes('leaflet')) {
            return 'leaflet'
          }

          if (id.includes('lucide')) {
            return 'icons'
          }

          if (id.includes('@headlessui') || id.includes('@heroicons')) {
            return 'headless-ui'
          }

          if (id.includes('@vueuse')) {
            return 'vueuse'
          }

          if (id.includes('@googlemaps')) {
            return 'maps'
          }

          if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'framework'
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/{unit,integration}/**/*.spec.ts']
  }
})
