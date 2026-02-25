// Test police login - no code changes
import fetch from 'node-fetch';

async function testPoliceLogin() {
  console.log('Testing police login with existing credentials...\n');
  
  try {
    const response = await fetch('http://localhost:3002/police-login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        email: 'adii123@gmail.com',
        password: 'adii123'
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (result.success) {
      console.log('✅ Police login working perfectly!');
      console.log('User ID:', result.user_id);
      console.log('Message:', result.message);
    } else {
      console.log('❌ Police login failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPoliceLogin();
