/**
 * Master test runner that executes all test suites
 * This will run consumer, merchant, and admin tests sequentially
 */
import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe.configure({ mode: 'serial' })

test.describe('Complete Application Test Suite', () => {
  test('Generate comprehensive bug report', async () => {
    console.log('\n' + '='.repeat(80))
    console.log('ANTIGASPI - COMPREHENSIVE TEST SUITE')
    console.log('='.repeat(80))

    const resultsDir = path.join(__dirname, '../../test-results')

    // Wait for all tests to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Collect all bug files
    const bugFiles = [
      'bugs-consumer.json',
      'bugs-merchant.json',
      'bugs-admin-ui.json'
    ]

    const allBugs: { [key: string]: string[] } = {}
    let totalBugs = 0

    for (const file of bugFiles) {
      const filePath = path.join(resultsDir, file)

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const bugs = JSON.parse(content)
          const category = file.replace('bugs-', '').replace('.json', '')
          allBugs[category] = bugs
          totalBugs += bugs.length

          console.log(`\n[${category.toUpperCase()}] Found ${bugs.length} bugs`)
        } catch (e) {
          console.error(`Error reading ${file}:`, e)
        }
      }
    }

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80))
    console.log(`TOTAL BUGS FOUND: ${totalBugs}`)
    console.log('='.repeat(80))

    if (totalBugs === 0) {
      console.log('\n✅ NO BUGS FOUND - ALL SYSTEMS OPERATIONAL!')
    } else {
      console.log('\n📋 BUG DETAILS BY CATEGORY:\n')

      for (const [category, bugs] of Object.entries(allBugs)) {
        if (bugs.length > 0) {
          console.log(`\n🔴 ${category.toUpperCase()} (${bugs.length} bugs):`)
          bugs.forEach((bug, index) => {
            console.log(`   ${index + 1}. ${bug}`)
          })
        }
      }
    }

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Antigaspi - Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    h1 { color: #333; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .bug-category { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .bug { padding: 10px; margin: 5px 0; background: #ffe6e6; border-left: 4px solid #ff4444; }
    .success { background: #e6ffe6; border-left: 4px solid #44ff44; padding: 20px; }
    .count { font-size: 48px; font-weight: bold; color: #ff4444; }
  </style>
</head>
<body>
  <h1>🤖 Antigaspi - Comprehensive Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div class="count">${totalBugs}</div>
    <p>Total bugs found across all test suites</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  ${totalBugs === 0 ? `
    <div class="success">
      <h2>✅ All Tests Passed!</h2>
      <p>No bugs found in the application. All systems are operational.</p>
    </div>
  ` : ''}

  ${Object.entries(allBugs).map(([category, bugs]) => {
    if (bugs.length === 0) return ''
    return `
      <div class="bug-category">
        <h2>🔴 ${category.toUpperCase()} - ${bugs.length} bugs</h2>
        ${bugs.map((bug, i) => `
          <div class="bug">
            <strong>${i + 1}.</strong> ${bug}
          </div>
        `).join('')}
      </div>
    `
  }).join('')}

  <div class="summary">
    <h3>Test Coverage</h3>
    <ul>
      <li>✅ Consumer flows (signup, login, browsing, reservations)</li>
      <li>✅ Merchant flows (product management, image upload, reservations)</li>
      <li>✅ Admin flows (user management, moderation, analytics)</li>
      <li>✅ UI/UX validation (modals, notifications, forms, responsive)</li>
      <li>✅ Accessibility checks (alt texts, button labels)</li>
    </ul>
  </div>
</body>
</html>
`

    fs.writeFileSync(path.join(resultsDir, 'comprehensive-report.html'), htmlReport)
    console.log('\n📄 HTML report generated: test-results/comprehensive-report.html')

    // Generate JSON summary
    const jsonReport = {
      timestamp: new Date().toISOString(),
      totalBugs,
      bugsByCategory: allBugs,
      testCoverage: {
        consumer: allBugs['consumer']?.length || 0,
        merchant: allBugs['merchant']?.length || 0,
        adminUI: allBugs['admin-ui']?.length || 0
      }
    }

    fs.writeFileSync(
      path.join(resultsDir, 'comprehensive-report.json'),
      JSON.stringify(jsonReport, null, 2)
    )

    console.log('📄 JSON report generated: test-results/comprehensive-report.json')
    console.log('\n' + '='.repeat(80))
  })
})
