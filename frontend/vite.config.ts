import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // PWA service worker (Workbox injectManifest)
    // - srcDir/filename: src/sw.js is bundled to dist/sw.js (same name/scope '/'
    //   as the legacy manual SW so existing clients pick up the update)
    // - registerType 'prompt': update applied via SKIP_WAITING when user confirms
    // - injectRegister false: registration handled manually in src/main.ts
    // - manifest false: public/manifest.json already exists and is linked in index.html
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
        globIgnores: ['bundle-analysis.html', '**/node_modules/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      },
      devOptions: {
        enabled: false
      }
    }),
    // Bundle analyzer plugin
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://antigaspi.jubtek.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',

    // Performance optimizations
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    // Bundle size optimization
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Advanced code splitting strategy
        manualChunks: {
          // Framework chunk (frequently used)
          'vendor-vue': ['vue', 'vue-router', 'pinia'],

          // UI library chunk (design system)
          'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],

          // Heavy libraries - separate chunks
          'vendor-charts': ['chart.js', 'vue-chart-3'],
          'vendor-maps': ['leaflet'],
          'vendor-utils': ['@vueuse/core', '@vueuse/motion'],

          // Icon libraries
          'vendor-icons': ['lucide-vue-next'],

          // Network and utilities
          'vendor-network': ['axios'],
          'vendor-misc': ['dompurify']
        },

        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          let extType = info[info.length - 1]

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img'
          } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts'
          }

          return `assets/${extType}/[name]-[hash][extname]`
        },

        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      },

      // Tree shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },

    // Enable asset optimization
    assetsInlineLimit: 4096, // 4kb

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true
  },

  // Development optimizations
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
      'axios'
    ],
    exclude: [
      'chart.js',
      'leaflet'
    ]
  },

  // Performance settings
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false
  },

  // Additional performance configurations
  esbuild: {
    // Remove console logs in production
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },

  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'tests/{unit,integration}/**/*.spec.ts',
      'src/**/__tests__/**/*.spec.ts'
    ]
  }
})
