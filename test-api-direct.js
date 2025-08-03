const https = require('https');

// Test the analytics API directly
function testAPI() {
  const options = {
    hostname: '89.58.17.78',
    port: 3001,
    path: '/api/analytics/feature-usage?timeRange=30d',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    rejectUnauthorized: false // For self-signed certificates
  };

  console.log('Testing feature usage API...');
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      
      try {
        const json = JSON.parse(data);
        console.log('\nParsed Response:');
        console.log('Success:', json.success);
        console.log('Data length:', json.data?.length || 0);
        if (json.data && json.data.length > 0) {
          console.log('Sample features:', json.data.slice(0, 3).map(f => `${f.feature}: ${f.usageCount} uses`));
        }
      } catch (error) {
        console.log('Could not parse JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.setTimeout(5000, () => {
    console.log('Request timeout');
    req.destroy();
  });

  req.end();
}

testAPI();