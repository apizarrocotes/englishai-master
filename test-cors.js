const https = require('https');

// Test CORS configuration with different origin headers
async function testCORS() {
  console.log('Testing CORS configuration...\n');

  const origins = [
    'https://89.58.17.78:3000',
    'http://89.58.17.78:3000',
    'https://localhost:3000',
    'http://localhost:3000'
  ];

  for (const origin of origins) {
    await testWithOrigin(origin);
  }
}

function testWithOrigin(origin) {
  return new Promise((resolve) => {
    const options = {
      hostname: '89.58.17.78',
      port: 3001,
      path: '/api/analytics/feature-usage?timeRange=30d',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin
      },
      rejectUnauthorized: false
    };

    console.log(`Testing with Origin: ${origin}`);
    
    const req = https.request(options, (res) => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Credentials': res.headers['access-control-allow-credentials']
      };
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`CORS Headers:`, corsHeaders);
      
      if (res.statusCode === 200 && corsHeaders['Access-Control-Allow-Origin']) {
        console.log('✅ CORS OK\n');
      } else {
        console.log('❌ CORS Issue\n');
      }
      
      resolve();
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}\n`);
      resolve();
    });

    req.setTimeout(3000, () => {
      console.log('❌ Timeout\n');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

testCORS();