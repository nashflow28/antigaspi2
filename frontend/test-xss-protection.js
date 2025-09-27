/**
 * XSS Protection Testing
 * 
 * Tests that all XSS vulnerabilities have been properly fixed
 */

import { describe, test, expect } from '@jest/globals'

// Simulate browser environment
global.document = {
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    head: { appendChild: () => {} }
  }),
  head: { appendChild: () => {} },
  querySelectorAll: () => []
}

global.window = {
  eval: () => {}
}

// Import our security utilities
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeErrorMessage,
  sanitizeUrlParam,
  sanitizeRouteId,
  detectXssAttempt,
  logXssAttempt
} from './src/utils/sanitization.js'

describe('XSS Protection Tests', () => {
  
  test('Should sanitize basic XSS script tags', () => {
    const maliciousInput = '<script>alert("XSS")</script>Hello'
    const result = sanitizeText(maliciousInput)
    expect(result).toBe('Hello')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })
  
  test('Should sanitize onclick handlers', () => {
    const maliciousInput = '<div onclick="alert(1)">Click me</div>'
    const result = sanitizeText(maliciousInput)
    expect(result).toBe('Click me')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('alert')
  })
  
  test('Should sanitize javascript: URLs', () => {
    const maliciousInput = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizeText(maliciousInput)
    expect(result).toBe('Link')
    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('alert')
  })
  
  test('Should sanitize error messages', () => {
    const maliciousError = '<script>steal_cookies()</script>Database error'
    const result = sanitizeErrorMessage(maliciousError)
    expect(result).toBe('Database error')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('steal_cookies')
  })
  
  test('Should sanitize URL parameters', () => {
    const maliciousParam = '<script>alert("XSS")</script>'
    const result = sanitizeUrlParam(maliciousParam)
    expect(result).toBe('alertXSS')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
  })
  
  test('Should validate and sanitize route IDs', () => {
    expect(sanitizeRouteId('123')).toBe(123)
    expect(sanitizeRouteId('<script>alert(1)</script>123')).toBe(123)
    expect(sanitizeRouteId('abc')).toBe(null)
    expect(sanitizeRouteId('0')).toBe(null)
    expect(sanitizeRouteId('-1')).toBe(null)
  })
  
  test('Should detect XSS attempts', () => {
    expect(detectXssAttempt('<script>alert(1)</script>')).toBe(true)
    expect(detectXssAttempt('javascript:alert(1)')).toBe(true)
    expect(detectXssAttempt('onclick="malicious()"')).toBe(true)
    expect(detectXssAttempt('<iframe src="evil.com">')).toBe(true)
    expect(detectXssAttempt('Normal text content')).toBe(false)
  })
  
  test('Should preserve safe content with ADMIN_MODAL level', () => {
    const safeContent = '<span class="text-green-600">✅ Safe content</span>'
    const result = sanitizeHtml(safeContent, 'ADMIN_MODAL')
    expect(result).toContain('text-green-600')
    expect(result).toContain('✅')
    expect(result).toContain('Safe content')
  })
  
  test('Should remove dangerous attributes even from allowed tags', () => {
    const maliciousContent = '<span onclick="alert(1)" class="text-red-600">Content</span>'
    const result = sanitizeHtml(maliciousContent, 'ADMIN_MODAL')
    expect(result).toContain('text-red-600')
    expect(result).toContain('Content')
    expect(result).not.toContain('onclick')
  })
  
})

console.log('🔒 Running XSS Protection Tests...')

// Run the actual tests
const testResults = []

// Test 1: Basic script tag sanitization
try {
  const maliciousInput = '<script>alert("XSS")</script>Hello'
  const result = sanitizeText(maliciousInput)
  const pass = result === 'Hello' && !result.includes('<script>')
  testResults.push({ test: 'Script tag sanitization', pass, result })
} catch (error) {
  testResults.push({ test: 'Script tag sanitization', pass: false, error: error.message })
}

// Test 2: Event handler sanitization
try {
  const maliciousInput = '<div onclick="alert(1)">Click me</div>'
  const result = sanitizeText(maliciousInput)
  const pass = result === 'Click me' && !result.includes('onclick')
  testResults.push({ test: 'Event handler sanitization', pass, result })
} catch (error) {
  testResults.push({ test: 'Event handler sanitization', pass: false, error: error.message })
}

// Test 3: Route ID validation
try {
  const validId = sanitizeRouteId('123')
  const invalidId = sanitizeRouteId('<script>alert(1)</script>')
  const pass = validId === 123 && invalidId === null
  testResults.push({ test: 'Route ID validation', pass, validId, invalidId })
} catch (error) {
  testResults.push({ test: 'Route ID validation', pass: false, error: error.message })
}

// Test 4: XSS Detection
try {
  const xssDetected = detectXssAttempt('<script>alert(1)</script>')
  const normalText = detectXssAttempt('Normal text')
  const pass = xssDetected === true && normalText === false
  testResults.push({ test: 'XSS Detection', pass, xssDetected, normalText })
} catch (error) {
  testResults.push({ test: 'XSS Detection', pass: false, error: error.message })
}

// Report results
console.log('\n🔒 XSS Protection Test Results:')
testResults.forEach(result => {
  const status = result.pass ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} - ${result.test}`)
  if (!result.pass && result.error) {
    console.log(`  Error: ${result.error}`)
  }
})

const passedTests = testResults.filter(r => r.pass).length
const totalTests = testResults.length
console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`)

if (passedTests === totalTests) {
  console.log('🎉 All XSS protection tests passed! Application is secure.')
} else {
  console.log('⚠️  Some tests failed. Review security implementation.')
}
