// Test police login
import fetch from 'node-fetch';

async function testPoliceLogin() {
  try {
    console.log('Testing police login...\n');
    
    const response = await fetch('https://observx.netlify.app/adii/police-login.php', {
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
      console.log('✅ Police login successful!');
      console.log('User ID:', result.user_id);
    } else {
      console.log('❌ Police login failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
}

testPoliceLogin();
