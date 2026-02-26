// Netlify Function for User Registration - Simplified Version
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://adityachandane71_db_user:adityamch2007@observex.fcerr8w.mongodb.net/observx?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid JSON' })
      };
    }

    const { email, password, full_name, mobile, address } = requestBody;

    // Basic validation
    if (!email || !password || !full_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Email, password, and full name are required' })
      };
    }

    // Always return success for now (demo mode)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user_id: 'user_' + Date.now(),
        user: {
          id: 'user_' + Date.now(),
          email,
          full_name,
          mobile: mobile || '',
          address: address || '',
          role: 'user'
        }
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Server error: ' + (error.message || 'Unknown error') 
      })
    };
  }
};