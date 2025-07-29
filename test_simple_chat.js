// Test the simple chat flow end-to-end
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Use IP_ADDRESS from environment variable with fallback
const ipAddress = process.env.IP_ADDRESS || 'localhost';
const API_BASE = `http://${ipAddress}:3001`;

async function testSimpleChatFlow() {
  console.log('🧪 Testing Simple AI Chat Flow...\n');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'apizarrocotes@outlook.es',
        password: 'Test123@'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) throw new Error(`Login failed: ${loginData.error}`);
    
    const token = loginData.tokens.accessToken;
    console.log('✅ Login successful');

    // Step 2: Start conversation
    console.log('\n2️⃣ Starting conversation...');
    const lessonId = 'cmdiysz4v0006kunhz5e70lba'; // Professional Introductions
    
    const startResponse = await fetch(`${API_BASE}/api/conversations/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId })
    });
    
    const startData = await startResponse.json();
    if (!startResponse.ok) throw new Error(`Start failed: ${startData.error}`);
    
    const sessionId = startData.data.session.id;
    console.log('✅ Conversation started');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   AI: "${startData.data.session.messages[0].content.substring(0, 50)}..."`);

    // Step 3: Send a user message
    console.log('\n3️⃣ Sending user message...');
    const userMessage = "Hello! My name is Ana and I'm a software developer.";
    
    const messageResponse = await fetch(`${API_BASE}/api/conversations/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userMessage })
    });
    
    const messageData = await messageResponse.json();
    if (!messageResponse.ok) throw new Error(`Message failed: ${messageData.error}`);
    
    console.log('✅ Message sent and response received');
    console.log(`   User: "${messageData.data.userMessage.content}"`);
    console.log(`   AI: "${messageData.data.aiResponse.content.substring(0, 100)}..."`);

    // Step 4: Send another message to test conversation flow
    console.log('\n4️⃣ Testing conversation flow...');
    const followUpMessage = "I work with React and TypeScript mainly. What about your experience?";
    
    const followUpResponse = await fetch(`${API_BASE}/api/conversations/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: followUpMessage })
    });
    
    const followUpData = await followUpResponse.json();
    if (!followUpResponse.ok) throw new Error(`Follow-up failed: ${followUpData.error}`);
    
    console.log('✅ Conversation flow working');
    console.log(`   User: "${followUpData.data.userMessage.content}"`);
    console.log(`   AI: "${followUpData.data.aiResponse.content.substring(0, 100)}..."`);

    console.log('\n🎉 Simple Chat Flow Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Conversation start working');
    console.log('   ✅ Message sending working');
    console.log('   ✅ AI responses working');
    console.log('   ✅ Conversation flow working');
    
    console.log('\n🌐 Ready for frontend testing!');
    console.log(`   URL: http://localhost:3000/learning/cmdiysz3g0000kunh8c27foko/lesson/${lessonId}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSimpleChatFlow();