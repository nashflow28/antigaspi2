#!/usr/bin/env node

/**
 * Legacy Classes Audit Tool - Phase 3 Migration
 * Scans all Vue files for legacy CSS classes and provides migration recommendations
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

console.log('🔍 Phase 3 - Legacy Classes Audit Tool\n')

// Configuration
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const _unused_dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(_unused_dirname, '..')
const SCAN_PATTERNS = [
  'src/**/*.vue',
  'src/**/*.ts',
  'src/**/*.js'
]

// Legacy classes to detect and their 2025 replacements
const LEGACY_MAPPINGS = {
  // Button classes
  'btn': 'Button component with variant prop',
  'btn-primary': 'Button variant="primary"',
  'btn-secondary': 'Button variant="secondary"',
  'btn-accent': 'Button variant="promo"',
  'btn-outline': 'Button variant="outline"',
  'btn-ghost': 'Button variant="ghost"',
  'btn-sm': 'Button size="sm"',
  'btn-lg': 'Button size="lg"',

  // Card classes
  'card': 'Card component',
  'card-glass': 'Card variant="glass"',
  'card-gradient': 'Card variant="gradient"',
  'card-interactive': 'Card interactive prop',

  // Form classes
  'form-group': 'form-group-2025 class',
  'form-label': 'Label component',
  'form-input': 'Input component',
  'form-textarea': 'Textarea component',
  'form-select': 'Select component',
  'form-checkbox': 'Checkbox component',
  'form-radio': 'Radio component',
  'form-error': 'ErrorText component',
  'form-help': 'HelpText component',

  // Badge classes
  'badge': 'Badge component',
  'badge-primary': 'Badge variant="primary"',
  'badge-secondary': 'Badge variant="secondary"',
  'badge-success': 'Badge variant="success"',
  'badge-warning': 'Badge variant="warning"',
  'badge-error': 'Badge variant="error"',

  // Utility classes
  'glass-bg': 'bg-white/60 backdrop-blur-md',
  'container-fluid': 'container-2025',
  'shadow-glow': 'shadow-card-2025',
  'gradient-primary': 'bg-nav-gradient-2025'
}

// Results storage
const results = {
  files: {},
  summary: {
    totalFiles: 0,
    filesWithLegacy: 0,
    totalLegacyUsages: 0,
    legacyClassCounts: {}
  }
}

/**
 * Scan single file for legacy classes
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(PROJECT_ROOT, filePath)
    const fileResult = {
      path: relativePath,
      legacyUsages: [],
      totalUsages: 0
    }

    // Scan for each legacy class
    Object.keys(LEGACY_MAPPINGS).forEach(legacyClass => {
      const regex = new RegExp(`\\b${legacyClass}\\b`, 'g')
      const matches = content.match(regex)

      if (matches) {
        const lineNumbers = []
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          if (line.includes(legacyClass)) {
            lineNumbers.push(index + 1)
          }
        })

        fileResult.legacyUsages.push({
          class: legacyClass,
          count: matches.length,
          replacement: LEGACY_MAPPINGS[legacyClass],
          lines: lineNumbers
        })

        fileResult.totalUsages += matches.length
        results.summary.legacyClassCounts[legacyClass] =
          (results.summary.legacyClassCounts[legacyClass] || 0) + matches.length
      }
    })

    if (fileResult.totalUsages > 0) {
      results.files[relativePath] = fileResult
      results.summary.filesWithLegacy++
      results.summary.totalLegacyUsages += fileResult.totalUsages
    }

    results.summary.totalFiles++
    return fileResult.totalUsages > 0
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message)
    return false
  }
}

/**
 * Generate migration priority
 */
function calculateMigrationPriority(fileResult) {
  const { path, totalUsages } = fileResult
  let priority = 'Low'
  let score = totalUsages

  // High priority for complex views
  if (path.includes('ProductDetailView') || path.includes('DashboardView')) {
    score += 50
    priority = 'High'
  }

  // Medium priority for components
  if (path.includes('components/ui/')) {
    score += 25
    priority = priority === 'High' ? 'High' : 'Medium'
  }

  // Critical if many usages
  if (totalUsages > 10) {
    priority = 'Critical'
    score += 100
  }

  return { priority, score }
}

/**
 * Generate migration report
 */
function generateReport() {
  console.log('📊 Legacy Classes Audit Report\n')
  console.log(`Total files scanned: ${results.summary.totalFiles}`)
  console.log(`Files with legacy classes: ${results.summary.filesWithLegacy}`)
  console.log(`Total legacy class usages: ${results.summary.totalLegacyUsages}\n`)

  // Top legacy classes
  console.log('🔥 Most used legacy classes:')
  const sortedClasses = Object.entries(results.summary.legacyClassCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)

  sortedClasses.forEach(([className, count]) => {
    console.log(`   ${className}: ${count} usages → ${LEGACY_MAPPINGS[className]}`)
  })
  console.log()

  // Files by migration priority
  const filesByPriority = Object.values(results.files)
    .map(file => ({ ...file, ...calculateMigrationPriority(file) }))
    .sort((a, b) => b.score - a.score)

  console.log('📋 Files by migration priority:\n')

  const priorities = ['Critical', 'High', 'Medium', 'Low']
  priorities.forEach(priority => {
    const filesForPriority = filesByPriority.filter(f => f.priority === priority)
    if (filesForPriority.length > 0) {
      console.log(`${priority} Priority (${filesForPriority.length} files):`)
      filesForPriority.forEach(file => {
        console.log(`   📄 ${file.path} (${file.totalUsages} usages)`)

        // Show top legacy classes in this file
        const topClasses = file.legacyUsages
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        topClasses.forEach(usage => {
          console.log(`      - ${usage.class} (${usage.count}x) → ${usage.replacement}`)
        })
      })
      console.log()
    }
  })

  // Detailed file breakdown
  console.log('📝 Detailed breakdown:')
  Object.values(results.files).forEach(file => {
    console.log(`\n📄 ${file.path}:`)
    file.legacyUsages.forEach(usage => {
      console.log(`   ❌ ${usage.class} (${usage.count} usages)`)
      console.log(`      → ${usage.replacement}`)
      console.log(`      Lines: ${usage.lines.join(', ')}`)
    })
  })
}

/**
 * Export results for automation
 */
function exportResults() {
  const exportData = {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    migrationPlan: Object.values(results.files)
      .map(file => ({ ...file, ...calculateMigrationPriority(file) }))
      .sort((a, b) => b.score - a.score),
    recommendations: {
      highPriorityFiles: Object.values(results.files)
        .filter(file => calculateMigrationPriority(file).priority === 'Critical')
        .map(file => file.path),
      quickWins: Object.entries(results.summary.legacyClassCounts)
        .filter(([, count]) => count < 5)
        .map(([className]) => className),
      complexMigrations: Object.entries(results.summary.legacyClassCounts)
        .filter(([, count]) => count > 20)
        .map(([className]) => className)
    }
  }

  const exportPath = path.join(PROJECT_ROOT, 'legacy-classes-audit.json')
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
  console.log(`\n💾 Results exported to: ${exportPath}`)
}

/**
 * Main execution
 */
async function main() {
  const allFiles = []

  for (const pattern of SCAN_PATTERNS) {
    const files = await glob(pattern, { cwd: PROJECT_ROOT })
    allFiles.push(...files.map(file => path.join(PROJECT_ROOT, file)))
  }

  console.log(`🔍 Scanning ${allFiles.length} files for legacy classes...\n`)

  // Scan all files
  allFiles.forEach(filePath => {
    scanFile(filePath)
  })

  // Generate reports
  generateReport()
  exportResults()

  // Exit code based on results
  if (results.summary.totalLegacyUsages > 0) {
    console.log(`\n⚠️  Found ${results.summary.totalLegacyUsages} legacy class usages that need migration.`)
    console.log('📋 Check legacy-classes-audit.json for detailed migration plan.')
    process.exit(1)
  } else {
    console.log('\n✅ No legacy classes found! Migration completed.')
    process.exit(0)
  }
}

// Run audit
main().catch(console.error)
