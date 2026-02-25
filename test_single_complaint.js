// Test script for single complaint API
import fetch from 'node-fetch';

async function testSingleComplaintAPI() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('Testing single complaint API...\n');
  
  // First, get all complaints to find a valid ID
  console.log('1. Getting a list of complaints to find a valid ID:');
  try {
    const response = await fetch(`${baseUrl}/get_complaints.php?user_id=user123`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const result = await response.json();
    if (result.success && result.complaints.length > 0) {
      const testComplaint = result.complaints[0];
      console.log('Found complaint:', testComplaint.title);
      console.log('Complaint ID:', testComplaint.id);
      console.log('Complaint ID (complaint_id):', testComplaint.complaint_id);
      
      // Test the single complaint API
      console.log('\n2. Testing get_complaint.php with internal ID:');
      try {
        const singleResponse = await fetch(`${baseUrl}/get_complaint.php?id=${testComplaint.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const singleResult = await singleResponse.json();
        console.log('Status:', singleResponse.status);
        console.log('Success:', singleResult.success);
        if (singleResult.success) {
          console.log('Complaint title:', singleResult.complaint.title);
          console.log('✅ Single complaint API test passed\n');
        } else {
          console.log('Error:', singleResult.message);
        }
      } catch (error) {
        console.error('❌ Single complaint API test failed:', error.message, '\n');
      }
      
      // Test with complaint_id as well
      console.log('3. Testing get_complaint.php with complaint_id:');
      try {
        const singleResponse2 = await fetch(`${baseUrl}/get_complaint.php?id=${testComplaint.complaint_id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const singleResult2 = await singleResponse2.json();
        console.log('Status:', singleResponse2.status);
        console.log('Success:', singleResult2.success);
        if (singleResult2.success) {
          console.log('Complaint title:', singleResult2.complaint.title);
          console.log('✅ Single complaint API test with complaint_id passed\n');
        } else {
          console.log('Error:', singleResult2.message);
        }
      } catch (error) {
        console.error('❌ Single complaint API test with complaint_id failed:', error.message, '\n');
      }
      
    } else {
      console.log('No complaints found to test with');
    }
  } catch (error) {
    console.error('❌ Failed to get complaints list:', error.message, '\n');
  }
  
  console.log('Single complaint API testing completed!');
}

testSingleComplaintAPI().catch(console.error);
