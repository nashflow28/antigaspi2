import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/reports/**/*.spec.ts'],
    setupFiles: ['tests/reports/setup.ts'],
    coverage: {
      reporter: ['json-summary', 'text-summary'],
      reportsDirectory: 'coverage',
      include: [
        'src/stores/cart.ts',
        'src/stores/products.ts',
        'src/stores/reservations.ts'
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/*.stories.*',
        'src/**/*.d.ts'
      ]
    }
  }
})
