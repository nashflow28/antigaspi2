#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🎨 PHASE 2 MOBILE - MIGRATION TYPOGRAPHY SÉMANTIQUE')
console.log('════════════════════════════════════════════════════')

// Typography semantic mappings
const typographyMappings = {
  // Primary text mappings
  'text-neutral-900': 'text-heading',
  'text-neutral-800': 'text-heading-secondary',
  'text-neutral-700': 'text-body-emphasis',
  'text-neutral-600': 'text-body',
  'text-neutral-500': 'text-muted',
  'text-neutral-400': 'text-placeholder',

  // Contextual mappings
  'text-primary-600': 'text-primary',
  'text-primary-700': 'text-primary-emphasis',
  'text-red-600': 'text-error',
  'text-green-600': 'text-success',
  'text-blue-600': 'text-info',
  'text-yellow-600': 'text-warning'
}

let totalReplacements = 0
let filesModified = 0

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let fileModified = false
    let fileReplacements = 0

    for (const [oldClass, newClass] of Object.entries(typographyMappings)) {
      const regex = new RegExp(`\\b${oldClass}\\b`, 'g')
      const matches = content.match(regex)

      if (matches) {
        content = content.replace(regex, newClass)
        fileReplacements += matches.length
        fileModified = true
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${path.basename(filePath)}: ${fileReplacements} remplacements`)
      totalReplacements += fileReplacements
      filesModified++
    }

  } catch (error) {
    console.error(`❌ Erreur ${filePath}:`, error.message)
  }
}

function findVueFiles(dir) {
  const files = []

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath)
      } else if (item.endsWith('.vue') || item.endsWith('.ts')) {
        files.push(fullPath)
      }
    }
  }

  scanDir(dir)
  return files
}

// Main execution
console.log('📁 Recherche des fichiers Vue/TS...')
const srcDir = path.join(process.cwd(), 'src')
const files = findVueFiles(srcDir)
console.log(`📊 ${files.length} fichiers trouvés`)

console.log('\n🔄 Migration en cours...')
files.forEach(migrateFile)

console.log('\n📊 RÉSULTATS PHASE 2 MOBILE:')
console.log(`├── Fichiers modifiés: ${filesModified}`)
console.log(`├── Remplacements totaux: ${totalReplacements}`)
console.log(`└── Typography sémantique: ${Object.keys(typographyMappings).length} mappings`)

// Git commit
try {
  execSync('git add src/', { stdio: 'pipe' })
  execSync(`git commit -m "feat(mobile): Phase 2 migration typography sémantique - ${totalReplacements} classes

🎨 TYPOGRAPHY SÉMANTIQUE PHASE 2:
- ${totalReplacements} remplacements automatisés
- ${filesModified} fichiers mis à jour
- ${Object.keys(typographyMappings).length} mappings sémantiques appliqués

📱 MOBILE IMPROVEMENTS:
- text-neutral-* → text-heading/body/muted
- text-primary-* → text-primary/emphasis
- text-contextual → text-error/success/info/warning

🚀 PHASE 2 PROGRESS: Typography semantic tokens implemented

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'pipe' })

  console.log('✅ Commit git créé')
} catch (error) {
  console.log('⚠️ Git commit échoué:', error.message)
}

console.log('\n🎯 PRÊT POUR: Phase 2 - spacing migration')
