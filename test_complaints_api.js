// Test script for complaints API
import fetch from 'node-fetch';

async function testComplaintsAPI() {
  const baseUrl = 'https://observx.netlify.app/adii';
  
  console.log('Testing complaints API...\n');
  
  // Test 1: Get all complaints
  console.log('1. Testing get all complaints:');
  try {
    const response = await fetch(`${baseUrl}/get_complaints.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Total complaints:', result.complaints?.length || 0);
    console.log('✅ Get all complaints test passed\n');
  } catch (error) {
    console.error('❌ Get all complaints test failed:', error.message, '\n');
  }
  
  // Test 2: Get complaints by user_id
  console.log('2. Testing get complaints by user_id:');
  try {
    const response = await fetch(`${baseUrl}/get_complaints.php?user_id=user123`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Complaints for user123:', result.complaints?.length || 0);
    if (result.complaints && result.complaints.length > 0) {
      console.log('First complaint:', result.complaints[0].title);
    }
    console.log('✅ Get complaints by user_id test passed\n');
  } catch (error) {
    console.error('❌ Get complaints by user_id test failed:', error.message, '\n');
  }
  
  console.log('Complaints API testing completed!');
}

testComplaintsAPI().catch(console.error);
