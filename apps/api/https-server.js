const https = require('https');
const fs = require('fs');
const path = require('path');

// Import the existing Express app
const app = require('./dist/index.js').default || require('./dist/index.js');

// SSL certificate paths
const certPath = path.join(__dirname, '../../ssl/cert.pem');
const keyPath = path.join(__dirname, '../../ssl/key.pem');

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const PORT = process.env.PORT || 3001;

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 API HTTPS server running on https://0.0.0.0:${PORT}`);
  console.log('🎤 Ready for remote microphone access');
});