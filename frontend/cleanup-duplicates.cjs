#!/usr/bin/env node

/**
 * 🧹 CLEANUP SCRIPT - Correction des doublons créés par les migrations
 *
 * Nettoie les classes dupliquées et optimise le code généré
 * - Supprime les répétitions de classes responsive
 * - Optimise les patterns de spacing
 * - Corrige les inconsistances de break-points
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

let totalFiles = 0
let totalReplacements = 0
const cleanupReport = []

function cleanupDuplicatesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let updatedContent = content
    let fileReplacements = 0

    // 1. Nettoyer les doublons de padding/margin responsive
    const duplicateCleanups = [
      // px-* doublons
      { pattern: /px-4\s+sm:px-6\s+lg:px-8-2025\s+sm:px-4\s+sm:px-6\s+lg:px-4\s+sm:px-6\s+lg:px-8-2025-2025[^"]*lg:px-4\s+sm:px-6\s+lg:px-8-2025-2025[^"]*/g, replacement: 'px-4 sm:px-6 lg:px-8-2025' },
      { pattern: /px-4\s+sm:px-4\s+sm:px-6\s+lg:px-4\s+sm:px-6\s+lg:px-8-2025-2025[^"]*lg:px-4\s+sm:px-6\s+lg:px-8-2025-2025[^"]*/g, replacement: 'px-4 sm:px-6 lg:px-8-2025' },
      { pattern: /lg:px-8-2025-2025/g, replacement: 'lg:px-8-2025' },

      // py-* doublons
      { pattern: /py-16\s+sm:py-18\s+lg:py-20\s+sm:py-28\s+lg:py-24\s+sm:py-28\s+lg:py-32[^"]*sm:py-28[^"]*lg:py-24[^"]*sm:py-28[^"]*lg:py-32[^"]*/g, replacement: 'py-24 sm:py-28 lg:py-32' },
      { pattern: /py-16\s+sm:py-18\s+lg:py-16\s+sm:py-18\s+lg:py-20[^"]*sm:py-18[^"]*lg:py-16[^"]*sm:py-18[^"]*lg:py-20/g, replacement: 'py-16 sm:py-18 lg:py-20' },

      // mb-* doublons
      { pattern: /mb-16\s+sm:mb-18\s+lg:mb-16\s+sm:mb-18\s+lg:mb-20[^"]*sm:mb-18[^"]*lg:mb-16[^"]*sm:mb-18[^"]*lg:mb-20/g, replacement: 'mb-16 sm:mb-18 lg:mb-20' },
      { pattern: /mt-16\s+sm:mt-18\s+lg:mt-16\s+sm:mt-18\s+lg:mt-20/g, replacement: 'mt-16 sm:mt-18 lg:mt-20' },

      // gap doublons
      { pattern: /gap-6\s+sm:gap-4\s+sm:gap-2/g, replacement: 'gap-2 sm:gap-4 md:gap-6' },
      { pattern: /gap-6\s+sm:gap-4\s+sm:gap-6/g, replacement: 'gap-4 sm:gap-6' },

      // text-* doublons
      { pattern: /text-left\s+sm:text-center\s+sm:text-center\s+sm:text-center/g, replacement: 'text-left sm:text-center' },
      { pattern: /sm:text-center\s+sm:text-center/g, replacement: 'sm:text-center' },

      // max-w doublons
      { pattern: /max-w-full\s+sm:max-w-full\s+sm:max-w-(\w+)/g, replacement: 'max-w-full sm:max-w-$1' },

      // grid doublons
      { pattern: /grid-cols-1\s+md:grid-cols-1\s+md:grid-cols-(\d+)/g, replacement: 'grid-cols-1 md:grid-cols-$1' },

      // flex doublons
      { pattern: /gap-6\s+sm:gap-4\s+flex\s+flex-col\s+sm:space-y-0\s+sm:gap-6\s+sm:gap-4\s+flex/g, replacement: 'gap-4 flex flex-col sm:gap-6' },

      // Nettoyage général des répétitions
      { pattern: /(\b\w+(?:-\w+)*\b)(\s+\1)+/g, replacement: '$1' }
    ]

    duplicateCleanups.forEach(({ pattern, replacement }) => {
      const matches = updatedContent.match(pattern)
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    // 2. Optimisations sémantiques
    const semanticOptimizations = [
      // Simplifier les patterns répétitifs
      { pattern: /class="([^"]*\s)?px-4\s+sm:px-6\s+lg:px-8-2025(\s[^"]*)?"/g, replacement: 'class="$1px-4 sm:px-6 lg:px-8-2025$2"' },
      { pattern: /class="([^"]*\s)?py-24\s+sm:py-28\s+lg:py-32(\s[^"]*)?"/g, replacement: 'class="$1py-24 sm:py-28 lg:py-32$2"' },
      { pattern: /class="([^"]*\s)?py-16\s+sm:py-18\s+lg:py-20(\s[^"]*)?"/g, replacement: 'class="$1py-16 sm:py-18 lg:py-20$2"' },

      // Corriger les flex patterns
      { pattern: /flex\s+flex-col\s+sm:flex-col\s+sm:flex-row/g, replacement: 'flex flex-col sm:flex-row' },
      { pattern: /gap-\d+\s+flex\s+flex-col\s+sm:space-y-0\s+sm:gap-\d+\s+flex/g, replacement: (match) => {
        const gapMatch = match.match(/gap-(\d+)/)
        const smGapMatch = match.match(/sm:gap-(\d+)/)
        return `gap-${gapMatch ? gapMatch[1] : '4'} flex flex-col sm:gap-${smGapMatch ? smGapMatch[1] : '6'}`
      } }
    ]

    semanticOptimizations.forEach(({ pattern, replacement }) => {
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

    // 3. Nettoyage final des espaces multiples
    updatedContent = updatedContent
      .replace(/\s{2,}/g, ' ')
      .replace(/class="\s+/g, 'class="')
      .replace(/\s+"/g, '"')

    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, updatedContent)
      cleanupReport.push({
        file: filePath.replace(process.cwd(), '.'),
        replacements: fileReplacements
      })
      totalFiles++
      console.log(`🧹 ${filePath.replace(process.cwd(), '.')} - ${fileReplacements} nettoyages`)
    }

  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message)
  }
}

function main() {
  console.log('🧹 NETTOYAGE DES DOUBLONS MIGRATION 2025\n')

  const srcPath = path.join(process.cwd(), 'frontend/src')

  if (!fs.existsSync(srcPath)) {
    console.error('❌ Dossier frontend/src non trouvé')
    process.exit(1)
  }

  const patterns = [
    'frontend/src/**/*.vue',
    'frontend/src/**/*.js',
    'frontend/src/**/*.ts'
  ]

  patterns.forEach(pattern => {
    const files = glob.sync(pattern)
    files.forEach(cleanupDuplicatesInFile)
  })

  console.log('\n📊 RAPPORT DE NETTOYAGE:')
  console.log(`✅ Fichiers nettoyés: ${totalFiles}`)
  console.log(`🔄 Total corrections: ${totalReplacements}`)

  if (cleanupReport.length > 0) {
    console.log('\n📁 DÉTAIL PAR FICHIER:')
    cleanupReport
      .sort((a, b) => b.replacements - a.replacements)
      .slice(0, 15)
      .forEach(({ file, replacements }) => {
        console.log(`   ${file}: ${replacements} corrections`)
      })
  }

  console.log('\n✨ NETTOYAGE TERMINÉ !')
  console.log('   → Doublons supprimés')
  console.log('   → Classes optimisées')
  console.log('   → Code propre et lisible')
}

if (require.main === module) {
  main()
}

module.exports = { cleanupDuplicatesInFile }
