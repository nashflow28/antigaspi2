#!/usr/bin/env node

/**
 * Phase 2 Validation Script - Notification System Centralization
 * Validates that all requirements from the Phase 2 plan have been met
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Phase 2 Validation - Notification System Centralization\n')

// Configuration
const PROJECT_ROOT = path.resolve(_unused_dirname, '..')
const STORES_DIR = path.join(PROJECT_ROOT, 'src/stores')
const TESTS_DIR = path.join(PROJECT_ROOT, 'tests')

// Validation results
const results = {
  stores: {},
  tests: {},
  errors: [],
  warnings: []
}

/**
 * Check if file contains pattern
 */
function fileContains(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return pattern.test(content)
  } catch (error) {
    results.errors.push(`Cannot read file: ${filePath}`)
    return false
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

/**
 * Count occurrences of pattern in file
 */
function countInFile(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(pattern)
    return matches ? matches.length : 0
  } catch (error) {
    return 0
  }
}

/**
 * Validate individual store
 */
function validateStore(storeName) {
  const storePath = path.join(STORES_DIR, `${storeName}.ts`)
  const storeResult = {
    exists: fileExists(storePath),
    hasSetTimeoutAntiPattern: false,
    hasErrorRefAntiPattern: false,
    usesNotifyComposable: false,
    hasRetryCallbacks: false,
    hasSuccessNotifications: false
  }

  if (storeResult.exists) {
    // Check for anti-patterns (should not exist)
    storeResult.hasSetTimeoutAntiPattern = fileContains(storePath, /setTimeout\s*\(\s*\(\)\s*=>\s*\{\s*error\.value\s*=\s*null/)
    storeResult.hasErrorRefAntiPattern = fileContains(storePath, /const\s+error\s*=\s*ref<string\s*\|\s*null>/)

    // Check for good patterns (should exist)
    storeResult.usesNotifyComposable = fileContains(storePath, /import\s+\{\s*notify\s*\}\s+from\s+['"]@\/composables\/useNotifications['"]/)
    storeResult.hasRetryCallbacks = fileContains(storePath, /action\s*:\s*\{\s*label\s*:\s*['"]Réessayer['"]/)
    storeResult.hasSuccessNotifications = fileContains(storePath, /notify\.success\s*\(/)
  }

  results.stores[storeName] = storeResult
  return storeResult
}

/**
 * Validate test file
 */
function validateTestFile(testName) {
  const testPath = path.join(TESTS_DIR, 'stores', `${testName}.test.ts`)
  const testResult = {
    exists: fileExists(testPath),
    hasCallbackTests: false,
    hasRetryTests: false,
    hasDoubleCloseTests: false,
    mocksDependencies: false
  }

  if (testResult.exists) {
    testResult.hasCallbackTests = fileContains(testPath, /callback.*expect\.any\(Function\)/)
    testResult.hasRetryTests = fileContains(testPath, /retry.*callback/)
    testResult.hasDoubleCloseTests = fileContains(testPath, /double.*close/i)
    testResult.mocksDependencies = fileContains(testPath, /vi\.mock/) && fileContains(testPath, /mockedNotify/)
  }

  results.tests[testName] = testResult
  return testResult
}

/**
 * Main validation
 */
function runValidation() {
  console.log('📊 Validating Stores...\n')

  // Validate core stores (Phase 2.2 and 2.4)
  const coreStores = ['auth', 'products']
  coreStores.forEach(store => {
    const result = validateStore(store)
    const status = result.exists && result.usesNotifyComposable && !result.hasSetTimeoutAntiPattern ? '✅' : '❌'

    console.log(`${status} Store: ${store}.ts`)

    if (!result.exists) {
      console.log('   ❌ File does not exist')
    } else {
      if (result.hasSetTimeoutAntiPattern) {
        console.log('   ❌ Contains setTimeout anti-pattern')
      }
      if (result.hasErrorRefAntiPattern) {
        console.log('   ❌ Contains error ref anti-pattern')
      }
      if (result.usesNotifyComposable) {
        console.log('   ✅ Uses notify composable')
      } else {
        console.log('   ❌ Missing notify composable import')
      }
      if (result.hasRetryCallbacks) {
        console.log('   ✅ Has retry callbacks')
      } else {
        console.log('   ⚠️  Missing retry callbacks')
      }
      if (result.hasSuccessNotifications) {
        console.log('   ✅ Has success notifications')
      } else {
        console.log('   ⚠️  Missing success notifications')
      }
    }
    console.log()
  })

  console.log('🧪 Validating Tests...\n')

  // Validate test files
  coreStores.forEach(store => {
    const result = validateTestFile(store)
    const status = result.exists && result.hasCallbackTests ? '✅' : '❌'

    console.log(`${status} Test: ${store}.test.ts`)

    if (!result.exists) {
      console.log('   ❌ Test file does not exist')
    } else {
      if (result.mocksDependencies) {
        console.log('   ✅ Mocks dependencies properly')
      } else {
        console.log('   ❌ Missing dependency mocks')
      }
      if (result.hasCallbackTests) {
        console.log('   ✅ Tests callback functions')
      } else {
        console.log('   ❌ Missing callback tests')
      }
      if (result.hasRetryTests) {
        console.log('   ✅ Tests retry functionality')
      } else {
        console.log('   ⚠️  Missing retry tests')
      }
    }
    console.log()
  })

  // Check for additional files
  console.log('📋 Validating Documentation...\n')

  const docs = [
    { file: 'AUDIT_D1_TIMERS_ERRORS.md', name: 'Audit Report' },
    { file: 'NOTIFICATION_CALLBACKS_CONVENTIONS.md', name: 'Callbacks Conventions' }
  ]

  docs.forEach(doc => {
    const docPath = path.join(PROJECT_ROOT, '..', doc.file)
    const exists = fileExists(docPath)
    console.log(`${exists ? '✅' : '❌'} ${doc.name}: ${doc.file}`)
  })

  console.log()
}

/**
 * Generate summary report
 */
function generateSummary() {
  console.log('📈 Validation Summary\n')

  const storeCount = Object.keys(results.stores).length
  const passedStores = Object.values(results.stores).filter(s =>
    s.exists && s.usesNotifyComposable && !s.hasSetTimeoutAntiPattern
  ).length

  const testCount = Object.keys(results.tests).length
  const passedTests = Object.values(results.tests).filter(t =>
    t.exists && t.hasCallbackTests && t.mocksDependencies
  ).length

  console.log(`Stores: ${passedStores}/${storeCount} ✅`)
  console.log(`Tests:  ${passedTests}/${testCount} ✅`)
  console.log(`Errors: ${results.errors.length} ❌`)
  console.log(`Warnings: ${results.warnings.length} ⚠️`)

  console.log()

  if (results.errors.length > 0) {
    console.log('❌ Errors:')
    results.errors.forEach(error => console.log(`   ${error}`))
    console.log()
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    results.warnings.forEach(warning => console.log(`   ${warning}`))
    console.log()
  }

  // Overall status
  const allStoresPassed = passedStores === storeCount
  const allTestsPassed = passedTests === testCount
  const noErrors = results.errors.length === 0

  if (allStoresPassed && allTestsPassed && noErrors) {
    console.log('🎉 Phase 2 Validation PASSED! All requirements met.')
    process.exit(0)
  } else {
    console.log('❌ Phase 2 Validation FAILED. Please address the issues above.')
    process.exit(1)
  }
}

// Run validation
runValidation()
generateSummary()
