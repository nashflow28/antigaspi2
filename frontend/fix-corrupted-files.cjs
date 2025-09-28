#!/usr/bin/env node

/**
 * 🔧 FIX CORRUPTED FILES SCRIPT
 *
 * Répare les fichiers corrompus par les scripts de migration
 * - Restaure les sauts de ligne appropriés
 * - Sépare les imports et interfaces
 * - Corrige la syntaxe JavaScript/TypeScript
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

let totalFiles = 0
let totalFixtures = 0
const fixReport = []

function fixCorruptedFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let fixedContent = content
    let fileFixtures = 0

    // 1. Séparer les imports qui ont été fusionnés
    const importFixtures = [
      // Import de modules séparés par des espaces
      { pattern: /import\s+([^'";]+)\s+from\s+['"]([^'"]+)['"]\s+import/g, replacement: "import $1 from '$2'\nimport" },

      // Interface déclarations fusionnées
      { pattern: /interface\s+(\w+)\s*\{([^}]+)\}\s*interface/g, replacement: 'interface $1 {\n$2\n}\n\ninterface' },

      // const/let/var déclarations fusionnées
      { pattern: /\}\s*(const|let|var)\s+/g, replacement: '}\n\n$1 ' },

      // Functions fusionnées
      { pattern: /\}\s*(function|async\s+function)/g, replacement: '}\n\n$1' },

      // Export statements fusionnés
      { pattern: /\}\s*(export\s+)/g, replacement: '}\n\n$1' },

      // Template et script séparés dans Vue
      { pattern: /<\/template>\s*<script/g, replacement: '</template>\n\n<script' },
      { pattern: /<\/script>\s*<style/g, replacement: '</script>\n\n<style' }
    ]

    importFixtures.forEach(({ pattern, replacement }) => {
      const matches = fixedContent.match(pattern)
      if (matches) {
        fixedContent = fixedContent.replace(pattern, replacement)
        fileFixtures += matches.length
        totalFixtures += matches.length
      }
    })

    // 2. Corrections TypeScript spécifiques
    const typescriptFixtures = [
      // Type annotations collées
      { pattern: /:\s*string\s+(\w+)/g, replacement: ': string\n$1' },
      { pattern: /:\s*number\s+(\w+)/g, replacement: ': number\n$1' },
      { pattern: /:\s*boolean\s+(\w+)/g, replacement: ': boolean\n$1' },
      { pattern: /:\s*any\s+(\w+)/g, replacement: ': any\n$1' },

      // Interface properties
      { pattern: /(\w+):\s*(\w+)\s+(\w+):/g, replacement: '$1: $2\n  $3:' }
    ]

    typescriptFixtures.forEach(({ pattern, replacement }) => {
      const matches = fixedContent.match(pattern)
      if (matches) {
        fixedContent = fixedContent.replace(pattern, replacement)
        fileFixtures += matches.length
        totalFixtures += matches.length
      }
    })

    // 3. Corrections Vue spécifiques
    if (filePath.endsWith('.vue')) {
      const vueFixtures = [
        // Template et script sections
        { pattern: /<template>\s*([^<]+)<\/template>\s*<script/g, replacement: '<template>\n$1\n</template>\n\n<script' },

        // Script setup content
        { pattern: /<script\s+setup\s+lang="ts">\s*([^<]+)/g, replacement: '<script setup lang="ts">\n$1' },

        // Imports dans script
        { pattern: /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s+import/g, replacement: "import { $1 } from '$2'\nimport" }
      ]

      vueFixtures.forEach(({ pattern, replacement }) => {
        const matches = fixedContent.match(pattern)
        if (matches) {
          fixedContent = fixedContent.replace(pattern, replacement)
          fileFixtures += matches.length
          totalFixtures += matches.length
        }
      })
    }

    // 4. Amélioration générale du formatage
    fixedContent = fixedContent
      // Espaces multiples vers espaces simples
      .replace(/[ \t]{2,}/g, ' ')
      // Lignes vides multiples vers ligne vide simple
      .replace(/\n{3,}/g, '\n\n')
      // Espaces en fin de ligne
      .replace(/[ \t]+$/gm, '')
      // Ajout de saut de ligne à la fin si manquant
      .replace(/([^\n])$/, '$1\n')

    if (fileFixtures > 0) {
      fs.writeFileSync(filePath, fixedContent)
      fixReport.push({
        file: filePath.replace(process.cwd(), '.'),
        fixtures: fileFixtures
      })
      totalFiles++
      console.log(`🔧 ${filePath.replace(process.cwd(), '.')} - ${fileFixtures} réparations`)
    }

  } catch (error) {
    console.error(`❌ Erreur lors de la réparation de ${filePath}:`, error.message)
  }
}

function main() {
  console.log('🔧 RÉPARATION DES FICHIERS CORROMPUS\n')

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
    files.forEach(fixCorruptedFile)
  })

  console.log('\n📊 RAPPORT DE RÉPARATION:')
  console.log(`✅ Fichiers réparés: ${totalFiles}`)
  console.log(`🔧 Total réparations: ${totalFixtures}`)

  if (fixReport.length > 0) {
    console.log('\n📁 DÉTAIL PAR FICHIER:')
    fixReport
      .sort((a, b) => b.fixtures - a.fixtures)
      .slice(0, 15)
      .forEach(({ file, fixtures }) => {
        console.log(`   ${file}: ${fixtures} réparations`)
      })
  }

  console.log('\n✅ RÉPARATION TERMINÉE !')
  console.log('   → Structure de fichiers restaurée')
  console.log('   → Syntaxe JavaScript/TypeScript corrigée')
  console.log('   → Formatage amélioré')
}

if (require.main === module) {
  main()
}

module.exports = { fixCorruptedFile }
