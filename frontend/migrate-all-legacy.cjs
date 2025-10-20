const fs = require('fs')
const path = require('path')

const MIGRATION_MAP = {
  'p-1': 'p-xs', 'p-2': 'p-sm', 'p-3': 'p-md', 'p-4': 'p-lg', 'p-5': 'p-xl', 'p-6': 'p-2xl', 'p-8': 'p-3xl',
  'px-1': 'px-xs', 'px-2': 'px-sm', 'px-3': 'px-md', 'px-4': 'px-lg', 'px-5': 'px-xl', 'px-6': 'px-2xl', 'px-8': 'px-3xl',
  'py-1': 'py-xs', 'py-2': 'py-sm', 'py-3': 'py-md', 'py-4': 'py-lg', 'py-5': 'py-xl', 'py-6': 'py-2xl', 'py-8': 'py-3xl',
  'pt-1': 'pt-xs', 'pt-2': 'pt-sm', 'pt-3': 'pt-md', 'pt-4': 'pt-lg', 'pt-6': 'pt-2xl', 'pt-8': 'pt-3xl',
  'pb-1': 'pb-xs', 'pb-2': 'pb-sm', 'pb-3': 'pb-md', 'pb-4': 'pb-lg', 'pb-6': 'pb-2xl', 'pb-8': 'pb-3xl',
  'pl-1': 'pl-xs', 'pl-2': 'pl-sm', 'pl-3': 'pl-md', 'pl-4': 'pl-lg', 'pl-6': 'pl-2xl',
  'pr-1': 'pr-xs', 'pr-2': 'pr-sm', 'pr-3': 'pr-md', 'pr-4': 'pr-lg', 'pr-6': 'pr-2xl',
  'm-1': 'm-xs', 'm-2': 'm-sm', 'm-3': 'm-md', 'm-4': 'm-lg', 'm-6': 'm-2xl', 'm-8': 'm-3xl',
  'mx-1': 'mx-xs', 'mx-2': 'mx-sm', 'mx-3': 'mx-md', 'mx-4': 'mx-lg', 'mx-6': 'mx-2xl',
  'my-1': 'my-xs', 'my-2': 'my-sm', 'my-3': 'my-md', 'my-4': 'my-lg', 'my-6': 'my-2xl', 'my-8': 'my-3xl',
  'mt-1': 'mt-xs', 'mt-2': 'mt-sm', 'mt-3': 'mt-md', 'mt-4': 'mt-lg', 'mt-6': 'mt-2xl', 'mt-8': 'mt-3xl',
  'mb-1': 'mb-xs', 'mb-2': 'mb-sm', 'mb-3': 'mb-md', 'mb-4': 'mb-lg', 'mb-6': 'mb-2xl', 'mb-8': 'mb-3xl',
  'ml-1': 'ml-xs', 'ml-2': 'ml-sm', 'ml-3': 'ml-md', 'ml-4': 'ml-lg', 'ml-6': 'ml-2xl',
  'mr-1': 'mr-xs', 'mr-2': 'mr-sm', 'mr-3': 'mr-md', 'mr-4': 'mr-lg', 'mr-6': 'mr-2xl',
  'gap-1': 'gap-xs', 'gap-2': 'gap-sm', 'gap-3': 'gap-md', 'gap-4': 'gap-lg', 'gap-6': 'gap-2xl', 'gap-8': 'gap-3xl',
  'space-x-1': 'space-x-xs', 'space-x-2': 'space-x-sm', 'space-x-3': 'space-x-md', 'space-x-4': 'space-x-lg', 'space-x-6': 'space-x-2xl',
  'space-y-1': 'space-y-xs', 'space-y-2': 'space-y-sm', 'space-y-3': 'space-y-md', 'space-y-4': 'space-y-lg', 'space-y-6': 'space-y-2xl',
  'w-4': 'w-sm', 'w-5': 'w-md', 'w-6': 'w-lg', 'w-8': 'w-xl', 'w-10': 'w-2xl', 'w-12': 'w-3xl', 'w-16': 'w-4xl', 'w-20': 'w-5xl', 'w-24': 'w-6xl', 'w-32': 'w-7xl', 'w-48': 'w-8xl', 'w-64': 'w-9xl',
  'h-4': 'h-sm', 'h-5': 'h-md', 'h-6': 'h-lg', 'h-8': 'h-xl', 'h-10': 'h-2xl', 'h-12': 'h-3xl', 'h-16': 'h-4xl', 'h-20': 'h-5xl', 'h-24': 'h-6xl', 'h-32': 'h-7xl', 'h-48': 'h-8xl', 'h-64': 'h-9xl',
  'bg-gray-50': 'bg-surface-50', 'bg-gray-100': 'bg-surface-100', 'bg-gray-200': 'bg-surface-200', 'bg-gray-300': 'bg-surface-300', 'bg-gray-400': 'bg-surface-400', 'bg-gray-500': 'bg-surface-500', 'bg-gray-600': 'bg-surface-600', 'bg-gray-700': 'bg-surface-700', 'bg-gray-800': 'bg-surface-800', 'bg-gray-900': 'bg-surface-900',
  'bg-green-50': 'bg-primary-50', 'bg-green-100': 'bg-primary-100', 'bg-green-200': 'bg-primary-200', 'bg-green-300': 'bg-primary-300', 'bg-green-400': 'bg-primary-400', 'bg-green-500': 'bg-primary-500', 'bg-green-600': 'bg-primary-600', 'bg-green-700': 'bg-primary-700', 'bg-green-800': 'bg-primary-800', 'bg-green-900': 'bg-primary-900',
  'bg-blue-50': 'bg-secondary-50', 'bg-blue-100': 'bg-secondary-100', 'bg-blue-200': 'bg-secondary-200', 'bg-blue-300': 'bg-secondary-300', 'bg-blue-400': 'bg-secondary-400', 'bg-blue-500': 'bg-secondary-500', 'bg-blue-600': 'bg-secondary-600', 'bg-blue-700': 'bg-secondary-700', 'bg-blue-800': 'bg-secondary-800', 'bg-blue-900': 'bg-secondary-900',
  'bg-red-50': 'bg-error-50', 'bg-red-100': 'bg-error-100', 'bg-red-200': 'bg-error-200', 'bg-red-300': 'bg-error-300', 'bg-red-400': 'bg-error-400', 'bg-red-500': 'bg-error-500', 'bg-red-600': 'bg-error-600', 'bg-red-700': 'bg-error-700', 'bg-red-800': 'bg-error-800', 'bg-red-900': 'bg-error-900',
  'text-gray-50': 'text-surface-50', 'text-gray-100': 'text-surface-100', 'text-gray-200': 'text-surface-200', 'text-gray-300': 'text-surface-300', 'text-gray-400': 'text-surface-400', 'text-gray-500': 'text-surface-500', 'text-gray-600': 'text-surface-600', 'text-gray-700': 'text-surface-700', 'text-gray-800': 'text-surface-800', 'text-gray-900': 'text-surface-900',
  'text-green-50': 'text-primary-50', 'text-green-100': 'text-primary-100', 'text-green-200': 'text-primary-200', 'text-green-300': 'text-primary-300', 'text-green-400': 'text-primary-400', 'text-green-500': 'text-primary-500', 'text-green-600': 'text-primary-600', 'text-green-700': 'text-primary-700', 'text-green-800': 'text-primary-800', 'text-green-900': 'text-primary-900',
  'text-blue-50': 'text-secondary-50', 'text-blue-100': 'text-secondary-100', 'text-blue-200': 'text-secondary-200', 'text-blue-300': 'text-secondary-300', 'text-blue-400': 'text-secondary-400', 'text-blue-500': 'text-secondary-500', 'text-blue-600': 'text-secondary-600', 'text-blue-700': 'text-secondary-700', 'text-blue-800': 'text-secondary-800', 'text-blue-900': 'text-secondary-900',
  'text-red-50': 'text-error-50', 'text-red-100': 'text-error-100', 'text-red-200': 'text-error-200', 'text-red-300': 'text-error-300', 'text-red-400': 'text-error-400', 'text-red-500': 'text-error-500', 'text-red-600': 'text-error-600', 'text-red-700': 'text-error-700', 'text-red-800': 'text-error-800', 'text-red-900': 'text-error-900'
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  Object.entries(MIGRATION_MAP).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g')
    if (regex.test(content)) {
      content = content.replace(regex, newClass)
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`✅ Migrated: ${filePath}`)
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(fullPath)
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      migrateFile(fullPath)
    }
  })
}

// Main execution
const srcDir = path.join(__dirname, 'src')
console.log('🚀 Starting legacy class migration...')
walkDirectory(srcDir)
console.log('✅ Migration completed!')
