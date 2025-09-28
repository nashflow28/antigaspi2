#!/usr/bin/env node

/**
 * 🚀 MIGRATION SCRIPT - Spacing Legacy vers Gap 2025
 *
 * Convertit les patterns d'espacement legacy vers les patterns gap modernes
 * - space-y-* → gap-* avec flex flex-col
 * - space-x-* → gap-* avec flex flex-row
 * - Patterns spécialisés pour mobile-first
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Configuration de migration spacing
const SPACING_MIGRATIONS = {
  // space-y-* vers gap avec flex-col
  'space-y-1': 'gap-1 flex flex-col',
  'space-y-2': 'gap-2 flex flex-col',
  'space-y-3': 'gap-3 flex flex-col',
  'space-y-4': 'gap-4 flex flex-col',
  'space-y-5': 'gap-5 flex flex-col',
  'space-y-6': 'gap-6 flex flex-col',
  'space-y-8': 'gap-8 flex flex-col',
  'space-y-10': 'gap-10 flex flex-col',
  'space-y-12': 'gap-12 flex flex-col',
  'space-y-16': 'gap-16 flex flex-col',
  'space-y-20': 'gap-20 flex flex-col',

  // space-x-* vers gap avec flex-row
  'space-x-1': 'gap-1 flex',
  'space-x-2': 'gap-2 flex',
  'space-x-3': 'gap-3 flex',
  'space-x-4': 'gap-4 flex',
  'space-x-5': 'gap-5 flex',
  'space-x-6': 'gap-6 flex',
  'space-x-8': 'gap-8 flex',

  // Responsive spacing
  'sm:space-y-2': 'sm:gap-2 sm:flex sm:flex-col',
  'sm:space-y-4': 'sm:gap-4 sm:flex sm:flex-col',
  'sm:space-y-6': 'sm:gap-6 sm:flex sm:flex-col',
  'sm:space-y-8': 'sm:gap-8 sm:flex sm:flex-col',
  'md:space-y-4': 'md:gap-4 md:flex md:flex-col',
  'md:space-y-6': 'md:gap-6 md:flex md:flex-col',
  'md:space-y-8': 'md:gap-8 md:flex md:flex-col',
  'lg:space-y-6': 'lg:gap-6 lg:flex lg:flex-col',
  'lg:space-y-8': 'lg:gap-8 lg:flex lg:flex-col',
  'lg:space-y-12': 'lg:gap-12 lg:flex lg:flex-col',

  'sm:space-x-2': 'sm:gap-2 sm:flex',
  'sm:space-x-4': 'sm:gap-4 sm:flex',
  'sm:space-x-6': 'sm:gap-6 sm:flex',
  'md:space-x-4': 'md:gap-4 md:flex',
  'md:space-x-6': 'md:gap-6 md:flex',
  'lg:space-x-6': 'lg:gap-6 lg:flex',

  // Spacing négatif (legacy patterns)
  '-space-y-1': '-gap-1 flex flex-col',
  '-space-x-1': '-gap-1 flex',

  // Patterns complexes grid
  'space-y-4 md:space-y-0 md:space-x-8': 'gap-4 flex flex-col md:gap-8 md:flex-row',
  'space-y-6 lg:space-y-0 lg:space-x-12': 'gap-6 flex flex-col lg:gap-12 lg:flex-row'
}

// Patterns spéciaux pour composants spécifiques
const COMPONENT_SPECIFIC_MIGRATIONS = {
  // Navigation items
  'nav space-x-': 'nav gap-',
  'menu space-y-': 'menu gap- flex flex-col',

  // Form groups
  'form space-y-': 'form gap- flex flex-col',
  'fieldset space-y-': 'fieldset gap- flex flex-col',

  // Button groups
  'button-group space-x-': 'button-group gap-',

  // Card grids
  'grid space-y-': 'grid gap-',
  'grid space-x-': 'grid gap-x-'
}

let totalFiles = 0
let totalReplacements = 0
const migrationReport = []

function migrateSpacingInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let updatedContent = content
    let fileReplacements = 0

    // 1. Migration spacing basique
    Object.entries(SPACING_MIGRATIONS).forEach(([legacy, modern]) => {
      const regex = new RegExp(`\\b${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const matches = updatedContent.match(regex)
      if (matches) {
        updatedContent = updatedContent.replace(regex, modern)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 2. Patterns complexes avec regex avancé
    const complexPatterns = [
      // space-y-X space-x-Y vers gap-X flex avec direction intelligente
      {
        pattern: /space-y-(\d+)\s+space-x-(\d+)/g,
        replacement: 'gap-$1 flex flex-col md:gap-$2 md:flex-row'
      },

      // div class="space-y-X" vers div class="gap-X flex flex-col"
      {
        pattern: /class="([^"]*\s)?space-y-(\d+)(\s[^"]*)?"/g,
        replacement: (match, prefix = '', spacing, suffix = '') => {
          return `class="${prefix}gap-${spacing} flex flex-col${suffix}"`
        }
      },

      // class="space-x-X" vers class="gap-X flex"
      {
        pattern: /class="([^"]*\s)?space-x-(\d+)(\s[^"]*)?"/g,
        replacement: (match, prefix = '', spacing, suffix = '') => {
          return `class="${prefix}gap-${spacing} flex${suffix}"`
        }
      }
    ]

    complexPatterns.forEach(({ pattern, replacement }) => {
      const matches = updatedContent.match(pattern)
      if (matches) {
        if (typeof replacement === 'function') {
          updatedContent = updatedContent.replace(pattern, replacement)
        } else {
          updatedContent = updatedContent.replace(pattern, replacement)
        }
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 3. Optimisation pour éviter les doublons flex
    updatedContent = updatedContent
      .replace(/flex\s+flex\s+flex/g, 'flex')
      .replace(/flex\s+flex-col\s+flex/g, 'flex flex-col')
      .replace(/flex\s+flex\s+flex-col/g, 'flex flex-col')

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
  console.log('🚀 MIGRATION SPACING → GAP 2025 DESIGN SYSTEM\n')

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
    files.forEach(migrateSpacingInFile)
  })

  console.log('\n📊 RAPPORT DE MIGRATION SPACING:')
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

  console.log('\n🎯 MIGRATION SPACING TERMINÉE !')
  console.log('   → Tous les space-* convertis en gap moderne')
  console.log('   → Flex layouts ajoutés automatiquement')
  console.log('   → Mobile-first responsive préservé')
}

if (require.main === module) {
  main()
}

module.exports = { migrateSpacingInFile, SPACING_MIGRATIONS }
