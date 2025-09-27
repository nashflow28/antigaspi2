#!/usr/bin/env node

/**
 * UI Component Migration Assistant - Phase 3
 * Automated tool to help migrate from legacy classes to 2025 design system
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const _unused_dirname = path.dirname(__filename)

console.log('🚀 UI Component Migration Assistant - Phase 3\n')

// Migration templates
const COMPONENT_MIGRATIONS = {
  'btn': {
    component: 'Button',
    import: "import Button from '@/components/ui/Button.vue'",
    template: (classes, content) => {
      const variants = {
        'btn-primary': 'primary',
        'btn-secondary': 'secondary',
        'btn-accent': 'promo',
        'btn-outline': 'outline',
        'btn-ghost': 'ghost'
      }

      const sizes = {
        'btn-sm': 'sm',
        'btn-lg': 'lg'
      }

      let variant = 'primary'
      let size = 'default'
      const extraClasses = []

      classes.forEach(cls => {
        if (variants[cls]) variant = variants[cls]
        else if (sizes[cls]) size = sizes[cls]
        else if (cls !== 'btn') extraClasses.push(cls)
      })

      const props = []
      if (variant !== 'primary') props.push(`variant="${variant}"`)
      if (size !== 'default') props.push(`size="${size}"`)
      if (extraClasses.length > 0) props.push(`class="${extraClasses.join(' ')}"`)

      return `<Button${props.length > 0 ? ' ' + props.join(' ') : ''}>${content}</Button>`
    }
  },

  'card': {
    component: 'Card',
    import: "import Card from '@/components/ui/Card.vue'",
    template: (classes, content) => {
      const variants = {
        'card-glass': 'glass',
        'card-gradient': 'gradient'
      }

      let variant = 'default'
      let interactive = false
      const extraClasses = []

      classes.forEach(cls => {
        if (variants[cls]) variant = variants[cls]
        else if (cls === 'card-interactive') interactive = true
        else if (cls !== 'card') extraClasses.push(cls)
      })

      const props = []
      if (variant !== 'default') props.push(`variant="${variant}"`)
      if (interactive) props.push('interactive')
      if (extraClasses.length > 0) props.push(`class="${extraClasses.join(' ')}"`)

      return `<Card${props.length > 0 ? ' ' + props.join(' ') : ''}>${content}</Card>`
    }
  },

  'form-input': {
    component: 'Input',
    import: "import Input from '@/components/ui/Input.vue'",
    template: (classes, attrs) => {
      const hasError = classes.includes('form-input-error')
      const extraClasses = classes.filter(cls =>
        !['form-input', 'form-input-error'].includes(cls)
      )

      const props = []
      if (hasError) props.push('error')
      if (extraClasses.length > 0) props.push(`class="${extraClasses.join(' ')}"`)

      // Transfer attributes
      Object.entries(attrs || {}).forEach(([key, value]) => {
        if (value === true) props.push(key)
        else props.push(`${key}="${value}"`)
      })

      return `<Input${props.length > 0 ? ' ' + props.join(' ') : ''} />`
    }
  }
}

// Class replacements that don't require component migration
const CLASS_REPLACEMENTS = {
  'glass-bg': 'bg-white/60 backdrop-blur-md border border-white/20',
  'container-fluid': 'container mx-auto px-4 sm:px-6 lg:px-8',
  'shadow-glow': 'shadow-lg shadow-primary-500/20',
  'gradient-primary': 'bg-gradient-to-r from-primary-600 to-primary-700',
  'form-group': 'space-y-2',
  'form-error': 'text-sm text-red-600 mt-1',
  'form-help': 'text-sm text-gray-500 mt-1'
}

/**
 * Create readline interface for user interaction
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer))
  })
}

/**
 * Parse Vue file to extract template, script, and style blocks
 */
function parseVueFile(content) {
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/)
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)

  return {
    template: templateMatch ? templateMatch[1] : '',
    script: scriptMatch ? scriptMatch[0] : '',
    style: styleMatch ? styleMatch[0] : '',
    full: content
  }
}

/**
 * Extract classes from HTML elements
 */
function extractClassesFromElement(element) {
  const classMatch = element.match(/class=['"](.*?)['"]/g)
  if (!classMatch) return []

  const classes = []
  classMatch.forEach(match => {
    const classStr = match.replace(/class=['"]/, '').replace(/['"]$/, '')
    classes.push(...classStr.split(/\s+/).filter(Boolean))
  })

  return [...new Set(classes)] // Remove duplicates
}

/**
 * Generate migration suggestions for a file
 */
function generateMigrationSuggestions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const parsed = parseVueFile(content)
  const suggestions = []
  const importsNeeded = new Set()

  // Find legacy patterns in template
  Object.keys(COMPONENT_MIGRATIONS).forEach(pattern => {
    const regex = new RegExp(`<([a-zA-Z][^>]*?)\\s+[^>]*class=['"][^'"]*\\b${pattern}\\b[^'"]*['"][^>]*>(.*?)<\/\\1>`, 'gs')
    let match

    while ((match = regex.exec(parsed.template)) !== null) {
      const [fullMatch, tag, content] = match
      const classes = extractClassesFromElement(fullMatch)
      const migration = COMPONENT_MIGRATIONS[pattern]

      if (classes.includes(pattern)) {
        suggestions.push({
          type: 'component',
          pattern,
          original: fullMatch,
          suggested: migration.template(classes, content),
          migration
        })

        importsNeeded.add(migration.import)
      }
    }
  })

  // Find class replacements
  Object.keys(CLASS_REPLACEMENTS).forEach(oldClass => {
    if (parsed.template.includes(oldClass)) {
      suggestions.push({
        type: 'class',
        pattern: oldClass,
        replacement: CLASS_REPLACEMENTS[oldClass],
        occurrences: (parsed.template.match(new RegExp(oldClass, 'g')) || []).length
      })
    }
  })

  return { suggestions, importsNeeded: Array.from(importsNeeded), parsed }
}

/**
 * Apply migration interactively
 */
async function applyMigration(filePath) {
  console.log(`\n📄 Analyzing: ${filePath}`)

  const { suggestions, importsNeeded, parsed } = generateMigrationSuggestions(filePath)

  if (suggestions.length === 0) {
    console.log('✅ No legacy patterns found in this file.')
    return false
  }

  console.log(`\n🔍 Found ${suggestions.length} migration opportunities:`)

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Process component migrations
  const componentSuggestions = suggestions.filter(s => s.type === 'component')
  if (componentSuggestions.length > 0) {
    console.log('\n🧩 Component migrations:')

    for (const suggestion of componentSuggestions) {
      console.log('\n❌ Original:')
      console.log(`   ${suggestion.original}`)
      console.log('\n✅ Suggested:')
      console.log(`   ${suggestion.suggested}`)

      const answer = await askQuestion('\nApply this migration? (y/n/a=all): ')

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'a') {
        content = content.replace(suggestion.original, suggestion.suggested)
        modified = true
        console.log('✅ Migration applied!')
      }

      if (answer.toLowerCase() === 'a') break
    }
  }

  // Process class replacements
  const classSuggestions = suggestions.filter(s => s.type === 'class')
  if (classSuggestions.length > 0) {
    console.log('\n🎨 Class replacements:')

    for (const suggestion of classSuggestions) {
      console.log(`\n🔄 Replace "${suggestion.pattern}" with "${suggestion.replacement}"`)
      console.log(`   Found ${suggestion.occurrences} occurrence(s)`)

      const answer = await askQuestion('Apply this replacement? (y/n/a=all): ')

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'a') {
        content = content.replace(new RegExp(suggestion.pattern, 'g'), suggestion.replacement)
        modified = true
        console.log('✅ Replacement applied!')
      }

      if (answer.toLowerCase() === 'a') break
    }
  }

  // Add necessary imports
  if (modified && importsNeeded.length > 0) {
    console.log('\n📦 Adding required imports:')
    importsNeeded.forEach(importLine => console.log(`   ${importLine}`))

    const addImports = await askQuestion('Add these imports? (y/n): ')
    if (addImports.toLowerCase() === 'y') {
      // Simple import injection (before existing imports)
      const scriptMatch = content.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/)
      if (scriptMatch) {
        const [, scriptOpen, scriptContent, scriptClose] = scriptMatch
        const newImports = importsNeeded.join('\n') + '\n'
        const newScriptContent = newImports + scriptContent
        content = content.replace(scriptMatch[0], scriptOpen + newScriptContent + scriptClose)
      }
    }
  }

  // Save changes
  if (modified) {
    const backup = filePath + '.backup-' + Date.now()
    fs.writeFileSync(backup, fs.readFileSync(filePath, 'utf8'))
    fs.writeFileSync(filePath, content)

    console.log(`\n💾 File updated! Backup saved as: ${path.basename(backup)}`)
    return true
  }

  return false
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: node migrate-ui-component.js <file-path>')
    console.log('       node migrate-ui-component.js --interactive')
    process.exit(1)
  }

  if (args[0] === '--interactive') {
    console.log('🎯 Interactive migration mode')

    const filePath = await askQuestion('Enter file path to migrate: ')

    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found!')
      process.exit(1)
    }

    await applyMigration(filePath)
  } else {
    const filePath = args[0]

    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found!')
      process.exit(1)
    }

    const success = await applyMigration(filePath)

    if (!success) {
      console.log('ℹ️  No changes made.')
    }
  }

  rl.close()
  console.log('\n🎉 Migration assistant completed!')
}

// Graceful exit
process.on('SIGINT', () => {
  console.log('\n👋 Migration cancelled by user.')
  rl.close()
  process.exit(0)
})

main().catch(console.error)
