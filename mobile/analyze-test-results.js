const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Analyzing Test Results...\n');

// Run tests and capture output
const output = execSync('npm test -- --passWithNoTests 2>&1', {
  encoding: 'utf-8',
  maxBuffer: 50 * 1024 * 1024
});

// Parse test results
const lines = output.split('\n');
const failedSuites = [];
const passedSuites = [];
let currentSuite = null;
let failedTests = {};
let passedTests = {};

lines.forEach(line => {
  // Match test suite results
  if (line.match(/^FAIL\s+(.+\.test\.tsx?)/)) {
    const match = line.match(/^FAIL\s+(.+\.test\.tsx?)/);
    currentSuite = match[1];
    failedSuites.push(currentSuite);
    failedTests[currentSuite] = [];
  } else if (line.match(/^PASS\s+(.+\.test\.tsx?)/)) {
    const match = line.match(/^PASS\s+(.+\.test\.tsx?)/);
    currentSuite = match[1];
    passedSuites.push(currentSuite);
    passedTests[currentSuite] = [];
  }

  // Match individual test failures (✕)
  if (currentSuite && line.match(/^\s+✕/)) {
    const testName = line.replace(/^\s+✕\s+/, '').trim();
    if (failedSuites.includes(currentSuite)) {
      failedTests[currentSuite].push(testName);
    }
  }

  // Match individual test passes (√)
  if (currentSuite && line.match(/^\s+√/)) {
    const testName = line.replace(/^\s+√\s+/, '').trim();
    if (passedSuites.includes(currentSuite)) {
      passedTests[currentSuite].push(testName);
    } else if (failedSuites.includes(currentSuite)) {
      passedTests[currentSuite] = passedTests[currentSuite] || [];
      passedTests[currentSuite].push(testName);
    }
  }
});

// Calculate totals
const totalFailedSuites = failedSuites.length;
const totalPassedSuites = passedSuites.length;
const totalSuites = totalFailedSuites + totalPassedSuites;

let totalFailedTests = 0;
let totalPassedTests = 0;

Object.values(failedTests).forEach(tests => totalFailedTests += tests.length);
Object.values(passedTests).forEach(tests => totalPassedTests += tests.length);

// Generate report
const report = {
  summary: {
    totalSuites,
    passedSuites: totalPassedSuites,
    failedSuites: totalFailedSuites,
    failRate: ((totalFailedSuites / totalSuites) * 100).toFixed(1) + '%',
    totalTests: totalFailedTests + totalPassedTests,
    passedTests: totalPassedTests,
    failedTests: totalFailedTests,
    testFailRate: ((totalFailedTests / (totalFailedTests + totalPassedTests)) * 100).toFixed(1) + '%'
  },
  failedSuites: failedSuites.sort(),
  failedTestsByFile: failedTests,
  passedSuites: passedSuites.sort()
};

// Write to file
fs.writeFileSync('test-analysis-report.json', JSON.stringify(report, null, 2));

console.log('📊 TEST ANALYSIS SUMMARY\n');
console.log(`Total Test Suites: ${totalSuites}`);
console.log(`  ✅ Passed: ${totalPassedSuites} (${((totalPassedSuites/totalSuites)*100).toFixed(1)}%)`);
console.log(`  ❌ Failed: ${totalFailedSuites} (${((totalFailedSuites/totalSuites)*100).toFixed(1)}%)`);
console.log();
console.log(`Total Tests: ${totalFailedTests + totalPassedTests}`);
console.log(`  ✅ Passed: ${totalPassedTests} (${((totalPassedTests/(totalFailedTests+totalPassedTests))*100).toFixed(1)}%)`);
console.log(`  ❌ Failed: ${totalFailedTests} (${((totalFailedTests/(totalFailedTests+totalPassedTests))*100).toFixed(1)}%)`);
console.log();
console.log(`📄 Detailed report saved to: test-analysis-report.json`);
console.log();
console.log('❌ FAILED TEST SUITES:');
failedSuites.forEach(suite => {
  const failCount = failedTests[suite]?.length || 0;
  const passCount = passedTests[suite]?.length || 0;
  console.log(`  - ${suite} (${failCount} failed, ${passCount} passed)`);
});
