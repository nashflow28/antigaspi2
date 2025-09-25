const axios = require('axios');

async function analyzeJsonResponses() {
  console.log('🔍 === JSON RESPONSE ANALYSIS ===\n');

  const endpoints = [
    'http://localhost:8000/api/health',
    'http://localhost:8000/api/products',
    'http://localhost:8000/api/merchants',
    'http://localhost:8000/api/categories'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    console.log('─'.repeat(60));

    try {
      const response = await axios.get(endpoint);

      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log('Response preview (first 300 chars):');
      console.log('"' + JSON.stringify(response.data).substring(0, 300) + '"');

      if (typeof response.data === 'string' && response.data.includes('<b>Warning</b>')) {
        console.log('❌ PROBLEM: Response contains HTML warnings instead of JSON!');
        console.log('This will cause JSON.parse errors in the frontend.');
      } else if (typeof response.data === 'object') {
        console.log('✅ Response is valid JSON object');
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      if (error.response) {
        console.log(`Response status: ${error.response.status}`);
        console.log(`Response preview: "${error.response.data.substring(0, 200)}"`);
      }
    }
  }

  console.log('\n🎯 === ANALYSIS COMPLETE ===');
  console.log('If you see HTML warnings in the responses, that explains the JSON.parse errors.');
}

// Run analysis
analyzeJsonResponses().catch(console.error);