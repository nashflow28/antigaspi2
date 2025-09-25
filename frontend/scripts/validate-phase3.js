#!/usr/bin/env node

/**
 * Phase 3 Validation Script - UI Design System Migration
 * Validates that migration meets all quality and performance criteria
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Phase 3 Validation - UI Design System Migration\n')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
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
    // Run legacy classes audit
    const auditScript = path.join(__dirname, 'audit-legacy-classes.js')
    execSync(`node "${auditScript}"`, { cwd: PROJECT_ROOT, stdio: 'pipe' })

    // If audit passes (exit code 0), no legacy classes found
    VALIDATION_RESULTS.checks.legacyClasses = {
      status: 'PASS',
      message: 'No legacy classes detected',
      score: 100
    }

  } catch (error) {
    // Audit failed (exit code 1), legacy classes still exist
    try {
      const auditResults = JSON.parse(fs.readFileSync(
        path.join(PROJECT_ROOT, 'legacy-classes-audit.json'), 'utf8'
      ))

      const totalUsages = auditResults.summary.totalLegacyUsages
      const filesAffected = auditResults.summary.filesWithLegacy

      let score = Math.max(0, 100 - (totalUsages * 2)) // -2 points per usage
      let status = score >= 95 ? 'PASS' : score >= 80 ? 'WARN' : 'FAIL'

      VALIDATION_RESULTS.checks.legacyClasses = {
        status,
        message: `${totalUsages} legacy class usages in ${filesAffected} files`,
        score,
        details: auditResults.recommendations
      }

      if (status === 'FAIL') {
        VALIDATION_RESULTS.errors.push(
          `Too many legacy classes remaining: ${totalUsages} usages`
        )
      } else if (status === 'WARN') {
        VALIDATION_RESULTS.warnings.push(
          `Some legacy classes still exist: ${totalUsages} usages`
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
    // Run tests and capture coverage
    const coverage = execSync('npm run test:coverage -- --reporter=json', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    })

    const coverageData = JSON.parse(coverage)
    const totalCoverage = coverageData.total?.statements?.pct || 0

    let score = Math.min(100, totalCoverage)
    let status = score >= 90 ? 'PASS' : score >= 75 ? 'WARN' : 'FAIL'

    VALIDATION_RESULTS.checks.testsCoverage = {
      status,
      message: `${totalCoverage.toFixed(1)}% test coverage`,
      score,
      details: coverageData.total
    }

    if (status === 'FAIL') {
      VALIDATION_RESULTS.errors.push(
        `Test coverage too low: ${totalCoverage.toFixed(1)}%`
      )
    }

  } catch (error) {
    VALIDATION_RESULTS.checks.testsCoverage = {
      status: 'ERROR',
      message: 'Failed to run test coverage',
      score: 0
    }
    VALIDATION_RESULTS.warnings.push('Could not determine test coverage')
  }
}

/**
 * Validate performance impact
 */
function validatePerformance() {
  console.log('⚡ Validating performance impact...')

  try {
    // Build the application and measure bundle size
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'pipe' })

    const distDir = path.join(PROJECT_ROOT, 'dist')
    const statsFile = path.join(distDir, 'stats.json')

    let bundleSize = 0
    let score = 100

    if (fs.existsSync(statsFile)) {
      const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'))
      bundleSize = stats.assets?.reduce((total, asset) => total + asset.size, 0) || 0
    } else {
      // Fallback: measure dist directory size
      const distFiles = fs.readdirSync(distDir, { withFileTypes: true })
      bundleSize = distFiles.reduce((total, file) => {
        if (file.isFile()) {
          const stats = fs.statSync(path.join(distDir, file.name))
          return total + stats.size
        }
        return total
      }, 0)
    }

    const bundleSizeMB = (bundleSize / 1024 / 1024).toFixed(2)

    // Score based on bundle size (penalize if > 2MB)
    if (bundleSize > 2 * 1024 * 1024) {
      score = Math.max(0, 100 - ((bundleSize - 2 * 1024 * 1024) / 1024 / 1024 * 10))
    }

    let status = score >= 90 ? 'PASS' : score >= 70 ? 'WARN' : 'FAIL'

    VALIDATION_RESULTS.checks.performance = {
      status,
      message: `Bundle size: ${bundleSizeMB}MB`,
      score,
      details: { bundleSize, bundleSizeMB }
    }

    if (status === 'WARN') {
      VALIDATION_RESULTS.warnings.push(
        `Bundle size is larger than recommended: ${bundleSizeMB}MB`
      )
    } else if (status === 'FAIL') {
      VALIDATION_RESULTS.errors.push(
        `Bundle size too large: ${bundleSizeMB}MB`
      )
    }

  } catch (error) {
    VALIDATION_RESULTS.checks.performance = {
      status: 'ERROR',
      message: 'Failed to measure performance',
      score: 0
    }
    VALIDATION_RESULTS.warnings.push('Could not measure bundle performance')
  }
}

/**
 * Validate accessibility compliance
 */
async function validateAccessibility() {
  console.log('♿ Validating accessibility compliance...')

  try {
    // Run accessibility tests (assuming axe-playwright is set up)
    const testOutput = execSync('npm run test:a11y', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    })

    // Parse test output for violations
    const violations = (testOutput.match(/violations: (\d+)/g) || [])
      .map(match => parseInt(match.match(/\d+/)[0]))
      .reduce((sum, count) => sum + count, 0)

    let score = Math.max(0, 100 - (violations * 5)) // -5 points per violation
    let status = score >= 95 ? 'PASS' : score >= 80 ? 'WARN' : 'FAIL'

    VALIDATION_RESULTS.checks.accessibility = {
      status,
      message: `${violations} accessibility violations found`,
      score,
      details: { violations }
    }

    if (status === 'FAIL') {
      VALIDATION_RESULTS.errors.push(
        `Too many accessibility violations: ${violations}`
      )
    } else if (status === 'WARN') {
      VALIDATION_RESULTS.warnings.push(
        `Some accessibility violations found: ${violations}`
      )
    }

  } catch (error) {
    VALIDATION_RESULTS.checks.accessibility = {
      status: 'ERROR',
      message: 'Failed to run accessibility tests',
      score: 0
    }
    VALIDATION_RESULTS.warnings.push('Could not validate accessibility')
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
  const reportPath = path.join(PROJECT_ROOT, 'phase3-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(VALIDATION_RESULTS, null, 2))
  console.log(`\n📄 Detailed report saved: ${reportPath}`)

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
  validatePerformance()
  await validateAccessibility()

  // Calculate final score and generate report
  calculateOverallScore()
  const exitCode = generateReport()

  process.exit(exitCode)
}

main().catch(console.error)