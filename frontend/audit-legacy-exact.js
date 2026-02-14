#!/usr/bin/env node
/**
 * Audit Script - DS2025 Migration Progress
 *
 * Counts legacy vs DS2025 component usage across the codebase.
 * Generates a detailed report for tracking migration progress.
 *
 * Usage: node audit-legacy-exact.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SRC_DIR = path.join(__dirname, 'src')
const REPORT_FILE = path.join(__dirname, 'phase3-validation-report.json')

// Patterns for detection
const LEGACY_IMPORT_PATTERN = /from\s+['"]@\/components\/ui\/(?!2025)[^'"]+['"]/g
const DS2025_IMPORT_PATTERN = /from\s+['"]@\/components\/ui\/2025[^'"]*['"]/g

// Legacy components that are intentionally kept
const INTENTIONAL_LEGACY = [
  'DashboardLayout',
  'Navigation',
  'Footer',
  'PageTransition',
  'NotificationContainer',
  'NotificationSystem',
  'Toast',
  'AdminModal',
  'Skeleton',
  'DarkModeToggle'
]

// Legacy paths that are bridges to DS2025 (re-exports)
const BRIDGE_PATHS = [
  '@/components/ui/dashboard'
]

async function getAllVueAndTsFiles() {
  return await glob('**/*.{vue,ts,tsx}', {
    cwd: SRC_DIR,
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**']
  })
}

function analyzeFile(filePath) {
  const fullPath = path.join(SRC_DIR, filePath)
  const content = fs.readFileSync(fullPath, 'utf-8')

  const legacyMatches = content.match(LEGACY_IMPORT_PATTERN) || []
  const ds2025Matches = content.match(DS2025_IMPORT_PATTERN) || []

  // Extract component names from legacy imports
  const legacyComponents = legacyMatches.map(match => {
    // Check if it's a bridge path
    for (const bridgePath of BRIDGE_PATHS) {
      if (match.includes(bridgePath)) {
        return `[bridge] ${bridgePath}`
      }
    }
    const componentMatch = match.match(/\/([^/]+)\.vue/)
    return componentMatch ? componentMatch[1] : match
  })

  return {
    file: filePath,
    legacyCount: legacyMatches.length,
    ds2025Count: ds2025Matches.length,
    legacyImports: legacyMatches,
    ds2025Imports: ds2025Matches,
    legacyComponents: legacyComponents
  }
}

function calculateScore(migrationPct, unintentionalCount) {
  // Score based on:
  // - 70% weight on migration percentage
  // - 30% weight on eliminating unintentional legacy
  const migrationScore = migrationPct * 0.7
  const legacyPenalty = Math.min(30, unintentionalCount * 2)
  const legacyScore = 30 - legacyPenalty

  return Math.round(migrationScore + legacyScore)
}

function generateRecommendations(unintentionalLegacy, filesWithLegacy) {
  const recommendations = []

  // Most used unintentional legacy components
  const sortedLegacy = Object.entries(unintentionalLegacy)
    .sort((a, b) => b[1] - a[1])

  if (sortedLegacy.length > 0) {
    recommendations.push({
      priority: 'high',
      message: `Migrate ${sortedLegacy[0][0]} (used ${sortedLegacy[0][1]} times) to DS2025 equivalent`
    })
  }

  // Files with most legacy imports
  const topFiles = filesWithLegacy
    .sort((a, b) => b.legacyCount - a.legacyCount)
    .slice(0, 3)

  topFiles.forEach(f => {
    recommendations.push({
      priority: 'medium',
      message: `Refactor ${f.file} (${f.legacyCount} legacy imports)`
    })
  })

  if (Object.keys(unintentionalLegacy).length === 0) {
    recommendations.push({
      priority: 'info',
      message: 'All legacy usage is intentional. Migration complete!'
    })
  }

  return recommendations
}

async function generateReport() {
  const files = await getAllVueAndTsFiles()
  const results = files.map(analyzeFile).filter(r => r.legacyCount > 0 || r.ds2025Count > 0)

  // Aggregate stats
  const totalLegacy = results.reduce((sum, r) => sum + r.legacyCount, 0)
  const totalDS2025 = results.reduce((sum, r) => sum + r.ds2025Count, 0)
  const totalImports = totalLegacy + totalDS2025
  const migrationPercentage = totalImports > 0
    ? Math.round((totalDS2025 / totalImports) * 100)
    : 100

  // Files with legacy imports
  const filesWithLegacy = results
    .filter(r => r.legacyCount > 0)
    .map(r => ({
      file: r.file,
      legacyCount: r.legacyCount,
      components: r.legacyComponents
    }))

  // Count legacy component usage
  const legacyComponentUsage = {}
  results.forEach(r => {
    r.legacyComponents.forEach(comp => {
      legacyComponentUsage[comp] = (legacyComponentUsage[comp] || 0) + 1
    })
  })

  // Separate intentional vs unintentional legacy
  const intentionalLegacy = {}
  const unintentionalLegacy = {}

  Object.entries(legacyComponentUsage).forEach(([comp, count]) => {
    const isBridge = comp.startsWith('[bridge]')
    const isIntentional = INTENTIONAL_LEGACY.includes(comp) || isBridge
    if (isIntentional) {
      intentionalLegacy[comp] = count
    } else {
      unintentionalLegacy[comp] = count
    }
  })

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      filesWithComponentImports: results.length,
      filesWithLegacyImports: filesWithLegacy.length,
      totalLegacyImports: totalLegacy,
      totalDS2025Imports: totalDS2025,
      migrationPercentage: migrationPercentage,
      intentionalLegacyCount: Object.values(intentionalLegacy).reduce((a, b) => a + b, 0),
      unintentionalLegacyCount: Object.values(unintentionalLegacy).reduce((a, b) => a + b, 0)
    },
    scoring: {
      legacyClasses: Object.values(unintentionalLegacy).reduce((a, b) => a + b, 0),
      overall: calculateScore(migrationPercentage, Object.values(unintentionalLegacy).reduce((a, b) => a + b, 0))
    },
    intentionalLegacyComponents: intentionalLegacy,
    unintentionalLegacyComponents: unintentionalLegacy,
    filesWithLegacyImports: filesWithLegacy,
    recommendations: generateRecommendations(unintentionalLegacy, filesWithLegacy)
  }

  return report
}

// Main execution
console.log('=== DS2025 Migration Audit ===\n')

const report = await generateReport()

// Console output
console.log(`Files analyzed: ${report.summary.totalFiles}`)
console.log(`Files with UI imports: ${report.summary.filesWithComponentImports}`)
console.log(`Files with legacy imports: ${report.summary.filesWithLegacyImports}`)
console.log('\nImport Statistics:')
console.log(`  DS2025 imports: ${report.summary.totalDS2025Imports}`)
console.log(`  Legacy imports: ${report.summary.totalLegacyImports}`)
console.log(`    - Intentional: ${report.summary.intentionalLegacyCount}`)
console.log(`    - Unintentional: ${report.summary.unintentionalLegacyCount}`)
console.log(`\nMigration Progress: ${report.summary.migrationPercentage}%`)
console.log(`Overall Score: ${report.scoring.overall}/100`)

if (Object.keys(report.unintentionalLegacyComponents).length > 0) {
  console.log('\nUnintentional Legacy Components:')
  Object.entries(report.unintentionalLegacyComponents)
    .sort((a, b) => b[1] - a[1])
    .forEach(([comp, count]) => {
      console.log(`  - ${comp}: ${count} usages`)
    })
}

if (report.recommendations.length > 0) {
  console.log('\nRecommendations:')
  report.recommendations.forEach(rec => {
    const icon = rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '>' : '*'
    console.log(`  ${icon} [${rec.priority.toUpperCase()}] ${rec.message}`)
  })
}

// Save report to file
fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))
console.log(`\nReport saved to: ${REPORT_FILE}`)
