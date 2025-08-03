const https = require('https');

// Test different scenarios to debug the frontend-backend connection
async function testFrontendAPI() {
  console.log('Testing frontend-backend connection scenarios...\n');

  // Test 1: Basic feature usage endpoint
  await testEndpoint('/api/analytics/feature-usage?timeRange=30d', 'Feature Usage');
  
  // Test 2: Detailed feature usage endpoint  
  await testEndpoint('/api/analytics/feature-usage/detailed?timeRange=30d', 'Detailed Feature Usage');
  
  // Test 3: Dashboard metrics
  await testEndpoint('/api/analytics/dashboard?timeRange=30d', 'Dashboard Metrics');
  
  // Test 4: Test with auth header (empty)
  await testEndpoint('/api/analytics/feature-usage?timeRange=30d', 'Feature Usage with Auth', true);
}

function testEndpoint(path, name, includeAuth = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: '89.58.17.78',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://89.58.17.78:3000', // Simulate frontend origin
        ...(includeAuth && { 'Authorization': 'Bearer fake-token' })
      },
      rejectUnauthorized: false
    };

    console.log(`Testing ${name}...`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.success && json.data) {
              console.log(`✅ ${name}: SUCCESS - ${Array.isArray(json.data) ? json.data.length + ' items' : 'data received'}`);
              if (Array.isArray(json.data) && json.data.length > 0 && json.data[0].feature) {
                console.log(`   Sample: ${json.data[0].feature} - ${json.data[0].usageCount} uses`);
              }
            } else {
              console.log(`❌ ${name}: Invalid response structure`);
            }
          } catch (error) {
            console.log(`❌ ${name}: JSON parse error`);
          }
        } else {
          console.log(`❌ ${name}: HTTP ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}`);
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: Request error - ${error.message}\n`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${name}: Timeout\n`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

testFrontendAPI();