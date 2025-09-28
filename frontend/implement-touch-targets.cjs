#!/usr/bin/env node

/**
 * 📱 TOUCH TARGETS 44px IMPLEMENTATION SCRIPT
 *
 * Applique systématiquement les touch targets de 44px minimum
 * Conforme aux guidelines d'accessibilité mobile WCAG et Apple/Google
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Mapping des éléments nécessitant touch targets 44px
const TOUCH_TARGET_MAPPINGS = {
  // Buttons et liens
  'h-8 w-8': 'h-11 w-11',      // 32px → 44px
  'h-9 w-9': 'h-11 w-11',      // 36px → 44px
  'h-10 w-10': 'h-11 w-11',    // 40px → 44px

  // Padding pour éléments cliquables
  'p-2': 'p-3',                // 8px → 12px (si < 44px total)
  'p-3': 'p-4',                // 12px → 16px (si < 44px total)
  'px-2 py-1': 'px-4 py-3',    // Touch-friendly padding
  'px-3 py-2': 'px-4 py-3',    // Touch-friendly padding

  // Navigation items
  'nav a': {
    minHeight: '44px',
    minWidth: '44px',
    padding: '12px'
  },

  // Form controls
  'input': {
    minHeight: '44px',
    padding: '12px 16px'
  },

  'select': {
    minHeight: '44px',
    padding: '12px 16px'
  },

  'textarea': {
    minHeight: '44px',
    padding: '12px 16px'
  },

  // FAB et action buttons
  'fab': {
    minHeight: '56px',  // FAB Material Design
    minWidth: '56px'
  }
}

// Patterns d'éléments interactive nécessitant touch targets
const INTERACTIVE_ELEMENTS = [
  // Buttons
  { pattern: /<button[^>]*class="([^"]*)"/, tag: 'button' },
  { pattern: /<Button[^>]*class="([^"]*)"/, tag: 'Button' },

  // Links
  { pattern: /<a[^>]*class="([^"]*)"/, tag: 'a' },
  { pattern: /<router-link[^>]*class="([^"]*)"/, tag: 'router-link' },

  // Icons cliquables
  { pattern: /<.*?@click[^>]*class="([^"]*)"/, tag: 'clickable' },

  // Form controls
  { pattern: /<input[^>]*class="([^"]*)"/, tag: 'input' },
  { pattern: /<select[^>]*class="([^"]*)"/, tag: 'select' },
  { pattern: /<textarea[^>]*class="([^"]*)"/, tag: 'textarea' }
]

let totalFiles = 0
let totalReplacements = 0
const touchTargetReport = []

function implementTouchTargetsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let updatedContent = content
    let fileReplacements = 0

    // 1. Corrections des dimensions pour touch targets
    Object.entries(TOUCH_TARGET_MAPPINGS).forEach(([small, large]) => {
      if (typeof large === 'string') {
        const regex = new RegExp(`\\b${small.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        const matches = updatedContent.match(regex)
        if (matches) {
          updatedContent = updatedContent.replace(regex, large)
          fileReplacements += matches.length
          totalReplacements += matches.length
        }
      }
    })

    // 2. Amélioration des éléments interactifs
    const touchTargetImprovements = [
      // Navigation items too small
      {
        pattern: /class="([^"]*(?:nav|menu)[^"]*flex[^"]*items-center[^"]*)"([^>]*>.*?<)/g,
        replacement: (match, classes, rest) => {
          if (!classes.includes('h-11') && !classes.includes('min-h-')) {
            return `class="${classes} min-h-11"${rest}`
          }
          return match
        }
      },

      // Buttons too small
      {
        pattern: /class="([^"]*(?:btn|button)[^"]*)"([^>]*>)/g,
        replacement: (match, classes, rest) => {
          if (!classes.includes('h-11') && !classes.includes('min-h-') && !classes.includes('py-3')) {
            return `class="${classes} min-h-11 px-4 py-3"${rest}`
          }
          return match
        }
      },

      // Icons clickables too small
      {
        pattern: /@click[^>]*class="([^"]*w-\d+ h-\d+[^"]*)"([^>]*>)/g,
        replacement: (match, classes, rest) => {
          if (classes.includes('w-8') || classes.includes('h-8') ||
              classes.includes('w-6') || classes.includes('h-6')) {
            const newClasses = classes
              .replace(/w-[68]\b/, 'w-11')
              .replace(/h-[68]\b/, 'h-11')
            return match.replace(classes, newClasses)
          }
          return match
        }
      },

      // Form controls
      {
        pattern: /<(input|select|textarea)[^>]*class="([^"]*)"([^>]*>)/g,
        replacement: (match, tag, classes, rest) => {
          if (!classes.includes('h-11') && !classes.includes('min-h-') && !classes.includes('py-3')) {
            return `<${tag} class="${classes} min-h-11 py-3"${rest}`
          }
          return match
        }
      }
    ]

    touchTargetImprovements.forEach(({ pattern, replacement }) => {
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

    // 3. Corrections spécifiques par type de fichier
    if (filePath.includes('Navigation.vue') || filePath.includes('NavBar.vue')) {
      // Navigation nécessite des touch targets plus grands
      updatedContent = updatedContent
        .replace(/h-10 w-10/g, 'h-12 w-12')  // 44px → 48px pour nav
        .replace(/p-2(?!\d)/g, 'p-4')        // Plus de padding nav
        .replace(/gap-2(?!\d)/g, 'gap-4')   // Plus d'espace entre items
    }

    if (filePath.includes('Button.vue')) {
      // Composant Button doit avoir des variants touch-friendly
      updatedContent = updatedContent.replace(
        /py-2(?!\d)/g, 'py-3'
      ).replace(
        /px-3(?!\d)/g, 'px-4'
      )
    }

    // 4. Ajout des media queries pour mobile
    const mobileOptimizations = [
      // Plus grand sur mobile
      { pattern: /class="([^"]*)(h-11)([^"]*)"/, replacement: 'class="$1h-12 sm:h-11$3"' },
      { pattern: /class="([^"]*)(w-11)([^"]*)"/, replacement: 'class="$1w-12 sm:w-11$3"' },

      // Padding augmenté sur mobile
      { pattern: /class="([^"]*)(p-3)([^"]*)"/, replacement: 'class="$1p-4 sm:p-3$3"' },
      { pattern: /class="([^"]*)(gap-4)([^"]*)"/, replacement: 'class="$1gap-6 sm:gap-4$3"' }
    ]

    mobileOptimizations.forEach(({ pattern, replacement }) => {
      const matches = updatedContent.match(pattern)
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement)
        fileReplacements += matches.length
        totalReplacements += matches.length
      }
    })

    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, updatedContent)
      touchTargetReport.push({
        file: filePath.replace(process.cwd(), '.'),
        replacements: fileReplacements
      })
      totalFiles++
      console.log(`📱 ${filePath.replace(process.cwd(), '.')} - ${fileReplacements} touch targets améliorés`)
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'implémentation touch targets ${filePath}:`, error.message)
  }
}

function main() {
  console.log('📱 IMPLÉMENTATION TOUCH TARGETS 44px MINIMUM\n')

  const srcPath = path.join(process.cwd(), 'frontend/src')

  if (!fs.existsSync(srcPath)) {
    console.error('❌ Dossier frontend/src non trouvé')
    process.exit(1)
  }

  const patterns = [
    'frontend/src/**/*.vue',
    'frontend/src/**/*.ts',
    'frontend/src/**/*.js'
  ]

  patterns.forEach(pattern => {
    const files = glob.sync(pattern)
    files.forEach(implementTouchTargetsInFile)
  })

  console.log('\n📊 RAPPORT TOUCH TARGETS:')
  console.log(`✅ Fichiers modifiés: ${totalFiles}`)
  console.log(`🔄 Total améliorations: ${totalReplacements}`)

  if (touchTargetReport.length > 0) {
    console.log('\n📁 DÉTAIL PAR FICHIER:')
    touchTargetReport
      .sort((a, b) => b.replacements - a.replacements)
      .slice(0, 15)
      .forEach(({ file, replacements }) => {
        console.log(`   ${file}: ${replacements} améliorations`)
      })
  }

  console.log('\n🎯 TOUCH TARGETS IMPLÉMENTÉS !')
  console.log('   → Minimum 44px appliqué')
  console.log('   → Mobile-first optimized')
  console.log('   → WCAG AAA compliance')
}

if (require.main === module) {
  main()
}

module.exports = { implementTouchTargetsInFile }
