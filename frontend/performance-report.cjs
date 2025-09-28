#!/usr/bin/env node

/**
 * Performance Analysis and Bundle Report Generator
 */

const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, 'test-results')
const BUILD_STATS_PATH = path.join(RESULTS_DIR, 'build-stats.json')
const LIGHTHOUSE_REPORT_PATH = path.join(RESULTS_DIR, 'lighthouse-report.json')

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      bundleSize: {},
      routeAnalysis: {},
      optimizations: [],
      recommendations: [],
      externalMetrics: {}
    }
  }

  analyzeProject() {
    console.log('🔍 Analyzing project performance...\n')

    this.analyzeBundleConfig()
    this.analyzeRoutes()
    this.analyzeComponents()
    this.loadExternalMetrics()
    this.generateRecommendations()
    this.generateReport()
  }

  analyzeBundleConfig() {
    console.log('📦 Analyzing bundle configuration...')

    const viteConfig = path.join(__dirname, 'vite.config.ts')
    if (fs.existsSync(viteConfig)) {
      const config = fs.readFileSync(viteConfig, 'utf8')

      // Check for optimizations
      const optimizations = []

      if (config.includes('manualChunks')) {
        optimizations.push('✅ Manual chunking configured')
      } else {
        this.results.recommendations.push('Configure manual chunking for better code splitting')
      }

      if (config.includes('terserOptions')) {
        optimizations.push('✅ Terser optimization enabled')
      } else {
        this.results.recommendations.push('Enable Terser optimization for production')
      }

      if (config.includes('rollup-plugin-visualizer')) {
        optimizations.push('✅ Bundle analyzer configured')
      } else {
        this.results.recommendations.push('Add bundle analyzer for size monitoring')
      }

      this.results.optimizations = optimizations
    }
  }

  analyzeRoutes() {
    console.log('🛣️  Analyzing route configuration...')

    const routerFile = path.join(__dirname, 'src/router/index.ts')
    if (fs.existsSync(routerFile)) {
      const router = fs.readFileSync(routerFile, 'utf8')

      // Count lazy loaded routes
      const lazyRoutes = (router.match(/import\(/g) || []).length
      const totalRoutes = (router.match(/path:/g) || []).length

      this.results.routeAnalysis = {
        total: totalRoutes,
        lazyLoaded: lazyRoutes,
        percentage: Math.round((lazyRoutes / totalRoutes) * 100)
      }

      if (this.results.routeAnalysis.percentage < 80) {
        this.results.recommendations.push('Implement lazy loading for more routes (currently ' + this.results.routeAnalysis.percentage + '%)')
      }
    }
  }

  analyzeComponents() {
    console.log('🧩 Analyzing components...')

    const srcDir = path.join(__dirname, 'src')
    if (fs.existsSync(srcDir)) {
      const componentDirs = ['views', 'components']
      let totalComponents = 0

      componentDirs.forEach(dir => {
        const dirPath = path.join(srcDir, dir)
        if (fs.existsSync(dirPath)) {
          const count = this.countVueFiles(dirPath)
          totalComponents += count
          console.log(`   ${dir}: ${count} components`)
        }
      })

      this.results.bundleSize.components = totalComponents
    }
  }

  loadExternalMetrics() {
    const metrics = {}

    if (fs.existsSync(BUILD_STATS_PATH)) {
      try {
        metrics.build = JSON.parse(fs.readFileSync(BUILD_STATS_PATH, 'utf8'))
      } catch (error) {
        console.warn('⚠️  Unable to parse build stats artifact:', error.message)
      }
    }

    if (fs.existsSync(LIGHTHOUSE_REPORT_PATH)) {
      try {
        const lighthouseReport = JSON.parse(fs.readFileSync(LIGHTHOUSE_REPORT_PATH, 'utf8'))
        if (lighthouseReport?.categories?.performance) {
          metrics.lighthouse = {
            performance: Math.round((lighthouseReport.categories.performance.score || 0) * 100),
            accessibility: Math.round(((lighthouseReport.categories.accessibility?.score) || 0) * 100),
            bestPractices: Math.round(((lighthouseReport.categories['best-practices']?.score) || 0) * 100),
            seo: Math.round(((lighthouseReport.categories.seo?.score) || 0) * 100),
            environment: lighthouseReport.environment || 'preview'
          }
        } else if (lighthouseReport?.status === 'SKIPPED') {
          metrics.lighthouse = {
            status: lighthouseReport.status,
            reason: lighthouseReport.reason,
            environment: lighthouseReport.environment
          }
        }
      } catch (error) {
        console.warn('⚠️  Unable to parse Lighthouse artifact:', error.message)
      }
    }

    this.results.externalMetrics = metrics

    if (!metrics.build) {
      this.results.recommendations.push('Générer les statistiques de build via `npm run validate:phase3`.')
    }
    if (!metrics.lighthouse) {
      this.results.recommendations.push('Exécuter Lighthouse (inclus dans `npm run validate:phase3`) pour disposer d’une référence de score.')
    }
  }

  countVueFiles(dir) {
    let count = 0
    try {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
          count += this.countVueFiles(filePath)
        } else if (file.endsWith('.vue')) {
          count++
        }
      })
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return count
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...')

    // Add general performance recommendations
    this.results.recommendations.push(
      'Implement virtual scrolling for large lists',
      'Use v-memo for expensive computations',
      'Optimize images with lazy loading and WebP format',
      'Implement progressive Web App (PWA) features',
      'Add preloading for critical resources',
      'Monitor Core Web Vitals in production'
    )
  }

  generateReport() {
    const report = `
# 🚀 Performance Analysis Report

**Generated on:** ${new Date().toISOString()}

## 📊 Bundle Analysis

### Route Configuration
- **Total Routes:** ${this.results.routeAnalysis.total || 'N/A'}
- **Lazy Loaded:** ${this.results.routeAnalysis.lazyLoaded || 'N/A'}
- **Lazy Loading Coverage:** ${this.results.routeAnalysis.percentage || 0}%

### Components
- **Total Components:** ${this.results.bundleSize.components || 'N/A'}

### Production Bundle Snapshot
${this.renderBuildMetrics()}

## ✅ Current Optimizations

${this.results.optimizations.map(opt => `- ${opt}`).join('\n')}

## 💡 Recommendations

${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔧 Next Steps

1. **Bundle Size Analysis**
   - Run \`npm run build\` to generate bundle analysis
   - Check \`dist/bundle-analysis.html\` for detailed breakdown

2. **Performance Monitoring**
   - Implement Core Web Vitals tracking
   - Set up performance budgets in CI/CD

3. **Runtime Optimizations**
   - Use the performance composables in critical components
   - Implement image lazy loading throughout the app

4. **Production Optimization**
   - Enable compression (gzip/brotli)
   - Implement service worker caching
   - Add resource preloading

## 📈 Performance Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Bundle Size:** < 2MB total
- **Lighthouse Score:** > 90

---
*Generated by Antigaspi Performance Analyzer*
`

    console.log('\n📄 Performance Report Generated:')
    console.log(report)

    // Write to file
    fs.writeFileSync('PERFORMANCE_REPORT.md', report)
    console.log('\n💾 Report saved to PERFORMANCE_REPORT.md')
  }
}

PerformanceAnalyzer.prototype.renderBuildMetrics = function renderBuildMetrics() {
  const metrics = this.results.externalMetrics
  if (!metrics.build) {
    return '- Aucun bundle analysé (exécuter `npm run validate:phase3`).'
  }

  const build = metrics.build
  const bundleSizeMB = ((build.bundleSizeMB ?? (build.totalSize ? build.totalSize / 1024 / 1024 : 0)) || 0).toFixed(2)
  const largestAssets = Array.isArray(build.assets)
    ? build.assets.slice(0, 5).map(asset => `  - ${asset.file} — ${((asset.sizeKB ?? (asset.size || 0) / 1024)).toFixed(2)} kB`).join('\n')
    : '  - Assets data unavailable'

  let lighthouseBlock = '- Lighthouse report non disponible.'
  if (metrics.lighthouse) {
    if (metrics.lighthouse.status === 'SKIPPED') {
      lighthouseBlock = `- Audit Lighthouse non exécuté (${metrics.lighthouse.reason || 'raison inconnue'}).`
    } else {
      lighthouseBlock = `- **Scores Lighthouse** (env. ${metrics.lighthouse.environment || 'preview'}):\n  - Performance: ${metrics.lighthouse.performance || 0}/100\n  - Accessibilité: ${metrics.lighthouse.accessibility || 0}/100\n  - Best Practices: ${metrics.lighthouse.bestPractices || 0}/100\n  - SEO: ${metrics.lighthouse.seo || 0}/100`
    }
  }

  return `- **Build re-used:** ${build.reusedBuild ? 'Yes' : 'No'}\n- **Bundle Size:** ${bundleSizeMB} MB\n- **Artifacts:** ${build.artifacts ? JSON.stringify(build.artifacts) : 'non trackés'}\n- **Top Assets:**\n${largestAssets}\n${lighthouseBlock}`
}

// Run analysis
const analyzer = new PerformanceAnalyzer()
analyzer.analyzeProject()
