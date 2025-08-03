const https = require('https');
const fs = require('fs');
const next = require('next');
const path = require('path');

// Ignore SSL certificate errors for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// SSL certificate paths
const certPath = path.join(__dirname, '../../ssl/cert.pem');
const keyPath = path.join(__dirname, '../../ssl/key.pem');

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('🚀 Next.js HTTPS server running on https://0.0.0.0:3000');
    console.log('🎤 Microphone access enabled for remote connections');
  });
});