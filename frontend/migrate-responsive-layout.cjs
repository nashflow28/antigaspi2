#!/usr/bin/env node

/**
 * 🚀 MIGRATION SCRIPT - Layout Responsive Legacy vers 2025
 *
 * Convertit les patterns de layout legacy vers les patterns 2025 modernes
 * - px-* → px-4 sm:px-6 lg:px-8-2025
 * - py-* → py-8 sm:py-10 lg:py-12
 * - margin/padding legacy vers responsive moderne
 * - max-w-* → max-w-full sm:max-w-*
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Configuration de migration responsive
const RESPONSIVE_LAYOUT_MIGRATIONS = {
  // Padding horizontal responsive
  'px-4': 'px-4 sm:px-6 lg:px-8-2025',
  'px-6': 'px-4 sm:px-6 lg:px-8-2025',
  'px-8': 'px-4 sm:px-6 lg:px-8-2025',

  // Padding vertical responsive
  'py-16': 'py-16 sm:py-18 lg:py-20',
  'py-20': 'py-16 sm:py-18 lg:py-20',
  'py-24': 'py-24 sm:py-28 lg:py-32',
  'py-32': 'py-24 sm:py-28 lg:py-32',

  // Max width responsive
  'max-w-md': 'max-w-full sm:max-w-md',
  'max-w-lg': 'max-w-full sm:max-w-lg',
  'max-w-xl': 'max-w-full sm:max-w-xl',
  'max-w-2xl': 'max-w-full sm:max-w-2xl',
  'max-w-3xl': 'max-w-full sm:max-w-3xl',
  'max-w-4xl': 'max-w-full sm:max-w-4xl',
  'max-w-5xl': 'max-w-full sm:max-w-5xl',
  'max-w-6xl': 'max-w-full sm:max-w-6xl',
  'max-w-7xl': 'max-w-full sm:max-w-7xl',

  // Margin responsive
  'mb-16': 'mb-16 sm:mb-18 lg:mb-20',
  'mb-20': 'mb-16 sm:mb-18 lg:mb-20',
  'mt-16': 'mt-16 sm:mt-18 lg:mt-20',
  'mt-20': 'mt-16 sm:mt-18 lg:mt-20',

  // Text alignment mobile-first
  'text-center': 'text-left sm:text-center',
  'text-left': 'text-left sm:text-center',

  // Grid responsive
  'grid-cols-2': 'grid-cols-1 md:grid-cols-2',
  'grid-cols-3': 'grid-cols-1 md:grid-cols-3',
  'grid-cols-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',

  // Flex direction responsive
  'flex-row': 'flex-col sm:flex-row',
  'flex-col': 'flex-col',

  // Hidden/block responsive
  'hidden sm:block': 'hidden sm:block',
  'sm:hidden': 'sm:hidden',
  'lg:hidden': 'lg:hidden',

  // Specific mobile patterns
  'block sm:hidden': 'block sm:hidden',
  'hidden sm:flex': 'hidden sm:flex'
}

// Patterns complexes pour conteneurs
const CONTAINER_PATTERNS = {
  // Container standard
  'container mx-auto px-4': 'container px-4 sm:px-6 lg:px-8-2025',
  'container px-4': 'container px-4 sm:px-6 lg:px-8-2025',
  'container px-6': 'container px-4 sm:px-6 lg:px-8-2025',

  // Sections avec padding
  'py-16 px-4': 'py-16 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8-2025',
  'py-20 px-4': 'py-16 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8-2025',
  'py-24 px-4': 'py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8-2025'
}

// Patterns pour améliorer la lisibilité mobile
const MOBILE_UX_IMPROVEMENTS = {
  // Espacement touch-friendly
  'gap-2': 'gap-4 sm:gap-2',
  'gap-4': 'gap-6 sm:gap-4',

  // Padding pour zone de touch
  'p-2': 'p-4 sm:p-2',
  'p-3': 'p-4 sm:p-3',
  'p-4': 'p-6 sm:p-4',

  // Text responsive
  'text-sm': 'text-responsive-sm',
  'text-base': 'text-responsive-base',
  'text-lg': 'text-responsive-lg',
  'text-xl': 'text-responsive-xl',
  'text-2xl': 'text-responsive-2xl',
  'text-3xl': 'text-display-sm',
  'text-4xl': 'text-display-md',
  'text-5xl': 'text-display-lg',
  'text-6xl': 'text-display-xl'
}

let totalFiles = 0
let totalReplacements = 0
const migrationReport = []

function migrateResponsiveLayoutInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let updatedContent = content
    let fileReplacements = 0

    // 1. Migration layout responsive basique
    Object.entries(RESPONSIVE_LAYOUT_MIGRATIONS).forEach(([legacy, modern]) => {
      const regex = new RegExp(`\\b${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const matches = updatedContent.match(regex)
      if (matches) {
        updatedContent = updatedContent.replace(regex, modern)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 2. Migration container patterns
    Object.entries(CONTAINER_PATTERNS).forEach(([legacy, modern]) => {
      const regex = new RegExp(legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = updatedContent.match(regex)
      if (matches) {
        updatedContent = updatedContent.replace(regex, modern)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 3. Amélioration UX mobile
    Object.entries(MOBILE_UX_IMPROVEMENTS).forEach(([legacy, modern]) => {
      const regex = new RegExp(`\\b${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const matches = updatedContent.match(regex)
      if (matches) {
        updatedContent = updatedContent.replace(regex, modern)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 4. Patterns complexes avec regex avancé
    const complexPatterns = [
      // Section responsive pattern
      {
        pattern: /class="([^"]*\s)?py-(\d+)(\s[^"]*)?"/g,
        replacement: (match, prefix = '', spacing, suffix = '') => {
          const mobilePy = parseInt(spacing) >= 20 ? 'py-16 sm:py-18 lg:py-20' : `py-${spacing}`
          return `class="${prefix}${mobilePy}${suffix}"`
        }
      },

      // Container avec max-width mobile-first
      {
        pattern: /class="([^"]*\s)?max-w-(\w+)(\s[^"]*)?"/g,
        replacement: (match, prefix = '', width, suffix = '') => {
          return `class="${prefix}max-w-full sm:max-w-${width}${suffix}"`
        }
      },

      // Grid mobile-first automatique
      {
        pattern: /class="([^"]*\s)?grid-cols-(\d+)(\s[^"]*)?"/g,
        replacement: (match, prefix = '', cols, suffix = '') => {
          const colNum = parseInt(cols)
          if (colNum === 2) return `class="${prefix}grid-cols-1 md:grid-cols-2${suffix}"`
          if (colNum === 3) return `class="${prefix}grid-cols-1 md:grid-cols-3${suffix}"`
          if (colNum === 4) return `class="${prefix}grid-cols-1 sm:grid-cols-2 lg:grid-cols-4${suffix}"`
          return match
        }
      }
    ]

    complexPatterns.forEach(({ pattern, replacement }) => {
      const matches = updatedContent.match(pattern)
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 5. Nettoyage des doublons responsive
    updatedContent = updatedContent
      .replace(/sm:text-left\s+sm:text-center/g, 'sm:text-center')
      .replace(/text-left\s+text-left/g, 'text-left')
      .replace(/max-w-full\s+max-w-full/g, 'max-w-full')
      .replace(/sm:max-w-(\w+)\s+sm:max-w-\1/g, 'sm:max-w-$1')

    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, updatedContent)
      migrationReport.push({
        file: filePath.replace(process.cwd(), '.'),
        replacements: fileReplacements
      })
      totalFiles++
      console.log(`✅ ${filePath.replace(process.cwd(), '.')} - ${fileReplacements} remplacements`)
    }

  } catch (error) {
    console.error(`❌ Erreur lors de la migration de ${filePath}:`, error.message)
  }
}

function main() {
  console.log('🚀 MIGRATION RESPONSIVE LAYOUT → 2025 MOBILE-FIRST\n')

  const srcPath = path.join(process.cwd(), 'frontend/src')

  if (!fs.existsSync(srcPath)) {
    console.error('❌ Dossier frontend/src non trouvé')
    process.exit(1)
  }

  const patterns = [
    'frontend/src/**/*.vue',
    'frontend/src/**/*.js',
    'frontend/src/**/*.ts',
    'frontend/src/**/*.jsx',
    'frontend/src/**/*.tsx'
  ]

  patterns.forEach(pattern => {
    const files = glob.sync(pattern)
    files.forEach(migrateResponsiveLayoutInFile)
  })

  console.log('\n📊 RAPPORT DE MIGRATION RESPONSIVE:')
  console.log(`✅ Fichiers modifiés: ${totalFiles}`)
  console.log(`🔄 Total remplacements: ${totalReplacements}`)

  if (migrationReport.length > 0) {
    console.log('\n📁 DÉTAIL PAR FICHIER:')
    migrationReport
      .sort((a, b) => b.replacements - a.replacements)
      .slice(0, 20)
      .forEach(({ file, replacements }) => {
        console.log(`   ${file}: ${replacements} remplacements`)
      })
  }

  console.log('\n🎯 MIGRATION RESPONSIVE TERMINÉE !')
  console.log('   → Mobile-first layouts appliqués')
  console.log('   → Responsive breakpoints optimisés')
  console.log('   → Touch targets améliorés')
}

if (require.main === module) {
  main()
}

module.exports = { migrateResponsiveLayoutInFile, RESPONSIVE_LAYOUT_MIGRATIONS }
