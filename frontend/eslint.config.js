import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configTypeScript from '@typescript-eslint/eslint-plugin'
import parserTypeScript from '@typescript-eslint/parser'

export default [
  // Base JavaScript rules
  js.configs.recommended,

  // Vue.js rules
  ...pluginVue.configs['flat/essential'],
  ...pluginVue.configs['flat/strongly-recommended'],
  ...pluginVue.configs['flat/recommended'],

  // TypeScript and Vue files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTypeScript,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': configTypeScript
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead

      // Vue template rules
      'vue/html-indent': ['error', 2],
      'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'error',
      'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/component-definition-name-casing': ['error', 'PascalCase']
    }
  },

  // Test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/one-component-per-file': 'off',
      // Allow expect to be imported even if it may not be used (Playwright tests)
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^(_|expect)$',
        caughtErrors: 'none',
        ignoreRestSiblings: true
      }]
    }
  },

  // UI Components - allow single-word names for base components
  {
    files: ['src/components/ui/**/*.vue', 'src/components/2025/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },

  // Stories files
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      'vue/one-component-per-file': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        FocusEvent: 'readonly',
        InputEvent: 'readonly',
        PointerEvent: 'readonly',
        TouchEvent: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        getComputedStyle: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Event: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        FileList: 'readonly',
        FormData: 'readonly',
        HTMLInputElement: 'readonly',
        Image: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        DOMParser: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        WebSocket: 'readonly',
        MessageEvent: 'readonly',
        CloseEvent: 'readonly',
        ErrorEvent: 'readonly',
        Storage: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Promise: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        Int8Array: 'readonly',
        Uint8Array: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        Intl: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        // Additional Web APIs
        HTMLImageElement: 'readonly',
        HTMLMetaElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        Animation: 'readonly',
        Keyframe: 'readonly',
        PropertyIndexedKeyframes: 'readonly',
        RequestInit: 'readonly',
        HeadersInit: 'readonly',
        BodyInit: 'readonly',
        ServiceWorkerRegistration: 'readonly',
        ServiceWorker: 'readonly',
        MessageChannel: 'readonly',
        MessagePort: 'readonly',
        ShareData: 'readonly',
        caches: 'readonly',
        CacheStorage: 'readonly',
        Cache: 'readonly',
        PushSubscription: 'readonly',
        PushManager: 'readonly',
        Notification: 'readonly',
        BufferSource: 'readonly',
        Navigator: 'readonly',
        PerformanceObserver: 'readonly',
        PerformanceEntry: 'readonly',
        PerformanceMark: 'readonly',
        PerformanceMeasure: 'readonly',
        PerformanceNavigationTiming: 'readonly',
        PerformanceResourceTiming: 'readonly',
        NotificationPermission: 'readonly',
        NotificationOptions: 'readonly',
        Geolocation: 'readonly',
        GeolocationPosition: 'readonly',
        GeolocationCoordinates: 'readonly',
        MediaQueryList: 'readonly',
        matchMedia: 'readonly',
        Location: 'readonly',
        History: 'readonly',
        history: 'readonly',
        location: 'readonly',
        open: 'readonly',
        close: 'readonly',
        print: 'readonly',
        screen: 'readonly',
        Screen: 'readonly',
        Clipboard: 'readonly',
        ClipboardEvent: 'readonly',
        DataTransfer: 'readonly',
        DragEvent: 'readonly',
        WheelEvent: 'readonly',
        AnimationEvent: 'readonly',
        TransitionEvent: 'readonly',
        BeforeUnloadEvent: 'readonly',
        PopStateEvent: 'readonly',
        HashChangeEvent: 'readonly',
        PageTransitionEvent: 'readonly',
        ProgressEvent: 'readonly',
        SecurityPolicyViolationEvent: 'readonly',
        UIEvent: 'readonly',
        CompositionEvent: 'readonly',
        StorageEvent: 'readonly',

        // Node.js globals for config files
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        NodeJS: 'readonly',
        Buffer: 'readonly',

        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        MockedFunction: 'readonly',
        performance: 'readonly'
      }
    },
    rules: {
      // General code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',

      // Unused variables - disabled in favor of @typescript-eslint/no-unused-vars
      'no-unused-vars': 'off',

      // Vue specific
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',

      // Code style
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }]
    }
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.vite/**',
      'coverage/**',
      'storybook-static/**',
      '*.min.js',
      'public/**',
      'debug-*.js',
      'debug-scripts/**',
      'test-*.js',
      // Migration and utility scripts
      '*.cjs',
      'cleanup-*.cjs',
      'count-*.cjs',
      'fix-*.cjs',
      'implement-*.cjs',
      'migrate-*.cjs',
      'validate-*.cjs',
      'scripts/**',
      'simple-xss-test.js'
    ]
  }
]
