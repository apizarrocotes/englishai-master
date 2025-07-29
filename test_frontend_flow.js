// Test the complete authentication and conversation flow
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Use IP_ADDRESS from environment variable with fallback
const ipAddress = process.env.IP_ADDRESS || 'localhost';
const API_BASE = `http://${ipAddress}:3001`;
const WEB_BASE = `http://${ipAddress}:3000`;

async function testCompleteFlow() {
  console.log('🧪 Testing complete authentication and conversation flow...\n');
  
  try {
    // Step 1: Login and get tokens
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'apizarrocotes@outlook.es',
        password: 'Test123@'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error}`);
    }
    
    console.log('✅ Login successful');
    console.log(`   User: ${loginData.user.name} (${loginData.user.email})`);
    console.log(`   Token: ${loginData.tokens.accessToken.substring(0, 20)}...`);
    
    const token = loginData.tokens.accessToken;
    const userId = loginData.user.id;

    // Step 2: Test lesson access
    console.log('\n2️⃣ Testing lesson access...');
    const lessonId = 'cmdiysz4v0006kunhz5e70lba'; // Professional Introductions
    const lessonResponse = await fetch(`${API_BASE}/api/learning/lessons/${lessonId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const lessonData = await lessonResponse.json();
    
    if (!lessonResponse.ok) {
      throw new Error(`Lesson access failed: ${lessonData.error}`);
    }
    
    console.log('✅ Lesson access successful');  
    console.log(`   Lesson: ${lessonData.data.title}`);
    console.log(`   Duration: ${lessonData.data.estimatedDuration} minutes`);

    // Step 3: Test conversation start
    console.log('\n3️⃣ Testing conversation start...');
    const conversationResponse = await fetch(`${API_BASE}/api/conversations/start`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId })
    });
    
    const conversationData = await conversationResponse.json();
    
    if (!conversationResponse.ok) {
      throw new Error(`Conversation start failed: ${conversationData.error}`);
    }
    
    console.log('✅ Conversation start successful');
    console.log(`   Session ID: ${conversationData.data.session.id}`);
    console.log(`   AI Teacher: ${conversationData.data.session.scenario.aiPersona.name}`);
    console.log(`   First message: "${conversationData.data.session.messages[0].content.substring(0, 50)}..."`);

    // Step 4: Test progress update
    console.log('\n4️⃣ Testing progress update...');
    const progressResponse = await fetch(`${API_BASE}/api/learning/progress`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lessonId,
        status: 'in_progress',
        timeSpent: 30
      })
    });
    
    const progressData = await progressResponse.json();
    
    if (!progressResponse.ok) {
      throw new Error(`Progress update failed: ${progressData.error}`);
    }
    
    console.log('✅ Progress update successful');
    console.log(`   Status: ${progressData.data.status}`);
    console.log(`   Time spent: ${progressData.data.timeSpent} seconds`);

    console.log('\n🎉 All tests passed! The authentication token flow is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ User login and token generation');
    console.log('   ✅ Token-based lesson access');
    console.log('   ✅ Token-based conversation start');
    console.log('   ✅ Token-based progress updates');
    console.log('\n🌐 The user can now access the lesson page and start AI conversations successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCompleteFlow();