#!/usr/bin/env node

/**
 * 📊 LEGACY COUNT SCRIPT - Compte usages legacy restants
 */

const { execSync } = require('child_process')
const path = require('path')

function countLegacyUsages() {
  console.log('📊 DÉCOMPTE LEGACY USAGES RESTANTS\n')

  const srcPath = path.join(process.cwd(), 'frontend/src')

  // Patterns legacy à compter
  const legacyPatterns = [
    { name: 'Spacing legacy', pattern: 'space-[xy]-\\d+' },
    { name: 'Text size legacy', pattern: 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)' },
    { name: 'Colors legacy', pattern: 'text-neutral-[0-9]' },
    { name: 'Padding legacy', pattern: 'p[xytblr]?-\\d+(?!\\s+(sm:|md:|lg:))' },
    { name: 'Margin legacy', pattern: 'm[xytblr]?-\\d+(?!\\s+(sm:|md:|lg:))' },
    { name: 'Max-width legacy', pattern: 'max-w-\\w+(?!\\s+(sm:|md:|lg:))' },
    { name: 'Grid legacy', pattern: 'grid-cols-\\d+(?!\\s+(sm:|md:|lg:))' }
  ]

  let totalLegacy = 0

  legacyPatterns.forEach(({ name, pattern }) => {
    try {
      const result = execSync(
        `cd "${srcPath}" && grep -r "${pattern}" . --include="*.vue" --include="*.ts" --include="*.js" | wc -l`,
        { encoding: 'utf8', shell: true }
      )

      const count = parseInt(result.trim())
      totalLegacy += count
      console.log(`${name}: ${count} usages`)
    } catch (error) {
      console.log(`${name}: 0 usages`)
    }
  })

  console.log(`\n🎯 TOTAL LEGACY: ${totalLegacy} usages`)

  return totalLegacy
}

if (require.main === module) {
  countLegacyUsages()
}

module.exports = { countLegacyUsages }
