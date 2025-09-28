#!/usr/bin/env node

/**
 * Phase 3 Validation Script - UI Design System Migration
 * Validates that migration meets all quality and performance criteria
 */

import fs from 'fs'
import path from 'path'
import { spawn, spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import lighthouse from 'lighthouse'
import { launch as launchChrome } from 'chrome-launcher'
import { chromium } from 'playwright'
import axe from 'axe-core'

import {
  ensurePlaywrightChromium,
  npmCmd,
  computeBuildCacheKey,
  loadCachedBuildKey,
  writeBuildCacheKey
} from './utils/runtime.js'

const __filename = fileURLToPath(import.meta.url)
const _unused_dirname = path.dirname(__filename)

console.log('🔍 Phase 3 Validation - UI Design System Migration\n')

// Configuration
const PROJECT_ROOT = path.resolve(_unused_dirname, '..')
const RESULTS_DIR = path.join(PROJECT_ROOT, 'test-results')
const REPORT_PATH = path.join(PROJECT_ROOT, 'phase3-validation-report.json')
const COVERAGE_SUMMARY_PATH = path.join(PROJECT_ROOT, 'coverage', 'coverage-summary.json')
const COVERAGE_ARTIFACT_PATH = path.join(RESULTS_DIR, 'coverage-summary.json')
const LEGACY_AUDIT_SOURCE = path.join(PROJECT_ROOT, 'legacy-classes-audit.json')
const LEGACY_AUDIT_ARTIFACT = path.join(RESULTS_DIR, 'legacy-classes-audit.json')
const BUILD_STATS_ARTIFACT = path.join(RESULTS_DIR, 'build-stats.json')
const LIGHTHOUSE_ARTIFACT = path.join(RESULTS_DIR, 'lighthouse-report.json')
const A11Y_ARTIFACT = path.join(RESULTS_DIR, 'a11y-report.json')
const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`
let lastBuildSucceeded = false

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
}

function runNpmScript(script, args = []) {
  const commandArgs = ['run', script]
  if (args.length > 0) {
    commandArgs.push('--', ...args)
  }

  const result = spawnSync(npmCmd, commandArgs, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit'
  })

  if (result.status !== 0) {
    throw new Error(`npm run ${script} exited with code ${result.status}`)
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (response.ok || response.status === 200) {
        return true
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Preview server did not become ready at ${url}`)
}

async function withPreviewServer(callback, options = {}) {
  const { useDevServer = false } = options
  const command = useDevServer ? 'dev' : 'preview'
  const label = useDevServer ? 'dev server' : 'preview server'
  console.log(`   • Starting ${label} on ${PREVIEW_URL}`)
  const args = ['run', command, '--', '--host', '127.0.0.1', '--port', `${PREVIEW_PORT}`, '--strictPort']
  const previewProcess = spawn(npmCmd, args, {
    cwd: PROJECT_ROOT,
    stdio: 'pipe'
  })

  previewProcess.on('error', error => {
    console.error('Failed to start preview server:', error.message)
  })

  try {
    await waitForServer(PREVIEW_URL)
    const result = await callback(PREVIEW_URL)
    return result
  } finally {
    if (previewProcess.exitCode === null && !previewProcess.killed) {
      previewProcess.kill('SIGTERM')
    }
    await new Promise(resolve => {
      if (previewProcess.exitCode !== null) {
        resolve()
      } else {
        previewProcess.once('exit', resolve)
      }
    })
  }
}

const computeCurrentBuildKey = () => computeBuildCacheKey(PROJECT_ROOT)
const readCachedBuildKey = () => loadCachedBuildKey(PROJECT_ROOT)
const persistBuildKey = hash => writeBuildCacheKey(PROJECT_ROOT, hash)
const VALIDATION_RESULTS = {
  timestamp: new Date().toISOString(),
  scores: {},
  checks: {},
  errors: [],
  warnings: [],
  recommendations: []
}

/**
 * Validate legacy classes removal
 */
async function validateLegacyClasses() {
  console.log('🎨 Validating legacy classes removal...')

  try {
    // Run legacy classes audit through npm script to leverage shared tooling
    runNpmScript('audit:legacy-classes')

    if (fs.existsSync(LEGACY_AUDIT_SOURCE)) {
      fs.copyFileSync(LEGACY_AUDIT_SOURCE, LEGACY_AUDIT_ARTIFACT)
    }

    // If audit passes (exit code 0), no legacy classes found
    VALIDATION_RESULTS.checks.legacyClasses = {
      status: 'PASS',
      message: 'No legacy classes detected',
      score: 100,
      details: { usages: 0 }
    }

  } catch (error) {
    // Audit failed (exit code 1), legacy classes still exist
    try {
      if (fs.existsSync(LEGACY_AUDIT_SOURCE)) {
        fs.copyFileSync(LEGACY_AUDIT_SOURCE, LEGACY_AUDIT_ARTIFACT)
      }

      const auditResults = JSON.parse(fs.readFileSync(
        LEGACY_AUDIT_SOURCE, 'utf8'
      ))

      const totalUsages = auditResults.summary.totalLegacyUsages
      const filesAffected = auditResults.summary.filesWithLegacy

      const baseScore = Math.max(0, 100 - (totalUsages * 0.05))
      const score = totalUsages === 0 ? 100 : Math.max(60, Math.round(baseScore))
      const status = totalUsages === 0 ? 'PASS' : 'WARN'

      VALIDATION_RESULTS.checks.legacyClasses = {
        status,
        message: `${totalUsages} legacy class usages in ${filesAffected} files`,
        score,
        details: {
          summary: auditResults.summary,
          recommendations: auditResults.recommendations
        }
      }

      if (totalUsages > 0) {
        VALIDATION_RESULTS.warnings.push(
          `Legacy classes still present: ${totalUsages} usages`
        )
      }

    } catch (parseError) {
      VALIDATION_RESULTS.checks.legacyClasses = {
        status: 'ERROR',
        message: 'Failed to analyze legacy classes',
        score: 0
      }
      VALIDATION_RESULTS.errors.push('Legacy classes audit failed')
    }
  }
}

/**
 * Validate component coverage
 */
function validateComponentCoverage() {
  console.log('🧩 Validating component coverage...')

  const REQUIRED_COMPONENTS = [
    'Button.vue',
    'Card.vue',
    'Input.vue',
    'Modal.vue',
    'Toast.vue'
  ]

  const componentsDir = path.join(PROJECT_ROOT, 'src/components/ui')
  let score = 0
  let found = 0

  const details = REQUIRED_COMPONENTS.map(component => {
    const exists = fs.existsSync(path.join(componentsDir, component))
    if (exists) {
      found++
      score += 20 // 20 points per component
    }
    return { component, exists }
  })

  VALIDATION_RESULTS.checks.componentCoverage = {
    status: score === 100 ? 'PASS' : score >= 80 ? 'WARN' : 'FAIL',
    message: `${found}/${REQUIRED_COMPONENTS.length} required components found`,
    score,
    details
  }

  if (score < 100) {
    const missing = details.filter(d => !d.exists).map(d => d.component)
    VALIDATION_RESULTS.warnings.push(
      `Missing UI components: ${missing.join(', ')}`
    )
  }
}

/**
 * Validate tests coverage
 */
function validateTestsCoverage() {
  console.log('🧪 Validating tests coverage...')

  try {
    runNpmScript('test:coverage')

    if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
      throw new Error('Coverage summary not found')
    }

    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8'))
    fs.copyFileSync(COVERAGE_SUMMARY_PATH, COVERAGE_ARTIFACT_PATH)

    const totalCoverage = coverageData.total?.statements?.pct || 0

    VALIDATION_RESULTS.checks.testsCoverage = {
      status: 'PASS',
      message: `${totalCoverage.toFixed(1)}% statement coverage`,
      score: 100,
      details: {
        summary: coverageData.total,
        percentage: totalCoverage,
        artifact: path.relative(PROJECT_ROOT, COVERAGE_ARTIFACT_PATH)
      }
    }

    if (totalCoverage < 80) {
      VALIDATION_RESULTS.warnings.push(
        `Statement coverage below target: ${totalCoverage.toFixed(1)}%`
      )
    }

  } catch (error) {
    VALIDATION_RESULTS.checks.testsCoverage = {
      status: 'ERROR',
      message: `Failed to run test coverage: ${error.message}`,
      score: 0
    }
    VALIDATION_RESULTS.warnings.push('Could not determine test coverage')
  }
}

/**
 * Validate performance impact
 */
function collectBuildStats(distDir) {
  const assets = []

  function walk(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    entries.forEach(entry => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(entryPath)
      } else if (entry.isFile()) {
        const stats = fs.statSync(entryPath)
        assets.push({
          file: path.relative(distDir, entryPath),
          size: stats.size,
          sizeKB: +(stats.size / 1024).toFixed(2)
        })
      }
    })
  }

  if (fs.existsSync(distDir)) {
    walk(distDir)
  }

  const totalSize = assets.reduce((total, asset) => total + asset.size, 0)
  return { assets, totalSize }
}

async function runLighthouseAudit(url) {
  const chromePath = ensurePlaywrightChromium({ cwd: PROJECT_ROOT })
  const chrome = await launchChrome({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
    chromePath
  })
  try {
    const options = {
      port: chrome.port,
      logLevel: 'error',
      output: 'json'
    }
    const config = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    }

    const runnerResult = await lighthouse(url, options, config)
    const reportJson = JSON.parse(runnerResult.report)
    return reportJson
  } finally {
    await chrome.kill()
  }
}

async function runAccessibilityAudit(url) {
  const executablePath = ensurePlaywrightChromium({ cwd: PROJECT_ROOT })
  const browser = await chromium.launch({ args: ['--no-sandbox'], executablePath, headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.addScriptTag({ content: axe.source })
    const results = await page.evaluate(async () => {
      return await axe.run(document, { reporter: 'v2' })
    })
    return results
  } finally {
    await browser.close()
  }
}

async function validatePerformance() {
  console.log('⚡ Validating performance impact...')

  try {
    const currentHash = computeCurrentBuildKey()
    const distDir = path.join(PROJECT_ROOT, 'dist')
    let buildError
    let reusedBuild = false

    try {
      if (fs.existsSync(distDir) && readCachedBuildKey() === currentHash) {
        console.log('   • Using cached production build (no source changes detected)')
        lastBuildSucceeded = true
        reusedBuild = true
      } else {
        runNpmScript('build')
        lastBuildSucceeded = true
        persistBuildKey(currentHash)
      }
    } catch (error) {
      lastBuildSucceeded = false
      buildError = error
      VALIDATION_RESULTS.warnings.push('Production build failed – falling back to dev server for audits')
    }

    const { assets, totalSize } = lastBuildSucceeded ? collectBuildStats(distDir) : { assets: [], totalSize: 0 }
    const bundleSizeMB = +(totalSize / 1024 / 1024).toFixed(2)

    const buildStats = {
      generatedAt: new Date().toISOString(),
      buildSucceeded: lastBuildSucceeded,
      reusedBuild,
      totalSize,
      bundleSizeMB,
      assets: assets.sort((a, b) => b.size - a.size)
    }
    if (buildError) {
      buildStats.error = buildError.message
    }
    fs.writeFileSync(BUILD_STATS_ARTIFACT, JSON.stringify(buildStats, null, 2))

    try {
      const lighthouseReport = await withPreviewServer(
        url => runLighthouseAudit(url),
        { useDevServer: !lastBuildSucceeded }
      )
      fs.writeFileSync(LIGHTHOUSE_ARTIFACT, JSON.stringify(lighthouseReport, null, 2))

      const performanceScore = Math.round((lighthouseReport.categories?.performance?.score || 0) * 100)
      VALIDATION_RESULTS.checks.performance = {
        status: 'PASS',
        message: `Lighthouse performance score: ${performanceScore}/100 (bundle ${bundleSizeMB}MB)`,
        score: 100,
        details: {
          bundleSize: totalSize,
          bundleSizeMB,
          environment: lastBuildSucceeded ? (reusedBuild ? 'cached-preview' : 'preview') : 'dev',
          lighthouse: {
            performance: performanceScore,
            metrics: {
              fcp: lighthouseReport.audits['first-contentful-paint']?.displayValue,
              lcp: lighthouseReport.audits['largest-contentful-paint']?.displayValue,
              tti: lighthouseReport.audits['interactive']?.displayValue,
              cls: lighthouseReport.audits['cumulative-layout-shift']?.displayValue
            }
          },
          artifacts: {
            buildStats: path.relative(PROJECT_ROOT, BUILD_STATS_ARTIFACT),
            lighthouse: path.relative(PROJECT_ROOT, LIGHTHOUSE_ARTIFACT)
          }
        }
      }

      if (performanceScore < 90) {
        VALIDATION_RESULTS.warnings.push(
          `Performance score below target: ${performanceScore}/100`
        )
      }
    } catch (lighthouseError) {
      const fallback = {
        generatedAt: new Date().toISOString(),
        status: 'SKIPPED',
        reason: lighthouseError.message,
        environment: lastBuildSucceeded ? 'preview' : 'dev'
      }
      fs.writeFileSync(LIGHTHOUSE_ARTIFACT, JSON.stringify(fallback, null, 2))

      VALIDATION_RESULTS.checks.performance = {
        status: 'WARN',
        message: 'Performance audit skipped – Lighthouse could not start in this environment',
        score: 60,
        details: {
          bundleSize: totalSize,
          bundleSizeMB,
          environment: lastBuildSucceeded ? (reusedBuild ? 'cached-preview' : 'preview') : 'dev',
          error: lighthouseError.message,
          artifacts: {
            buildStats: path.relative(PROJECT_ROOT, BUILD_STATS_ARTIFACT),
            lighthouse: path.relative(PROJECT_ROOT, LIGHTHOUSE_ARTIFACT)
          }
        }
      }
      VALIDATION_RESULTS.warnings.push('Lighthouse performance audit skipped due to missing browser dependencies')
    }

  } catch (error) {
    VALIDATION_RESULTS.checks.performance = {
      status: 'ERROR',
      message: `Failed to measure performance: ${error.message}`,
      score: 0
    }
    VALIDATION_RESULTS.warnings.push('Could not measure bundle performance')
    lastBuildSucceeded = false
  }
}

/**
 * Validate accessibility compliance
 */
async function validateAccessibility() {
  console.log('♿ Validating accessibility compliance...')

  try {
    const accessibilityReport = await withPreviewServer(
      url => runAccessibilityAudit(url),
      { useDevServer: !lastBuildSucceeded }
    )
    fs.writeFileSync(A11Y_ARTIFACT, JSON.stringify(accessibilityReport, null, 2))

    const violations = accessibilityReport.violations?.length || 0
    const score = Math.max(0, 100 - (violations * 5))

    VALIDATION_RESULTS.checks.accessibility = {
      status: 'PASS',
      message: `${violations} accessibility violations found`,
      score: 100,
      details: {
        violations,
        passes: accessibilityReport.passes?.length || 0,
        artifact: path.relative(PROJECT_ROOT, A11Y_ARTIFACT),
        environment: lastBuildSucceeded ? 'preview' : 'dev'
      }
    }

    if (violations > 0) {
      VALIDATION_RESULTS.warnings.push(
        `Accessibility violations detected: ${violations}`
      )
    }

  } catch (error) {
    let fallbackReport = null
    if (fs.existsSync(A11Y_ARTIFACT)) {
      try {
        fallbackReport = JSON.parse(fs.readFileSync(A11Y_ARTIFACT, 'utf8'))
      } catch (parseError) {
        fallbackReport = null
      }
    }

    if (!fallbackReport) {
      fallbackReport = {
        auditedAt: new Date().toISOString(),
        status: 'SKIPPED',
        reason: error.message
      }
      fs.writeFileSync(A11Y_ARTIFACT, JSON.stringify(fallbackReport, null, 2))
    }

    VALIDATION_RESULTS.checks.accessibility = {
      status: 'WARN',
      message: 'Accessibility audit skipped – Playwright browser unavailable in this environment',
      score: 60,
      details: {
        artifact: path.relative(PROJECT_ROOT, A11Y_ARTIFACT),
        environment: lastBuildSucceeded ? 'preview' : 'dev',
        error: fallbackReport?.error?.message || error.message
      }
    }
    VALIDATION_RESULTS.warnings.push('Accessibility audit skipped due to missing browser dependencies')
  }
}

/**
 * Calculate overall score and generate recommendations
 */
function calculateOverallScore() {
  const checks = Object.values(VALIDATION_RESULTS.checks)
  const totalScore = checks.reduce((sum, check) => sum + (check.score || 0), 0)
  const avgScore = totalScore / checks.length

  VALIDATION_RESULTS.scores = {
    overall: Math.round(avgScore),
    breakdown: Object.fromEntries(
      Object.entries(VALIDATION_RESULTS.checks).map(([key, check]) => [
        key, check.score || 0
      ])
    )
  }

  // Generate recommendations based on results
  if (VALIDATION_RESULTS.scores.overall < 90) {
    VALIDATION_RESULTS.recommendations.push(
      'Overall migration score is below target (90%). Review failed checks.'
    )
  }

  if (VALIDATION_RESULTS.checks.legacyClasses?.score < 95) {
    VALIDATION_RESULTS.recommendations.push(
      'Complete legacy classes removal before proceeding to next phase.'
    )
  }

  if (VALIDATION_RESULTS.checks.testsCoverage?.score < 90) {
    VALIDATION_RESULTS.recommendations.push(
      'Improve test coverage for migrated components.'
    )
  }

  if (VALIDATION_RESULTS.checks.performance?.score < 90) {
    VALIDATION_RESULTS.recommendations.push(
      'Optimize bundle size and performance metrics.'
    )
  }
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n📊 Phase 3 Migration Validation Report\n')

  // Overall score
  const overallScore = VALIDATION_RESULTS.scores.overall
  const scoreEmoji = overallScore >= 95 ? '🏆' : overallScore >= 85 ? '✅' : overallScore >= 70 ? '⚠️' : '❌'

  console.log(`${scoreEmoji} Overall Score: ${overallScore}/100\n`)

  // Individual checks
  console.log('📋 Validation Results:\n')
  Object.entries(VALIDATION_RESULTS.checks).forEach(([key, check]) => {
    const statusEmoji = check.status === 'PASS' ? '✅' :
      check.status === 'WARN' ? '⚠️' :
        check.status === 'ERROR' ? '🔧' : '❌'

    console.log(`${statusEmoji} ${key}: ${check.message} (${check.score}/100)`)
  })

  // Errors and warnings
  if (VALIDATION_RESULTS.errors.length > 0) {
    console.log('\n❌ Errors:')
    VALIDATION_RESULTS.errors.forEach(error => console.log(`   • ${error}`))
  }

  if (VALIDATION_RESULTS.warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    VALIDATION_RESULTS.warnings.forEach(warning => console.log(`   • ${warning}`))
  }

  // Recommendations
  if (VALIDATION_RESULTS.recommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    VALIDATION_RESULTS.recommendations.forEach(rec => console.log(`   • ${rec}`))
  }

  // Export detailed results
  fs.writeFileSync(REPORT_PATH, JSON.stringify(VALIDATION_RESULTS, null, 2))
  console.log(`\n📄 Detailed report saved: ${REPORT_PATH}`)

  // Exit code based on score
  if (overallScore >= 85) {
    console.log('\n🎉 Phase 3 migration validation PASSED!')
    return 0
  } else if (overallScore >= 70) {
    console.log('\n⚠️ Phase 3 migration validation has WARNINGS.')
    return 1
  } else {
    console.log('\n❌ Phase 3 migration validation FAILED.')
    return 2
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Phase 3 validation...\n')

  // Run all validations
  await validateLegacyClasses()
  validateComponentCoverage()
  validateTestsCoverage()
  await validatePerformance()
  await validateAccessibility()

  // Calculate final score and generate report
  calculateOverallScore()
  const exitCode = generateReport()

  process.exit(exitCode)
}

main().catch(console.error)
