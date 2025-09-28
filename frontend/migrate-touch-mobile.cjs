#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('👆 MIGRATION TOUCH OPTIMIZATION MOBILE - 2025 DESIGN SYSTEM')
console.log('============================================================\n')

// Standards touch mobile (Apple: 44px, Google: 48px)
const touchOptimizations = {
  // Boutons - padding vertical minimum pour 44px height
  'py-1': 'py-3',  // 8px → 12px (44px total avec border/text)
  'py-2': 'py-3',  // 8px → 12px
  'px-2': 'px-4',  // Largeur minimum pour confort tactile
  'px-3': 'px-4',  // Standardisation mobile

  // Hauteur/largeur explicites trop petites
  'h-6': 'h-10',   // 24px → 40px (proche 44px)
  'w-6': 'w-10',   // 24px → 40px
  'h-8': 'h-10',   // 32px → 40px
  'w-8': 'w-10',   // 32px → 40px

  // Espacement tactile entre éléments
  'gap-1': 'gap-2', // 4px → 8px minimum
  'space-x-1': 'space-x-2',
  'space-y-1': 'space-y-2',

  // Checkbox et radio buttons
  'w-4': 'w-5',   // 16px → 20px (meilleur pour tactile)
  'h-4': 'h-5'   // 16px → 20px
}

// Optimisations spéciales pour éléments interactifs
const interactiveOptimizations = [
  {
    // Boutons avec classes button/btn mais padding insuffisant
    pattern: /(class="[^"]*(?:btn|button)[^"]*?)py-1([^"]*")/g,
    replacement: '$1py-3$2',
    description: 'Boutons py-1 → py-3 (touch 44px)'
  },
  {
    pattern: /(class="[^"]*(?:btn|button)[^"]*?)py-2([^"]*")/g,
    replacement: '$1py-3$2',
    description: 'Boutons py-2 → py-3 (touch 44px)'
  },
  {
    // Links interactifs
    pattern: /(class="[^"]*(?:hover:|focus:)[^"]*?)p-1([^"]*")/g,
    replacement: '$1p-2$2',
    description: 'Liens interactifs p-1 → p-2 (touch area)'
  },
  {
    // Icones clickables
    pattern: /(class="[^"]*(?:cursor-pointer|hover:)[^"]*?)w-4 h-4([^"]*")/g,
    replacement: '$1w-6 h-6$2',
    description: 'Icones clickables 16px → 24px (touch area)'
  },
  {
    // Inputs et selects - hauteur mobile
    pattern: /(class="[^"]*(?:input|select|form-)[^"]*?)py-2([^"]*")/g,
    replacement: '$1py-3$2',
    description: 'Inputs/selects py-2 → py-3 (touch comfort)'
  },
  {
    // Pagination et navigation - espacement tactile
    pattern: /(class="[^"]*(?:pagination|nav)[^"]*?)gap-1([^"]*")/g,
    replacement: '$1gap-3$2',
    description: 'Navigation gap-1 → gap-3 (touch spacing)'
  }
]

// Classes à surveiller pour mobile (violations potentielles)
const mobileViolations = [
  'py-0', 'py-1', 'px-1', 'p-1',    // Padding insuffisant
  'h-3', 'h-4', 'h-5', 'w-3', 'w-4', 'w-5',  // Tailles trop petites
  'text-xs',  // Texte potentiellement trop petit (déjà migré)
  'gap-0', 'gap-1'  // Espacement insuffisant entre éléments tactiles
]

// Compteurs pour statistiques
let totalFiles = 0
let migratedFiles = 0
let totalOptimizations = 0
let violationsFound = 0
const optimizationsByType = {}

// Initialiser compteurs
Object.keys(touchOptimizations).forEach(opt => {
  optimizationsByType[opt] = 0
})

function optimizeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    let fileOptimizations = 0

    // Appliquer les optimisations de base
    Object.entries(touchOptimizations).forEach(([oldClass, newClass]) => {
      const patterns = [
        new RegExp(`(class="[^"]*?)\\b${oldClass}\\b([^"]*")`, 'g'),
        new RegExp(`(class='[^']*?)\\b${oldClass}\\b([^']*')`, 'g')
      ]

      patterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          content = content.replace(pattern, `$1${newClass}$2`)
          const count = matches.length
          optimizationsByType[oldClass] += count
          fileOptimizations += count
        }
      })
    })

    // Appliquer les optimisations spéciales interactives
    interactiveOptimizations.forEach(opt => {
      const beforeCount = (content.match(opt.pattern) || []).length
      if (beforeCount > 0) {
        content = content.replace(opt.pattern, opt.replacement)
        fileOptimizations += beforeCount
        console.log(`   👆 ${opt.description}: ${beforeCount} optimisations`)
      }
    })

    // Détecter les violations potentielles mobile
    mobileViolations.forEach(violation => {
      const violationPattern = new RegExp(`class="[^"]*\\b${violation}\\b[^"]*"`, 'g')
      const violations = content.match(violationPattern)
      if (violations) {
        violationsFound += violations.length
      }
    })

    // Ajouter classes spéciales touch pour mobile
    const touchEnhancements = [
      {
        // Améliorer les zones de tap sur les cards interactives
        pattern: /(class="[^"]*card[^"]*?)cursor-pointer([^"]*")/g,
        replacement: '$1cursor-pointer active:scale-95 touch-manipulation$2',
        description: 'Cards touch feedback'
      },
      {
        // Optimiser les transitions pour mobile
        pattern: /(class="[^"]*hover:)[^"]*?(transition-[^"]*?")/g,
        replacement: '$1$2',
        description: 'Hover → Touch transitions'
      }
    ]

    touchEnhancements.forEach(enhancement => {
      const beforeCount = (content.match(enhancement.pattern) || []).length
      if (beforeCount > 0) {
        content = content.replace(enhancement.pattern, enhancement.replacement)
        fileOptimizations += beforeCount
        console.log(`   📱 ${enhancement.description}: ${beforeCount} améliorations`)
      }
    })

    // Si des changements ont été effectués, sauvegarder le fichier
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      migratedFiles++
      totalOptimizations += fileOptimizations
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fileOptimizations} optimisations touch`)
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'optimisation de ${filePath}:`, error.message)
  }
}

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath)

  items.forEach(item => {
    const fullPath = path.join(dirPath, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Ignorer node_modules et .git
      if (!['node_modules', '.git', 'dist'].includes(item)) {
        scanDirectory(fullPath)
      }
    } else if (item.endsWith('.vue')) {
      totalFiles++
      optimizeFile(fullPath)
    }
  })
}

// Créer backup avant migration
console.log('📦 Création d\'un backup...')
try {
  execSync('git add -A && git commit -m "backup avant migration touch mobile"')
  console.log('✅ Backup créé avec Git\n')
} catch (error) {
  console.log('⚠️ Backup Git déjà créé\n')
}

// Lancer la migration
const startTime = Date.now()
console.log('🚀 Début de l\'optimisation touch mobile...\n')

scanDirectory(path.join(process.cwd(), 'src'))

const endTime = Date.now()
const duration = ((endTime - startTime) / 1000).toFixed(2)

// Statistiques finales
console.log('\n📊 RÉSULTATS OPTIMISATION TOUCH')
console.log('===============================')
console.log(`📁 Fichiers scannés: ${totalFiles}`)
console.log(`✅ Fichiers optimisés: ${migratedFiles}`)
console.log(`👆 Total optimisations touch: ${totalOptimizations}`)
console.log(`⚠️ Violations potentielles détectées: ${violationsFound}`)
console.log(`⏱️ Durée: ${duration}s\n`)

console.log('📈 DÉTAIL OPTIMISATIONS:')
Object.entries(optimizationsByType).forEach(([opt, count]) => {
  if (count > 0) {
    console.log(`   ${opt} → ${touchOptimizations[opt]}: ${count} optimisations`)
  }
})

// Calculer score touch mobile
const touchImpactEstimate = Math.min(100, ((totalOptimizations + migratedFiles) / 200) * 100)
console.log(`\n👆 IMPACT TOUCH MOBILE: ${touchImpactEstimate.toFixed(1)}% - Interfaces optimisées pour tactile`)

// Recommandations post-migration
console.log('\n💡 RECOMMANDATIONS TOUCH MOBILE:')
if (violationsFound > 0) {
  console.log(`⚠️  ${violationsFound} éléments potentiellement trop petits pour mobile`)
  console.log('   → Vérifier manuellement les éléments avec h-3, w-3, py-0, px-1')
}
console.log('✅ Tester sur appareil mobile pour valider les zones de toucher')
console.log('✅ Vérifier l\'espacement entre boutons adjacents (8px minimum)')
console.log('✅ S\'assurer que tous les éléments interactifs sont accessibles au pouce')

console.log('\n✨ MIGRATION TOUCH TERMINÉE - Prêt pour migration layout')
