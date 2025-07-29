const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = 8080;

// Get allowed origins from environment variables
const getDefaultOrigins = () => {
  const ipAddress = process.env.IP_ADDRESS || 'localhost';
  return [
    'http://localhost:3000', // Always allow localhost for development
    `http://${ipAddress}:3000` // Dynamic IP from environment
  ];
};

const allowedOrigins = getDefaultOrigins();

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT,
    timestamp: new Date().toISOString(),
    message: 'EnglishAI API Server is running'
  });
});

// Basic API routes for testing
app.get('/api/auth/me', (req, res) => {
  res.json({ message: 'Auth endpoint working' });
});

app.get('/api/learning/paths', (req, res) => {
  res.json({ 
    success: true,
    data: [],
    message: 'Learning paths endpoint working'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ EnglishAI API Server running on http://0.0.0.0:${PORT}`);
  console.log(`   - Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`   - Frontend URL: http://193.70.3.183:3000`);
});