const fs = require('fs');

console.log('🔍 Parsing test output...\n');

// Read the test output file
const output = fs.readFileSync('test-full-output.txt', 'utf-8');

// Parse results
const lines = output.split('\n');
const failedSuites = [];
const passedSuites = [];
const testDetails = {};

let currentSuite = null;
let currentSuiteStatus = null;

lines.forEach(line => {
  // Match test suite headers
  if (line.match(/^FAIL\s+(.+\.test\.tsx?)/)) {
    const match = line.match(/^FAIL\s+(.+\.test\.tsx?)/);
    currentSuite = match[1];
    currentSuiteStatus = 'FAIL';
    failedSuites.push(currentSuite);
    testDetails[currentSuite] = { passed: [], failed: [], skipped: [] };
  } else if (line.match(/^PASS\s+(.+\.test\.tsx?)/)) {
    const match = line.match(/^PASS\s+(.+\.test\.tsx?)/);
    currentSuite = match[1];
    currentSuiteStatus = 'PASS';
    passedSuites.push(currentSuite);
    testDetails[currentSuite] = { passed: [], failed: [], skipped: [] };
  }

  // Match test results
  if (currentSuite) {
    // Failed tests (✕ or ×)
    if (line.match(/^\s+[✕×]/)) {
      const testName = line.replace(/^\s+[✕×]\s+/, '').trim();
      testDetails[currentSuite].failed.push(testName);
    }
    // Passed tests (√ or ✓)
    else if (line.match(/^\s+[√✓]/)) {
      const testName = line.replace(/^\s+[√✓]\s+/, '').trim();
      testDetails[currentSuite].passed.push(testName);
    }
    // Skipped tests (○)
    else if (line.match(/^\s+○ skipped/)) {
      const testName = line.replace(/^\s+○ skipped\s+/, '').trim();
      testDetails[currentSuite].skipped.push(testName);
    }
  }
});

// Calculate stats
let totalFailed = 0;
let totalPassed = 0;
let totalSkipped = 0;

Object.values(testDetails).forEach(suite => {
  totalFailed += suite.failed.length;
  totalPassed += suite.passed.length;
  totalSkipped += suite.skipped.length;
});

const totalSuites = failedSuites.length + passedSuites.length;
const totalTests = totalFailed + totalPassed + totalSkipped;

// Generate report
const report = {
  summary: {
    suites: {
      total: totalSuites,
      passed: passedSuites.length,
      failed: failedSuites.length,
      failRate: `${((failedSuites.length / totalSuites) * 100).toFixed(1)}%`
    },
    tests: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      failRate: `${((totalFailed / totalTests) * 100).toFixed(1)}%`
    }
  },
  failedSuites: failedSuites.sort(),
  passedSuites: passedSuites.sort(),
  testDetails
};

// Write report
fs.writeFileSync('test-analysis-report.json', JSON.stringify(report, null, 2));

// Print summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 TEST ANALYSIS SUMMARY');
console.log('═══════════════════════════════════════════════════\n');

console.log('📦 TEST SUITES:');
console.log(`   Total: ${totalSuites}`);
console.log(`   ✅ Passed: ${passedSuites.length} (${((passedSuites.length/totalSuites)*100).toFixed(1)}%)`);
console.log(`   ❌ Failed: ${failedSuites.length} (${((failedSuites.length/totalSuites)*100).toFixed(1)}%)\n`);

console.log('🧪 INDIVIDUAL TESTS:');
console.log(`   Total: ${totalTests}`);
console.log(`   ✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
console.log(`   ❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`);
console.log(`   ⊗ Skipped: ${totalSkipped} (${((totalSkipped/totalTests)*100).toFixed(1)}%)\n`);

console.log('═══════════════════════════════════════════════════');
console.log('❌ FAILED TEST SUITES (' + failedSuites.length + '):');
console.log('═══════════════════════════════════════════════════\n');

failedSuites.forEach(suite => {
  const details = testDetails[suite];
  const failCount = details.failed.length;
  const passCount = details.passed.length;
  const total = failCount + passCount + details.skipped.length;
  const failRate = ((failCount / total) * 100).toFixed(0);

  console.log(`📄 ${suite}`);
  console.log(`   ❌ Failed: ${failCount}/${total} (${failRate}%)`);
  console.log(`   ✅ Passed: ${passCount}/${total}\n`);
});

console.log('\n📄 Full report saved to: test-analysis-report.json\n');
