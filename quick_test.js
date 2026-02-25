// Quick test for complaint view
import fetch from 'node-fetch';

async function testComplaintView() {
  const testIds = [
    'c055b13d-70b4-4934-85de-62b6d1047458', // First complaint (old format)
    '8029aaf5-c6c2-450f-ac23-e2c189db0627', // Second complaint (new format)
    'eb21552e-c965-4b0d-831d-c04f9b90e362'  // The one from the error URL
  ];
  
  for (const testId of testIds) {
    console.log(`\nTesting ID: ${testId}`);
    try {
      const response = await fetch(`http://localhost:3002/get_complaint.php?id=${testId}`);
      console.log('Status:', response.status);
      const result = await response.json();
      console.log('Success:', result.success);
      if (result.success) {
        console.log('Title:', result.complaint.title);
        console.log('✅ Working');
      } else {
        console.log('Error:', result.message);
      }
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }
  }
}

testComplaintView();
