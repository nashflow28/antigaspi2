/**
 * Simple XSS Protection Test (No Jest)
 */

// Simulate minimal browser environment
global.document = {
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    head: { appendChild: () => {} }
  }),
  head: { appendChild: () => {} },
  querySelectorAll: () => []
}

import {
  sanitizeHtml,
  sanitizeText,
  sanitizeErrorMessage,
  sanitizeUrlParam,
  sanitizeRouteId,
  detectXssAttempt
} from './src/utils/sanitization.js'

console.log('🔒 Testing XSS Protection...\n')

const tests = [
  {
    name: 'Script tag removal',
    input: '<script>alert("XSS")</script>Hello',
    expected: 'Hello',
    test: (input) => sanitizeText(input)
  },
  {
    name: 'Event handler removal',
    input: '<div onclick="alert(1)">Click me</div>',
    expected: 'Click me',
    test: (input) => sanitizeText(input)
  },
  {
    name: 'JavaScript URL removal',
    input: '<a href="javascript:alert(1)">Link</a>',
    expected: 'Link',
    test: (input) => sanitizeText(input)
  },
  {
    name: 'Error message sanitization',
    input: '<script>steal_cookies()</script>Database error',
    expected: 'Database error',
    test: (input) => sanitizeErrorMessage(input)
  },
  {
    name: 'URL parameter sanitization',
    input: '<script>alert("XSS")</script>',
    expected: 'alertXSS',
    test: (input) => sanitizeUrlParam(input)
  },
  {
    name: 'Route ID validation (valid)',
    input: '123',
    expected: 123,
    test: (input) => sanitizeRouteId(input)
  },
  {
    name: 'Route ID validation (malicious)',
    input: '<script>alert(1)</script>123',
    expected: 123,
    test: (input) => sanitizeRouteId(input)
  },
  {
    name: 'XSS detection (malicious)',
    input: '<script>alert(1)</script>',
    expected: true,
    test: (input) => detectXssAttempt(input)
  },
  {
    name: 'XSS detection (safe)',
    input: 'Normal text content',
    expected: false,
    test: (input) => detectXssAttempt(input)
  }
]

let passed = 0
let failed = 0

tests.forEach(({ name, input, expected, test }) => {
  try {
    const result = test(input)
    const success = JSON.stringify(result) === JSON.stringify(expected)

    if (success) {
      console.log(`✅ ${name}`)
      passed++
    } else {
      console.log(`❌ ${name}`)
      console.log(`   Expected: ${JSON.stringify(expected)}`)
      console.log(`   Got: ${JSON.stringify(result)}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`)
    failed++
  }
})

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 All XSS protection tests passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some XSS protection tests failed!')
  process.exit(1)
}
